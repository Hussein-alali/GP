import numpy as np
from sqlalchemy.orm import Session
from app.models import RealEstate
from typing import Optional


def estimate_property_value(
    db: Session,
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
    Comparable-based property valuation agent.
    Searches DB for comparable properties, removes outliers via IQR,
    and returns min/expected/max price with confidence score.
    """

    # ── Round 1: strict (same type, city, ±20% area, exact beds/baths) ──────
    # ── Round 2: relax beds/baths by ±1, area by ±30%, drop city filter ──────
    # ── Round 3: any type, ±50% area ─────────────────────────────────────────
    search_rounds = [
        dict(area_tol=0.20, bed_tol=0, bath_tol=0, use_type=True,  use_city=True),
        dict(area_tol=0.30, bed_tol=1, bath_tol=1, use_type=True,  use_city=True),
        dict(area_tol=0.30, bed_tol=1, bath_tol=1, use_type=True,  use_city=False),
        dict(area_tol=0.50, bed_tol=2, bath_tol=1, use_type=True,  use_city=False),
        dict(area_tol=0.50, bed_tol=2, bath_tol=2, use_type=False, use_city=False),
    ]

    raw_props = []
    for rnd in search_rounds:
        min_area = area * (1 - rnd["area_tol"])
        max_area = area * (1 + rnd["area_tol"])

        q = db.query(RealEstate).filter(
            RealEstate.area >= min_area,
            RealEstate.area <= max_area,
            RealEstate.price > 0,
        )

        if rnd["use_type"]:
            q = q.filter(RealEstate.type == property_type)

        if rnd["bed_tol"] == 0:
            q = q.filter(RealEstate.bedrooms == bedrooms)
        else:
            q = q.filter(
                RealEstate.bedrooms >= bedrooms - rnd["bed_tol"],
                RealEstate.bedrooms <= bedrooms + rnd["bed_tol"],
            )

        if rnd["bath_tol"] == 0:
            q = q.filter(RealEstate.bathrooms == bathrooms)
        else:
            q = q.filter(
                RealEstate.bathrooms >= bathrooms - rnd["bath_tol"],
                RealEstate.bathrooms <= bathrooms + rnd["bath_tol"],
            )

        if rnd["use_city"] and city:
            city_q = q.filter(RealEstate.location.ilike(f"%{city}%"))
            results = city_q.limit(30).all()
            if len(results) >= 5:
                raw_props = results
                break
            # also try region
            if region:
                region_q = q.filter(RealEstate.location.ilike(f"%{region}%"))
                results = region_q.limit(30).all()
                if len(results) >= 5:
                    raw_props = results
                    break

        results = q.limit(30).all()
        if len(results) >= 5:
            raw_props = results
            break

    # ── No comparables at all → heuristic fallback ───────────────────────────
    if not raw_props:
        return _heuristic_fallback(property_type, city, area, bedrooms, bathrooms)

    # ── Step 5: price_per_sqm for each comparable ────────────────────────────
    comp_data = [
        {"prop": p, "ppsqm": p.price / p.area}
        for p in raw_props
        if p.area and p.area > 0 and p.price and p.price > 0
    ]

    if not comp_data:
        return _heuristic_fallback(property_type, city, area, bedrooms, bathrooms)

    # ── Step 6: IQR outlier removal ───────────────────────────────────────────
    ppsqm_vals = np.array([c["ppsqm"] for c in comp_data], dtype=float)
    q1 = float(np.percentile(ppsqm_vals, 25))
    q3 = float(np.percentile(ppsqm_vals, 75))
    iqr = q3 - q1
    lower = q1 - 1.5 * iqr
    upper = q3 + 1.5 * iqr

    valid = [c for c in comp_data if lower <= c["ppsqm"] <= upper]
    outliers_removed = len(comp_data) - len(valid)

    # ── Step 7: if fewer than 5 valid, use all (already expanded search) ─────
    if len(valid) < 5:
        valid = comp_data
        outliers_removed = 0

    # ── Step 8: percentile statistics ────────────────────────────────────────
    valid_ppsqm = np.array([c["ppsqm"] for c in valid], dtype=float)
    median_ppsqm = float(np.median(valid_ppsqm))
    p10_ppsqm    = float(np.percentile(valid_ppsqm, 10))
    p90_ppsqm    = float(np.percentile(valid_ppsqm, 90))

    # ── Step 9: valuation ─────────────────────────────────────────────────────
    min_price      = round(max(0, p10_ppsqm * area),    -3)
    expected_price = round(max(0, median_ppsqm * area), -3)
    max_price      = round(max(0, p90_ppsqm * area),    -3)

    # ── Step 10: confidence score ─────────────────────────────────────────────
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

    # Penalise if many outliers were removed (data is noisy)
    outlier_ratio = outliers_removed / max(len(comp_data), 1)
    confidence = max(10, int(confidence * (1 - outlier_ratio * 0.3)))

    # ── Build comparable_properties list ─────────────────────────────────────
    comparable_properties = []
    for c in sorted(valid, key=lambda x: -x["ppsqm"])[:20]:
        p = c["prop"]
        area_sim  = max(0.0, 1.0 - abs(p.area - area) / area)
        bed_sim   = 1.0 if p.bedrooms  == bedrooms  else max(0.0, 1.0 - abs(p.bedrooms  - bedrooms)  * 0.25)
        bath_sim  = 1.0 if p.bathrooms == bathrooms else max(0.0, 1.0 - abs(p.bathrooms - bathrooms) * 0.3)
        type_sim  = 1.0 if p.type == property_type else 0.5
        sim = round((area_sim * 0.40 + bed_sim * 0.30 + bath_sim * 0.20 + type_sim * 0.10) * 100, 1)

        comparable_properties.append({
            "title": f"{p.type.capitalize()} in {p.location}",
            "price": float(p.price),
            "area": float(p.area),
            "bedrooms": p.bedrooms,
            "bathrooms": p.bathrooms,
            "price_per_sqm": round(c["ppsqm"], 2),
            "source": "Smart Estate DB",
            "url": f"/properties/{p.id}",
            "similarity_score": min(100.0, max(0.0, sim)),
        })

    return {
        "min_price": min_price,
        "expected_price": expected_price,
        "max_price": max_price,
        "confidence_score": confidence,
        "comparables_used": n,
        "outliers_removed": outliers_removed,
        "comparable_properties": comparable_properties,
    }


# ── Heuristic fallback (no DB data) ──────────────────────────────────────────
def _heuristic_fallback(property_type: str, city: str, area: float, bedrooms: int, bathrooms: int) -> dict:
    city_l = (city or "").lower()

    PREMIUM = ["new cairo", "القاهرة الجديدة", "zayed", "الشيخ زايد", "new capital",
               "العاصمة الإدارية", "north coast", "الساحل الشمالي", "maadi", "المعادي"]
    MID     = ["nasr city", "مدينة نصر", "heliopolis", "مصر الجديدة", "dokki", "دقي",
               "mohandessin", "المهندسين", "zamalek", "الزمالك", "october", "أكتوبر"]

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
    min_p  = round(median * 0.80 * area, -3)
    exp_p  = round(median * area,        -3)
    max_p  = round(median * 1.25 * area, -3)

    return {
        "min_price": int(min_p),
        "expected_price": int(exp_p),
        "max_price": int(max_p),
        "confidence_score": 20,
        "comparables_used": 0,
        "outliers_removed": 0,
        "comparable_properties": [],
    }
