from base64 import b64decode, b64encode
from typing import List, Optional

from fastapi import APIRouter, Depends, File, Form, Header, HTTPException, UploadFile
from sqlalchemy.orm import Session
from app.schemas import UserAddRealEstateResponse, UserProfileResponse, UserProfileUpdate
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


def serialize_property(prop: RealEstate) -> dict:
    return {
        "id": prop.id,
        "area": prop.area,
        "bedrooms": prop.bedrooms,
        "bathrooms": prop.bathrooms,
        "location": prop.location,
        "type": prop.type,
        "price": prop.price,
        "description": prop.description,
        "images": prop.images or [],
        "features": prop.features or [],
        "owner_id": prop.owner_id,
    }


def serialize_user(user: User) -> dict:
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "phone": user.phone,
        "bio": user.bio,
        "favorites": user.favorites or [],
    }


def get_user_with_fallback(
    db: Session,
    user_id: int,
    authorization: Optional[str] = None,
) -> User:
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        return user

    # Fallback for stale localStorage user IDs: resolve user by email from bearer token payload "id:email".
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ", 1)[1].strip()
        try:
            payload = b64decode(token).decode("utf-8")
            parts = payload.split(":", 1)
            if len(parts) == 2:
                email = parts[1]
                user = db.query(User).filter(User.email == email).first()
                if user:
                    return user
        except Exception:
            pass

    raise HTTPException(status_code=404, detail="User not found. Please login again.")


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
    return serialize_property(new_estate)

@router.get("/user/{user_id}/realestate", response_model=List[UserAddRealEstateResponse])
def get_realestates_for_user(user_id: int, db: Session = Depends(get_db)):
    estates = db.query(RealEstate).filter(RealEstate.owner_id == user_id).all()
    return [serialize_property(prop) for prop in estates]


@router.get("/user/{user_id}/profile", response_model=UserProfileResponse)
def get_user_profile(
    user_id: int,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    user = get_user_with_fallback(db, user_id, authorization)
    return serialize_user(user)


@router.put("/user/{user_id}/profile", response_model=UserProfileResponse)
def update_user_profile(
    user_id: int,
    payload: UserProfileUpdate,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    user = get_user_with_fallback(db, user_id, authorization)

    if payload.phone is not None:
        user.phone = payload.phone.strip() or None
    if payload.bio is not None:
        user.bio = payload.bio.strip() or None

    db.add(user)
    db.commit()
    db.refresh(user)
    return serialize_user(user)


@router.get("/user/{user_id}/favorites", response_model=List[UserAddRealEstateResponse])
def get_user_favorites(
    user_id: int,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    user = get_user_with_fallback(db, user_id, authorization)

    favorite_ids = [int(pid) for pid in (user.favorites or []) if str(pid).isdigit()]
    if not favorite_ids:
        return []

    props = db.query(RealEstate).filter(RealEstate.id.in_(favorite_ids)).all()
    by_id = {prop.id: prop for prop in props}
    ordered = [by_id[pid] for pid in favorite_ids if pid in by_id]
    return [serialize_property(prop) for prop in ordered]


@router.post("/user/{user_id}/favorites/{property_id}", response_model=UserProfileResponse)
def add_favorite(
    user_id: int,
    property_id: int,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    user = get_user_with_fallback(db, user_id, authorization)

    prop = db.query(RealEstate).filter(RealEstate.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")

    favorites = [int(pid) for pid in (user.favorites or []) if str(pid).isdigit()]
    if property_id not in favorites:
        favorites.append(property_id)
        user.favorites = favorites
        db.add(user)
        db.commit()
        db.refresh(user)

    return serialize_user(user)


@router.delete("/user/{user_id}/favorites/{property_id}", response_model=UserProfileResponse)
def remove_favorite(
    user_id: int,
    property_id: int,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    user = get_user_with_fallback(db, user_id, authorization)

    favorites = [int(pid) for pid in (user.favorites or []) if str(pid).isdigit()]
    user.favorites = [pid for pid in favorites if pid != property_id]
    db.add(user)
    db.commit()
    db.refresh(user)
    return serialize_user(user)

