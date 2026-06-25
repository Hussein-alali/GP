from base64 import b64encode
import json
from typing import List, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import RealEstate, User
from app.schemas import UserAddRealEstateResponse
from app.services.brand_protection import BrandProtectionService

_brand = BrandProtectionService()

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


def serialize_property_list_item(prop: RealEstate, include_first_image: bool = True) -> dict:
    first_image = (prop.images or [])[:1] if include_first_image else []
    return {
        "id": prop.id,
        "area": prop.area,
        "bedrooms": prop.bedrooms,
        "bathrooms": prop.bathrooms,
        "location": prop.location,
        "type": prop.type,
        "price": prop.price,
        "description": prop.description,
        # Keep list payload small: return only the first image preview.
        "images": first_image,
        "features": prop.features or [],
        "owner_id": prop.owner_id,
    }


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
    # Brand protection: read first image bytes, run check, then reset stream
    first_bytes = files[0].file.read()
    files[0].file.seek(0)
    user = db.query(User).filter(User.id == owner_id).first()
    user_email = user.email if user else ""
    brand_check = _brand.check_owner(first_bytes, user_email)
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
            parsed_features = [part.strip() for part in features.split(",") if part.strip()]

    new_prop = RealEstate(
        area=area,
        bedrooms=bedrooms,
        bathrooms=bathrooms,
        location=location,
        type=type,
        price=price,
        owner_id=owner_id,
        description=description,
        images=images,
        features=parsed_features,
    )
    db.add(new_prop)
    db.commit()
    db.refresh(new_prop)
    return serialize_property(new_prop)


@router.get("/", response_model=List[UserAddRealEstateResponse])
def get_properties_by_price(
    min_price: float | None = None,
    max_price: float | None = None,
    include_images: bool = False,
    list_images: bool = True,
    db: Session = Depends(get_db),
):
    query = db.query(RealEstate)
    if min_price is not None:
        query = query.filter(RealEstate.price >= min_price)
    if max_price is not None:
        query = query.filter(RealEstate.price <= max_price)
    properties = query.all()
    if include_images:
        return [serialize_property(prop) for prop in properties]
    return [serialize_property_list_item(prop, include_first_image=list_images) for prop in properties]


@router.get("/{property_id}", response_model=UserAddRealEstateResponse)
def get_property_by_id(property_id: int, db: Session = Depends(get_db)):
    prop = db.query(RealEstate).filter(RealEstate.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    return serialize_property(prop)


@router.put("/{property_id}", response_model=UserAddRealEstateResponse)
async def update_property(
    property_id: int,
    area: Optional[float] = Form(None),
    bedrooms: Optional[int] = Form(None),
    bathrooms: Optional[int] = Form(None),
    location: Optional[str] = Form(None),
    type: Optional[str] = Form(None),
    price: Optional[float] = Form(None),
    description: Optional[str] = Form(None),
    features: Optional[str] = Form(None),
    files: Optional[List[UploadFile]] = File(None),
    db: Session = Depends(get_db),
):
    prop = db.query(RealEstate).filter(RealEstate.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")

    update_data = {
        "area": area,
        "bedrooms": bedrooms,
        "bathrooms": bathrooms,
        "location": location,
        "type": type,
        "price": price,
        "description": description,
    }
    for key, value in update_data.items():
        if value is not None:
            setattr(prop, key, value)

    if files is not None:
        prop.images = encode_uploaded_images(files)
    if features is not None:
        try:
            loaded = json.loads(features)
            prop.features = [str(item) for item in loaded if item] if isinstance(loaded, list) else []
        except json.JSONDecodeError:
            prop.features = [part.strip() for part in features.split(",") if part.strip()]

    db.commit()
    db.refresh(prop)
    return serialize_property(prop)


@router.delete("/{property_id}")
def delete_property(property_id: int, db: Session = Depends(get_db)):
    prop = db.query(RealEstate).filter(RealEstate.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    db.delete(prop)
    db.commit()
    return {"message": "Deleted successfully"}
