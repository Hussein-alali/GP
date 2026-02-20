from .database import SessionLocal
from .models import User

db = SessionLocal()
new_user = User(username="John", email="john@example.com", password="1234")
db.add(new_user)
db.commit()
db.refresh(new_user)
print("User added:", new_user.id)
db.close()
