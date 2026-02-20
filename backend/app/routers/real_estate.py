# from fastapi import APIRouter, Query
# from app.schemas import PropertyCreate

# router = APIRouter()

# @router.post("/")
# def add_property(property: PropertyCreate):
#     return {"message": "Property added", "property": property}

# @router.get("/")
# def get_properties(
#     city: str | None = None,
#     min_price: float | None = None,
#     max_price: float | None = None
# ):
#     return {"properties": []}

# @router.get("/{property_id}")
# def get_property(property_id: int):
#     return {"property_id": property_id}

# @router.put("/{property_id}")
# def update_property(property_id: int, property: PropertyCreate):
#     return {"message": "Updated"}

# @router.delete("/{property_id}")
# def delete_property(property_id: int):
#     return {"message": "Deleted"}

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import RealEstate
from app.schemas import RealEstateUpdate, UserAddRealEstateRequest, UserAddRealEstateResponse

router = APIRouter()

#Add property
@router.post("/", response_model=UserAddRealEstateResponse)
def add_property(
    data: UserAddRealEstateRequest,
    db: Session = Depends(get_db)
):
    new_property = RealEstate(**data.model_dump())
    db.add(new_property)
    db.commit()
    db.refresh(new_property)
    return new_property

# Get all properties by price
@router.get("/", response_model=List[UserAddRealEstateResponse])
def get_properties_By_Price(
    min_price: float | None = None,
    max_price: float | None = None,
    db: Session = Depends(get_db)
):
    query = db.query(RealEstate)

    if min_price is not None:
        query = query.filter(RealEstate.price >= min_price)
    if max_price is not None:
        query = query.filter(RealEstate.price <= max_price)

    return query.all()

# Get property by id
@router.get("/{property_id}", response_model=UserAddRealEstateResponse)
def get_property_By_ID(property_id: int, db: Session = Depends(get_db)):
    prop = db.query(RealEstate).filter(RealEstate.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    return prop

# Update property
@router.put("/{property_id}", response_model=UserAddRealEstateResponse)
def update_property(
    property_id: int,
    data: RealEstateUpdate,
    db: Session = Depends(get_db)
):
    prop = db.query(RealEstate).filter(RealEstate.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(prop, key, value)

    db.commit()
    db.refresh(prop)
    return prop

# Delete property
@router.delete("/{property_id}")
def delete_property(property_id: int, db: Session = Depends(get_db)):
    prop = db.query(RealEstate).filter(RealEstate.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")

    db.delete(prop)
    db.commit()
    return {"message": "Deleted successfully"}
