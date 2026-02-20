from fastapi import APIRouter
from app.services.recommendation_engine import recommend_for_user

router = APIRouter()

@router.get("/user/{user_id}")
def recommend(user_id: int):
    return recommend_for_user(user_id)
