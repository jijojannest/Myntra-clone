from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from typing import Optional, List
import logging
import base64
import cv2
import numpy as np
from services.clothing_processing import ClothingProcessingService

logger = logging.getLogger(__name__)

router = APIRouter()

class ClothingProcessRequest(BaseModel):
    product_image: str  # Base64 encoded image
    remove_background: bool = True
    extract_clothing: bool = True

class Point(BaseModel):
    x: float
    y: float
    type: str

class ClothingProcessResponse(BaseModel):
    success: bool
    data: Optional[dict] = None
    error: Optional[str] = None

class KeyPoint(BaseModel):
    x: float
    y: float
    type: str

class ClothingSegmentation(BaseModel):
    processed_image: str  # Base64
    mask: str  # Base64
    keypoints: List[KeyPoint]

@router.post("/process-clothing", response_model=ClothingProcessResponse)
async def process_clothing(request: ClothingProcessRequest):
    """Process clothing image for virtual try-on"""
    try:
        # Initialize clothing processing service
        clothing_service = ClothingProcessingService()

        # Decode base64 image
        image_bytes = base64.b64decode(request.product_image)
        nparr = np.frombuffer(image_bytes, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if image is None:
            raise HTTPException(status_code=400, detail="Invalid image data")

        # Process clothing image
        result = await clothing_service.process_clothing_image(
            image=image,
            remove_background=request.remove_background,
            extract_clothing=request.extract_clothing
        )

        return ClothingProcessResponse(
            success=True,
            data={
                "processed_image": result["processed_image"],
                "mask": result["mask"],
                "keypoints": result["keypoints"]
            }
        )

    except Exception as e:
        logger.error(f"Clothing processing error: {str(e)}")
        return ClothingProcessResponse(
            success=False,
            error=f"Clothing processing failed: {str(e)}"
        )

@router.post("/batch-process", response_model=ClothingProcessResponse)
async def batch_process(
    images: List[UploadFile] = File(...),
    remove_background: bool = Form(True),
    extract_clothing: bool = Form(True)
):
    """Process multiple clothing images"""
    try:
        clothing_service = ClothingProcessingService()
        results = []

        for image_file in images:
            # Read uploaded file
            contents = await image_file.read()
            nparr = np.frombuffer(contents, np.uint8)
            image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

            if image is not None:
                result = await clothing_service.process_clothing_image(
                    image=image,
                    remove_background=remove_background,
                    extract_clothing=extract_clothing
                )
                results.append(result)

        return ClothingProcessResponse(
            success=True,
            data={"processed_images": results}
        )

    except Exception as e:
        logger.error(f"Batch processing error: {str(e)}")
        return ClothingProcessResponse(
            success=False,
            error=f"Batch processing failed: {str(e)}"
        )