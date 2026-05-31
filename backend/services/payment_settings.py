from sqlalchemy.orm import Session

import models
from config import settings

VALID_PAYMENT_MODES = {"qris", "snap"}


def default_payment_mode() -> str:
    return "snap" if not settings.MIDTRANS_IS_PRODUCTION else "qris"


def sanitize_payment_mode(payment_mode: str | None) -> str:
    if payment_mode in VALID_PAYMENT_MODES:
        return payment_mode
    return default_payment_mode()


def resolve_effective_payment_mode(payment_setting: models.PaymentSetting | None) -> str:
    if not settings.MIDTRANS_IS_PRODUCTION:
        return "snap"
    if payment_setting and payment_setting.payment_mode in VALID_PAYMENT_MODES:
        return payment_setting.payment_mode
    return default_payment_mode()


def ensure_payment_setting(db: Session, store_id: int) -> models.PaymentSetting:
    payment_setting = db.query(models.PaymentSetting).filter(models.PaymentSetting.store_id == store_id).first()
    if payment_setting:
        if payment_setting.payment_mode not in VALID_PAYMENT_MODES:
            payment_setting.payment_mode = default_payment_mode()
            db.commit()
            db.refresh(payment_setting)
        return payment_setting

    payment_setting = models.PaymentSetting(
        store_id=store_id,
        payment_mode=default_payment_mode(),
    )
    db.add(payment_setting)
    db.commit()
    db.refresh(payment_setting)
    return payment_setting
