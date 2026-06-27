"""
Egyptian Real Estate ML Ensemble Predictor.
Loads artifacts/egypt_real_estate_pipeline.joblib and runs inference.
Falls back gracefully when the model is unavailable.
"""
import os
import sys
import logging
import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)

TE_SMOOTH = 20.0


# ── CrossFittedTargetEncoder ─────────────────────────────────────────────────
# Must be defined here (not __main__) so joblib can unpickle the saved bundle.
class CrossFittedTargetEncoder:
    """Smoothed out-of-fold target encoder — matches the class in the joblib bundle."""

    def __init__(self, cols, target_col, smoothing=TE_SMOOTH):
        self.cols = cols if isinstance(cols, list) else [cols]
        self.target_col = target_col
        self.smoothing = smoothing
        self.global_mean_ = None
        self.mapping_ = None
        self.name = "_".join(self.cols) + "__te"

    def _key(self, df):
        return df[self.cols].astype(str).agg("|".join, axis=1)

    def _smoothed_means(self, df):
        g = df.groupby(self._key(df))[self.target_col]
        cnt, mean = g.count(), g.mean()
        gm = df[self.target_col].mean()
        return (cnt * mean + self.smoothing * gm) / (cnt + self.smoothing), gm

    def fit_transform_oof(self, df, fold_col="_fold"):
        out = pd.Series(index=df.index, dtype=float)
        self.global_mean_ = df[self.target_col].mean()
        for f in sorted(df[fold_col].unique()):
            tr = df[df[fold_col] != f]
            va = df[df[fold_col] == f]
            means, gm = self._smoothed_means(tr)
            out.loc[va.index] = self._key(va).map(means).fillna(gm).values
        return out

    def fit_full(self, df):
        self.mapping_, self.global_mean_ = self._smoothed_means(df)
        return self

    def transform(self, df):
        return self._key(df).map(self.mapping_).fillna(self.global_mean_).values


# Patch __main__ so joblib can resolve the class during unpickling
_main = sys.modules.get("__main__")
if _main and not hasattr(_main, "CrossFittedTargetEncoder"):
    setattr(_main, "CrossFittedTargetEncoder", CrossFittedTargetEncoder)


# ── Value maps (English input → Arabic training values) ──────────────────────
_PROPERTY_TYPE_MAP = {
    "apartments": "Apartment", "apartment": "Apartment",
    "furnished-apartments": "Apartment",
    "villas": "Villa", "villa": "Villa",
    "studios": "Studio", "studio": "Studio",
    "offices": "Apartment", "office": "Apartment",
    "chalets": "Chalet", "chalet": "Chalet",
    "rooms": "Apartment", "room": "Apartment",
    "duplex": "Duplex", "townhouse": "Townhouse",
}

_FINISHING_MAP = {
    "core": "Core & Shell", "shell": "Core & Shell",
    "semi_finished": "Semi Finished", "semi": "Semi Finished",
    "fully_finished": "Fully Finished", "full": "Fully Finished",
    "luxury": "Super Lux", "super_luxury": "Super Lux",
    "ultra_luxury": "Ultra Lux",
}

# Arabic values — kept as-is; model was trained on Arabic for these columns
_PAYMENT_MAP  = {"cash": "كاش", "installment": "تقسيط"}
_STATUS_MAP   = {
    "ready": "جاهز",
    "under_construction": "تحت التشطيب",
    "off_plan": "على الخارطة",
}

# English city name → Arabic (to improve target-encoding lookup)
_CITY_AR_MAP = {
    "new cairo": "القاهرة الجديدة",
    "nasr city": "مدينة نصر",
    "maadi": "المعادي", "el maadi": "المعادي",
    "heliopolis": "مصر الجديدة",
    "sheikh zayed": "الشيخ زايد", "zayed": "الشيخ زايد",
    "october": "السادس من أكتوبر", "6th october": "السادس من أكتوبر",
    "dokki": "الدقي",
    "zamalek": "الزمالك",
    "mohandessin": "المهندسين",
    "alexandria": "الإسكندرية", "alex": "الإسكندرية",
    "giza": "الجيزة",
    "cairo": "القاهرة",
    "madinaty": "مدينتي", "madinty": "مدينتي",
    "rehab": "الرحاب", "el rehab": "الرحاب",
    "shorouk": "الشروق", "el shorouk": "الشروق",
    "ain shams": "عين شمس",
    "helwan": "حلوان",
    "faisal": "فيصل",
    "new capital": "العاصمة الإدارية الجديدة",
    "new administrative capital": "العاصمة الإدارية الجديدة",
    "hurghada": "الغردقة",
    "sharm el sheikh": "شرم الشيخ",
    "north coast": "الساحل الشمالي",
}

