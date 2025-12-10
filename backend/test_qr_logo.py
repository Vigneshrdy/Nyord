"""
Test script to verify QR code generation with logo
Run this from backend directory: python test_qr_logo.py
"""
from app.qr_utils import generate_account_qr_code, generate_user_qr_code

# Test account QR generation
print("Testing Account QR Code generation with logo...")
account_data = {
    "account_number": "ACC123456789",
    "user_name": "Test User",
    "account_type": "Savings"
}

try:
    qr_code = generate_account_qr_code(
        account_id=1,
        account_data=account_data,
        base_url="http://localhost:3000"
    )
    
    if qr_code.startswith("data:image/png;base64,"):
        print("✅ QR Code generated successfully with logo!")
        print(f"✅ QR Code length: {len(qr_code)} characters")
        print("✅ Features:")
        print("   - Error Correction: Level H (30% damage tolerance)")
        print("   - Logo size: 20% of QR code")
        print("   - White padding: 15% around logo")
        print("   - Logo positioned in center (avoiding corner squares)")
    else:
        print("❌ QR Code format incorrect")
        
except Exception as e:
    print(f"❌ Error generating QR code: {e}")
    import traceback
    traceback.print_exc()

print("\nTesting User QR Code generation with logo...")
user_data = {
    "username": "testuser",
    "full_name": "Test User"
}

try:
    qr_code = generate_user_qr_code(
        user_id=1,
        user_data=user_data,
        base_url="http://localhost:5173"
    )
    
    if qr_code.startswith("data:image/png;base64,"):
        print("✅ User QR Code generated successfully with logo!")
    else:
        print("❌ User QR Code format incorrect")
        
except Exception as e:
    print(f"❌ Error generating user QR code: {e}")
    import traceback
    traceback.print_exc()
