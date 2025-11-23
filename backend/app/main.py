from fastapi import FastAPI
from .database import Base, engine
from .routers import auth_router, account_router
from .routers import transaction_router
from .routers import ws_router
import threading
import asyncio
from .rabbitmq_ws_listener import rabbitmq_ws_listener





Base.metadata.create_all(bind=engine)

app = FastAPI()

app.include_router(auth_router.router)
app.include_router(account_router.router)
app.include_router(transaction_router.router)
app.include_router(ws_router.router)

@app.on_event("startup")
def start_ws_listener():
    thread = threading.Thread(
        target=lambda: asyncio.run(rabbitmq_ws_listener()),
        daemon=True
    )
    thread.start()