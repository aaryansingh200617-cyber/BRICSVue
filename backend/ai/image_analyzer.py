import io
import numpy as np
from PIL import Image

def analyze_image(image_bytes: bytes) -> dict:
    """Analyze image for smoke/fire/dust."""
    try:
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        img = img.resize((100, 100))
        arr = np.array(img)
        
        # Simple heuristics
        mean_r = np.mean(arr[:, :, 0])
        mean_g = np.mean(arr[:, :, 1])
        mean_b = np.mean(arr[:, :, 2])
        
        if mean_r > 150 and mean_g < 100 and mean_b < 100:
            return {"detected": "Fire", "confidence": 0.8, "description": "Red/orange pixels detected"}
        if mean_r > 100 and mean_g > 100 and mean_b > 100 and abs(mean_r - mean_b) < 20:
            return {"detected": "Smoke", "confidence": 0.7, "description": "Gray pixels detected"}
        if mean_r > 120 and mean_g > 100 and mean_b < 80:
            return {"detected": "Dust/Haze", "confidence": 0.75, "description": "Yellow-brown tint detected"}
        
        return {"detected": "Unknown", "confidence": 0.4, "description": "No specific pattern detected"}
    except Exception:
        return {"detected": "Unknown", "confidence": 0.3, "description": "Unable to analyze image"}
