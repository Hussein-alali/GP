from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models import User
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str):
    return pwd_context.hash(password)

def register_user(user_data, db: Session):
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = User(
        username=user_data.name,
        email=user_data.email,
        password=user_data.password   # بدون hashing
    )


    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "id": new_user.id,
        "email": new_user.email
    }

def login_user(user, db: Session):
    # verify email & password
    return {"access_token": "jwt-token"}