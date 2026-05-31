from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from config import settings
from database import get_db
import models, schemas
from services.payment_settings import ensure_payment_setting, resolve_effective_payment_mode, sanitize_payment_mode

router = APIRouter()


def build_payment_setting_response(payment_setting: models.PaymentSetting) -> schemas.PaymentSettingResponse:
    effective_mode = resolve_effective_payment_mode(payment_setting)
    return schemas.PaymentSettingResponse(
        store_id=payment_setting.store_id,
        payment_mode=sanitize_payment_mode(payment_setting.payment_mode),
        effective_mode=effective_mode,
        is_locked=not settings.MIDTRANS_IS_PRODUCTION,
    )


@router.get("/{store_id}/payment", response_model=schemas.PaymentSettingResponse)
def read_payment_setting(store_id: int, db: Session = Depends(get_db)):
    store = db.query(models.Store).filter(models.Store.id == store_id).first()
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")

    payment_setting = ensure_payment_setting(db, store_id)
    return build_payment_setting_response(payment_setting)


@router.put("/{store_id}/payment", response_model=schemas.PaymentSettingResponse)
def update_payment_setting(
    store_id: int,
    payload: schemas.PaymentSettingUpdate,
    db: Session = Depends(get_db),
):
    store = db.query(models.Store).filter(models.Store.id == store_id).first()
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")

    payment_setting = ensure_payment_setting(db, store_id)
    requested_mode = sanitize_payment_mode(payload.payment_mode)

    if not settings.MIDTRANS_IS_PRODUCTION and requested_mode != "snap":
        raise HTTPException(status_code=400, detail="Sandbox is locked to Snap mode")

    payment_setting.payment_mode = requested_mode
    db.commit()
    db.refresh(payment_setting)

    return build_payment_setting_response(payment_setting)
