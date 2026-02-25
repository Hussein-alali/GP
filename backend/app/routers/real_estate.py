from base64 import b64encode
import json
from typing import List, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import RealEstate
from app.schemas import UserAddRealEstateResponse

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
    files: Optional[List[UploadFile]] = File(None),
    db: Session = Depends(get_db),
):
    images = encode_uploaded_images(files) if files else []
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
    db: Session = Depends(get_db),
):
    query = db.query(RealEstate)
    if min_price is not None:
        query = query.filter(RealEstate.price >= min_price)
    if max_price is not None:
        query = query.filter(RealEstate.price <= max_price)
    return [serialize_property(prop) for prop in query.all()]


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
