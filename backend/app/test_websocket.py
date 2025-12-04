import asyncio
import websockets
import requests
import json
import time

BASE_URL = "http://127.0.0.1:8000"
WS_URL = "ws://127.0.0.1:8000/wss"

async def listen_to_ws():
    print("\n🔌 Connecting to WebSocket...")

    async with websockets.connect(WS_URL) as ws:
        print("✅ WebSocket connected")

        # Wait for broadcast event
        print("⏳ Waiting for real-time banking events...\n")

        try:
            while True:
                msg = await ws.recv()
                print("📩 REAL-TIME EVENT RECEIVED:")
                print(msg)
        except Exception as e:
            print("❌ WebSocket error:", e)


def initiate_test_transaction(token):
    print("\n💳 Initiating backend & Celery flow...")

    headers = {"token": token}

    # Create two accounts
    resp1 = requests.post(f"{BASE_URL}/accounts/create",
                          json={"initial_balance": 5000},
                          headers=headers)
    acc1 = resp1.json()["id"]

    resp2 = requests.post(f"{BASE_URL}/accounts/create",
                          json={"initial_balance": 200},
                          headers=headers)
    acc2 = resp2.json()["id"]

    print(f"Source Account: {acc1}, Destination Account: {acc2}")

    # Send transaction
    txn_payload = {
        "src_account": acc1,
        "dest_account": acc2,
        "amount": 150
    }

    resp = requests.post(f"{BASE_URL}/transactions/initiate",
                         json=txn_payload,
                         headers=headers)

    print("Transaction Initiated:", resp.json())
    print("Now waiting for Celery to process & WebSocket to push...\n")


async def main():
    # Login (or register if needed)
    print("🔐 Logging in...")

    login_payload = {"username": "omar", "password": "1234"}

    resp = requests.post(f"{BASE_URL}/auth/login", json=login_payload)
    token = resp.json()["access_token"]
    print("Login successful.\n")

    # Start websocket listener task
    ws_task = asyncio.create_task(listen_to_ws())

    # Give it time to connect
    await asyncio.sleep(1)

    # Initiate transaction that will trigger Celery + WebSocket
    initiate_test_transaction(token)

    # Keep listening
    await ws_task

# Run the test
if __name__ == "__main__":
    asyncio.run(main())