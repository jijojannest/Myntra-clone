from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import logging
import base64
import cv2
import numpy as np
from services.pose_detection import PoseDetectionService
from services.clothing_processing import ClothingProcessingService
from services.virtual_try_on import VirtualTryOnService

logger = logging.getLogger(__name__)

router = APIRouter()

class PoseData(BaseModel):
    landmarks: List[dict]
    bbox: dict

class VirtualTryOnRequest(BaseModel):
    pose_data: PoseData
    product_image: str  # Base64 encoded
    size: str
    color: str

class VirtualTryOnResponse(BaseModel):
    success: bool
    data: Optional[dict] = None
    error: Optional[str] = None

class SizeRecommendation(BaseModel):
    size: str
    fit: str
    confidence: float

class ClothingSizeRecommendation(BaseModel):
    recommended_size: str
    alternatives: List[SizeRecommendation]
    measurements: dict

@router.post("/generate-overlay", response_model=VirtualTryOnResponse)
async def generate_virtual_try_on(request: VirtualTryOnRequest):
    """Generate virtual try-on overlay"""
    try:
        # Initialize services
        pose_service = PoseDetectionService()
        clothing_service = ClothingProcessingService()
        try_on_service = VirtualTryOnService()

        # Process clothing image
        clothing_result = await clothing_service.process_clothing_image(
            image_data=request.product_image,
            remove_background=True,
            extract_clothing=True
        )

        # Generate virtual try-on
        result = await try_on_service.generate_overlay(
            pose_data=request.pose_data,
            processed_clothing=clothing_result,
            size=request.size,
            color=request.color
        )

        return VirtualTryOnResponse(
            success=True,
            data={
                "processed_image": result["overlay_image"],
                "confidence": result["confidence"],
                "recommendations": result.get("recommendations", {})
            }
        )

    except Exception as e:
        logger.error(f"Virtual try-on generation error: {str(e)}")
        return VirtualTryOnResponse(
            success=False,
            error=f"Virtual try-on failed: {str(e)}"
        )

@router.post("/size-recommendations", response_model=ClothingSizeRecommendation)
async def get_size_recommendations(
    height: float,
    weight: float,
    gender: str = "unspecified",
    brand: Optional[str] = None,
    category: Optional[str] = None
):
    """Get clothing size recommendations based on body measurements"""
    try:
        try_on_service = VirtualTryOnService()
        recommendations = await try_on_service.get_size_recommendations(
            height=height,
            weight=weight,
            gender=gender,
            brand=brand,
            category=category
        )

        return recommendations

    except Exception as e:
        logger.error(f"Size recommendation error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Size recommendation failed: {str(e)}"
        )

@router.post("/analyze-fit", response_model=VirtualTryOnResponse)
async def analyze_clothing_fit(
    user_image: str,  # Base64
    product_image: str,  # Base64
    size: str
):
    """Analyze how well clothing fits the user"""
    try:
        try_on_service = VirtualTryOnService()
        result = await try_on_service.analyze_fit(
            user_image=user_image,
            product_image=product_image,
            size=size
        )

        return VirtualTryOnResponse(
            success=True,
            data=result
        )

    except Exception as e:
        logger.error(f"Fit analysis error: {str(e)}")
        return VirtualTryOnResponse(
            success=False,
            error=f"Fit analysis failed: {str(e)}"
        )