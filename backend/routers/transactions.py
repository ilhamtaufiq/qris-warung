from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import uuid

from database import get_db
import models, schemas
from services.midtrans import create_qris_transaction

router = APIRouter()

# For a real app, you would extract the store_id from the JWT token via a Depends dependency.
# Here we just pass store_id in the URL for simplicity in MVP.
@router.post("/{store_id}/qris", response_model=schemas.TransactionResponse)
def create_qris(store_id: int, tx: schemas.TransactionCreate, db: Session = Depends(get_db)):
    if tx.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be greater than zero")

    store = db.query(models.Store).filter(models.Store.id == store_id).first()
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
    
    order_id = f"ORDER-{store_id}-{uuid.uuid4().hex[:8]}"
    
    try:
        charge_resp = create_qris_transaction(order_id, tx.amount)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    # Extract QR Code URL
    # For gopay type, midtrans returns an array of actions. We look for 'generate-qr-code'
    qr_url = None
    if "actions" in charge_resp:
        for action in charge_resp["actions"]:
            if action.get("name") == "generate-qr-code":
                qr_url = action.get("url")
                break
                
    db_tx = models.Transaction(
        id=order_id,
        store_id=store_id,
        amount=tx.amount,
        status="pending",
        payment_type="qris"
    )
    db.add(db_tx)
    db.commit()
    db.refresh(db_tx)
    
    response = schemas.TransactionResponse.model_validate(db_tx)
    response.qr_url = qr_url
    return response
