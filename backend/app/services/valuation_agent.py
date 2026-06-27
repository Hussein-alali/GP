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

    if ml_result:
        price     = ml_result["price"]
        min_price = round(price * 0.90, -3)
        max_price = round(price * 1.10, -3)
        return {
            "min_price":             int(min_price),
            "expected_price":        int(price),
            "max_price":             int(max_price),
            "confidence_score":      72,
            "comparables_used":      0,
            "outliers_removed":      0,
            "comparable_properties": [],
            "popular_in_area":       [],
            "ml_price":              int(price),
            "ml_price_min":          int(min_price),
            "ml_price_max":          int(max_price),
            "ml_available":          True,
        }

    # Heuristic fallback when model unavailable
    return _heuristic_fallback(property_type, city, area, bedrooms, bathrooms)


def _heuristic_fallback(property_type, city, area, bedrooms, bathrooms):
    city_l = (city or "").lower()
    PREMIUM = ["new cairo", "zayed", "new capital", "north coast", "maadi",
               "madinaty", "sheikh zayed", "el gouna", "katameya"]
    MID     = ["nasr city", "heliopolis", "dokki", "october", "shorouk",
               "rehab", "mohandessin", "zamalek", "ain shams"]
    if any(loc in city_l for loc in PREMIUM):
        base = 45000
    elif any(loc in city_l for loc in MID):
        base = 28000
    else:
        base = 18000
    type_mult = {
        "villas": 1.8, "villa": 1.8,
        "chalets": 1.3, "chalet": 1.3,
        "apartments": 1.0, "apartment": 1.0,
        "studios": 0.85, "studio": 0.85,
        "offices": 1.4, "office": 1.4,
        "rooms": 0.7, "room": 0.7,
        "furnished-apartments": 1.15,
    }.get((property_type or "").lower(), 1.0)
    median = base * type_mult
    return {
        "min_price":             int(round(median * 0.80 * area, -3)),
        "expected_price":        int(round(median * area,        -3)),
        "max_price":             int(round(median * 1.25 * area, -3)),
        "confidence_score":      15,
        "comparables_used":      0,
        "outliers_removed":      0,
        "comparable_properties": [],
        "popular_in_area":       [],
        "ml_price":              None,
        "ml_price_min":          None,
        "ml_price_max":          None,
        "ml_available":          False,
    }