_AMENITY_COLS = [
    "has_pool", "has_garden", "has_security", "has_elevator", "has_gym",
    "has_parking", "has_clubhouse", "has_central_ac", "has_roof", "has_terrace",
    "has_balcony", "has_storage", "has_lake_view", "has_nile_view",
    "has_sea_view", "has_smart_home",
]


# ── Model loading ─────────────────────────────────────────────────────────────
_BUNDLE = None
_ARTIFACT = os.path.join(os.path.dirname(__file__), "artifacts",
                         "egypt_real_estate_pipeline.joblib")


def _load_bundle():
    global _BUNDLE
    if _BUNDLE is not None:
        return _BUNDLE
    if not os.path.exists(_ARTIFACT):
        logger.warning("ML artifact not found at %s", _ARTIFACT)
        return None
    try:
        import joblib
        _BUNDLE = joblib.load(_ARTIFACT)
        logger.info("ML model loaded: %s models, %d features",
                    list(_BUNDLE["models"].keys()), len(_BUNDLE.get("feature_names", [])))
        return _BUNDLE
    except Exception as exc:
        logger.warning("ML model load failed: %s", exc)
        return None


def is_available() -> bool:
    return _load_bundle() is not None


# ── Feature engineering ───────────────────────────────────────────────────────
def _build_row(inp: dict) -> pd.DataFrame:
    area      = float(inp.get("area_sqm", 100))
    bedrooms  = int(inp.get("bedrooms", 2))
    bathrooms = int(inp.get("bathrooms", 1))
    reception = int(inp.get("reception_rooms", 1))
    floor_num = int(inp.get("floor_number", 0))
    tot_floors = int(inp.get("total_floors", 5))
    hy        = inp.get("handover_year")
    city_raw  = str(inp.get("city", "")).strip().lower()
    city_ar   = _CITY_AR_MAP.get(city_raw, inp.get("city", ""))
    district  = str(inp.get("district", inp.get("city", ""))).strip()

    amenities = set(inp.get("amenities", []))

    row = {
        "area_sqm":           area,
        "bedrooms":           bedrooms,
        "bathrooms":          bathrooms,
        "reception_rooms":    reception,
        "room_count":         bedrooms + reception,
        "floor_number":       floor_num,
        "total_floors":       tot_floors,
        "handover_year":      float(hy) if hy else np.nan,
        "building_age":       0,
        # Categoricals (Arabic)
        "property_type_ext":   _PROPERTY_TYPE_MAP.get(
                                   inp.get("property_type", "apartments"), "شقة"),
        "finishing":           _FINISHING_MAP.get(
                                   inp.get("finishing", "fully_finished"), "تشطيب كامل"),
        "detail_furnished":    "مفروش" if inp.get("furnished") else "غير مفروش",
        "detail_ownership":    inp.get("detail_ownership", ""),
        "detail_payment_method": _PAYMENT_MAP.get(
                                   inp.get("payment_method", "cash"), "كاش"),
        "detail_property_status": _STATUS_MAP.get(
                                   inp.get("property_status", "ready"), "جاهز للسكن"),
        "view_type":           inp.get("view_type", ""),
        "orientation":         inp.get("orientation", ""),
        # Location
        "city":                    city_ar,
        "district":                district,
        "compound_grp":            inp.get("compound", "no_compound"),
        "detail_location_address": city_ar,
        "price_per_sqm":           0,
    }

    for col in _AMENITY_COLS:
        key = col.replace("has_", "")
        row[col] = 1 if key in amenities else 0

    return pd.DataFrame([row])


