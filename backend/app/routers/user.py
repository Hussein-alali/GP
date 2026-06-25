from base64 import b64decode
from typing import List, Optional

from fastapi import APIRouter, Depends, File, Form, Header, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import RealEstate, User
from app.schemas import UserAddRealEstateResponse, UserProfileResponse, UserProfileUpdate
from app.utils import encode_uploaded_images, serialize_property

router = APIRouter()


def serialize_user(user: User) -> dict:
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "phone": user.phone,
        "bio": user.bio,
        "favorites": user.favorites or [],
    }


def get_user_with_fallback(db: Session, user_id: int, authorization: Optional[str] = None) -> User:
    """Resolve user by ID; fall back to email from Bearer token if ID is stale."""
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        return user

    if authorization and authorization.startswith("Bearer "):
        try:
            payload = b64decode(authorization.split(" ", 1)[1]).decode()
            email = payload.split(":", 1)[1] if ":" in payload else ""
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
    if not db.query(User).filter(User.id == user_id).first():
        raise HTTPException(status_code=404, detail="User not found")

    prop = RealEstate(
        area=area, bedrooms=bedrooms, bathrooms=bathrooms,
        location=location, type=type, price=price,
        description=description, owner_id=user_id,
        images=encode_uploaded_images(files) if files else [],
    )
    db.add(prop)
    db.commit()
    db.refresh(prop)
    return serialize_property(prop)


@router.get("/user/{user_id}/realestate", response_model=List[UserAddRealEstateResponse])
def get_realestates_for_user(user_id: int, db: Session = Depends(get_db)):
    return [serialize_property(p) for p in db.query(RealEstate).filter(RealEstate.owner_id == user_id).all()]


@router.get("/user/{user_id}/profile", response_model=UserProfileResponse)
def get_user_profile(user_id: int, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    return serialize_user(get_user_with_fallback(db, user_id, authorization))


@router.put("/user/{user_id}/profile", response_model=UserProfileResponse)
def update_user_profile(
    user_id: int,
    payload: UserProfileUpdate,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    user = get_user_with_fallback(db, user_id, authorization)

    if payload.username is not None:
        name = payload.username.strip()
        if not name:
            raise HTTPException(status_code=400, detail="Username cannot be empty")
        if db.query(User).filter(User.username == name, User.id != user.id).first():
            raise HTTPException(status_code=400, detail="Username already taken")
        user.username = name

    if payload.email is not None:
        email = payload.email.strip().lower()
        if not email:
            raise HTTPException(status_code=400, detail="Email cannot be empty")
        if db.query(User).filter(User.email == email, User.id != user.id).first():
            raise HTTPException(status_code=400, detail="Email already registered")
        user.email = email

    if payload.phone is not None:
        user.phone = payload.phone.strip() or None
    if payload.bio is not None:
        user.bio = payload.bio.strip() or None

    db.add(user)
    db.commit()
    db.refresh(user)
    return serialize_user(user)


@router.get("/user/{user_id}/favorites", response_model=List[UserAddRealEstateResponse])
def get_user_favorites(user_id: int, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    user = get_user_with_fallback(db, user_id, authorization)
    ids = [int(pid) for pid in (user.favorites or []) if str(pid).isdigit()]
    if not ids:
        return []
    by_id = {p.id: p for p in db.query(RealEstate).filter(RealEstate.id.in_(ids)).all()}
    return [serialize_property(by_id[pid]) for pid in ids if pid in by_id]


@router.post("/user/{user_id}/favorites/{property_id}", response_model=UserProfileResponse)
def add_favorite(
    user_id: int, property_id: int,
    authorization: Optional[str] = Header(None), db: Session = Depends(get_db),
):
    user = get_user_with_fallback(db, user_id, authorization)
    if not db.query(RealEstate).filter(RealEstate.id == property_id).first():
        raise HTTPException(status_code=404, detail="Property not found")

    ids = [int(pid) for pid in (user.favorites or []) if str(pid).isdigit()]
    if property_id not in ids:
        ids.append(property_id)
        user.favorites = ids
        db.add(user)
        db.commit()
        db.refresh(user)
    return serialize_user(user)


@router.delete("/user/{user_id}/favorites/{property_id}", response_model=UserProfileResponse)
def remove_favorite(
    user_id: int, property_id: int,
    authorization: Optional[str] = Header(None), db: Session = Depends(get_db),
):
    user = get_user_with_fallback(db, user_id, authorization)
    ids = [int(pid) for pid in (user.favorites or []) if str(pid).isdigit()]
    user.favorites = [pid for pid in ids if pid != property_id]
    db.add(user)
    db.commit()
    db.refresh(user)
    return serialize_user(user)
