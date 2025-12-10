"""
Test script to verify QR code with NEW logo (transparent background)
Run this from backend directory: python test_new_logo.py
"""
from app.qr_utils import generate_account_qr_code
from PIL import Image
import base64
import io
import os

# Check logo file details
logo_path = os.path.join(os.path.dirname(__file__), "..", "frontend", "public", "logo.png")
print("=" * 60)
print("Logo File Check:")
print("=" * 60)
if os.path.exists(logo_path):
    logo = Image.open(logo_path)
    print(f"✅ Logo found at: {logo_path}")
    print(f"✅ Logo size: {logo.size}")
    print(f"✅ Logo mode: {logo.mode} {'(RGBA = has transparency!)' if logo.mode == 'RGBA' else '(RGB = no transparency)'}")
    print(f"✅ File size: {os.path.getsize(logo_path)} bytes")
    
    # Get file modification time
    import time
    mod_time = os.path.getmtime(logo_path)
    print(f"✅ Last modified: {time.ctime(mod_time)}")
else:
    print(f"❌ Logo not found at: {logo_path}")

print("\n" + "=" * 60)
print("Generating QR Code with logo...")
print("=" * 60)
account_data = {
    "account_number": "ACC123456789",
    "user_name": "Test User",
    "account_type": "Savings"
}

try:
    qr_code = generate_account_qr_code(
        account_id=1,
        account_data=account_data,
        base_url="http://localhost:5173"
    )
    
    if qr_code.startswith("data:image/png;base64,"):
        print("✅ QR Code generated successfully!")
        
        # Save QR to file for inspection
        base64_data = qr_code.split(',')[1]
        qr_image_data = base64.b64decode(base64_data)
        qr_img = Image.open(io.BytesIO(qr_image_data))
        
        output_path = "test_qr_NEW_LOGO.png"
        qr_img.save(output_path)
        print(f"✅ QR Code saved to: {output_path}")
        print(f"   👉 OPEN THIS FILE to verify your NEW logo is inside!")
        
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 60)
print("NEXT STEPS TO SEE NEW LOGO IN APP:")
print("=" * 60)
print("1. Open test_qr_NEW_LOGO.png - does it have the new logo?")
print("   ✅ YES → Logo file is correct, just need to refresh app")
print("   ❌ NO → Replace logo.png file again")
print("")
print("2. In the UVICORN terminal:")
print("   - Press Ctrl+C to stop")
print("   - Run: uvicorn app.main:app --reload")
print("")
print("3. In your browser:")
print("   - Press Ctrl+Shift+R (hard refresh)")
print("   - Or Ctrl+F5")
print("   - Or clear browser cache")
print("=" * 60)
