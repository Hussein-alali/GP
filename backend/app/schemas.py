from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, List
from datetime import datetime


class UserCreate(BaseModel):
    username: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

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
    description: Optional[str] = None
    images: List[str] = Field(default_factory=list)
    features: List[str] = Field(default_factory=list)
    status: str = "available"

class UserAddRealEstateResponse(BaseModel):
    id: int
    area: float
    bedrooms: int
    bathrooms: int
    location: str
    type: str
    price: float
    description: Optional[str] = None
    images: List[str] = Field(default_factory=list)
    features: List[str] = Field(default_factory=list)
    status: str = "available"
    owner_id: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)

class RealEstateUpdate(BaseModel):
    area: Optional[float] = None
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None
    location: Optional[str] = None
    type: Optional[str] = None
    price: Optional[float] = None
    description: Optional[str] = None
    images: Optional[List[str]] = None
    features: Optional[List[str]] = None
    status: Optional[str] = None

class UserProfileUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    bio: Optional[str] = None

class UserProfileResponse(BaseModel):
    id: int
    username: str
    email: str
    phone: Optional[str] = None
    bio: Optional[str] = None
    role: str = "user"
    favorites: List[int] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)

class MessageCreate(BaseModel):
    receiver_id: int
    property_id: Optional[int] = None
    content: str

class MessageResponse(BaseModel):
    id: int
    sender_id: int
    receiver_id: int
    property_id: Optional[int] = None
    content: str
    created_at: datetime
    is_read: int
    sender_name: Optional[str] = None
    receiver_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class BrandDetectionResponse(BaseModel):
    company_name: Optional[str]
    confidence_score: float
    is_fraudulent: bool
    reason: str


class BrandValidationResponse(BaseModel):
    claimed_company: str
    company_name: Optional[str]
    confidence_score: float
    is_fraudulent: bool
    reason: str
