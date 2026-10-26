from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from backend.app.core.config import settings
from backend.app.core.database import Base, engine, SessionLocal
from backend.app.accounting.seed import seed_chart_of_accounts
from backend.app.accounting.router import router as accounting_router
from backend.app.students.router import router as students_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create tables if not exist & Seed Chart of Accounts
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_chart_of_accounts(db)
    finally:
        db.close()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Enterprise Accounting & Financial Management System for Global Era Multi Service Pvt. Ltd., Nepal",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict to settings.BACKEND_CORS_ORIGINS
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers under /api/v1
app.include_router(accounting_router, prefix=settings.API_V1_STR)
app.include_router(students_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "system": settings.PROJECT_NAME,
        "company": settings.COMPANY_NAME,
        "location": settings.LOCATION,
        "currency": settings.CURRENCY,
        "version": settings.VERSION,
        "status": "OPERATIONAL"
    }

@app.get("/health")
def health_check():
    return {"status": "HEALTHY"}
