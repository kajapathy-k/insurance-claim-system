import os
from typing import List
from pathlib import Path

from dotenv import load_dotenv
from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from sqlalchemy import Column, ForeignKey, Integer, String, create_engine
from sqlalchemy.orm import Session, declarative_base, sessionmaker

# Load only the service-local .env so local testing is predictable.
ENV_PATH = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=ENV_PATH, override=True)

# =========================
# DATABASE CONFIG (FINAL)
# =========================

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:postgres@localhost:5432/insurance_claims",
)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# =========================
# MODELS
# =========================

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    role = Column(String, default="user", nullable=False, server_default="user")


class Policy(Base):
    __tablename__ = "policies"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    policy_type = Column(String, nullable=False)
    status = Column(String, default="active")


# =========================
# SCHEMAS
# =========================

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    role: str = "user"


class UserResponse(UserCreate):
    id: int

    class Config:
        from_attributes = True


class PolicyCreate(BaseModel):
    user_id: int
    policy_type: str
    status: str = "active"


class PolicyResponse(PolicyCreate):
    id: int

    class Config:
        from_attributes = True


# =========================
# FASTAPI APP
# =========================

app = FastAPI(title="User & Policy Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================
# DB DEPENDENCY
# =========================

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# =========================
# STARTUP EVENT
# =========================

@app.on_event("startup")
def create_tables():
    Base.metadata.create_all(bind=engine)


# =========================
# HEALTH CHECK
# =========================

@app.get("/health")
def health_check():
    return {"service": "user-policy-service", "status": "running"}


# =========================
# APIs
# =========================

@app.get("/users", response_model=List[UserResponse])
def get_users(db: Session = Depends(get_db)):
    return db.query(User).order_by(User.id.desc()).all()


@app.post("/users", response_model=UserResponse)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    db_user = User(name=user.name, email=user.email, role=user.role)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


@app.post("/policies", response_model=PolicyResponse)
def create_policy(policy: PolicyCreate, db: Session = Depends(get_db)):
    db_policy = Policy(
        user_id=policy.user_id,
        policy_type=policy.policy_type,
        status=policy.status,
    )
    db.add(db_policy)
    db.commit()
    db.refresh(db_policy)
    return db_policy


@app.get("/policies", response_model=List[PolicyResponse])
def get_policies(db: Session = Depends(get_db)):
    return db.query(Policy).order_by(Policy.id.desc()).all()
