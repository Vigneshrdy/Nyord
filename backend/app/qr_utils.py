import qrcode
import io
import base64
from typing import Union
import hashlib
import json

def generate_user_qr_code(user_id: int, user_data: dict = None) -> str:
    """
    Generate a unique QR code for a user that will always be the same for the same user_id.
    
    Args:
        user_id: The user's unique ID
        user_data: Optional dictionary with user info like name, email etc.
    
    Returns:
        Base64 encoded PNG image of the QR code
    """
    # Create consistent QR data using user_id as the primary identifier
    qr_data = {
        "user_id": user_id,
        "app": "Nyord Banking",
        "type": "user_profile",
        "timestamp": "permanent"  # Static to ensure same QR always
    }
    
    # Add user data if provided
    if user_data:
        qr_data.update({
            "name": user_data.get("full_name", ""),
            "email": user_data.get("email", ""),
            "username": user_data.get("username", "")
        })
    
    # Convert to JSON string for QR encoding (sorted keys for consistency)
    qr_content = json.dumps(qr_data, sort_keys=True)
    
    # Create QR code with specific settings for consistency
    qr = qrcode.QRCode(
        version=1,  # Controls size, 1 is smallest
        error_correction=qrcode.constants.ERROR_CORRECT_M,  # Medium error correction
        box_size=10,  # Size of each box in pixels
        border=4,  # Border size in boxes
    )
    
    qr.add_data(qr_content)
    qr.make(fit=True)
    
    # Create image with specific colors for consistency
    qr_image = qr.make_image(
        fill_color="black",
        back_color="white"
    )
    
    # Convert to base64 string
    img_buffer = io.BytesIO()
    qr_image.save(img_buffer, format='PNG')
    img_buffer.seek(0)
    
    # Encode to base64
    img_base64 = base64.b64encode(img_buffer.getvalue()).decode('utf-8')
    
    return f"data:image/png;base64,{img_base64}"

def generate_user_qr_hash(user_id: int) -> str:
    """
    Generate a consistent hash for the user that can be used as QR identifier.
    This will always produce the same hash for the same user_id.
    
    Args:
        user_id: The user's unique ID
    
    Returns:
        SHA256 hash string
    """
    # Use a salt with user_id for consistent hashing
    salt = "nyord_banking_qr_2024"
    data = f"{salt}_{user_id}_{salt}"
    
    return hashlib.sha256(data.encode()).hexdigest()

def verify_qr_code(qr_data: str, expected_user_id: int) -> bool:
    """
    Verify if a QR code data belongs to the expected user.
    
    Args:
        qr_data: The decoded QR code data (JSON string)
        expected_user_id: The expected user ID
    
    Returns:
        True if QR code is valid for the user, False otherwise
    """
    try:
        parsed_data = json.loads(qr_data)
        return parsed_data.get("user_id") == expected_user_id and parsed_data.get("app") == "Nyord Banking"
    except (json.JSONDecodeError, KeyError):
        return False