import requests
import time

BASE_URL = "http://127.0.0.1:8000"

def print_section(title):
    print("\n" + "="*60)
    print(title)
    print("="*60)


# ------------------------------
# 1. Login (using existing user)
# ------------------------------
print_section("1. LOGIN USER")

username = "omar"   # Replace if needed
password = "1234"

resp = requests.post(f"{BASE_URL}/auth/login", json={
    "username": username,
    "password": password
})

print("Status:", resp.status_code)
print("Response:", resp.json())

token = resp.json().get("access_token")

if not token:
    print("❌ FAILED: Login failed. Ensure user exists.")
    exit()

headers = {"token": token}


# ------------------------------
# 2. Create accounts
# ------------------------------
print_section("2. CREATE ACCOUNTS")

# Source
resp1 = requests.post(f"{BASE_URL}/accounts/create",
                      json={"initial_balance": 5000},
                      headers=headers)
print("Account 1:", resp1.json())
acc1 = resp1.json()["id"]

# Destination
resp2 = requests.post(f"{BASE_URL}/accounts/create",
                      json={"initial_balance": 2000},
                      headers=headers)
print("Account 2:", resp2.json())
acc2 = resp2.json()["id"]


# ------------------------------
# 3. Initiate Transaction
# ------------------------------
print_section("3. INITIATE TRANSACTION")

amount = 200

txn_payload = {
    "src_account": acc1,
    "dest_account": acc2,
    "amount": amount
}

resp = requests.post(f"{BASE_URL}/transactions/initiate",
                     json=txn_payload,
                     headers=headers)

print("Status:", resp.status_code)
txn_data = resp.json()
print("Transaction:", txn_data)

txn_id = txn_data["id"]


# ------------------------------
# 4. Wait for Celery to process
# ------------------------------
print_section("4. WAITING FOR CELERY PROCESSING")

print("⏳ Waiting for Celery worker...")
time.sleep(3)    # Give worker time to update DB


# ------------------------------
# 5. Check Transaction Status
# ------------------------------
print_section("5. CHECK TRANSACTION STATUS")

resp = requests.get(f"{BASE_URL}/transactions/{txn_id}", headers=headers)

if resp.status_code != 200:
    print("❌ FAILED: Cannot fetch transaction")
    print(resp.text)
    exit()

txn_final = resp.json()
print("Final Transaction Data:", txn_final)

if txn_final["status"] == "SUCCESS":
    print("✅ Transaction successfully processed")
else:
    print("❌ Transaction failed or still pending")


# ------------------------------
# 6. Check Updated Balances
# ------------------------------
print_section("6. CHECK UPDATED BALANCES")

resp = requests.get(f"{BASE_URL}/accounts/me", headers=headers)
accounts = resp.json()
print("Accounts:", accounts)

acc1_after = next(acc for acc in accounts if acc["id"] == acc1)
acc2_after = next(acc for acc in accounts if acc["id"] == acc2)

print("Source Account After:", acc1_after)
print("Destination Account After:", acc2_after)

if acc1_after["balance"] == 5000 - amount and acc2_after["balance"] == 2000 + amount:
    print("✅ Balances updated correctly")
else:
    print("❌ Balance mismatch")


# ------------------------------
# 7. (Optional) Check Audit Logs endpoint
# ------------------------------
# If you have /audit endpoint later.

print("\n🔥 DAY-3 Test Completed 🔥")