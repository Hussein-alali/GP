from fastapi import HTTPException
from app.services import ml_predictor


def estimate_property_value(
    db,
    property_type: str,
    city: str,
    region: str,
    area: float,
    bedrooms: int,
    bathrooms: int,
    furnished: bool = False,
    level: int = 0,
    reception_rooms: int = 1,
    total_floors: int = 5,
    handover_year: int | None = None,
    finishing: str = "fully_finished",
    property_status: str = "ready",
    payment_method: str = "cash",
    amenities: list[str] | None = None,
):
    amenities = amenities or []

    ml_result = ml_predictor.predict({
        "property_type":    property_type,
        "city":             city,
        "area_sqm":         area,
        "bedrooms":         bedrooms,
        "bathrooms":        bathrooms,
        "reception_rooms":  reception_rooms,
        "floor_number":     level,
        "total_floors":     total_floors,
        "handover_year":    handover_year,
        "finishing":        finishing,
        "furnished":        furnished,
        "property_status":  property_status,
        "payment_method":   payment_method,
        "district":         region,
        "amenities":        amenities,
    })

    if not ml_result:
        raise HTTPException(status_code=503, detail="ML model is unavailable. Please try again later.")

    price = ml_result["price"]
    min_price = round(price * 0.90, -3)
    max_price = round(price * 1.10, -3)

    return {
        "min_price":        int(min_price),
        "expected_price":   int(price),
        "max_price":        int(max_price),
        "confidence_score": 72,
    }
