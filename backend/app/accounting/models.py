import uuid
from datetime import datetime, date
from decimal import Decimal
from enum import Enum
from sqlalchemy import (
    Column, String, Text, Boolean, Date, DateTime, Numeric,
    ForeignKey, Integer, Enum as SQLEnum, CheckConstraint, Index
)
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

class AccountType(str, Enum):
    ASSET = "ASSET"
    LIABILITY = "LIABILITY"
    EQUITY = "EQUITY"
    REVENUE = "REVENUE"
    EXPENSE = "EXPENSE"

class NormalBalance(str, Enum):
    DEBIT = "DEBIT"
    CREDIT = "CREDIT"

class JournalStatus(str, Enum):
    DRAFT = "DRAFT"
    POSTED = "POSTED"
    REVERSED = "REVERSED"

class FiscalYear(Base):
    __tablename__ = "fiscal_years"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    code = Column(String(20), unique=True, nullable=False) # e.g. "2082/2083" or "FY2026/27"
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    is_closed = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class Account(Base):
    """
    Standard Chart of Accounts (COA) Entity
    """
    __tablename__ = "accounts"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    code = Column(String(30), unique=True, nullable=False, index=True) # e.g. "1010-01"
    name = Column(String(255), nullable=False)
    account_type = Column(SQLEnum(AccountType), nullable=False)
    normal_balance = Column(SQLEnum(NormalBalance), nullable=False)
    parent_id = Column(String(36), ForeignKey("accounts.id"), nullable=True)
    is_reconcilable = Column(Boolean, default=False, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    parent = relationship("Account", remote_side=[id], backref="sub_accounts")
    lines = relationship("JournalLine", back_populates="account")

class JournalEntry(Base):
    """
    Double-Entry Journal Header
    """
    __tablename__ = "journal_entries"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    entry_number = Column(String(50), unique=True, nullable=False, index=True) # e.g. "JV-2026-0001"
    idempotency_key = Column(String(100), unique=True, nullable=True, index=True)
    fiscal_year_id = Column(String(36), ForeignKey("fiscal_years.id"), nullable=True)
    entry_date = Column(Date, nullable=False, default=date.today)
    narration = Column(Text, nullable=False)
    source_module = Column(String(50), nullable=False) # e.g. "STUDENT_FEE", "PAYROLL", "EXPENSE"
    source_id = Column(String(100), nullable=True, index=True)
    status = Column(SQLEnum(JournalStatus), default=JournalStatus.POSTED, nullable=False)
    posted_by = Column(String(100), default="System", nullable=False)
    posted_at = Column(DateTime, default=datetime.utcnow)
    reversed_entry_id = Column(String(36), ForeignKey("journal_entries.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    lines = relationship("JournalLine", back_populates="entry", cascade="all, delete-orphan")
    reversal_of = relationship("JournalEntry", remote_side=[id], foreign_keys=[reversed_entry_id])

class JournalLine(Base):
    """
    Individual debit/credit posting line
    """
    __tablename__ = "journal_lines"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    journal_entry_id = Column(String(36), ForeignKey("journal_entries.id", ondelete="CASCADE"), nullable=False)
    account_id = Column(String(36), ForeignKey("accounts.id"), nullable=False)
    debit = Column(Numeric(14, 2), default=Decimal("0.00"), nullable=False)
    credit = Column(Numeric(14, 2), default=Decimal("0.00"), nullable=False)
    line_narration = Column(String(255), nullable=True)
    cost_center = Column(String(100), nullable=True)
    
    entry = relationship("JournalEntry", back_populates="lines")
    account = relationship("Account", back_populates="lines")
    
    __table_args__ = (
        CheckConstraint("debit >= 0", name="check_positive_debit"),
        CheckConstraint("credit >= 0", name="check_positive_credit"),
        Index("idx_journal_account_date", "account_id")
    )
