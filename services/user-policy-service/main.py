import os
from typing import List
from pathlib import Path

from datetime import datetime, timedelta

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr
from sqlalchemy import Column, ForeignKey, Integer, String, create_engine
from sqlalchemy.orm import Session, declarative_base, sessionmaker

# Load only the service-local .env so local testing is predictable.
ENV_PATH = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=ENV_PATH, override=True)

# =========================
# SECURITY CONFIG
# =========================
SECRET_KEY = os.getenv("SECRET_KEY", "super-secret-jwt-key-replace-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

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
    email = Column(String, nullable=False, unique=True, index=True)
    password = Column(String, nullable=False)
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
    password: str
    role: str = "user"

class UserLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    id: int
    role: str


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


def get_current_admin(current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return current_user


# =========================
# STARTUP EVENT
# =========================

@app.on_event("startup")
def create_tables():
    Base.metadata.create_all(bind=engine)
    
    # Seed default admin
    db = SessionLocal()
    try:
        admin_email = "admin@nexus.com"
        admin = db.query(User).filter(User.email == admin_email).first()
        if not admin:
            db_admin = User(
                name="Nexus Admin",
                email=admin_email,
                password=get_password_hash("admin123"),
                role="admin"
            )
            db.add(db_admin)
            db.commit()
    finally:
        db.close()


# =========================
# HEALTH CHECK
# =========================

@app.get("/health")
def health_check():
    return {"service": "user-policy-service", "status": "running"}


# =========================
# AUTH APIs
# =========================

@app.post("/auth/login", response_model=Token)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == credentials.email).first()
    if not user or not verify_password(credentials.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    access_token = create_access_token(data={"id": user.id, "role": user.role})
    return {"access_token": access_token, "token_type": "bearer"}


@app.post("/auth/register", response_model=UserResponse)
def register(user: UserCreate, db: Session = Depends(get_db), current_admin: User = Depends(get_current_admin)):
    if db.query(User).filter(User.email == user.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    db_user = User(
        name=user.name, 
        email=user.email, 
        password=get_password_hash(user.password),
        role=user.role
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


@app.get("/auth/me", response_model=UserResponse)
def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user


# =========================
# APIs
# =========================

@app.get("/users", response_model=List[UserResponse])
def get_users(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(User).order_by(User.id.desc()).all()


@app.post("/users", response_model=UserResponse)
def create_user_legacy(user: UserCreate, db: Session = Depends(get_db)):
    # Legacy endpoint kept for backwards compatibility but throws 403.
    raise HTTPException(status_code=403, detail="Use /auth/register via an Admin account to create users.")


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
