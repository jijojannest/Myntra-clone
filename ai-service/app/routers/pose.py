from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import logging
import base64
import cv2
import numpy as np
from services.pose_detection import PoseDetectionService

logger = logging.getLogger(__name__)

router = APIRouter()

class Landmark(BaseModel):
    x: float
    y: float
    z: Optional[float] = None
    visibility: Optional[float] = None

class BoundingBox(BaseModel):
    x: float
    y: float
    width: float
    height: float

class PoseData(BaseModel):
    landmarks: List[Landmark]
    bbox: BoundingBox

class PoseDetectionRequest(BaseModel):
    image_data: str  # Base64 encoded image

class PoseDetectionResponse(BaseModel):
    success: bool
    data: Optional[PoseData] = None
    error: Optional[str] = None

@router.post("/detect", response_model=PoseDetectionResponse)
async def detect_pose(request: PoseDetectionRequest):
    """Detect human pose in image using MediaPipe"""
    try:
        # Initialize pose detection service
        pose_service = PoseDetectionService()

        # Decode base64 image
        image_bytes = base64.b64decode(request.image_data)
        nparr = np.frombuffer(image_bytes, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if image is None:
            raise HTTPException(status_code=400, detail="Invalid image data")

        # Detect pose
        pose_data = await pose_service.detect_pose(image)

        return PoseDetectionResponse(
            success=True,
            data=pose_data
        )

    except Exception as e:
        logger.error(f"Pose detection error: {str(e)}")
        return PoseDetectionResponse(
            success=False,
            error=f"Pose detection failed: {str(e)}"
        )