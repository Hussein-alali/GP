from sqlalchemy import Column, Integer, Float, String, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base
#from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False)
    email = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=False)

    real_estates = relationship("RealEstate", back_populates="owner")


class RealEstate(Base):
    __tablename__ = "real_estates"

    id = Column(Integer, primary_key=True, index=True)
    area = Column(Float, nullable=False)
    bedrooms = Column(Integer, nullable=False)
    bathrooms = Column(Integer, nullable=False)
    location = Column(String, nullable=False)
    type = Column(String, nullable=False)
    price = Column(Float, nullable=False)

    owner_id = Column(Integer, ForeignKey("users.id"))  # ربط باليوزر
    owner = relationship("User", back_populates="real_estates")
