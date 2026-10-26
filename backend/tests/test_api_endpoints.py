import pytest
from decimal import Decimal
from fastapi.testclient import TestClient
from backend.app.main import app

@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c

def test_root_and_health(client):
    res = client.get("/")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "OPERATIONAL"
    assert data["company"] == "Global Era Multi Service Pvt. Ltd."

    health = client.get("/health")
    assert health.status_code == 200
    assert health.json()["status"] == "HEALTHY"

def test_chart_of_accounts_endpoint(client):
    res = client.get("/api/v1/accounting/coa")
    assert res.status_code == 200
    accounts = res.json()
    assert len(accounts) >= 15
    codes = [a["code"] for a in accounts]
    assert "1010" in codes # Cash
    assert "1200" in codes # Student Receivables
    assert "4100" in codes # Training Revenue

def test_student_enrollment_and_payment_api_flow(client):
    # 1. Enroll Student via API
    enroll_payload = {
        "name": "Aarati Chaudhary",
        "phone": "9801234567",
        "tgid": f"TGID-API-099",
        "group_id": "GRP-01",
        "course_name": "Basic Beautician",
        "original_course_fee": 30000.0,
        "discount_percent": 60.0,
        "admission_fee": 1700.0,
        "locked_course_fee_override": 11865.0
    }
    enroll_res = client.post("/api/v1/students/enroll", json=enroll_payload)
    assert enroll_res.status_code == 200
    enroll_data = enroll_res.json()
    assert enroll_data["success"] is True
    assert enroll_data["locked_course_fee"] == 11865.0
    enrollment_id = enroll_data["enrollment_id"]

    # 2. Record 1st Installment Payment via API
    pay_payload = {
        "enrollment_id": enrollment_id,
        "amount": 6000.0,
        "payment_method": "Fonepay / QR",
        "installment_no": 1,
        "received_by": "Cashier Desk",
        "trainer_commission_percent": 25.0
    }
    pay_res = client.post("/api/v1/students/payments", json=pay_payload)
    assert pay_res.status_code == 200
    pay_data = pay_res.json()
    assert pay_data["success"] is True
    assert pay_data["amount"] == 6000.0
    assert pay_data["remaining_due"] == 5865.0
    assert pay_data["receipt_no"].startswith("REC-2026")

    # 3. Check Trial Balance via API
    tb_res = client.get("/api/v1/accounting/reports/trial-balance")
    assert tb_res.status_code == 200
    tb = tb_res.json()
    assert tb["is_balanced"] is True
    assert tb["difference"] == 0.0
