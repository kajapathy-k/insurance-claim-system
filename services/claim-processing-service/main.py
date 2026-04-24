import os

import requests
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import Column, ForeignKey, Integer, String, create_engine
from sqlalchemy.orm import Session, declarative_base, sessionmaker

load_dotenv()

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:postgres@localhost:5432/insurance_claims",
)
NOTIFICATION_SERVICE_URL = os.getenv(
    "NOTIFICATION_SERVICE_URL",
    "http://localhost:8004",
)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, nullable=False)


class Policy(Base):
    __tablename__ = "policies"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    policy_type = Column(String, nullable=False)
    status = Column(String, default="active")


class Claim(Base):
    __tablename__ = "claims"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    policy_id = Column(Integer, ForeignKey("policies.id"), nullable=False)
    description = Column(String, nullable=False)
    status = Column(String, default="pending")


class ClaimResponse(BaseModel):
    id: int
    user_id: int
    policy_id: int
    description: str
    status: str

    class Config:
        from_attributes = True


app = FastAPI(title="Claim Processing Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def notify(message: str):
    try:
        requests.post(
            f"{NOTIFICATION_SERVICE_URL}/notifications",
            json={"message": message},
            timeout=2,
        )
    except requests.RequestException:
        print(f"Notification service unavailable: {message}")


def update_claim_status(claim_id: int, status: str, db: Session):
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    claim.status = status
    db.commit()
    db.refresh(claim)
    notify(f"Claim #{claim.id} was {status}.")
    return claim


@app.on_event("startup")
def create_tables():
    Base.metadata.create_all(bind=engine)


@app.get("/health")
def health_check():
    return {"service": "claim-processing-service", "status": "running"}


@app.put("/claims/{claim_id}/approve", response_model=ClaimResponse)
def approve_claim(claim_id: int, db: Session = Depends(get_db)):
    return update_claim_status(claim_id, "approved", db)


@app.put("/claims/{claim_id}/reject", response_model=ClaimResponse)
def reject_claim(claim_id: int, db: Session = Depends(get_db)):
    return update_claim_status(claim_id, "rejected", db)
