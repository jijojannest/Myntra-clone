from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import uvicorn
import os
from dotenv import load_dotenv
import logging

from app.routers import clothing, pose, virtual_try_on, health
from utils.config import get_settings

# Load environment variables
load_dotenv()

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting AI Virtual Try-On Service")
    logger.info(f"OpenCV version: available")
    logger.info(f"MediaPipe version: available")

    yield

    # Shutdown
    logger.info("Shutting down AI Virtual Try-On Service")

# Create FastAPI app
app = FastAPI(
    title="Myntra Clone AI Service",
    description="AI-powered virtual try-on and image processing service",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, prefix="/health", tags=["Health"])
app.include_router(clothing.router, prefix="/clothing", tags=["Clothing Processing"])
app.include_router(pose.router, prefix="/pose", tags=["Pose Detection"])
app.include_router(virtual_try_on.router, prefix="/virtual-try-on", tags=["Virtual Try-On"])

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "Myntra Clone AI Service",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "health": "/health",
            "clothing": "/clothing",
            "pose": "/pose",
            "virtual-try-on": "/virtual-try-on"
        }
    }

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"Unhandled exception: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": "Internal server error",
            "detail": str(exc)
        }
    )

# HTTP exception handler
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": exc.detail,
            "status_code": exc.status_code
        }
    )

if __name__ == "__main__":
    settings = get_settings()

    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level="info"
    )