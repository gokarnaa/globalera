from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
from pydantic import BaseModel
from decimal import Decimal

from backend.app.core.database import get_db
from backend.app.accounting.models import Account, JournalEntry
from backend.app.accounting.engine import PostingEngine, AccountingEngineError
from backend.app.reports.service import FinancialReportingService

router = APIRouter(prefix="/accounting", tags=["Accounting & General Ledger"])

class JournalLineSchema(BaseModel):
    account_code: Optional[str] = None
    account_id: Optional[str] = None
    debit: Decimal = Decimal("0.00")
    credit: Decimal = Decimal("0.00")
    line_narration: Optional[str] = None
    cost_center: Optional[str] = None

class CreateJournalEntrySchema(BaseModel):
    narration: str
    lines: List[JournalLineSchema]
    source_module: str = "MANUAL"
    source_id: Optional[str] = None
    idempotency_key: Optional[str] = None
    entry_date: Optional[date] = None

class ReverseJournalSchema(BaseModel):
    reason: str

@router.get("/coa")
def get_chart_of_accounts(db: Session = Depends(get_db)):
    accounts = db.query(Account).filter(Account.is_active == True).order_by(Account.code).all()
    return [
        {
            "id": a.id,
            "code": a.code,
            "name": a.name,
            "type": a.account_type.value,
            "normal_balance": a.normal_balance.value,
            "is_active": a.is_active
        }
        for a in accounts
    ]

@router.get("/journals")
def list_journal_entries(
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    entries = db.query(JournalEntry).order_by(JournalEntry.created_at.desc()).offset(offset).limit(limit).all()
    return [
        {
            "id": e.id,
            "entry_number": e.entry_number,
            "entry_date": e.entry_date.isoformat(),
            "narration": e.narration,
            "source_module": e.source_module,
            "status": e.status.value,
            "posted_by": e.posted_by,
            "lines": [
                {
                    "account_code": l.account.code,
                    "account_name": l.account.name,
                    "debit": float(l.debit),
                    "credit": float(l.credit),
                    "line_narration": l.line_narration
                }
                for l in e.lines
            ]
        }
        for e in entries
    ]

@router.post("/journals")
def post_manual_journal(
    payload: CreateJournalEntrySchema,
    db: Session = Depends(get_db)
):
    try:
        entry = PostingEngine.post_journal(
            db=db,
            narration=payload.narration,
            lines=[l.model_dump() for l in payload.lines],
            source_module=payload.source_module,
            source_id=payload.source_id,
            idempotency_key=payload.idempotency_key,
            entry_date=payload.entry_date,
            posted_by="Admin"
        )
        db.commit()
        return {
            "success": True,
            "entry_number": entry.entry_number,
            "id": entry.id,
            "status": entry.status.value
        }
    except AccountingEngineError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/journals/{entry_id}/reverse")
def reverse_journal_entry(
    entry_id: str,
    payload: ReverseJournalSchema,
    db: Session = Depends(get_db)
):
    try:
        reversal = PostingEngine.reverse_journal(
            db=db,
            original_entry_id=entry_id,
            reason=payload.reason
        )
        db.commit()
        return {
            "success": True,
            "reversal_entry_number": reversal.entry_number,
            "original_id": entry_id
        }
    except AccountingEngineError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/reports/trial-balance")
def get_trial_balance(
    as_of: Optional[date] = None,
    db: Session = Depends(get_db)
):
    return FinancialReportingService.get_trial_balance(db, as_of_date=as_of)

@router.get("/reports/profit-loss")
def get_profit_and_loss(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db)
):
    return FinancialReportingService.get_profit_and_loss(db, start_date=start_date, end_date=end_date)
