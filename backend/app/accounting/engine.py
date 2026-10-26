import uuid
from decimal import Decimal
from typing import List, Dict, Any, Optional
from datetime import date, datetime
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.app.accounting.models import (
    JournalEntry, JournalLine, Account, FiscalYear, JournalStatus
)

class AccountingEngineError(Exception):
    pass

class PostingEngine:
    """
    Central Accounting Engine: Enforces double-entry invariance,
    idempotency, and immutable financial audit trails.
    """
    
    @staticmethod
    def get_or_create_default_fiscal_year(db: Session) -> FiscalYear:
        current_year = date.today().year
        code = f"FY{current_year}/{current_year+1}"
        fy = db.query(FiscalYear).filter(FiscalYear.code == code).first()
        if not fy:
            fy = FiscalYear(
                code=code,
                start_date=date(current_year, 4, 1),
                end_date=date(current_year + 1, 3, 31),
                is_closed=False
            )
            db.add(fy)
            db.flush()
        return fy

    @staticmethod
    def generate_next_entry_number(db: Session, prefix: str = "JV-2026") -> str:
        count = db.query(func.count(JournalEntry.id)).scalar() or 0
        return f"{prefix}-{(count + 1):05d}"

    @classmethod
    def post_journal(
        cls,
        db: Session,
        narration: str,
        lines: List[Dict[str, Any]],
        source_module: str,
        source_id: Optional[str] = None,
        idempotency_key: Optional[str] = None,
        posted_by: str = "System",
        entry_date: Optional[date] = None
    ) -> JournalEntry:
        """
        Post a balanced, atomic double-entry journal entry.
        Each line dict must contain:
          - account_id: str (or account_code)
          - debit: Decimal or numeric
          - credit: Decimal or numeric
          - line_narration: optional str
        """
        # 1. Idempotency check: prevent duplicate financial transactions
        if idempotency_key:
            existing = db.query(JournalEntry).filter(
                JournalEntry.idempotency_key == idempotency_key
            ).first()
            if existing:
                return existing

        if not lines or len(lines) < 2:
            raise AccountingEngineError("A journal entry requires at least two lines (Debit and Credit).")

        total_debit = Decimal("0.00")
        total_credit = Decimal("0.00")
        prepared_lines: List[JournalLine] = []

        for idx, line in enumerate(lines):
            acc_id = line.get("account_id")
            acc_code = line.get("account_code")
            
            # Lookup account by ID or Code
            account = None
            if acc_id:
                account = db.query(Account).filter(Account.id == acc_id).first()
            elif acc_code:
                account = db.query(Account).filter(Account.code == acc_code).first()
                
            if not account:
                raise AccountingEngineError(f"Line {idx+1}: Account '{acc_id or acc_code}' not found.")
            if not account.is_active:
                raise AccountingEngineError(f"Line {idx+1}: Account '{account.name}' is inactive.")

            debit_val = Decimal(str(line.get("debit", 0))).quantize(Decimal("0.01"))
            credit_val = Decimal(str(line.get("credit", 0))).quantize(Decimal("0.01"))

            if debit_val < 0 or credit_val < 0:
                raise AccountingEngineError(f"Line {idx+1}: Debit and credit amounts must be non-negative.")
            if debit_val > 0 and credit_val > 0:
                raise AccountingEngineError(f"Line {idx+1}: A single line cannot have both debit and credit.")
            if debit_val == 0 and credit_val == 0:
                continue

            total_debit += debit_val
            total_credit += credit_val

            prepared_lines.append(JournalLine(
                account_id=account.id,
                debit=debit_val,
                credit=credit_val,
                line_narration=line.get("line_narration", narration[:250]),
                cost_center=line.get("cost_center")
            ))

        # 2. Strict Balance Invariant: Debit == Credit
        if total_debit != total_credit:
            raise AccountingEngineError(
                f"Double-entry imbalance! Total Debit (Rs. {total_debit}) != Total Credit (Rs. {total_credit})."
            )
        if total_debit <= 0:
            raise AccountingEngineError("Transaction total amount must be greater than zero.")

        fy = cls.get_or_create_default_fiscal_year(db)
        if fy.is_closed:
            raise AccountingEngineError(f"Fiscal year '{fy.code}' is closed. Postings are prohibited.")

        entry_num = cls.generate_next_entry_number(db)
        journal = JournalEntry(
            entry_number=entry_num,
            idempotency_key=idempotency_key,
            fiscal_year_id=fy.id,
            entry_date=entry_date or date.today(),
            narration=narration,
            source_module=source_module,
            source_id=source_id,
            status=JournalStatus.POSTED,
            posted_by=posted_by,
            posted_at=datetime.utcnow()
        )
        journal.lines = prepared_lines

        db.add(journal)
        db.flush()
        return journal

    @classmethod
    def reverse_journal(
        cls,
        db: Session,
        original_entry_id: str,
        reason: str,
        reversal_by: str = "Admin"
    ) -> JournalEntry:
        """
        Reverse a posted journal entry by generating an exact inverse entry.
        Never directly delete or mutate the original posted entry.
        """
        original = db.query(JournalEntry).filter(JournalEntry.id == original_entry_id).first()
        if not original:
            raise AccountingEngineError(f"Journal entry '{original_entry_id}' not found.")
        if original.status == JournalStatus.REVERSED:
            raise AccountingEngineError(f"Journal entry '{original.entry_number}' has already been reversed.")

        inverse_lines: List[Dict[str, Any]] = []
        for line in original.lines:
            inverse_lines.append({
                "account_id": line.account_id,
                "debit": line.credit,   # swap credit to debit
                "credit": line.debit,   # swap debit to credit
                "line_narration": f"Reversal of {original.entry_number}: {reason}"[:250]
            })

        reversal_entry = cls.post_journal(
            db=db,
            narration=f"REVERSAL OF {original.entry_number}: {reason}",
            lines=inverse_lines,
            source_module=original.source_module,
            source_id=f"REV-{original.entry_number}",
            posted_by=reversal_by
        )

        reversal_entry.reversed_entry_id = original.id
        original.status = JournalStatus.REVERSED
        db.flush()
        return reversal_entry