def _engineer(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    bd   = df["bedrooms"].fillna(0)
    ba   = df["bathrooms"].fillna(0)
    rc   = df["reception_rooms"].fillna(0)
    area = df["area_sqm"]

    df["rooms_total"]           = bd + rc
    df["bedrooms_per_area"]     = bd / area
    df["bathrooms_per_bedroom"] = ba / (bd + 1)
    df["reception_per_area"]    = rc / area
    df["floor_ratio"]           = (df["floor_number"].fillna(0) /
                                   (df["total_floors"].fillna(0) + 1))
    df["building_age_feat"]     = np.where(
        df["handover_year"].notna(),
        (2025 - df["handover_year"]).clip(lower=0),
        df["building_age"].fillna(0)
    )
    df["area_bucket"] = pd.cut(
        area, [0, 70, 110, 150, 200, 300, 500, 10_000],
        labels=["<70","70-110","110-150","150-200","200-300","300-500","500+"]
    ).astype(str)

    amen = [c for c in df.columns if c.startswith("has_")]
    df["amenity_count"] = df[amen].sum(axis=1)

    view_cols = [c for c in ["has_nile_view","has_sea_view","has_lake_view"] if c in df.columns]
    view_max  = df[view_cols].max(axis=1) if view_cols else 0
    df["luxury_score"] = (
        df.get("has_pool", pd.Series([0])) * 2
        + df.get("has_gym", pd.Series([0]))
        + df.get("has_clubhouse", pd.Series([0])) * 2
        + df.get("has_security", pd.Series([0]))
        + df.get("has_central_ac", pd.Series([0]))
        + df.get("has_smart_home", pd.Series([0])) * 2
        + view_max * 2
    )
    return df


# ── Public predict function ───────────────────────────────────────────────────
def predict(inputs: dict) -> dict | None:
    """
    Run ML ensemble prediction for a single property.
    Returns {price, min, max} or None if model unavailable / inference fails.
    """
    bundle = _load_bundle()
    if bundle is None:
        return None

    try:
        models          = bundle["models"]
        ensemble_members = ["LightGBM"]
        te_encoders     = bundle["te_encoders"]
        ohe             = bundle["ohe"]
        ohe_names       = bundle["ohe_names"]
        onehot_cols     = bundle["onehot_cols"]
        imputer         = bundle["imputer"]
        feature_names   = bundle["feature_names"]
        numeric_feats   = bundle.get("numeric_features", [])
        resid_std       = float(bundle.get("resid_std", 0.15))

        df = _build_row(inputs)
        df = _engineer(df)

        # Apply all target encoders
        for name, enc in te_encoders.items():
            try:
                df[name] = enc.transform(df)
            except Exception:
                df[name] = enc.global_mean_ or 0

        # Delta features (use encoded city averages as reference)
        city_avg = df.get("city_avg_price_sqm", pd.Series([0])).iloc[0]
        df["difference_from_district_average"] = (
            df.get("district_avg_price_sqm", pd.Series([city_avg])) - city_avg
        )
        df["difference_from_compound_average"] = (
            df.get("compound_avg_price_sqm", pd.Series([city_avg])) - city_avg
        )
        df["distance_from_city_average"] = (
            df.get("city_district_avg_price_sqm", pd.Series([city_avg])) - city_avg
        )
        df["price_per_room"] = (
            df.get("city_district_avg_price_sqm", pd.Series([city_avg]))
            * df["area_sqm"] / (df["rooms_total"] + 1)
        )

        # One-hot encode categoricals
        ohe_input  = df[[c for c in onehot_cols if c in df.columns]].astype(str)
        # Fill missing OHE cols with empty string
        for c in onehot_cols:
            if c not in ohe_input.columns:
                ohe_input[c] = ""
        ohe_input  = ohe_input[onehot_cols]
        ohe_arr    = ohe.transform(ohe_input)
        ohe_df     = pd.DataFrame(ohe_arr, columns=ohe_names, index=df.index)

        # Combine numeric + OHE
        avail_num = [f for f in numeric_feats if f in df.columns]
        X = pd.concat([df[avail_num], ohe_df], axis=1)
        X = X.reindex(columns=feature_names, fill_value=0)

        # Impute then predict (keep as DataFrame to avoid feature-name warnings)
        X_imp_arr = imputer.transform(X)
        X_imp = pd.DataFrame(X_imp_arr, columns=feature_names)
        log_preds = []
        for name in ensemble_members:
            if name in models:
                log_preds.append(float(models[name].predict(X_imp)[0]))

        if not log_preds:
            return None

        log_mean = float(np.mean(log_preds))
        log_std  = float(np.std(log_preds)) if len(log_preds) > 1 else 0.0
        sigma    = float(np.sqrt(log_std**2 + resid_std**2))

        price     = float(np.expm1(log_mean))
        price_min = float(np.expm1(log_mean - 1.28 * sigma))
        price_max = float(np.expm1(log_mean + 1.28 * sigma))

        return {
            "price": round(max(0, price),     -3),
            "min":   round(max(0, price_min), -3),
            "max":   round(max(0, price_max), -3),
        }

    except Exception as exc:
        logger.warning("ML prediction error: %s", exc, exc_info=True)
        return None
