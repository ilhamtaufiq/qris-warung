import midtransclient

from config import settings

core_api = midtransclient.CoreApi(
    is_production=settings.MIDTRANS_IS_PRODUCTION,
    server_key=settings.MIDTRANS_SERVER_KEY,
    client_key=settings.MIDTRANS_CLIENT_KEY,
)

snap_api = midtransclient.Snap(
    is_production=settings.MIDTRANS_IS_PRODUCTION,
    server_key=settings.MIDTRANS_SERVER_KEY,
    client_key=settings.MIDTRANS_CLIENT_KEY,
)


def _gross_amount(amount: float) -> int:
    gross_amount = int(round(amount))
    if gross_amount <= 0:
        raise ValueError("Amount must be greater than zero")
    return gross_amount


def _extract_qr_url(charge_response: dict) -> str | None:
    if "actions" not in charge_response:
        return None

    for action in charge_response["actions"]:
        if action.get("name") == "generate-qr-code":
            return action.get("url")

    return None


def create_qris_transaction(order_id: str, amount: float):
    gross_amount = _gross_amount(amount)
    param = {
        "payment_type": "qris",
        "transaction_details": {
            "order_id": order_id,
            "gross_amount": gross_amount,
        },
    }
    return core_api.charge(param)


def create_snap_transaction(order_id: str, amount: float):
    gross_amount = _gross_amount(amount)
    param = {
        "transaction_details": {
            "order_id": order_id,
            "gross_amount": gross_amount,
        },
        "credit_card": {
            "secure": True,
        },
        "finish_redirect_url": f"{settings.FRONTEND_URL}/payment/success?order_id={order_id}",
        "unfinish_redirect_url": f"{settings.FRONTEND_URL}/payment/unfinish?order_id={order_id}",
        "error_redirect_url": f"{settings.FRONTEND_URL}/payment/error?order_id={order_id}",
    }
    return snap_api.create_transaction(param)


def create_payment_transaction(order_id: str, amount: float, payment_mode: str):
    effective_mode = "snap" if not settings.MIDTRANS_IS_PRODUCTION else payment_mode
    if effective_mode == "snap":
        snap_response = create_snap_transaction(order_id, amount)
        return {
            "payment_type": "snap",
            "payment_url": snap_response.get("redirect_url"),
            "snap_token": snap_response.get("token"),
        }

    charge_response = create_qris_transaction(order_id, amount)
    qr_url = _extract_qr_url(charge_response)
    return {
        "payment_type": "qris",
        "payment_url": qr_url,
        "qr_url": qr_url,
    }
