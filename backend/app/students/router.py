from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from datetime import date
from pydantic import BaseModel
from decimal import Decimal

from backend.app.core.database import get_db
from backend.app.students.models import StudentMaster, StudentEnrollment, FeeReceipt
from backend.app.students.service import StudentFinanceService
from backend.app.accounting.engine import AccountingEngineError

router = APIRouter(prefix="/students", tags=["Student Financial Management"])

class EnrollStudentSchema(BaseModel):
    name: str
    phone: str
    tgid: str
    group_id: str
    course_name: str
    original_course_fee: Decimal
    discount_percent: Decimal = Decimal("0.00")
    admission_fee: Decimal = Decimal("1700.00")
    locked_course_fee_override: Optional[Decimal] = None
    gender: str = "Female"
    admission_date: Optional[date] = None

class RecordPaymentSchema(BaseModel):
    enrollment_id: str
    amount: Decimal
    payment_method: str = "Cash"
    installment_no: int = 1
    received_by: str = "Cashier"
    remarks: Optional[str] = None
    payment_date: Optional[date] = None
    trainer_commission_percent: Decimal = Decimal("0.00")

@router.get("/enrollments")
def list_enrollments(db: Session = Depends(get_db)):
    enrollments = db.query(StudentEnrollment).order_by(StudentEnrollment.created_at.desc()).all()
    return [
        {
            "id": e.id,
            "student_name": e.student.name,
            "tgid": e.student.tgid,
            "phone": e.student.phone,
            "group_id": e.group_id,
            "course_name": e.course_name,
            "locked_course_fee": float(e.locked_course_fee),
            "total_paid": float(e.total_paid),
            "due_balance": float(e.due_balance),
            "status": e.status,
            "installments": [
                {
                    "installment_no": i.installment_no,
                    "amount_due": float(i.amount_due),
                    "amount_paid": float(i.amount_paid),
                    "due_date": i.due_date.isoformat(),
                    "status": i.status.value
                }
                for i in e.installments
            ]
        }
        for e in enrollments
    ]

@router.post("/enroll")
def enroll_student(payload: EnrollStudentSchema, db: Session = Depends(get_db)):
    try:
        enrollment = StudentFinanceService.enroll_student(
            db=db,
            name=payload.name,
            phone=payload.phone,
            tgid=payload.tgid,
            group_id=payload.group_id,
            course_name=payload.course_name,
            original_course_fee=payload.original_course_fee,
            discount_percent=payload.discount_percent,
            admission_fee=payload.admission_fee,
            locked_course_fee_override=payload.locked_course_fee_override,
            gender=payload.gender,
            admission_date=payload.admission_date
        )
        db.commit()
        return {
            "success": True,
            "enrollment_id": enrollment.id,
            "student_name": enrollment.student.name,
            "locked_course_fee": float(enrollment.locked_course_fee),
            "due_balance": float(enrollment.due_balance)
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/payments")
def record_payment(payload: RecordPaymentSchema, db: Session = Depends(get_db)):
    try:
        receipt = StudentFinanceService.record_student_payment(
            db=db,
            enrollment_id=payload.enrollment_id,
            amount=payload.amount,
            payment_method=payload.payment_method,
            installment_no=payload.installment_no,
            received_by=payload.received_by,
            remarks=payload.remarks,
            payment_date=payload.payment_date,
            trainer_commission_percent=payload.trainer_commission_percent
        )
        db.commit()
        return {
            "success": True,
            "receipt_no": receipt.receipt_no,
            "amount": float(receipt.amount),
            "remaining_due": float(receipt.enrollment.due_balance),
            "total_paid": float(receipt.enrollment.total_paid),
            "journal_entry_id": receipt.journal_entry_id
        }
    except AccountingEngineError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
