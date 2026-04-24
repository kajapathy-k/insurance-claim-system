import os
from typing import List

import requests
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from pydantic import BaseModel
from sqlalchemy import Column, ForeignKey, Integer, String, create_engine
from sqlalchemy.orm import Session, declarative_base, sessionmaker

SECRET_KEY = os.getenv("SECRET_KEY", "super-secret-jwt-key-replace-in-production")
ALGORITHM = "HS256"
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/policy/auth/login")

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
    email = Column(String, nullable=False, unique=True, index=True)
    password = Column(String, nullable=False)
    role = Column(String, default="user", nullable=False, server_default="user")


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


class ClaimCreate(BaseModel):
    user_id: int
    policy_id: int
    description: str


class ClaimResponse(ClaimCreate):
    id: int
    status: str

    class Config:
        from_attributes = True


app = FastAPI(title="Claim Service")

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

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("id")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception
    return user

def notify(message: str):
    try:
        requests.post(
            f"{NOTIFICATION_SERVICE_URL}/notifications",
            json={"message": message},
            timeout=2,
        )
    except requests.RequestException:
        print(f"Notification service unavailable: {message}")


@app.on_event("startup")
def create_tables():
    Base.metadata.create_all(bind=engine)


@app.get("/health")
def health_check():
    return {"service": "claim-service", "status": "running"}


@app.post("/claims", response_model=ClaimResponse)
def submit_claim(claim: ClaimCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Verify policy belongs to user or admin
    if current_user.role != "admin" and claim.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Cannot submit claims for other users")
        
    db_claim = Claim(
        user_id=claim.user_id,
        policy_id=claim.policy_id,
        description=claim.description,
        status="pending",
    )
    db.add(db_claim)
    db.commit()
    db.refresh(db_claim)

    notify(f"Claim #{db_claim.id} was submitted and is pending review.")
    return db_claim


@app.get("/claims", response_model=List[ClaimResponse])
def get_claims(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role == "admin":
        return db.query(Claim).order_by(Claim.id.desc()).all()
    return db.query(Claim).filter(Claim.user_id == current_user.id).order_by(Claim.id.desc()).all()


@app.get("/claims/{claim_id}", response_model=ClaimResponse)
def get_claim_by_id(claim_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    if current_user.role != "admin" and claim.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    return claim
