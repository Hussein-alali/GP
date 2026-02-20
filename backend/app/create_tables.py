# create_tables.py
from .database import Base, engine
from .models import RealEstate,User
import models

Base.metadata.create_all(bind=engine)
# models.Base.metadata.create_all(bind=engine)
print("Tables created successfully!")
