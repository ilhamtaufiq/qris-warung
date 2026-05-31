import hashlib

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from database import get_db
import models
from config import settings

router = APIRouter()
public_router = APIRouter()


def verify_signature(payload: dict) -> bool:
    signature_key = payload.get("signature_key")
    order_id = payload.get("order_id")
    status_code = payload.get("status_code")
    gross_amount = payload.get("gross_amount")

    if not signature_key or not order_id or not status_code or gross_amount is None:
        return False

    raw_signature = f"{order_id}{status_code}{gross_amount}{settings.MIDTRANS_SERVER_KEY}"
    expected_signature = hashlib.sha512(raw_signature.encode("utf-8")).hexdigest()
    return signature_key == expected_signature

async def _handle_midtrans_webhook(request: Request, db: Session = Depends(get_db)):
    payload = await request.json()
    print(
        "Midtrans webhook received",
        {
            "order_id": payload.get("order_id"),
            "transaction_status": payload.get("transaction_status"),
            "status_code": payload.get("status_code"),
        },
    )

    if not verify_signature(payload):
        print("Midtrans webhook rejected: invalid signature")
        raise HTTPException(status_code=401, detail="Invalid Midtrans signature")

    order_id = payload.get("order_id")
    transaction_status = payload.get("transaction_status")
    
    db_tx = db.query(models.Transaction).filter(models.Transaction.id == order_id).first()
    if not db_tx:
        print(f"Midtrans webhook ignored: transaction not found for order_id={order_id}")
        return {"status": "ignored"}
        
    if transaction_status in ['capture', 'settlement']:
        db_tx.status = 'success'
        db.commit()
        # Broadcast to websocket
        from main import manager
        await manager.broadcast_to_store(db_tx.store_id, {
            "event": "payment_success",
            "order_id": db_tx.id,
            "amount": db_tx.amount
        })
        
    elif transaction_status in ['deny', 'cancel', 'expire']:
        db_tx.status = 'expired'
        db.commit()
        from main import manager
        await manager.broadcast_to_store(db_tx.store_id, {
            "event": "payment_expired",
            "order_id": db_tx.id
        })
        
    return {"status": "ok"}


@router.post("/midtrans")
async def midtrans_webhook(request: Request, db: Session = Depends(get_db)):
    return await _handle_midtrans_webhook(request, db)


@public_router.post("/payments/midtrans-notification")
async def public_midtrans_webhook(request: Request, db: Session = Depends(get_db)):
    return await _handle_midtrans_webhook(request, db)
