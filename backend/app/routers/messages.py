from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Message, User
from app.schemas import MessageCreate, MessageResponse
from typing import List

router = APIRouter()


def _enrich(msg: Message) -> dict:
    return {
        "id": msg.id,
        "sender_id": msg.sender_id,
        "receiver_id": msg.receiver_id,
        "property_id": msg.property_id,
        "content": msg.content,
        "created_at": msg.created_at,
        "is_read": msg.is_read,
        "sender_name": msg.sender.username if msg.sender else "",
        "receiver_name": msg.receiver.username if msg.receiver else "",
    }


@router.post("/send", response_model=MessageResponse)
def send_message(body: MessageCreate, sender_id: int, db: Session = Depends(get_db)):
    sender = db.query(User).filter(User.id == sender_id).first()
    if not sender:
        raise HTTPException(status_code=404, detail="Sender not found")
    receiver = db.query(User).filter(User.id == body.receiver_id).first()
    if not receiver:
        raise HTTPException(status_code=404, detail="Receiver not found")

    msg = Message(
        sender_id=sender_id,
        receiver_id=body.receiver_id,
        property_id=body.property_id,
        content=body.content,
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return _enrich(msg)


@router.get("/inbox/{user_id}", response_model=List[MessageResponse])
def get_inbox(user_id: int, db: Session = Depends(get_db)):
    messages = (
        db.query(Message)
        .filter(Message.receiver_id == user_id)
        .order_by(Message.created_at.desc())
        .all()
    )
    for m in messages:
        if m.is_read == 0:
            m.is_read = 1
    db.commit()
    return [_enrich(m) for m in messages]


@router.get("/sent/{user_id}", response_model=List[MessageResponse])
def get_sent(user_id: int, db: Session = Depends(get_db)):
    messages = (
        db.query(Message)
        .filter(Message.sender_id == user_id)
        .order_by(Message.created_at.desc())
        .all()
    )
    return [_enrich(m) for m in messages]


@router.get("/conversation/{user_a}/{user_b}", response_model=List[MessageResponse])
def get_conversation(user_a: int, user_b: int, db: Session = Depends(get_db)):
    messages = (
        db.query(Message)
        .filter(
            ((Message.sender_id == user_a) & (Message.receiver_id == user_b))
            | ((Message.sender_id == user_b) & (Message.receiver_id == user_a))
        )
        .order_by(Message.created_at.asc())
        .all()
    )
    return [_enrich(m) for m in messages]


@router.get("/unread-count/{user_id}")
def get_unread_count(user_id: int, db: Session = Depends(get_db)):
    count = db.query(Message).filter(Message.receiver_id == user_id, Message.is_read == 0).count()
    return {"unread": count}
