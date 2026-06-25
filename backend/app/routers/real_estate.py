import json
from typing import List, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import RealEstate, User
from app.schemas import UserAddRealEstateResponse
from app.services.brand_protection import BrandProtectionService
from app.utils import encode_uploaded_images, serialize_property, serialize_property_preview

_brand = BrandProtectionService()
router = APIRouter()


@router.post("/", response_model=UserAddRealEstateResponse)
async def add_property(
    area: float = Form(...),
    bedrooms: int = Form(...),
    bathrooms: int = Form(...),
    location: str = Form(...),
    type: str = Form(...),
    price: float = Form(...),
    owner_id: int = Form(...),
    description: Optional[str] = Form(None),
    features: Optional[str] = Form(None),
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
):
    # Brand protection: read first image bytes, check domain, then reset stream
    first_bytes = files[0].file.read()
    files[0].file.seek(0)
    user = db.query(User).filter(User.id == owner_id).first()
    brand_check = _brand.check_owner(first_bytes, user.email if user else "")
    if brand_check["blocked"]:
        raise HTTPException(status_code=403, detail=brand_check["reason"])

    images = encode_uploaded_images(files)
    if not images:
        raise HTTPException(status_code=400, detail="At least one image is required")

    parsed_features: List[str] = []
    if features:
        try:
            loaded = json.loads(features)
            if isinstance(loaded, list):
                parsed_features = [str(item) for item in loaded if item]
        except json.JSONDecodeError:
            parsed_features = [p.strip() for p in features.split(",") if p.strip()]

    prop = RealEstate(
        area=area, bedrooms=bedrooms, bathrooms=bathrooms,
        location=location, type=type, price=price,
        owner_id=owner_id, description=description,
        images=images, features=parsed_features,
    )
    db.add(prop)
    db.commit()
    db.refresh(prop)
    return serialize_property(prop, user)


@router.get("/", response_model=List[UserAddRealEstateResponse])
def get_properties(
    min_price: float | None = None,
    max_price: float | None = None,
    include_images: bool = False,
    db: Session = Depends(get_db),
):
    query = db.query(RealEstate)
    if min_price is not None:
        query = query.filter(RealEstate.price >= min_price)
    if max_price is not None:
        query = query.filter(RealEstate.price <= max_price)
    props = query.all()
    owner_ids = {p.owner_id for p in props}
    owners = {u.id: u for u in db.query(User).filter(User.id.in_(owner_ids)).all()}
    serializer = serialize_property if include_images else serialize_property_preview
    return [serializer(p, owners.get(p.owner_id)) for p in props]


@router.get("/{property_id}", response_model=UserAddRealEstateResponse)
def get_property(property_id: int, db: Session = Depends(get_db)):
    prop = db.query(RealEstate).filter(RealEstate.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    owner = db.query(User).filter(User.id == prop.owner_id).first()
    return serialize_property(prop, owner)


@router.put("/{property_id}", response_model=UserAddRealEstateResponse)
async def update_property(
    property_id: int,
    area: Optional[float] = Form(None),
    bedrooms: Optional[int] = Form(None),
    bathrooms: Optional[int] = Form(None),
    location: Optional[str] = Form(None),
    type: Optional[str] = Form(None),
    price: Optional[float] = Form(None),
    status: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    features: Optional[str] = Form(None),
    files: Optional[List[UploadFile]] = File(None),
    db: Session = Depends(get_db),
):
    prop = db.query(RealEstate).filter(RealEstate.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")

    for field, val in dict(area=area, bedrooms=bedrooms, bathrooms=bathrooms,
                           location=location, type=type, price=price,
                           status=status, description=description).items():
        if val is not None:
            setattr(prop, field, val)

    if files:
        prop.images = encode_uploaded_images(files)
    if features is not None:
        try:
            loaded = json.loads(features)
            prop.features = [str(i) for i in loaded if i] if isinstance(loaded, list) else []
        except json.JSONDecodeError:
            prop.features = [p.strip() for p in features.split(",") if p.strip()]

    db.commit()
    db.refresh(prop)
    owner = db.query(User).filter(User.id == prop.owner_id).first()
    return serialize_property(prop, owner)


@router.delete("/{property_id}")
def delete_property(property_id: int, db: Session = Depends(get_db)):
    prop = db.query(RealEstate).filter(RealEstate.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    db.delete(prop)
    db.commit()
    return {"message": "Deleted successfully"}
