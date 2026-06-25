from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, RealEstate

router = APIRouter()


def require_admin(admin_id: int, db: Session):
    user = db.query(User).filter(User.id == admin_id).first()
    if not user or user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


@router.get("/stats")
def get_stats(admin_id: int, db: Session = Depends(get_db)):
    require_admin(admin_id, db)
    total_users = db.query(User).count()
    total_properties = db.query(RealEstate).count()
    available = db.query(RealEstate).filter(RealEstate.status == "available").count()
    sold = db.query(RealEstate).filter(RealEstate.status == "sold").count()
    rented = db.query(RealEstate).filter(RealEstate.status == "rented").count()
    return {
        "total_users": total_users,
        "total_properties": total_properties,
        "available_properties": available,
        "sold_properties": sold,
        "rented_properties": rented,
    }


@router.get("/users")
def list_users(admin_id: int, db: Session = Depends(get_db)):
    require_admin(admin_id, db)
    users = db.query(User).all()
    return [
        {
            "id": u.id,
            "username": u.username,
            "email": u.email,
            "phone": u.phone,
            "role": u.role,
            "properties_count": len(u.real_estates),
        }
        for u in users
    ]


@router.put("/users/{user_id}/role")
def update_user_role(user_id: int, role: str, admin_id: int, db: Session = Depends(get_db)):
    require_admin(admin_id, db)
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if role not in ("user", "admin", "suspended"):
        raise HTTPException(status_code=400, detail="Invalid role")
    user.role = role
    db.commit()
    return {"message": f"User {user_id} role updated to {role}"}


@router.get("/properties")
def list_all_properties(admin_id: int, db: Session = Depends(get_db)):
    require_admin(admin_id, db)
    props = db.query(RealEstate).all()
    return [
        {
            "id": p.id,
            "type": p.type,
            "location": p.location,
            "price": p.price,
            "status": p.status,
            "owner_id": p.owner_id,
            "owner_name": p.owner.username if p.owner else "",
        }
        for p in props
    ]


@router.put("/properties/{property_id}/status")
def update_property_status(property_id: int, status: str, admin_id: int, db: Session = Depends(get_db)):
    require_admin(admin_id, db)
    prop = db.query(RealEstate).filter(RealEstate.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    if status not in ("available", "sold", "rented"):
        raise HTTPException(status_code=400, detail="Invalid status")
    prop.status = status
    db.commit()
    return {"message": f"Property {property_id} status updated to {status}"}


@router.delete("/properties/{property_id}")
def delete_property(property_id: int, admin_id: int, db: Session = Depends(get_db)):
    require_admin(admin_id, db)
    prop = db.query(RealEstate).filter(RealEstate.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    db.delete(prop)
    db.commit()
    return {"message": "Property deleted"}
