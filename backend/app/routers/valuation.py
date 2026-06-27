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
    # ML extras
    reception_rooms: int = 1
    total_floors: int = 5
    handover_year: Optional[int] = None
    finishing: str = "fully_finished"       # core | semi_finished | fully_finished | luxury
    property_status: str = "ready"          # ready | under_construction | off_plan
    payment_method: str = "cash"            # cash | installment
    amenities: List[str] = []               # ["pool","gym","security","clubhouse",...]


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


class PopularListing(BaseModel):
    price: float
    area: float
    bedrooms: int
    bathrooms: int
    title: str
    url: str


class ValuationResponse(BaseModel):
    min_price: float
    expected_price: float
    max_price: float
    confidence_score: int
    comparables_used: int
    outliers_removed: int
    comparable_properties: List[ComparableProperty]
    popular_in_area: List[PopularListing] = []
    # ML model output
    ml_price: Optional[float] = None
    ml_price_min: Optional[float] = None
    ml_price_max: Optional[float] = None
    ml_available: bool = False


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
