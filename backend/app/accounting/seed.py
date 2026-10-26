from sqlalchemy.orm import Session
from backend.app.accounting.models import Account, AccountType, NormalBalance

DEFAULT_CHART_OF_ACCOUNTS = [
    # 1. ASSETS
    {"code": "1010", "name": "Cash on Hand (Counter)", "type": AccountType.ASSET, "balance": NormalBalance.DEBIT},
    {"code": "1020", "name": "Bank / Digital QR (Fonepay/eSewa)", "type": AccountType.ASSET, "balance": NormalBalance.DEBIT},
    {"code": "1200", "name": "Student Accounts Receivable", "type": AccountType.ASSET, "balance": NormalBalance.DEBIT},
    {"code": "1250", "name": "Municipal & Project Receivables", "type": AccountType.ASSET, "balance": NormalBalance.DEBIT},
    {"code": "1500", "name": "Vocational Training Equipment & Assets", "type": AccountType.ASSET, "balance": NormalBalance.DEBIT},
    
    # 2. LIABILITIES
    {"code": "2010", "name": "Accounts Payable (Vendors)", "type": AccountType.LIABILITY, "balance": NormalBalance.CREDIT},
    {"code": "2110", "name": "Trainer Commission Payable", "type": AccountType.LIABILITY, "balance": NormalBalance.CREDIT},
    {"code": "2120", "name": "Staff Salary Payable", "type": AccountType.LIABILITY, "balance": NormalBalance.CREDIT},
    {"code": "2200", "name": "Advance / Unearned Student Fees", "type": AccountType.LIABILITY, "balance": NormalBalance.CREDIT},
    {"code": "2300", "name": "TDS & Tax Withholding Payable", "type": AccountType.LIABILITY, "balance": NormalBalance.CREDIT},
    
    # 3. EQUITY
    {"code": "3010", "name": "Owner's Capital", "type": AccountType.EQUITY, "balance": NormalBalance.CREDIT},
    {"code": "3020", "name": "Retained Earnings", "type": AccountType.EQUITY, "balance": NormalBalance.CREDIT},
    
    # 4. REVENUE
    {"code": "4100", "name": "Vocational Course Training Revenue", "type": AccountType.REVENUE, "balance": NormalBalance.CREDIT},
    {"code": "4110", "name": "Student Admission Fees", "type": AccountType.REVENUE, "balance": NormalBalance.CREDIT},
    {"code": "4200", "name": "Municipality / Ward Project Revenue", "type": AccountType.REVENUE, "balance": NormalBalance.CREDIT},
    {"code": "4300", "name": "Certificate & Verification Fees", "type": AccountType.REVENUE, "balance": NormalBalance.CREDIT},
    
    # 5. EXPENSES
    {"code": "5100", "name": "Trainer Commission Expense", "type": AccountType.EXPENSE, "balance": NormalBalance.DEBIT},
    {"code": "5110", "name": "Trainer Fixed Salary Expense", "type": AccountType.EXPENSE, "balance": NormalBalance.DEBIT},
    {"code": "5200", "name": "Staff Payroll & Wages", "type": AccountType.EXPENSE, "balance": NormalBalance.DEBIT},
    {"code": "5300", "name": "Practical Training Materials (Raw Stock)", "type": AccountType.EXPENSE, "balance": NormalBalance.DEBIT},
    {"code": "5400", "name": "Center Rent & Electricity/Water", "type": AccountType.EXPENSE, "balance": NormalBalance.DEBIT},
    {"code": "5500", "name": "Marketing & Student Recruitment", "type": AccountType.EXPENSE, "balance": NormalBalance.DEBIT},
    {"code": "5600", "name": "Repairs, Maintenance & Office Supplies", "type": AccountType.EXPENSE, "balance": NormalBalance.DEBIT},
    {"code": "5700", "name": "Depreciation Expense", "type": AccountType.EXPENSE, "balance": NormalBalance.DEBIT},
]

def seed_chart_of_accounts(db: Session):
    for item in DEFAULT_CHART_OF_ACCOUNTS:
        existing = db.query(Account).filter(Account.code == item["code"]).first()
        if not existing:
            acc = Account(
                code=item["code"],
                name=item["name"],
                account_type=item["type"],
                normal_balance=item["balance"],
                is_active=True
            )
            db.add(acc)
    db.commit()
