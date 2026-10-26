import uuid
from decimal import Decimal
from datetime import date, timedelta, datetime
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.app.students.models import (
    StudentMaster, StudentEnrollment, InstallmentSchedule, FeeReceipt, InstallmentStatus
)
from backend.app.accounting.engine import PostingEngine, AccountingEngineError

class StudentFinanceService:
    
    @staticmethod
    def generate_next_receipt_number(db: Session, prefix: str = "REC-2026") -> str:
        count = db.query(func.count(FeeReceipt.id)).scalar() or 0
        return f"{prefix}-{(count + 1):04d}"

    @classmethod
    def enroll_student(
        cls,
        db: Session,
        name: str,
        phone: str,
        tgid: str,
        group_id: str,
        course_name: str,
        original_course_fee: Decimal,
        discount_percent: Decimal = Decimal("0.00"),
        admission_fee: Decimal = Decimal("1700.00"),
        locked_course_fee_override: Optional[Decimal] = None,
        secondary_phone: Optional[str] = None,
        email: Optional[str] = None,
        gender: str = "Female",
        admission_date: Optional[date] = None
    ) -> StudentEnrollment:
        """
        Creates student, enrollment snapshot, 2-installment schedule,
        and posts initial billing journal entry:
          Dr. 1200 Student Receivables
          Cr. 4100 Training Revenue
        """
        adm_date = admission_date or date.today()
        
        # 1. Get or create master student
        student = db.query(StudentMaster).filter(StudentMaster.tgid == tgid).first()
        if not student:
            student = StudentMaster(
                tgid=tgid,
                name=name,
                phone=phone,
                secondary_phone=secondary_phone,
                email=email,
                gender=gender,
                admission_date=adm_date
            )
            db.add(student)
            db.flush()

        # 2. Calculate locked course fee
        orig_fee = Decimal(str(original_course_fee))
        disc_pct = Decimal(str(discount_percent))
        disc_amt = (orig_fee * disc_pct / Decimal("100.00")).quantize(Decimal("0.01"))
        adm_charge = Decimal(str(admission_fee)).quantize(Decimal("0.01"))
        
        if locked_course_fee_override is not None:
            locked_fee = Decimal(str(locked_course_fee_override)).quantize(Decimal("0.01"))
        else:
            locked_fee = (orig_fee - disc_amt + adm_charge).quantize(Decimal("0.01"))

        enrollment = StudentEnrollment(
            student_id=student.id,
            group_id=group_id,
            course_name=course_name,
            original_course_fee=orig_fee,
            discount_percent=disc_pct,
            discount_amount=disc_amt,
            admission_fee=adm_charge,
            locked_course_fee=locked_fee,
            total_paid=Decimal("0.00"),
            due_balance=locked_fee,
            status="Active"
        )
        db.add(enrollment)
        db.flush()

        # 3. Create 2-Installment Schedule (50% upfront, remaining 50% within 30 days)
        inst1_amt = (locked_fee / Decimal("2.00")).quantize(Decimal("0.01"))
        inst2_amt = locked_fee - inst1_amt

        inst1 = InstallmentSchedule(
            enrollment_id=enrollment.id,
            installment_no=1,
            amount_due=inst1_amt,
            due_date=adm_date,
            status=InstallmentStatus.PENDING
        )
        inst2 = InstallmentSchedule(
            enrollment_id=enrollment.id,
            installment_no=2,
            amount_due=inst2_amt,
            due_date=adm_date + timedelta(days=30),
            status=InstallmentStatus.PENDING
        )
        db.add_all([inst1, inst2])

        # 4. Post Double-Entry Invoicing Journal
        # Dr. 1200 Student Accounts Receivable (Full contracted amount)
        # Cr. 4100 Vocational Course Training Revenue
        PostingEngine.post_journal(
            db=db,
            narration=f"Enrollment & Invoicing for {student.name} ({student.tgid}) - {course_name}",
            lines=[
                {"account_code": "1200", "debit": locked_fee, "credit": 0},
                {"account_code": "4100", "debit": 0, "credit": locked_fee}
            ],
            source_module="STUDENT_ENROLLMENT",
            source_id=enrollment.id,
            idempotency_key=f"ENR-BILL-{enrollment.id}",
            entry_date=adm_date
        )

        db.flush()
        return enrollment

    @classmethod
    def record_student_payment(
        cls,
        db: Session,
        enrollment_id: str,
        amount: Decimal,
        payment_method: str = "Cash",
        installment_no: int = 1,
        received_by: str = "Cashier",
        remarks: Optional[str] = None,
        payment_date: Optional[date] = None,
        trainer_commission_percent: Decimal = Decimal("0.00")
    ) -> FeeReceipt:
        """
        Record student fee collection with full double-entry accounting:
          1. Dr. 1010 Cash (or 1020 Bank/QR)
             Cr. 1200 Student Receivables
          2. Auto-accrue Trainer Commission on realized cash:
             Dr. 5100 Trainer Commission Expense
             Cr. 2110 Trainer Commission Payable
        """
        pay_date = payment_date or date.today()
        pay_amt = Decimal(str(amount)).quantize(Decimal("0.01"))

        if pay_amt <= 0:
            raise AccountingEngineError("Payment amount must be greater than zero.")

        enrollment = db.query(StudentEnrollment).filter(
            StudentEnrollment.id == enrollment_id
        ).with_for_update().first() if "sqlite" not in str(db.bind.url) else db.query(StudentEnrollment).filter(StudentEnrollment.id == enrollment_id).first()

        if not enrollment:
            raise AccountingEngineError("Enrollment record not found.")

        if pay_amt > enrollment.due_balance:
            raise AccountingEngineError(
                f"Overpayment prohibited! Amount Rs. {pay_amt} exceeds due balance Rs. {enrollment.due_balance}."
            )

        receipt_no = cls.generate_next_receipt_number(db)
        is_digital = any(k in payment_method.lower() for k in ["qr", "fonepay", "esewa", "bank", "card"])
        debit_acc_code = "1020" if is_digital else "1010"

        # 1. Post Collection Journal
        collection_jv = PostingEngine.post_journal(
            db=db,
            narration=f"Student Fee Collection ({receipt_no}) from {enrollment.student.name} ({enrollment.student.tgid}) via {payment_method}",
            lines=[
                {"account_code": debit_acc_code, "debit": pay_amt, "credit": 0},
                {"account_code": "1200", "debit": 0, "credit": pay_amt}
            ],
            source_module="STUDENT_FEE_RECEIPT",
            source_id=receipt_no,
            idempotency_key=f"RCPT-PAY-{receipt_no}",
            entry_date=pay_date,
            posted_by=received_by
        )

        # 2. Optional Trainer Commission Accrual on Realized Cash
        comm_pct = Decimal(str(trainer_commission_percent))
        if comm_pct > 0:
            comm_amt = (pay_amt * comm_pct / Decimal("100.00")).quantize(Decimal("0.01"))
            if comm_amt > 0:
                PostingEngine.post_journal(
                    db=db,
                    narration=f"Trainer Commission Accrual ({comm_pct}%) on {receipt_no}",
                    lines=[
                        {"account_code": "5100", "debit": comm_amt, "credit": 0},
                        {"account_code": "2110", "debit": 0, "credit": comm_amt}
                    ],
                    source_module="TRAINER_COMMISSION_ACCRUAL",
                    source_id=receipt_no,
                    idempotency_key=f"TRN-COMM-{receipt_no}",
                    entry_date=pay_date,
                    posted_by="System"
                )

        # 3. Record Fee Receipt
        receipt = FeeReceipt(
            receipt_no=receipt_no,
            enrollment_id=enrollment.id,
            journal_entry_id=collection_jv.id,
            amount=pay_amt,
            payment_method=payment_method,
            installment_no=installment_no,
            received_by=received_by,
            remarks=remarks,
            payment_date=pay_date
        )
        db.add(receipt)

        # 4. Update Enrollment Balances
        enrollment.total_paid += pay_amt
        enrollment.due_balance -= pay_amt

        # 5. Update Installment Schedule
        unpaid_insts = db.query(InstallmentSchedule).filter(
            InstallmentSchedule.enrollment_id == enrollment.id,
            InstallmentSchedule.status != InstallmentStatus.PAID
        ).order_by(InstallmentSchedule.installment_no).all()

        rem_to_allocate = pay_amt
        for inst in unpaid_insts:
            gap = inst.amount_due - inst.amount_paid
            if rem_to_allocate >= gap:
                inst.amount_paid += gap
                inst.status = InstallmentStatus.PAID
                rem_to_allocate -= gap
            else:
                inst.amount_paid += rem_to_allocate
                rem_to_allocate = Decimal("0.00")
                break

        db.flush()
        return receipt
