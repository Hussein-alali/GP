from base64 import b64encode
from typing import List, Optional

from fastapi import UploadFile

from app.models import RealEstate, User


def encode_uploaded_images(files: List[UploadFile]) -> List[str]:
    result = []
    for file in files:
        content = file.file.read()
        if not content:
            continue
        mime = file.content_type or "application/octet-stream"
        result.append(f"data:{mime};base64,{b64encode(content).decode()}")
    return result


def serialize_property(prop: RealEstate, owner: Optional[User] = None) -> dict:
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
        "status": prop.status,
        "owner_id": prop.owner_id,
        "owner_phone": owner.phone if owner else None,
        "owner_name": owner.username if owner else None,
    }


def serialize_property_preview(prop: RealEstate, owner: Optional[User] = None) -> dict:
    """Like serialize_property but only includes the first image (for list views)."""
    d = serialize_property(prop, owner)
    d["images"] = (prop.images or [])[:1]
    return d
