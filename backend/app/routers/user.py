from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.schemas import UserAddRealEstateRequest, UserAddRealEstateResponse
from app.models import RealEstate, User
from app.database import get_db

router = APIRouter()

@router.post("/user/{user_id}/realestate", response_model=UserAddRealEstateResponse)
def add_realestate_for_user(user_id: int, data: UserAddRealEstateRequest, db: Session = Depends(get_db)):
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    new_estate = RealEstate(
        area=data.area,
        bedrooms=data.bedrooms,
        bathrooms=data.bathrooms,
        location=data.location,
        type=data.type,
        price=data.price,
        owner_id=user_id
    )
    db.add(new_estate)
    db.commit()
    db.refresh(new_estate)
    return new_estate

@router.get("/user/{user_id}/realestate", response_model=List[UserAddRealEstateResponse])
def get_realestates_for_user(user_id: int, db: Session = Depends(get_db)):
    estates = db.query(RealEstate).filter(RealEstate.owner_id == user_id).all()
    return estates

