import qrcode
import io
import base64
from typing import Union
import hashlib
import json
from PIL import Image, ImageDraw
import os

def add_logo_to_qr(qr_image: Image.Image) -> Image.Image:
    """
    Add logo to the center of QR code with proper sizing and padding.
    
    Args:
        qr_image: The QR code PIL Image
    
    Returns:
        QR code with logo embedded
    """
    # Get logo path (adjust based on your project structure)
    logo_path = os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "public", "logo.png")
    
    # Check if logo exists
    if not os.path.exists(logo_path):
        return qr_image  # Return original QR if logo not found
    
    try:
        # Open logo
        logo = Image.open(logo_path)
        
        # Calculate logo size (15% of QR code size for better scanning)
        qr_width, qr_height = qr_image.size
        logo_max_size = int(qr_width * 0.15)  # 15% of QR size (reduced from 20%)
        
        # Resize logo maintaining aspect ratio
        logo.thumbnail((logo_max_size, logo_max_size), Image.Resampling.LANCZOS)
        
        # Create a white background with padding (adds white border around logo)
        logo_width, logo_height = logo.size
        padding = int(logo_max_size * 0.20)  # 20% padding (increased from 15%)
        
        background_size = logo_width + (padding * 2)
        background = Image.new('RGB', (background_size, background_size), 'white')
        
        # Paste logo onto white background
        logo_pos = (padding, padding)
        if logo.mode == 'RGBA':
            background.paste(logo, logo_pos, logo)
        else:
            background.paste(logo, logo_pos)
        
        # Calculate position to center the logo (avoiding the 3 corner squares)
        logo_position = (
            (qr_width - background_size) // 2,
            (qr_height - background_size) // 2
        )
        
        # Paste logo with background onto QR code
        qr_image.paste(background, logo_position)
        
        return qr_image
        
    except Exception as e:
        print(f"Error adding logo to QR: {e}")
        return qr_image  # Return original QR if error occurs

def generate_user_qr_code(user_id: int, user_data: dict = None, base_url: str = "https://bank.vigneshreddy.tech") -> str:
    """
    Generate a unique QR code for a user that contains a payment URL.
    When scanned, it redirects to the payment page.
    
    Args:
        user_id: The user's unique ID
        user_data: Optional dictionary with user info like name, email etc.
        base_url: Base URL of the frontend application
    
    Returns:
        Base64 encoded PNG image of the QR code
    """
    # Generate secure hash for the user
    user_hash = generate_user_qr_hash(user_id)
    
    # Create payment URL that works with external scanners
    payment_url = f"{base_url}/pay?to={user_id}&hash={user_hash}"
    print(f"QR Code Debug - Base URL: {base_url}")
    print(f"QR Code Debug - Payment URL: {payment_url}")
    
    # Add user info as URL parameters for better UX
    if user_data:
        if user_data.get("username"):
            payment_url += f"&username={user_data['username']}"
        if user_data.get("full_name"):
            payment_url += f"&name={user_data['full_name'].replace(' ', '%20')}"
    
    # QR content is now a simple URL
    qr_content = payment_url
    
    # Create QR code with HIGH error correction for logo embedding
    qr = qrcode.QRCode(
        version=1,  # Controls size, 1 is smallest
        error_correction=qrcode.constants.ERROR_CORRECT_H,  # HIGH error correction (30% damage tolerance)
        box_size=10,  # Size of each box in pixels
        border=4,  # Border size in boxes
    )
    
    qr.add_data(qr_content)
    qr.make(fit=True)
    
    # Create image with specific colors for consistency
    qr_image = qr.make_image(
        fill_color="black",
        back_color="white"
    ).convert('RGB')
    
    # Add logo to center of QR code
    qr_image = add_logo_to_qr(qr_image)
    
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

def generate_account_qr_code(account_id: int, account_data: dict = None, base_url: str = "http://localhost:3000") -> str:
    """
    Generate a unique QR code for a bank account (similar to UPI).
    Each account gets its own QR code for receiving payments.
    
    Args:
        account_id: The account's unique ID
        account_data: Optional dictionary with account info
        base_url: Base URL of the frontend application
    
    Returns:
        Base64 encoded PNG image of the QR code
    """
    # Generate secure hash for the account
    account_hash = generate_account_qr_hash(account_id)
    
    # Create payment URL that works with external scanners
    payment_url = f"{base_url}/pay?account={account_id}&hash={account_hash}"
    
    # Add account info as URL parameters for better UX
    if account_data:
        if account_data.get("account_number"):
            payment_url += f"&acc_num={account_data['account_number']}"
        if account_data.get("user_name"):
            payment_url += f"&name={account_data['user_name'].replace(' ', '%20')}"
        if account_data.get("account_type"):
            payment_url += f"&type={account_data['account_type']}"
    
    # QR content is the payment URL
    qr_content = payment_url
    
    # Create QR code with HIGH error correction for logo embedding
    qr = qrcode.QRCode(
        version=1,  # Controls size
        error_correction=qrcode.constants.ERROR_CORRECT_H,  # HIGH error correction (30% damage tolerance)
        box_size=10,  # Size of each box in pixels
        border=4,  # Border size in boxes
    )
    
    qr.add_data(qr_content)
    qr.make(fit=True)
    
    # Create image
    qr_image = qr.make_image(
        fill_color="black",
        back_color="white"
    ).convert('RGB')
    
    # Add logo to center of QR code
    qr_image = add_logo_to_qr(qr_image)
    
    # Convert to base64 string
    img_buffer = io.BytesIO()
    qr_image.save(img_buffer, format='PNG')
    img_buffer.seek(0)
    
    # Encode to base64
    img_base64 = base64.b64encode(img_buffer.getvalue()).decode('utf-8')
    
    return f"data:image/png;base64,{img_base64}"

def generate_account_qr_hash(account_id: int) -> str:
    """
    Generate a consistent hash for an account that can be used as QR identifier.
    This will always produce the same hash for the same account_id.
    
    Args:
        account_id: The account's unique ID
    
    Returns:
        SHA256 hash string
    """
    # Use a salt with account_id for consistent hashing
    salt = "nyord_account_qr_2024"
    data = f"{salt}_{account_id}_{salt}"
    
    return hashlib.sha256(data.encode()).hexdigest()