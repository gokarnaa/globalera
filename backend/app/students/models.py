import uuid
from datetime import datetime, date
from decimal import Decimal
from enum import Enum
from sqlalchemy import (
    Column, String, Text, Boolean, Date, DateTime, Numeric,
    ForeignKey, Integer, Enum as SQLEnum
)
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

class InstallmentStatus(str, Enum):
    PENDING = "PENDING"
    PAID = "PAID"
    OVERDUE = "OVERDUE"

class StudentMaster(Base):
    __tablename__ = "students_master"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tgid = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    phone = Column(String(20), nullable=False, index=True)
    secondary_phone = Column(String(20), nullable=True)
    email = Column(String(255), nullable=True)
    gender = Column(String(20), default="Female")
    admission_date = Column(Date, default=date.today)
    photo_url = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    enrollments = relationship("StudentEnrollment", back_populates="student")

class StudentEnrollment(Base):
    """
    Financial Master Contract for a student's course enrollment.
    Maintains immutable locked course fee snapshot.
    """
    __tablename__ = "student_enrollments"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    student_id = Column(String(36), ForeignKey("students_master.id"), nullable=False)
    group_id = Column(String(50), nullable=False) # e.g. "GRP-01"
    course_name = Column(String(255), nullable=False)
    
    original_course_fee = Column(Numeric(12, 2), nullable=False)
    discount_percent = Column(Numeric(5, 2), default=Decimal("0.00"))
    discount_amount = Column(Numeric(12, 2), default=Decimal("0.00"))
    admission_fee = Column(Numeric(12, 2), default=Decimal("0.00"))
    locked_course_fee = Column(Numeric(12, 2), nullable=False) # (original - discount + admission)
    
    total_paid = Column(Numeric(12, 2), default=Decimal("0.00"), nullable=False)
    due_balance = Column(Numeric(12, 2), nullable=False)
    status = Column(String(50), default="Active") # Active, Completed, Dropped
    created_at = Column(DateTime, default=datetime.utcnow)
    
    student = relationship("StudentMaster", back_populates="enrollments")
    receipts = relationship("FeeReceipt", back_populates="enrollment")
    installments = relationship("InstallmentSchedule", back_populates="enrollment")

class InstallmentSchedule(Base):
    __tablename__ = "installment_schedules"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    enrollment_id = Column(String(36), ForeignKey("student_enrollments.id"), nullable=False)
    installment_no = Column(Integer, nullable=False)
    amount_due = Column(Numeric(12, 2), nullable=False)
    amount_paid = Column(Numeric(12, 2), default=Decimal("0.00"), nullable=False)
    due_date = Column(Date, nullable=False)
    status = Column(SQLEnum(InstallmentStatus), default=InstallmentStatus.PENDING)
    
    enrollment = relationship("StudentEnrollment", back_populates="installments")

class FeeReceipt(Base):
    """
    Official Payment Receipt (REC-2026-XXXX)
    Linked directly to double-entry journal entry!
    """
    __tablename__ = "fee_receipts"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    receipt_no = Column(String(50), unique=True, nullable=False, index=True)
    enrollment_id = Column(String(36), ForeignKey("student_enrollments.id"), nullable=False)
    journal_entry_id = Column(String(36), ForeignKey("journal_entries.id"), nullable=False)
    
    amount = Column(Numeric(12, 2), nullable=False)
    payment_method = Column(String(50), nullable=False) # Cash, Fonepay / QR, Bank Transfer, eSewa
    installment_no = Column(Integer, default=1)
    received_by = Column(String(100), default="Cashier")
    remarks = Column(Text, nullable=True)
    payment_date = Column(Date, default=date.today)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    enrollment = relationship("StudentEnrollment", back_populates="receipts")
    journal_entry = relationship("JournalEntry")
