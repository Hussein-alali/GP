from fastapi import APIRouter
from app.schemas import PricePredictionRequest, PricePredictionResponse
from app.services.price_model import predict_price

router = APIRouter()

@router.post("/price", response_model=PricePredictionResponse)
def price_prediction(data: PricePredictionRequest):
    price, confidence = predict_price(data)
    return {
        "predicted_price": price,
        "confidence": confidence
    }
