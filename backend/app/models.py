from sqlalchemy import Column, Integer, Float, String, ForeignKey, Text, DateTime
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.mutable import MutableList
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False)
    email = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    bio = Column(Text, nullable=True)
    role = Column(String, nullable=False, default="user")
    favorites = Column(MutableList.as_mutable(JSONB), nullable=False, default=list)

    real_estates = relationship("RealEstate", back_populates="owner")
    sent_messages = relationship("Message", foreign_keys="Message.sender_id", back_populates="sender")
    received_messages = relationship("Message", foreign_keys="Message.receiver_id", back_populates="receiver")


class RealEstate(Base):
    __tablename__ = "real_estates"

    id = Column(Integer, primary_key=True, index=True)
    area = Column(Float, nullable=False)
    bedrooms = Column(Integer, nullable=False)
    bathrooms = Column(Integer, nullable=False)
    location = Column(String, nullable=False)
    type = Column(String, nullable=False)
    price = Column(Float, nullable=False)
    description = Column(Text, nullable=True)
    images = Column(MutableList.as_mutable(JSONB), nullable=False, default=list)
    features = Column(MutableList.as_mutable(JSONB), nullable=True, default=list)
    status = Column(String, nullable=False, default="available")

    owner_id = Column(Integer, ForeignKey("users.id"))
    owner = relationship("User", back_populates="real_estates")


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    receiver_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    property_id = Column(Integer, ForeignKey("real_estates.id"), nullable=True)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    is_read = Column(Integer, nullable=False, default=0)

    sender = relationship("User", foreign_keys=[sender_id], back_populates="sent_messages")
    receiver = relationship("User", foreign_keys=[receiver_id], back_populates="received_messages")
