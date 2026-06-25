import numpy as np
from app.services.web_scraper import scrape_listings


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
):
    """
    Comparable-based valuation using live Aqarmap listings only.
    IQR outlier removal → P10/median/P90 pricing.
    """

    # ── Fetch live listings from aqarmap.com (exact area only) ───────────────
    web_props = scrape_listings(property_type, city, area, bedrooms, bathrooms)

    # Filter by area/beds/baths tolerance
    raw_props = [
        wp for wp in web_props
        if (
            wp.area and area * 0.5 <= wp.area <= area * 1.5
            and abs(wp.bedrooms - bedrooms) <= 2
            and abs(wp.bathrooms - bathrooms) <= 2
        )
    ]

    if not raw_props:
        return _heuristic_fallback(property_type, city, area, bedrooms, bathrooms)

    # ── price_per_sqm ─────────────────────────────────────────────────────────
    comp_data = [
        {"prop": p, "ppsqm": p.price / p.area}
        for p in raw_props
        if p.area > 0 and p.price > 0
    ]

    if not comp_data:
        return _heuristic_fallback(property_type, city, area, bedrooms, bathrooms)

    # ── IQR outlier removal ───────────────────────────────────────────────────
    ppsqm_vals = np.array([c["ppsqm"] for c in comp_data], dtype=float)
    q1 = float(np.percentile(ppsqm_vals, 25))
    q3 = float(np.percentile(ppsqm_vals, 75))
    iqr = q3 - q1
    lower = q1 - 1.5 * iqr
    upper = q3 + 1.5 * iqr

    valid = [c for c in comp_data if lower <= c["ppsqm"] <= upper]
    outliers_removed = len(comp_data) - len(valid)

    if len(valid) < 3:
        valid = comp_data
        outliers_removed = 0

    # ── Percentile pricing ────────────────────────────────────────────────────
    valid_ppsqm    = np.array([c["ppsqm"] for c in valid], dtype=float)
    median_ppsqm   = float(np.median(valid_ppsqm))
    p10_ppsqm      = float(np.percentile(valid_ppsqm, 10))
    p90_ppsqm      = float(np.percentile(valid_ppsqm, 90))

    min_price      = round(max(0, p10_ppsqm * area),    -3)
    expected_price = round(max(0, median_ppsqm * area), -3)
    max_price      = round(max(0, p90_ppsqm * area),    -3)

    # ── Confidence score ──────────────────────────────────────────────────────
    n = len(valid)
    if n >= 25:
        confidence = min(100, 90 + (n - 25) // 2)
    elif n >= 15:
        confidence = 75 + (n - 15) * 14 // 10
    elif n >= 10:
        confidence = 60 + (n - 10) * 3
    elif n >= 5:
        confidence = 40 + (n - 5) * 4
    else:
        confidence = max(10, n * 8)

    outlier_ratio = outliers_removed / max(len(comp_data), 1)
    confidence = max(10, int(confidence * (1 - outlier_ratio * 0.3)))

    # ── Popular listings (all web results, unfiltered) ────────────────────────
    popular_in_area = [
        {
            "price":     float(wp.price),
            "area":      float(wp.area),
            "bedrooms":  wp.bedrooms,
            "bathrooms": wp.bathrooms,
            "title":     f"{wp.type.capitalize()} in {wp.location}",
            "url":       wp.listing_url,
        }
        for wp in web_props[:5]
    ]

    # ── Comparable properties list ────────────────────────────────────────────
    comparable_properties = []
    for c in sorted(valid, key=lambda x: -x["ppsqm"])[:20]:
        p = c["prop"]
        area_sim = max(0.0, 1.0 - abs(p.area - area) / area)
        bed_sim  = 1.0 if p.bedrooms  == bedrooms  else max(0.0, 1.0 - abs(p.bedrooms  - bedrooms)  * 0.25)
        bath_sim = 1.0 if p.bathrooms == bathrooms else max(0.0, 1.0 - abs(p.bathrooms - bathrooms) * 0.3)
        sim = round((area_sim * 0.40 + bed_sim * 0.35 + bath_sim * 0.25) * 100, 1)

        comparable_properties.append({
            "title":           f"{p.type.capitalize()} in {p.location}",
            "price":           float(p.price),
            "area":            float(p.area),
            "bedrooms":        p.bedrooms,
            "bathrooms":       p.bathrooms,
            "price_per_sqm":   round(c["ppsqm"], 2),
            "source":          "Aqarmap",
            "url":             p.listing_url,
            "similarity_score": min(100.0, max(0.0, sim)),
        })

    return {
        "min_price":             min_price,
        "expected_price":        expected_price,
        "max_price":             max_price,
        "confidence_score":      confidence,
        "comparables_used":      n,
        "outliers_removed":      outliers_removed,
        "comparable_properties": comparable_properties,
        "popular_in_area":       popular_in_area,
    }


# ── Heuristic fallback (area not in Aqarmap) ──────────────────────────────────
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
    }
