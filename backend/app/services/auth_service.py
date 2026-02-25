import base64
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models import User
from passlib.context import CryptContext
from passlib.exc import UnknownHashError

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return pwd_context.verify(plain, hashed)
    except UnknownHashError:
        # Support legacy rows that stored plain text passwords.
        return plain == hashed


def _create_token(user: User) -> str:
    """Create a simple token encoding user id and email (use JWT in production)."""
    payload = f"{user.id}:{user.email}"
    return base64.b64encode(payload.encode()).decode()


def register_user(user_data, db: Session):
    existing_email = db.query(User).filter(User.email == user_data.email).first()
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already registered")

    existing_username = db.query(User).filter(User.username == user_data.username).first()
    if existing_username:
        raise HTTPException(status_code=400, detail="Username already taken")

    new_user = User(
        username=user_data.username,
        email=user_data.email,
        password=hash_password(user_data.password),
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "id": new_user.id,
        "username": new_user.username,
        "email": new_user.email,
        "phone": new_user.phone,
        "bio": new_user.bio,
        "favorites": new_user.favorites or [],
        "access_token": _create_token(new_user),
    }


def login_user(user_data, db: Session):
    user = db.query(User).filter(User.email == user_data.email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not verify_password(user_data.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # Auto-upgrade legacy plain text passwords to hash.
    if not str(user.password).startswith("$pbkdf2-sha256$"):
        user.password = hash_password(user_data.password)
        db.add(user)
        db.commit()

    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "phone": user.phone,
        "bio": user.bio,
        "favorites": user.favorites or [],
        "access_token": _create_token(user),
    }
