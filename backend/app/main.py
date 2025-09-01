from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel
from typing import Optional, List
import os
from dotenv import load_dotenv
import logging
from loguru import logger
from PIL import Image
import io
import time
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from services.gemini_service import GeminiImageService
from .middleware import (
    error_handling_middleware,
    rate_limit_middleware,
    GeminiServiceError,
    ImageProcessingError,
    ValidationError,
    gemini_service_exception_handler,
    image_processing_exception_handler,
    validation_exception_handler
)

# Load environment variables
# Load .env from root directory
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), '.env'))

# Configure logging
logger.add(
    "logs/nanobanana.log",
    rotation="10 MB",
    retention="7 days",
    level=os.getenv("LOG_LEVEL", "INFO")
)

# Initialize Gemini service
try:
    gemini_service = GeminiImageService()
    logger.info("GeminiImageService initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize GeminiImageService: {str(e)}")
    gemini_service = None

app = FastAPI(
    title="NanoBanana API",
    description="AI-powered image generation and editing using Gemini",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add custom exception handlers
app.add_exception_handler(GeminiServiceError, gemini_service_exception_handler)
app.add_exception_handler(ImageProcessingError, image_processing_exception_handler)
app.add_exception_handler(ValidationError, validation_exception_handler)

# CORS removed - backend only accessible internally from Next.js server
# No need for CORS since backend is not exposed to browsers directly

# Request/Response models
class TextToImageRequest(BaseModel):
    prompt: str
    width: Optional[int] = 1024
    height: Optional[int] = 1024
    style: Optional[str] = None
    quality: Optional[str] = "standard"
    stream: Optional[bool] = False

class ImageEditRequest(BaseModel):
    prompt: str
    edit_instruction: str
    style: Optional[str] = None
    quality: Optional[str] = "standard"

class MultiImageComposeRequest(BaseModel):
    prompt: str
    composition_type: str = "combine"  # combine, overlay, blend
    style: Optional[str] = None
    quality: Optional[str] = "standard"

class StyleTransferRequest(BaseModel):
    prompt: str
    intensity: float = 0.7  # 0.0 to 1.0
    quality: Optional[str] = "standard"

class ConversationRequest(BaseModel):
    prompt: str
    conversation_id: Optional[str] = None
    previous_image_data: Optional[str] = None  # Base64 encoded
    edit_instruction: str
    style: Optional[str] = None
    quality: Optional[str] = "standard"

class ImageResponse(BaseModel):
    success: bool
    image_url: Optional[str] = None
    image_data: Optional[str] = None  # Base64 encoded
    message: Optional[str] = None
    error: Optional[str] = None
    conversation_id: Optional[str] = None

class HealthResponse(BaseModel):
    status: str
    version: str
    gemini_available: bool

# Health check endpoint
@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint to verify API status and Gemini availability"""
    try:
        gemini_available = False
        if gemini_service:
            health_result = await gemini_service.health_check()
            gemini_available = health_result.get("success", False)
        
        status = "healthy" if gemini_available else "degraded"
        
        return HealthResponse(
            status=status,
            version="1.0.0",
            gemini_available=gemini_available
        )
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return HealthResponse(
            status="unhealthy",
            version="1.0.0",
            gemini_available=False
        )

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "NanoBanana API - AI Image Generation and Editing",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }

# Text-to-Image endpoint
@app.post("/api/generate")
async def generate_image(request: TextToImageRequest):
    """Generate image from text prompt"""
    try:
        if not gemini_service:
            raise HTTPException(
                status_code=503,
                detail="Gemini service is not available"
            )
        
        # Validate prompt length
        max_prompt_length = int(os.getenv("MAX_PROMPT_LENGTH", "2000"))
        if len(request.prompt) > max_prompt_length:
            raise ValidationError(
                f"Prompt too long. Maximum length is {max_prompt_length} characters"
            )
        
        logger.info(f"Text-to-image request: {request.prompt[:100]}... (streaming: {request.stream})")
        
        # Check if streaming is requested
        if request.stream:
            # Return streaming response
            async def generate_stream():
                import json
                
                # Send initial status
                yield f"data: {json.dumps({'status': 'starting', 'message': 'Initializing image generation...'})}\n\n"
                
                try:
                    # Generate image using Gemini service
                    result = await gemini_service.generate_image_from_text(
                        prompt=request.prompt,
                        width=request.width,
                        height=request.height,
                        style=request.style,
                        quality=request.quality
                    )
                    
                    if result["success"]:
                        # Send success response with image data
                        response_data = {
                            'status': 'completed',
                            'success': True,
                            'image_data': result["image_data"],
                            'message': result["message"]
                        }
                        yield f"data: {json.dumps(response_data)}\n\n"
                    else:
                        # Send error response
                        response_data = {
                            'status': 'error',
                            'success': False,
                            'error': result["error"],
                            'message': result["message"]
                        }
                        yield f"data: {json.dumps(response_data)}\n\n"
                        
                except Exception as e:
                    # Send error response
                    response_data = {
                        'status': 'error',
                        'success': False,
                        'error': str(e),
                        'message': 'Image generation failed'
                    }
                    yield f"data: {json.dumps(response_data)}\n\n"
                
                # Send end signal
                yield "data: [DONE]\n\n"
            
            return StreamingResponse(
                generate_stream(),
                media_type="text/event-stream",
                headers={
                    "Cache-Control": "no-cache",
                    "Connection": "keep-alive",
                    "X-Accel-Buffering": "no"
                }
            )
        
        # Non-streaming response (original behavior)
        result = await gemini_service.generate_image_from_text(
            prompt=request.prompt,
            width=request.width,
            height=request.height,
            style=request.style,
            quality=request.quality
        )
        
        if result["success"]:
            return ImageResponse(
                success=True,
                image_data=result["image_data"],
                message=result["message"]
            )
        else:
            return ImageResponse(
                success=False,
                error=result["error"],
                message=result["message"]
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Text-to-image generation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Image editing endpoint
@app.post("/api/edit", response_model=ImageResponse)
async def edit_image(
    image: UploadFile = File(...),
    prompt: Optional[str] = Form(None),
    edit_instruction: str = Form(...),
    style: Optional[str] = Form(None),
    quality: Optional[str] = Form("standard")
):
    """Edit image based on text instructions"""
    try:
        if not gemini_service:
            raise HTTPException(
                status_code=503,
                detail="Gemini service is not available"
            )
        
        # Validate file type
        if not image.content_type or not image.content_type.startswith("image/"):
            raise ValidationError(
                "Invalid file type. Please upload an image file"
            )
        
        # Validate prompt length
        max_prompt_length = int(os.getenv("MAX_PROMPT_LENGTH", "2000"))
        if len(edit_instruction) > max_prompt_length:
            raise ValidationError(
                f"Edit instruction too long. Maximum length is {max_prompt_length} characters"
            )
        
        prompt_display = prompt[:50] if prompt else "No description"
        logger.info(f"Image edit request: {prompt_display}... - {edit_instruction[:50]}...")
        
        # Read and process uploaded image
        try:
            image_bytes = await image.read()
            pil_image = Image.open(io.BytesIO(image_bytes))
        except Exception as e:
            raise ImageProcessingError(f"Failed to process uploaded image: {str(e)}")
        
        # Validate image size
        max_size = int(os.getenv("MAX_IMAGE_SIZE", "2048"))
        if pil_image.width > max_size or pil_image.height > max_size:
            # Resize image while maintaining aspect ratio
            pil_image.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
            logger.info(f"Image resized to {pil_image.width}x{pil_image.height}")
        
        # Edit image using Gemini service
        result = await gemini_service.edit_image(
            image=pil_image,
            prompt=prompt or "",
            edit_instruction=edit_instruction,
            style=style,
            quality=quality
        )
        
        if result["success"]:
            return ImageResponse(
                success=True,
                image_data=result["image_data"],
                message=result["message"]
            )
        else:
            return ImageResponse(
                success=False,
                error=result["error"],
                message=result["message"]
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Image editing failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Multi-image composition endpoint
@app.post("/api/compose", response_model=ImageResponse)
async def compose_images(
    images: List[UploadFile] = File(...),
    prompt: str = Form(...),
    composition_type: str = Form("combine"),
    style: Optional[str] = Form(None),
    quality: Optional[str] = Form("standard")
):
    """Compose multiple images into a new image"""
    try:
        if not gemini_service:
            raise HTTPException(
                status_code=503,
                detail="Gemini service is not available"
            )
        
        # Validate number of images
        if len(images) > 3:
            raise ValidationError(
                "Maximum 3 images supported for composition"
            )
        
        if len(images) < 2:
            raise ValidationError(
                "At least 2 images required for composition"
            )
        
        # Validate prompt length
        max_prompt_length = int(os.getenv("MAX_PROMPT_LENGTH", "2000"))
        if len(prompt) > max_prompt_length:
            raise ValidationError(
                f"Prompt too long. Maximum length is {max_prompt_length} characters"
            )
        
        logger.info(f"Multi-image composition request: {len(images)} images, {prompt[:50]}...")
        
        # Process uploaded images
        pil_images = []
        for image in images:
            # Validate file type
            if not image.content_type or not image.content_type.startswith("image/"):
                raise ValidationError(
                    f"Invalid file type for {image.filename}. Please upload image files only"
                )
            
            try:
                image_bytes = await image.read()
                pil_image = Image.open(io.BytesIO(image_bytes))
                
                # Validate and resize image if needed
                max_size = int(os.getenv("MAX_IMAGE_SIZE", "2048"))
                if pil_image.width > max_size or pil_image.height > max_size:
                    pil_image.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
                    logger.info(f"Image {image.filename} resized to {pil_image.width}x{pil_image.height}")
                
                pil_images.append(pil_image)
                
            except Exception as e:
                raise ImageProcessingError(f"Failed to process image {image.filename}: {str(e)}")
        
        # Compose images using Gemini service
        result = await gemini_service.compose_images(
            images=pil_images,
            prompt=prompt,
            composition_type=composition_type,
            style=style,
            quality=quality
        )
        
        if result["success"]:
            return ImageResponse(
                success=True,
                image_data=result["image_data"],
                message=result["message"]
            )
        else:
            return ImageResponse(
                success=False,
                error=result["error"],
                message=result["message"]
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Multi-image composition failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Style transfer endpoint
@app.post("/api/style-transfer", response_model=ImageResponse)
async def transfer_style(
    content_image: UploadFile = File(...),
    style_image: UploadFile = File(...),
    prompt: str = Form(...),
    intensity: float = Form(0.7),
    quality: Optional[str] = Form("standard")
):
    """Transfer style from one image to another"""
    try:
        if not gemini_service:
            raise HTTPException(
                status_code=503,
                detail="Gemini service is not available"
            )
        
        # Validate file types
        for image, name in [(content_image, "content"), (style_image, "style")]:
            if not image.content_type or not image.content_type.startswith("image/"):
                raise ValidationError(
                    f"Invalid file type for {name} image. Please upload an image file"
                )
        
        # Validate prompt length
        max_prompt_length = int(os.getenv("MAX_PROMPT_LENGTH", "2000"))
        if len(prompt) > max_prompt_length:
            raise ValidationError(
                f"Prompt too long. Maximum length is {max_prompt_length} characters"
            )
        
        # Validate intensity
        if not 0.0 <= intensity <= 1.0:
            raise ValidationError(
                "Intensity must be between 0.0 and 1.0"
            )
        
        logger.info(f"Style transfer request: {prompt[:50]}..., intensity: {intensity}")
        
        # Process uploaded images
        try:
            content_bytes = await content_image.read()
            content_pil = Image.open(io.BytesIO(content_bytes))
            
            style_bytes = await style_image.read()
            style_pil = Image.open(io.BytesIO(style_bytes))
            
            # Validate and resize images if needed
            max_size = int(os.getenv("MAX_IMAGE_SIZE", "2048"))
            for pil_image, name in [(content_pil, "content"), (style_pil, "style")]:
                if pil_image.width > max_size or pil_image.height > max_size:
                    pil_image.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
                    logger.info(f"{name} image resized to {pil_image.width}x{pil_image.height}")
            
        except Exception as e:
            raise ImageProcessingError(f"Failed to process uploaded images: {str(e)}")
        
        # Transfer style using Gemini service
        result = await gemini_service.transfer_style(
            content_image=content_pil,
            style_image=style_pil,
            prompt=prompt,
            intensity=intensity,
            quality=quality
        )
        
        if result["success"]:
            return ImageResponse(
                success=True,
                image_data=result["image_data"],
                message=result["message"]
            )
        else:
            return ImageResponse(
                success=False,
                error=result["error"],
                message=result["message"]
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Style transfer failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Conversational image editing endpoint
@app.post("/api/conversation", response_model=ImageResponse)
async def conversation_edit(
    request: ConversationRequest
):
    """Iterative image editing through conversation"""
    try:
        if not gemini_service:
            raise HTTPException(
                status_code=503,
                detail="Gemini service is not available"
            )
        
        # Validate prompt length
        max_prompt_length = int(os.getenv("MAX_PROMPT_LENGTH", "2000"))
        if len(request.edit_instruction) > max_prompt_length:
            raise ValidationError(
                f"Edit instruction too long. Maximum length is {max_prompt_length} characters"
            )
        
        # Generate conversation ID if not provided
        conversation_id = request.conversation_id or f"conv_{int(time.time())}_{os.urandom(4).hex()}"
        
        logger.info(f"Conversation edit request: {conversation_id}, {request.edit_instruction[:50]}...")
        
        # Process previous image if provided
        pil_image = None
        if request.previous_image_data:
            try:
                pil_image = gemini_service._decode_base64_to_image(request.previous_image_data)
            except Exception as e:
                raise ImageProcessingError(f"Failed to decode previous image: {str(e)}")
        
        # Create enhanced prompt for conversation context
        enhanced_prompt = f"{request.prompt}. {request.edit_instruction}"
        if request.conversation_id:
            enhanced_prompt = f"Continue the previous conversation. {enhanced_prompt}"
        
        # Edit image using Gemini service
        if pil_image:
            result = await gemini_service.edit_image(
                image=pil_image,
                prompt=enhanced_prompt,
                edit_instruction=request.edit_instruction,
                style=request.style,
                quality=request.quality
            )
        else:
            # Generate new image if no previous image
            result = await gemini_service.generate_image_from_text(
                prompt=enhanced_prompt,
                style=request.style,
                quality=request.quality
            )
        
        if result["success"]:
            return ImageResponse(
                success=True,
                image_data=result["image_data"],
                message=result["message"],
                conversation_id=conversation_id
            )
        else:
            return ImageResponse(
                success=False,
                error=result["error"],
                message=result["message"],
                conversation_id=conversation_id
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Conversation edit failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    
    host = os.getenv("BACKEND_HOST", "0.0.0.0")
    port = int(os.getenv("BACKEND_PORT", 7777))
    debug = os.getenv("DEBUG", "True").lower() == "true"
    
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=debug,
        log_level="info"
    )