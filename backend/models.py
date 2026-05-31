from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True)
    hashed_password = Column(String(255))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    
    store = relationship("Store", back_populates="owner", uselist=False)

class Store(Base):
    __tablename__ = "stores"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), index=True)
    owner_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, server_default=func.now())
    
    owner = relationship("User", back_populates="store")
    transactions = relationship("Transaction", back_populates="store")
    devices = relationship("Device", back_populates="store")
    payment_setting = relationship("PaymentSetting", back_populates="store", uselist=False)


class PaymentSetting(Base):
    __tablename__ = "payment_settings"

    id = Column(Integer, primary_key=True, index=True)
    store_id = Column(Integer, ForeignKey("stores.id"), unique=True)
    payment_mode = Column(String(50), default="qris")  # qris, snap
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    store = relationship("Store", back_populates="payment_setting")

class Transaction(Base):
    __tablename__ = "transactions"
    
    id = Column(String(100), primary_key=True, index=True) # e.g. order_id
    store_id = Column(Integer, ForeignKey("stores.id"))
    amount = Column(Integer)
    status = Column(String(50), default="pending") # pending, success, expired
    payment_type = Column(String(50), nullable=True) # qris
    payment_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    
    store = relationship("Store", back_populates="transactions")

class Device(Base):
    __tablename__ = "devices"
    
    id = Column(Integer, primary_key=True, index=True)
    store_id = Column(Integer, ForeignKey("stores.id"))
    device_token = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    
    store = relationship("Store", back_populates="devices")
