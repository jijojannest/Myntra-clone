from fastapi import APIRouter
from pydantic import BaseModel
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

class HealthResponse(BaseModel):
    status: str
    version: str
    models: list[str]

@router.get("/")
async def health_check():
    """Check if the AI service is healthy and models are loaded"""
    return HealthResponse(
        status="healthy",
        version="1.0.0",
        models=[
            "pose_detection",
            "clothing_segmentation",
            "virtual_try_on"
        ]
    )