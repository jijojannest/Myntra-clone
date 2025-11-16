import os
from pydantic import BaseSettings

class Settings(BaseSettings):
    # API Settings
    HOST: str = "0.0.0.0"
    PORT: int = int(os.getenv("PORT", 8000))
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"

    # Redis Settings
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379")

    # File Upload Settings
    MAX_FILE_SIZE: int = int(os.getenv("MAX_FILE_SIZE", "10485760"))  # 10MB
    ALLOWED_EXTENSIONS: set = {".jpg", ".jpeg", ".png", ".webp"}

    # AI Model Settings
    POSE_MODEL_COMPLEXITY: int = int(os.getenv("POSE_MODEL_COMPLEXITY", "1"))
    POSE_DETECTION_CONFIDENCE: float = float(os.getenv("POSE_DETECTION_CONFIDENCE", "0.5"))
    CLOTHING_SEGMENTATION_CONFIDENCE: float = float(os.getenv("CLOTHING_SEGMENTATION_CONFIDENCE", "0.5"))

    class Config:
        env_file = ".env"

def get_settings() -> Settings:
    return Settings()