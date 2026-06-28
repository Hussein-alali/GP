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
    reception_rooms: int = 1
    total_floors: int = 5
    handover_year: Optional[int] = None
    finishing: str = "fully_finished"
    property_status: str = "ready"
    payment_method: str = "cash"
    amenities: List[str] = []


class ValuationResponse(BaseModel):
    min_price: float
    expected_price: float
    max_price: float
    confidence_score: int


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
        reception_rooms=body.reception_rooms,
        total_floors=body.total_floors,
        handover_year=body.handover_year,
        finishing=body.finishing,
        property_status=body.property_status,
        payment_method=body.payment_method,
        amenities=body.amenities,
    )
