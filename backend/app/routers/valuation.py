from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from app.database import get_db
from app.services.valuation_agent import estimate_property_value

router = APIRouter()


class ValuationRequest(BaseModel):
    property_type: str
    city: str
    region: str = ""
    area: float
    bedrooms: int
    bathrooms: int
    furnished: bool = False
    level: int = 0


class ComparableProperty(BaseModel):
    title: str
    price: float
    area: float
    bedrooms: int
    bathrooms: int
    price_per_sqm: float
    source: str
    url: str
    similarity_score: float


class ValuationResponse(BaseModel):
    min_price: float
    expected_price: float
    max_price: float
    confidence_score: int
    comparables_used: int
    outliers_removed: int
    comparable_properties: List[ComparableProperty]


@router.post("/estimate", response_model=ValuationResponse)
def valuation_estimate(body: ValuationRequest, db: Session = Depends(get_db)):
    return estimate_property_value(
        db=db,
        property_type=body.property_type,
        city=body.city,
        region=body.region,
        area=body.area,
        bedrooms=body.bedrooms,
        bathrooms=body.bathrooms,
        furnished=body.furnished,
        level=body.level,
    )
