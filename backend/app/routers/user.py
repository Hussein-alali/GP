from base64 import b64encode
from typing import List, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session
from app.schemas import UserAddRealEstateResponse
from app.models import RealEstate, User
from app.database import get_db

router = APIRouter()


def encode_uploaded_images(files: List[UploadFile]) -> List[str]:
    encoded_images: List[str] = []
    for file in files:
        content = file.file.read()
        if not content:
            continue
        mime_type = file.content_type or "application/octet-stream"
        encoded = b64encode(content).decode("utf-8")
        encoded_images.append(f"data:{mime_type};base64,{encoded}")
    return encoded_images


@router.post("/user/{user_id}/realestate", response_model=UserAddRealEstateResponse)
async def add_realestate_for_user(
    user_id: int,
    area: float = Form(...),
    bedrooms: int = Form(...),
    bathrooms: int = Form(...),
    location: str = Form(...),
    type: str = Form(...),
    price: float = Form(...),
    description: Optional[str] = Form(None),
    files: Optional[List[UploadFile]] = File(None),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    images = encode_uploaded_images(files) if files else []
    new_estate = RealEstate(
        area=area,
        bedrooms=bedrooms,
        bathrooms=bathrooms,
        location=location,
        type=type,
        price=price,
        description=description,
        images=images,
        owner_id=user_id,
    )
    db.add(new_estate)
    db.commit()
    db.refresh(new_estate)
    return new_estate

@router.get("/user/{user_id}/realestate", response_model=List[UserAddRealEstateResponse])
def get_realestates_for_user(user_id: int, db: Session = Depends(get_db)):
    estates = db.query(RealEstate).filter(RealEstate.owner_id == user_id).all()
    return estates

