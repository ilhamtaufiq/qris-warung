import midtransclient
from config import settings
import uuid

# Create Core API instance
core_api = midtransclient.CoreApi(
    is_production=settings.MIDTRANS_IS_PRODUCTION,
    server_key=settings.MIDTRANS_SERVER_KEY,
    client_key=settings.MIDTRANS_CLIENT_KEY
)

# Or Snap API instance if we want to use snap URL, but for QRIS, Core API is usually better to get raw QR string
# We will use CoreApi to generate QRIS

def create_qris_transaction(order_id: str, amount: float):
    gross_amount = int(round(amount))
    if gross_amount <= 0:
        raise ValueError("Amount must be greater than zero")

    param = {
        "payment_type": "qris",
        "transaction_details": {
            "order_id": order_id,
            "gross_amount": gross_amount
        },
    }
    
    charge_response = core_api.charge(param)
    return charge_response
