from pydantic import BaseModel, ConfigDict
from typing import Optional

class UserCreate(BaseModel):
    username: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str
    
class PropertyCreate(BaseModel):
    title: str
    price: float
    area: float
    bedrooms: int
    bathrooms: int
    city: str
    district: str
    type: str
    purpose: str

class PricePredictionRequest(BaseModel):
    area: float
    bedrooms: int
    bathrooms: int
    location: str
    type: str
    
class PricePredictionResponse(BaseModel):
    predicted_price: float
    confidence: float
    
class UserAddRealEstateRequest(BaseModel):
    area: float
    bedrooms: int
    bathrooms: int
    location: str
    type: str
    price: float

class UserAddRealEstateResponse(UserAddRealEstateRequest):
    id: int
    owner_id: Optional[int] = None
    model_config = ConfigDict(from_attributes=True)

class RealEstateUpdate(BaseModel):
    area: Optional[float] = None
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None
    location: Optional[str] = None
    type: Optional[str] = None
    price: Optional[float] = None
