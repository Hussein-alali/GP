from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.recommendation_engine import recommend_for_user

router = APIRouter()


@router.get("/user/{user_id}")
def recommend(user_id: int, db: Session = Depends(get_db)):
    return recommend_for_user(user_id, db)
