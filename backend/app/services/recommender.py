import pandas as pd
from sklearn.preprocessing import StandardScaler
from sklearn.metrics.pairwise import cosine_similarity


class RealEstateRecommender:
    """
    A comprehensive real estate recommendation system.

    Features:
    - Budget-based recommendations
    - Similarity-based search
    - Best value analysis
    - Market statistics
    - Multi-criteria filtering
    """

    def __init__(self, dataframe: pd.DataFrame):
        """
        Initialize the recommender system.

        Parameters:
        -----------
        dataframe : pd.DataFrame
            The real estate dataset
        """
        self.df = dataframe.copy()
        self.df["level"] = self.df["level"].fillna(0)

        # Encode categorical variables
        self.type_map = {t: i for i, t in enumerate(self.df["type"].unique())}
        self.city_map = {c: i for i, c in enumerate(self.df["city"].unique())}

        self.df["type_encoded"] = self.df["type"].map(self.type_map)
        self.df["city_encoded"] = self.df["city"].map(self.city_map)

        # Prepare features for similarity calculation
        feature_cols = [
            "type_encoded",
            "area",
            "bedrooms",
            "bathrooms",
            "level",
            "city_encoded",
            "price_per_sqm",
            "rent",
        ]

        self.features = self.df[feature_cols].values

        # Scale features
        self.scaler = StandardScaler()
        self.features_scaled = self.scaler.fit_transform(self.features)

        print(f"✓ Recommender initialized with {len(self.df):,} properties")

    def recommend_by_budget(
        self,
        budget: float,
        property_type: str | None = None,
        city: str | None = None,
        min_bedrooms: int | None = None,
        max_bedrooms: int | None = None,
        min_bathrooms: int | None = None,
        min_area: float | None = None,
        max_area: float | None = None,
        is_rent: bool = False,
        furnished: bool | None = None,
        n: int = 10,
    ) -> pd.DataFrame:
        """
        Get property recommendations within a specific budget.

        Parameters:
        -----------
        budget : float
            Maximum budget (in EGP)
        property_type : str, optional
            Type of property (e.g., 'apartment', 'villa')
        city : str, optional
            City name or part of city name
        min_bedrooms : int, optional
            Minimum number of bedrooms
        max_bedrooms : int, optional
            Maximum number of bedrooms
        min_bathrooms : int, optional
            Minimum number of bathrooms
        min_area : float, optional
            Minimum area in square meters
        max_area : float, optional
            Maximum area in square meters
        is_rent : bool, default=False
            True for rental properties, False for sale properties
        furnished : bool, optional
            True for furnished, False for unfurnished
        n : int, default=10
            Number of recommendations to return

        Returns:
        --------
        pd.DataFrame
            Recommended properties sorted by best value
        """
        filtered = self.df.copy()

        # Apply filters
        filtered = filtered[filtered["price"] <= budget]
        filtered = filtered[filtered["rent"] == (1 if is_rent else 0)]

        if property_type:
            filtered = filtered[
                filtered["type"].str.lower() == property_type.lower()
            ]

        if city:
            filtered = filtered[
                filtered["city"].str.contains(city, case=False, na=False)
            ]

        if min_bedrooms is not None:
            filtered = filtered[filtered["bedrooms"] >= min_bedrooms]

        if max_bedrooms is not None:
            filtered = filtered[filtered["bedrooms"] <= max_bedrooms]

        if min_bathrooms is not None:
            filtered = filtered[filtered["bathrooms"] >= min_bathrooms]

        if min_area is not None:
            filtered = filtered[filtered["area"] >= min_area]

        if max_area is not None:
            filtered = filtered[filtered["area"] <= max_area]

        if furnished is not None:
            if furnished:
                filtered = filtered[filtered["furnished_Yes"] == True]
            else:
                filtered = filtered[filtered["furnished_No"] == True]

        # Sort by best value (lowest price per sqm)
        result = filtered.nsmallest(n, "price_per_sqm")

        return result[
            [
                "type",
                "price",
                "area",
                "bedrooms",
                "bathrooms",
                "level",
                "city",
                "rent",
                "furnished_Yes",
                "price_per_sqm",
            ]
        ]

    def find_similar(
        self, property_index: int, n: int = 10, price_tolerance: float = 0.3
    ) -> pd.DataFrame:
        """
        Find properties similar to a given property.

        Parameters:
        -----------
        property_index : int
            Index of the reference property in the dataset
        n : int, default=10
            Number of similar properties to return
        price_tolerance : float, default=0.3
            Price range tolerance (0.3 = ±30% of reference price)

        Returns:
        --------
        pd.DataFrame
            Similar properties with similarity scores
        """
        if property_index >= len(self.df):
            raise ValueError(f"Property index {property_index} is out of range")

        # Calculate similarity scores
        ref_features = self.features_scaled[property_index].reshape(1, -1)
        similarities = cosine_similarity(ref_features, self.features_scaled)[0]

        # Get reference property price
        ref_price = self.df.iloc[property_index]["price"]
        min_price = ref_price * (1 - price_tolerance)
        max_price = ref_price * (1 + price_tolerance)

        # Find similar properties within price range
        similar_indices = similarities.argsort()[::-1]
        recommendations: list[int] = []

        for idx in similar_indices:
            if idx == property_index:
                continue

            prop_price = self.df.iloc[idx]["price"]
            if min_price <= prop_price <= max_price:
                recommendations.append(idx)

            if len(recommendations) >= n:
                break

        # If not enough within price range, add more without price filter
        if len(recommendations) < n:
            for idx in similar_indices:
                if idx == property_index or idx in recommendations:
                    continue
                recommendations.append(idx)
                if len(recommendations) >= n:
                    break

        # Create result dataframe
        result = self.df.iloc[recommendations].copy()
        result["similarity_score"] = [similarities[i] for i in recommendations]

        return result[
            [
                "type",
                "price",
                "area",
                "bedrooms",
                "bathrooms",
                "city",
                "rent",
                "furnished_Yes",
                "price_per_sqm",
                "similarity_score",
            ]
        ]

    def find_best_value(
        self,
        property_type: str | None = None,
        city: str | None = None,
        is_rent: bool | None = None,
        n: int = 10,
    ) -> pd.DataFrame:
        """
        Find properties with the best value (lowest price per square meter).

        Parameters:
        -----------
        property_type : str, optional
            Type of property
        city : str, optional
            City name
        is_rent : bool, optional
            True for rentals, False for sales
        n : int, default=10
            Number of properties to return

        Returns:
        --------
        pd.DataFrame
            Best value properties
        """
        filtered = self.df.copy()

        if property_type:
            filtered = filtered[
                filtered["type"].str.lower() == property_type.lower()
            ]

        if city:
            filtered = filtered[
                filtered["city"].str.contains(city, case=False, na=False)
            ]

        if is_rent is not None:
            filtered = filtered[filtered["rent"] == (1 if is_rent else 0)]

        result = filtered.nsmallest(n, "price_per_sqm")

        return result[
            [
                "type",
                "price",
                "area",
                "bedrooms",
                "bathrooms",
                "city",
                "rent",
                "furnished_Yes",
                "price_per_sqm",
            ]
        ]

    def get_market_stats(
        self,
        property_type: str | None = None,
        city: str | None = None,
        is_rent: bool | None = None,
    ) -> dict:
        """
        Get market statistics for filtered properties.

        Parameters:
        -----------
        property_type : str, optional
            Type of property
        city : str, optional
            City name
        is_rent : bool, optional
            True for rentals, False for sales

        Returns:
        --------
        dict
            Dictionary containing market statistics
        """
        filtered = self.df.copy()

        if property_type:
            filtered = filtered[
                filtered["type"].str.lower() == property_type.lower()
            ]

        if city:
            filtered = filtered[
                filtered["city"].str.contains(city, case=False, na=False)
            ]

        if is_rent is not None:
            filtered = filtered[filtered["rent"] == (1 if is_rent else 0)]

        if len(filtered) == 0:
            return {"error": "No properties match the criteria"}

        stats = {
            "total_properties": len(filtered),
            "price_stats": {
                "mean": filtered["price"].mean(),
                "median": filtered["price"].median(),
                "min": filtered["price"].min(),
                "max": filtered["price"].max(),
                "std": filtered["price"].std(),
            },
            "area_stats": {
                "mean": filtered["area"].mean(),
                "median": filtered["area"].median(),
                "min": filtered["area"].min(),
                "max": filtered["area"].max(),
            },
            "price_per_sqm_stats": {
                "mean": filtered["price_per_sqm"].mean(),
                "median": filtered["price_per_sqm"].median(),
                "min": filtered["price_per_sqm"].min(),
                "max": filtered["price_per_sqm"].max(),
            },
            "avg_bedrooms": filtered["bedrooms"].mean(),
            "avg_bathrooms": filtered["bathrooms"].mean(),
            "furnished_percentage": (
                filtered["furnished_Yes"].sum() / len(filtered)
            )
            * 100,
        }

        return stats

    def search_multi_city(
        self,
        cities: list[str],
        budget: float,
        property_type: str | None = None,
        min_bedrooms: int | None = None,
        is_rent: bool = False,
        n: int = 10,
    ) -> pd.DataFrame:
        """
        Search for properties across multiple cities within budget.

        Parameters:
        -----------
        cities : list
            List of city names
        budget : float
            Maximum budget
        property_type : str, optional
            Type of property
        min_bedrooms : int, optional
            Minimum number of bedrooms
        is_rent : bool, default=False
            True for rentals, False for sales
        n : int, default=10
            Number of recommendations to return

        Returns:
        --------
        pd.DataFrame
            Properties from all specified cities
        """
        all_results: list[pd.DataFrame] = []

        for city in cities:
            city_results = self.recommend_by_budget(
                budget=budget,
                property_type=property_type,
                city=city,
                min_bedrooms=min_bedrooms,
                is_rent=is_rent,
                n=n,
            )
            all_results.append(city_results)

        if not all_results:
            return pd.DataFrame()

        # Combine and sort
        combined = pd.concat(all_results, ignore_index=True)
        combined = combined.sort_values("price_per_sqm").head(n)

        return combined


print("RealEstateRecommender class defined successfully!")
