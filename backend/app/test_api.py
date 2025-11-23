import requests
import random

BASE_URL = "http://127.0.0.1:8000"

def print_section(title):
    print("\n" + "="*50)
    print(title)
    print("="*50)

# -------------------------------------------------------
# 1. Register User
# -------------------------------------------------------
print_section("1. REGISTER USER")

username = "omar_test_" + str(random.randint(1000, 9999))

register_payload = {
    "username": username,
    "email": f"{username}@example.com",
    "password": "1234"
}

resp = requests.post(f"{BASE_URL}/auth/register", json=register_payload)
print("Status:", resp.status_code)
print("Response:", resp.json())

token = resp.json().get("access_token")

if not token:
    print("❌ FAILED: Could not get token from register.")
    exit()

print("Token:", token)


# -------------------------------------------------------
# 2. Login User
# -------------------------------------------------------
print_section("2. LOGIN USER")

login_payload = {
    "username": username,
    "password": "1234"
}

resp = requests.post(f"{BASE_URL}/auth/login", json=login_payload)
print("Status:", resp.status_code)
print("Response:", resp.json())

token = resp.json().get("access_token")

if not token:
    print("❌ FAILED: Login failed.")
    exit()

print("Logged in Token:", token)


# Header for protected routes
headers = {"token": token}


# -------------------------------------------------------
# 3. Create Two Accounts
# -------------------------------------------------------
print_section("3. CREATE ACCOUNTS")

# Account 1
resp1 = requests.post(f"{BASE_URL}/accounts/create", json={"initial_balance": 5000}, headers=headers)
print("Account 1:", resp1.json())

# Account 2
resp2 = requests.post(f"{BASE_URL}/accounts/create", json={"initial_balance": 2000}, headers=headers)
print("Account 2:", resp2.json())

acc1 = resp1.json().get("id")
acc2 = resp2.json().get("id")


# -------------------------------------------------------
# 4. Get My Accounts
# -------------------------------------------------------
print_section("4. GET MY ACCOUNTS")

resp = requests.get(f"{BASE_URL}/accounts/me", headers=headers)
print("Status:", resp.status_code)
print("Accounts:", resp.json())


# -------------------------------------------------------
# 5. Initiate Transaction
# -------------------------------------------------------
print_section("5. INITIATE TRANSACTION")

txn_payload = {
    "src_account": acc1,
    "dest_account": acc2,
    "amount": 150
}

resp = requests.post(f"{BASE_URL}/transactions/initiate", json=txn_payload, headers=headers)
print("Status:", resp.status_code)
print("Transaction:", resp.json())


print("\n\n🔥 TEST COMPLETED SUCCESSFULLY 🔥")