from sqlalchemy import Column, Integer, Float, String, ForeignKey, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.mutable import MutableList
from sqlalchemy.orm import relationship
from .database import Base


class User(Base):
    __tablename__ = "users"

    id       = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False)
    email    = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=False)
    phone    = Column(String, nullable=True)
    bio      = Column(Text, nullable=True)
    role     = Column(String, nullable=False, default="user")
    favorites = Column(MutableList.as_mutable(JSONB), nullable=False, default=list)

    real_estates = relationship("RealEstate", back_populates="owner")


class RealEstate(Base):
    __tablename__ = "real_estates"

    id          = Column(Integer, primary_key=True, index=True)
    area        = Column(Float, nullable=False)
    bedrooms    = Column(Integer, nullable=False)
    bathrooms   = Column(Integer, nullable=False)
    location    = Column(String, nullable=False)
    type        = Column(String, nullable=False)
    price       = Column(Float, nullable=False)
    description = Column(Text, nullable=True)
    images      = Column(MutableList.as_mutable(JSONB), nullable=False, default=list)
    features    = Column(MutableList.as_mutable(JSONB), nullable=True, default=list)
    status      = Column(String, nullable=False, default="available")

    owner_id = Column(Integer, ForeignKey("users.id"))
    owner    = relationship("User", back_populates="real_estates")
