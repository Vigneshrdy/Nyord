from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import Base, engine
from .routers import auth_router, account_router
from .routers import transaction_router
from .routers import ws_router
from .routers import profile_router
from .routers import fixed_deposits_router
from .routers import loans_router
from .routers import cards_router
from .routers import dashboard_router
from .routers import users_router
from .routers import admin_router
from .routers import notification_router
from .routers import qr_router
import threading
import asyncio
from .rabbitmq_ws_listener import rabbitmq_ws_listener
from . import config





Base.metadata.create_all(bind=engine)

app = FastAPI()

# Dynamic CORS configuration driven by environment variables to avoid hardcoding.
_cors_origins = config.get_cors_origins()
app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router)
app.include_router(account_router.router)
app.include_router(transaction_router.router)
app.include_router(ws_router.router)
app.include_router(profile_router.router)
app.include_router(fixed_deposits_router.router)
app.include_router(loans_router.router)
app.include_router(cards_router.router)
app.include_router(dashboard_router.router)
app.include_router(users_router.router)
app.include_router(admin_router.router)
app.include_router(notification_router.router)
app.include_router(qr_router.router)

@app.on_event("startup")
def start_ws_listener():
    thread = threading.Thread(
        target=lambda: asyncio.run(rabbitmq_ws_listener()),
        daemon=True
    )
    thread.start()