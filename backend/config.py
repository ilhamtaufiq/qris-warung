import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    DATABASE_URL: str = os.getenv("DATABASE_URL", "mysql+pymysql://root:@localhost/qris_db")
    MIDTRANS_IS_PRODUCTION: bool = os.getenv("MIDTRANS_IS_PRODUCTION", "False").lower() in ("true", "1", "t")
    MIDTRANS_MERCHANT_ID: str = os.getenv("MIDTRANS_MERCHANT_ID", "")
    MIDTRANS_SERVER_KEY: str = os.getenv("MIDTRANS_SERVER_KEY", "")
    MIDTRANS_CLIENT_KEY: str = os.getenv("MIDTRANS_CLIENT_KEY", "")
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "secret")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")

settings = Settings()
