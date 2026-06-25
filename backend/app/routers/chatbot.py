from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import RealEstate
from pydantic import BaseModel
from typing import Optional

router = APIRouter()


class ChatRequest(BaseModel):
    message: str
    user_id: Optional[int] = None


@router.post("/chat")
def chat(body: ChatRequest, db: Session = Depends(get_db)):
    msg = (body.message or "").lower()

    # Simple intent detection
    properties = db.query(RealEstate).filter(RealEstate.status == "available").all()

    keywords = {
        "villa": "villas", "فيلا": "villas",
        "apartment": "apartments", "شقة": "apartments",
        "studio": "studios", "استوديو": "studios",
        "office": "offices", "مكتب": "offices",
        "chalet": "chalets", "شاليه": "chalets",
    }

    matched_type = next((v for k, v in keywords.items() if k in msg), None)

    if matched_type:
        filtered = [p for p in properties if p.type == matched_type][:5]
    else:
        filtered = properties[:5]

    results = [
        {"id": p.id, "type": p.type, "location": p.location, "price": p.price, "area": p.area}
        for p in filtered
    ]

    return {
        "reply": f"Found {len(results)} properties matching your query.",
        "properties": results,
    }
