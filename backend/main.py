from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from sqlalchemy import inspect, text
import models
from routers import auth, transactions, webhooks, settings as settings_router
from config import settings
from typing import Dict, List

# Create DB tables
Base.metadata.create_all(bind=engine)


def ensure_additive_schema():
    inspector = inspect(engine)
    tables = set(inspector.get_table_names())

    if "payment_settings" not in tables:
        models.PaymentSetting.__table__.create(bind=engine, checkfirst=True)

    if "transactions" in tables:
        columns = {column["name"] for column in inspector.get_columns("transactions")}
        if "payment_url" not in columns:
            with engine.begin() as connection:
                connection.execute(text("ALTER TABLE transactions ADD COLUMN payment_url VARCHAR(500) NULL"))


ensure_additive_schema()

app = FastAPI(title="Warung Payment API")

cors_origins = [origin.strip() for origin in settings.CORS_ORIGINS.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_origin_regex=r"^https://([a-z0-9-]+\.)*cianjur\.space$",
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ConnectionManager:
    def __init__(self):
        # Dictionary mapping store_id to a list of active websocket connections
        self.active_connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, store_id: int):
        await websocket.accept()
        if store_id not in self.active_connections:
            self.active_connections[store_id] = []
        self.active_connections[store_id].append(websocket)

    def disconnect(self, websocket: WebSocket, store_id: int):
        if store_id in self.active_connections:
            self.active_connections[store_id].remove(websocket)
            if not self.active_connections[store_id]:
                del self.active_connections[store_id]

    async def broadcast_to_store(self, store_id: int, message: dict):
        if store_id in self.active_connections:
            for connection in self.active_connections[store_id]:
                try:
                    await connection.send_json(message)
                except Exception:
                    pass

manager = ConnectionManager()

@app.websocket("/ws/{store_id}")
async def websocket_endpoint(websocket: WebSocket, store_id: int):
    await manager.connect(websocket, store_id)
    try:
        while True:
            # Keep connection alive, wait for messages if any (e.g. ping)
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, store_id)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(transactions.router, prefix="/api/transactions", tags=["transactions"])
app.include_router(settings_router.router, prefix="/api/settings", tags=["settings"])
app.include_router(webhooks.router, prefix="/api/webhooks", tags=["webhooks"])

@app.get("/")
def read_root():
    return {"message": "Warung Payment API is running"}
