from decimal import Decimal
from typing import List, Dict, Any, Optional
from datetime import date
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.app.accounting.models import (
    Account, JournalLine, JournalEntry, AccountType, NormalBalance, JournalStatus
)

class FinancialReportingService:

    @classmethod
    def get_trial_balance(cls, db: Session, as_of_date: Optional[date] = None) -> Dict[str, Any]:
        """
        Calculates mathematical trial balance from posted journal lines.
        Invariant: Total Debits == Total Credits.
        """
        cutoff = as_of_date or date.today()
        
        # Query total debits and credits per account for posted entries
        query = (
            db.query(
                Account.id,
                Account.code,
                Account.name,
                Account.account_type,
                Account.normal_balance,
                func.coalesce(func.sum(JournalLine.debit), Decimal("0.00")).label("total_debit"),
                func.coalesce(func.sum(JournalLine.credit), Decimal("0.00")).label("total_credit"),
            )
            .outerjoin(
                JournalLine,
                JournalLine.account_id == Account.id
            )
            .outerjoin(
                JournalEntry,
                (JournalLine.journal_entry_id == JournalEntry.id) & 
                (JournalEntry.status == JournalStatus.POSTED) & 
                (JournalEntry.entry_date <= cutoff)
            )
            .group_by(Account.id)
            .order_by(Account.code)
        )
        
        accounts_data = query.all()
        
        report_lines = []
        grand_total_debit = Decimal("0.00")
        grand_total_credit = Decimal("0.00")

        for acc in accounts_data:
            dr = Decimal(str(acc.total_debit))
            cr = Decimal(str(acc.total_credit))
            
            # Compute net balance according to normal balance
            if acc.normal_balance == NormalBalance.DEBIT:
                net_dr = dr - cr
                net_cr = Decimal("0.00")
                if net_dr < 0:
                    net_cr = abs(net_dr)
                    net_dr = Decimal("0.00")
            else:
                net_cr = cr - dr
                net_dr = Decimal("0.00")
                if net_cr < 0:
                    net_dr = abs(net_cr)
                    net_cr = Decimal("0.00")

            grand_total_debit += net_dr
            grand_total_credit += net_cr

            report_lines.append({
                "account_id": acc.id,
                "code": acc.code,
                "name": acc.name,
                "type": acc.account_type.value,
                "debit": float(net_dr),
                "credit": float(net_cr)
            })

        is_balanced = (grand_total_debit == grand_total_credit)
        
        return {
            "as_of_date": cutoff.isoformat(),
            "lines": report_lines,
            "total_debit": float(grand_total_debit),
            "total_credit": float(grand_total_credit),
            "is_balanced": is_balanced,
            "difference": float(abs(grand_total_debit - grand_total_credit))
        }

    @classmethod
    def get_profit_and_loss(cls, db: Session, start_date: Optional[date] = None, end_date: Optional[date] = None) -> Dict[str, Any]:
        """
        Computes Income Statement (Revenue - Expenses)
        """
        tb = cls.get_trial_balance(db, as_of_date=end_date)
        
        revenue_lines = [l for l in tb["lines"] if l["type"] == AccountType.REVENUE.value]
        expense_lines = [l for l in tb["lines"] if l["type"] == AccountType.EXPENSE.value]

        total_revenue = sum(l["credit"] - l["debit"] for l in revenue_lines)
        total_expenses = sum(l["debit"] - l["credit"] for l in expense_lines)
        net_profit = total_revenue - total_expenses
        profit_margin = round((net_profit / total_revenue * 100), 2) if total_revenue > 0 else 0.0

        return {
            "period_end": (end_date or date.today()).isoformat(),
            "revenue": {
                "items": revenue_lines,
                "total": float(total_revenue)
            },
            "expenses": {
                "items": expense_lines,
                "total": float(total_expenses)
            },
            "net_profit": float(net_profit),
            "profit_margin_percent": profit_margin
        }
