from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
import uuid

from database import get_db
import models, schemas
from services.midtrans import create_payment_transaction
from services.payment_settings import ensure_payment_setting, resolve_effective_payment_mode

router = APIRouter()


def _create_payment_response(store_id: int, amount: int, db: Session):
    payment_setting = ensure_payment_setting(db, store_id)
    payment_mode = resolve_effective_payment_mode(payment_setting)
    order_id = f"ORDER-{store_id}-{uuid.uuid4().hex[:8]}"

    try:
        payment_resp = create_payment_transaction(order_id, amount, payment_mode)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    db_tx = models.Transaction(
        id=order_id,
        store_id=store_id,
        amount=amount,
        status="pending",
        payment_type=payment_resp.get("payment_type"),
        payment_url=payment_resp.get("payment_url"),
    )
    db.add(db_tx)
    db.commit()
    db.refresh(db_tx)

    response = schemas.TransactionResponse.model_validate(db_tx)
    response.payment_type = payment_resp.get("payment_type")
    response.payment_url = payment_resp.get("payment_url")
    response.qr_url = payment_resp.get("qr_url")
    return response


def _build_stats(transactions: list[models.Transaction]) -> schemas.TransactionStats:
    total_transactions = len(transactions)
    success_transactions = sum(1 for tx in transactions if tx.status == "success")
    pending_transactions = sum(1 for tx in transactions if tx.status == "pending")
    expired_transactions = sum(1 for tx in transactions if tx.status == "expired")

    total_amount = sum(tx.amount or 0 for tx in transactions)
    success_amount = sum(tx.amount or 0 for tx in transactions if tx.status == "success")
    pending_amount = sum(tx.amount or 0 for tx in transactions if tx.status == "pending")
    expired_amount = sum(tx.amount or 0 for tx in transactions if tx.status == "expired")

    return schemas.TransactionStats(
        total_transactions=total_transactions,
        success_transactions=success_transactions,
        pending_transactions=pending_transactions,
        expired_transactions=expired_transactions,
        total_amount=total_amount,
        success_amount=success_amount,
        pending_amount=pending_amount,
        expired_amount=expired_amount,
    )


@router.post("/{store_id}/payment", response_model=schemas.TransactionResponse)
def create_payment(store_id: int, tx: schemas.TransactionCreate, db: Session = Depends(get_db)):
    if tx.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be greater than zero")

    store = db.query(models.Store).filter(models.Store.id == store_id).first()
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")

    return _create_payment_response(store_id, tx.amount, db)


@router.post("/{store_id}/qris", response_model=schemas.TransactionResponse)
def create_qris(store_id: int, tx: schemas.TransactionCreate, db: Session = Depends(get_db)):
    return create_payment(store_id, tx, db)


@router.get("/public/{order_id}", response_model=schemas.TransactionResponse)
def get_public_transaction(order_id: str, db: Session = Depends(get_db)):
    transaction = db.query(models.Transaction).filter(models.Transaction.id == order_id).first()
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")

    return schemas.TransactionResponse.model_validate(transaction)


@router.get("/{store_id}/overview", response_model=schemas.TransactionOverviewResponse)
def transaction_overview(
    store_id: int,
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    store = db.query(models.Store).filter(models.Store.id == store_id).first()
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")

    transactions = (
        db.query(models.Transaction)
        .filter(models.Transaction.store_id == store_id)
        .order_by(models.Transaction.created_at.desc())
        .limit(limit)
        .all()
    )

    stats = _build_stats(
        db.query(models.Transaction)
        .filter(models.Transaction.store_id == store_id)
        .all()
    )

    return schemas.TransactionOverviewResponse(
        stats=stats,
        transactions=[schemas.TransactionListItem.model_validate(tx) for tx in transactions],
    )
