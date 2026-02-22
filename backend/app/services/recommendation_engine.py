from typing import List

import pandas as pd
from sqlalchemy.orm import Session

from app.models import RealEstate
from app.services.recommender import RealEstateRecommender


def _build_dataframe_from_db(db: Session) -> pd.DataFrame:
    """Load real estate data from the database and shape it for RealEstateRecommender."""
    properties: List[RealEstate] = db.query(RealEstate).all()

    if not properties:
        return pd.DataFrame(
            columns=[
                "type",
                "price",
                "area",
                "bedrooms",
                "bathrooms",
                "level",
                "city",
                "rent",
                "furnished_Yes",
                "furnished_No",
                "price_per_sqm",
            ]
        )

    rows: list[dict] = []
    for p in properties:
        area = p.area or 0
        price = p.price or 0
        price_per_sqm = price / area if area else 0

        rows.append(
            {
                "id": p.id,
                "type": p.type,
                "price": price,
                "area": area,
                "bedrooms": p.bedrooms,
                "bathrooms": p.bathrooms,
                "location": p.location,
                # Fields that don't exist in the DB are synthesized
                "level": 0,
                "city": p.location,
                "rent": 0,  # 0 = sale, 1 = rent
                "furnished_Yes": False,
                "furnished_No": True,
                "price_per_sqm": price_per_sqm,
            }
        )

    return pd.DataFrame(rows)


def recommend_for_user(user_id: int, db: Session):
    """
    Generate property recommendations for a user using RealEstateRecommender.

    Strategy:
    - Build a dataset from all properties in the DB
    - If the user has properties, infer a budget from their most expensive one
    - Otherwise, fall back to global "best value" properties
    """
    df = _build_dataframe_from_db(db)
    if df.empty:
        return {"recommended_properties": []}

    recommender = RealEstateRecommender(df)

    user_properties: List[RealEstate] = (
        db.query(RealEstate).filter(RealEstate.owner_id == user_id).all()
    )

    if user_properties:
        max_price = max((p.price or 0) for p in user_properties)
        if max_price > 0:
            budget = max_price * 1.2
            result_df = recommender.recommend_by_budget(budget=budget, n=10)
        else:
            result_df = recommender.find_best_value(n=10)
    else:
        result_df = recommender.find_best_value(n=10)

    # Reattach DB ids after recommendation, since the recommender may return a subset of columns.
    key_cols = ["type", "price", "area", "bedrooms", "bathrooms", "city"]
    source_cols = [c for c in ["id", *key_cols] if c in df.columns]
    if "id" in source_cols and all(c in result_df.columns for c in key_cols):
        source = (
            df[source_cols]
            .drop_duplicates(subset=key_cols, keep="first")
            .copy()
        )
        result_df = result_df.merge(source, on=key_cols, how="left")

    return {
        "recommended_properties": result_df.to_dict(orient="records"),
    }
