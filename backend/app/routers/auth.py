from fastapi import APIRouter, Depends

from app.schemas import UserCreate, UserLogin
from app.services.auth_service import register_user, login_user
from app.database import get_db
from sqlalchemy.orm import Session

router = APIRouter()

@router.post("/register")
def register(user: UserCreate, db: Session = Depends(get_db)):
    return register_user(user, db)

@router.post("/login")
def login(user: UserLogin, db: Session = Depends(get_db)):
    return login_user(user, db)
