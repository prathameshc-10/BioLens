"""
BioBERT Service
Medical entity extraction and symptom analysis service
"""

from fastapi import FastAPI
from fastapi.responses import JSONResponse
import uvicorn
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Create FastAPI application
app = FastAPI(
    title="BioBERT Service",
    description="Medical entity extraction and symptom analysis using BioBERT",
    version="0.1.0"
)

@app.get("/")
async def root():
    """Root endpoint for health check"""
    return {"message": "BioBERT Service is running", "version": "0.1.0"}

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "biobert-service",
        "version": "0.1.0",
        "model_loaded": False  # Will be updated when model is loaded
    }

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler for unhandled errors"""
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "message": "An unexpected error occurred in BioBERT service"
        }
    )

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8001,
        reload=True,
        log_level="info"
    )