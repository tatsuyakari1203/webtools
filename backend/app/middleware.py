from fastapi import Request, Response, HTTPException
from fastapi.responses import JSONResponse
from typing import Callable
import time
import asyncio
from collections import defaultdict
from loguru import logger
import traceback

# Simple error handling without BaseHTTPMiddleware
async def error_handling_middleware(request: Request, call_next: Callable) -> Response:
    """Middleware để xử lý lỗi tập trung và ghi nhật ký"""
    start_time = time.time()
    
    # Log incoming request
    logger.info(f"Incoming request: {request.method} {request.url}")
    
    try:
        response = await call_next(request)
        
        # Log successful response
        process_time = time.time() - start_time
        logger.info(
            f"Request completed: {request.method} {request.url} - "
            f"Status: {response.status_code} - Time: {process_time:.3f}s"
        )
        
        return response
        
    except HTTPException as e:
        # Log HTTP exceptions
        process_time = time.time() - start_time
        logger.warning(
            f"HTTP Exception: {request.method} {request.url} - "
            f"Status: {e.status_code} - Detail: {e.detail} - Time: {process_time:.3f}s"
        )
        return JSONResponse(
            status_code=e.status_code,
            content={"error": e.detail, "status_code": e.status_code}
        )
        
    except Exception as e:
        # Log unexpected exceptions
        process_time = time.time() - start_time
        error_id = f"error_{int(time.time())}"
        logger.error(
            f"Unexpected error [{error_id}]: {request.method} {request.url} - "
            f"Error: {str(e)} - Time: {process_time:.3f}s\n{traceback.format_exc()}"
        )
        return JSONResponse(
            status_code=500,
            content={
                "error": "Internal server error",
                "error_id": error_id,
                "status_code": 500
            }
        )

# Rate limiting storage
rate_limit_storage = defaultdict(list)

async def rate_limit_middleware(request: Request, call_next: Callable, requests_per_minute: int = 100) -> Response:
    """Middleware để giới hạn tốc độ yêu cầu"""
    client_ip = request.client.host if request.client else "unknown"
    current_time = time.time()
    
    # Clean old requests (older than 1 minute)
    rate_limit_storage[client_ip] = [
        req_time for req_time in rate_limit_storage[client_ip]
        if current_time - req_time < 60
    ]
    
    # Check rate limit
    if len(rate_limit_storage[client_ip]) >= requests_per_minute:
        logger.warning(f"Rate limit exceeded for IP: {client_ip}")
        return JSONResponse(
            status_code=429,
            content={
                "error": "Rate limit exceeded",
                "status_code": 429,
                "retry_after": 60
            }
        )
    
    # Add current request
    rate_limit_storage[client_ip].append(current_time)
    
    return await call_next(request)

# Custom exception classes
class GeminiServiceError(Exception):
    """Exception raised when Gemini service encounters an error"""
    def __init__(self, message: str, status_code: int = 500):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)

class ImageProcessingError(Exception):
    """Exception raised when image processing fails"""
    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)

class ValidationError(Exception):
    """Exception raised when request validation fails"""
    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)

# Exception handlers
async def gemini_service_exception_handler(request: Request, exc: GeminiServiceError):
    """Handle Gemini service exceptions"""
    logger.error(f"Gemini service error: {exc.message}")
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": exc.message,
            "message": "Gemini service error",
            "status_code": exc.status_code
        }
    )

async def image_processing_exception_handler(request: Request, exc: ImageProcessingError):
    """Handle image processing exceptions"""
    logger.error(f"Image processing error: {exc.message}")
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": exc.message,
            "message": "Image processing error",
            "status_code": exc.status_code
        }
    )

async def validation_exception_handler(request: Request, exc: ValidationError):
    """Handle validation exceptions"""
    logger.warning(f"Validation error: {exc.message}")
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": exc.message,
            "message": "Validation error",
            "status_code": exc.status_code
        }
    )