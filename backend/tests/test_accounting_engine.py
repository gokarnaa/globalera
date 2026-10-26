import pytest
from decimal import Decimal
from datetime import date
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.app.core.database import Base
from backend.app.accounting.models import Account, AccountType, NormalBalance, JournalStatus
from backend.app.accounting.engine import PostingEngine, AccountingEngineError
from backend.app.accounting.seed import seed_chart_of_accounts
from backend.app.students.service import StudentFinanceService
from backend.app.reports.service import FinancialReportingService

@pytest.fixture(scope="function")
def db_session():
    # In-memory SQLite for high-speed test isolation
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = TestingSessionLocal()
    
    # Seed standard Chart of Accounts
    seed_chart_of_accounts(session)
    
    yield session
    
    session.close()

def test_balanced_journal_posting(db_session):
    """Verify that a balanced journal entry posts cleanly."""
    journal = PostingEngine.post_journal(
        db=db_session,
        narration="Initial Capital Injection",
        lines=[
            {"account_code": "1010", "debit": 100000, "credit": 0},
            {"account_code": "3010", "debit": 0, "credit": 100000}
        ],
        source_module="MANUAL",
        idempotency_key="TEST-CAPITAL-01"
    )
    
    assert journal is not None
    assert journal.entry_number.startswith("JV-2026")
    assert journal.status == JournalStatus.POSTED
    assert len(journal.lines) == 2

def test_imbalanced_journal_rejected(db_session):
    """Verify that an imbalanced journal entry is rejected with AccountingEngineError."""
    with pytest.raises(AccountingEngineError) as exc_info:
        PostingEngine.post_journal(
            db=db_session,
            narration="Erroneous Imbalanced Entry",
            lines=[
                {"account_code": "1010", "debit": 50000, "credit": 0},
                {"account_code": "3010", "debit": 0, "credit": 40000} # Imbalance!
            ],
            source_module="MANUAL"
        )
    assert "Double-entry imbalance" in str(exc_info.value)

def test_idempotent_posting_prevents_duplicate(db_session):
    """Verify that submitting the same transaction twice returns existing without duplicating."""
    j1 = PostingEngine.post_journal(
        db=db_session,
        narration="Idempotency Test Entry",
        lines=[
            {"account_code": "1010", "debit": 1500, "credit": 0},
            {"account_code": "4110", "debit": 0, "credit": 1500}
        ],
        source_module="FEE",
        idempotency_key="UNIQUE-TX-KEY-999"
    )
    
    j2 = PostingEngine.post_journal(
        db=db_session,
        narration="Duplicate Request",
        lines=[
            {"account_code": "1010", "debit": 1500, "credit": 0},
            {"account_code": "4110", "debit": 0, "credit": 1500}
        ],
        source_module="FEE",
        idempotency_key="UNIQUE-TX-KEY-999"
    )
    
    assert j1.id == j2.id

def test_reversal_creates_exact_inverse(db_session):
    """Verify reversing a journal entry creates an exact inverse and sets status to REVERSED."""
    original = PostingEngine.post_journal(
        db=db_session,
        narration="Expense to be reversed",
        lines=[
            {"account_code": "5400", "debit": 5000, "credit": 0},
            {"account_code": "1010", "debit": 0, "credit": 5000}
        ],
        source_module="EXPENSE"
    )
    
    reversal = PostingEngine.reverse_journal(
        db=db_session,
        original_entry_id=original.id,
        reason="Erroneous charge entered by cashier"
    )
    
    assert original.status == JournalStatus.REVERSED
    assert reversal.status == JournalStatus.POSTED
    assert reversal.reversed_entry_id == original.id

def test_student_enrollment_and_installment_collection(db_session):
    """
    Complete end-to-end workflow:
      1. Student Enrollment: Standard fee Rs. 30,000, 60% offer discount, Rs. 1,700 admission
         -> Locked Course Fee = Rs. 11,865
      2. 1st Installment Payment (50% upfront) = Rs. 6,000 with 25% trainer commission
      3. Overpayment rejection
      4. 2nd Installment Payment (Remaining Rs. 5,865)
      5. Mathematical Trial Balance verification
    """
    # 1. Enroll Student with promotional offer package Rs. 11,865
    enrollment = StudentFinanceService.enroll_student(
        db=db_session,
        name="Sunita Sharma",
        phone="9841987654",
        tgid="TGID-101",
        group_id="GRP-01",
        course_name="Basic Beautician",
        original_course_fee=Decimal("30000.00"),
        discount_percent=Decimal("60.00"),
        admission_fee=Decimal("1700.00"),
        locked_course_fee_override=Decimal("11865.00")
    )
    
    assert enrollment.locked_course_fee == Decimal("11865.00")
    assert enrollment.due_balance == Decimal("11865.00")
    assert len(enrollment.installments) == 2

    # 2. Receive 1st Installment = Rs. 6,000 via Fonepay / QR with 25% Trainer Commission
    rcpt1 = StudentFinanceService.record_student_payment(
        db=db_session,
        enrollment_id=enrollment.id,
        amount=Decimal("6000.00"),
        payment_method="Fonepay / QR",
        installment_no=1,
        trainer_commission_percent=Decimal("25.00")
    )
    
    assert rcpt1.receipt_no.startswith("REC-2026")
    assert enrollment.total_paid == Decimal("6000.00")
    assert enrollment.due_balance == Decimal("5865.00")

    # 3. Overpayment should be prohibited
    with pytest.raises(AccountingEngineError) as exc:
        StudentFinanceService.record_student_payment(
            db=db_session,
            enrollment_id=enrollment.id,
            amount=Decimal("10000.00") # Exceeds remaining due Rs. 5,865
        )
    assert "Overpayment prohibited" in str(exc.value)

    # 4. Receive Final 2nd Installment = Rs. 5,865 via Cash
    rcpt2 = StudentFinanceService.record_student_payment(
        db=db_session,
        enrollment_id=enrollment.id,
        amount=Decimal("5865.00"),
        payment_method="Cash",
        installment_no=2,
        trainer_commission_percent=Decimal("25.00")
    )
    
    assert enrollment.due_balance == Decimal("0.00")
    assert enrollment.total_paid == Decimal("11865.00")

    # 5. Verify Mathematical Trial Balance
    tb = FinancialReportingService.get_trial_balance(db_session)
    assert tb["is_balanced"] is True
    assert tb["difference"] == 0.0
    assert tb["total_debit"] > 0
    assert tb["total_debit"] == tb["total_credit"]

    # 6. Verify Profit & Loss
    pnl = FinancialReportingService.get_profit_and_loss(db_session)
    assert pnl["revenue"]["total"] == 11865.0
    # Trainer commission accrued: (6000 + 5865) * 25% = 2966.25
    assert pnl["expenses"]["total"] == 2966.25
    assert pnl["net_profit"] == (11865.0 - 2966.25)
