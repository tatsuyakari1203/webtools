import os
import base64
import io
from typing import Optional, Dict, Any, List
from PIL import Image
from google import genai
from google.genai import types
from loguru import logger
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class GeminiImageService:
    """Service class for handling Gemini AI image generation and editing"""
    
    def __init__(self):
        self.api_key = os.getenv("GOOGLE_API_KEY")
        if not self.api_key:
            raise ValueError("GOOGLE_API_KEY environment variable is required")
        
        # Initialize Gemini client
        self.client = genai.Client(api_key=self.api_key)
        
        # Model configuration
        self.model_name = os.getenv("DEFAULT_MODEL", "gemini-2.5-flash-image-preview")
        self.max_tokens = int(os.getenv("MAX_TOKENS", "1000"))
        self.temperature = float(os.getenv("TEMPERATURE", "0.7"))
        
        logger.info(f"GeminiImageService initialized with model: {self.model_name}")
    
    def _encode_image_to_base64(self, image: Image.Image, format: str = "PNG") -> str:
        """Convert PIL Image to base64 string"""
        buffer = io.BytesIO()
        image.save(buffer, format=format)
        image_bytes = buffer.getvalue()
        return base64.b64encode(image_bytes).decode('utf-8')
    
    def _decode_base64_to_image(self, base64_string: str) -> Image.Image:
        """Convert base64 string to PIL Image"""
        image_bytes = base64.b64decode(base64_string)
        return Image.open(io.BytesIO(image_bytes))
    
    async def generate_image_from_text(
        self,
        prompt: str,
        width: int = 1024,
        height: int = 1024,
        style: Optional[str] = None,
        quality: str = "standard"
    ) -> Dict[str, Any]:
        """Generate image from text prompt using Gemini"""
        try:
            # Enhance prompt with style and quality parameters
            enhanced_prompt = self._enhance_prompt_for_generation(
                prompt, width, height, style, quality
            )
            
            logger.info(f"Generating image with prompt: {enhanced_prompt[:100]}...")
            
            # Generate image using Gemini
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=enhanced_prompt,
                config={
                    'max_output_tokens': self.max_tokens,
                    'temperature': self.temperature,
                }
            )
            
            # Extract image from response
            if response.candidates and len(response.candidates) > 0:
                candidate = response.candidates[0]
                
                # Check if response contains image data
                if hasattr(candidate, 'content') and candidate.content.parts:
                    for part in candidate.content.parts:
                        if hasattr(part, 'inline_data') and part.inline_data:
                            # Extract image data and ensure it's base64 encoded
                            image_data = part.inline_data.data
                            if isinstance(image_data, bytes):
                                image_data = base64.b64encode(image_data).decode('utf-8')
                            mime_type = part.inline_data.mime_type
                            
                            return {
                                "success": True,
                                "image_data": image_data,
                                "mime_type": mime_type,
                                "message": "Image generated successfully"
                            }
            
            # If no image found in response, check text response
            if response.text:
                logger.warning(f"No image generated, text response: {response.text}")
                return {
                    "success": False,
                    "error": f"Failed to generate image: {response.text}",
                    "message": "Image generation failed"
                }
            
            return {
                "success": False,
                "error": "No image or text response received from Gemini",
                "message": "Image generation failed"
            }
            
        except Exception as e:
            logger.error(f"Image generation failed: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "message": "Image generation failed due to an error"
            }
    
    async def edit_image(
        self,
        image: Image.Image,
        prompt: str,
        edit_instruction: str,
        style: Optional[str] = None,
        quality: str = "standard"
    ) -> Dict[str, Any]:
        """Edit image based on text instructions using Gemini"""
        try:
            # Convert image to base64 for Gemini API
            image_base64 = self._encode_image_to_base64(image)
            
            # Create enhanced prompt for image editing
            enhanced_prompt = self._enhance_prompt_for_editing(
                prompt, edit_instruction, style, quality
            )
            
            logger.info(f"Editing image with instruction: {edit_instruction[:100]}...")
            
            # Prepare content with image and text using the new API
            contents = [
                types.Part.from_text(enhanced_prompt),
                types.Part.from_bytes(
                    data=base64.b64decode(image_base64),
                    mime_type="image/png"
                )
            ]
            
            # Generate edited image using Gemini
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=contents,
                config={
                    'max_output_tokens': self.max_tokens,
                    'temperature': self.temperature,
                }
            )
            
            # Extract edited image from response
            if response.candidates and len(response.candidates) > 0:
                candidate = response.candidates[0]
                
                # Check if response contains image data
                if hasattr(candidate, 'content') and candidate.content.parts:
                    for part in candidate.content.parts:
                        if hasattr(part, 'inline_data') and part.inline_data:
                            # Extract image data and ensure it's base64 encoded
                            image_data = part.inline_data.data
                            if isinstance(image_data, bytes):
                                image_data = base64.b64encode(image_data).decode('utf-8')
                            mime_type = part.inline_data.mime_type
                            
                            return {
                                "success": True,
                                "image_data": image_data,
                                "mime_type": mime_type,
                                "message": "Image edited successfully"
                            }
            
            # If no image found in response, check text response
            if response.text:
                logger.warning(f"No edited image generated, text response: {response.text}")
                
                # Check if it's a refusal or limitation from Gemini
                text_response = response.text.lower()
                if any(phrase in text_response for phrase in [
                    "không thể chỉnh sửa", "rất tiếc", "cannot edit", "unable to edit", 
                    "can't edit", "not able to edit", "cannot modify", "unable to modify"
                ]):
                    return {
                        "success": False,
                        "error": "AI_REFUSAL",
                        "message": "The AI cannot edit this image. Try creating a new image instead.",
                        "ai_response": response.text
                    }
                else:
                    return {
                        "success": False,
                        "error": f"Failed to edit image: {response.text}",
                        "message": "Image editing failed"
                    }
            
            return {
                "success": False,
                "error": "No image or text response received from Gemini",
                "message": "Image editing failed"
            }
            
        except Exception as e:
            logger.error(f"Image editing failed: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "message": "Image editing failed due to an error"
            }
    
    def _enhance_prompt_for_generation(
        self,
        prompt: str,
        width: int,
        height: int,
        style: Optional[str] = None,
        quality: str = "standard"
    ) -> str:
        """Enhance prompt for image generation with additional parameters and improved text rendering"""
        enhanced_prompt = f"Generate a high-quality image: {prompt}"
        
        # Add text rendering instructions if text is mentioned in prompt
        text_keywords = ['text', 'word', 'letter', 'sign', 'label', 'title', 'caption', 'writing', 'typography']
        if any(keyword in prompt.lower() for keyword in text_keywords):
            enhanced_prompt += " IMPORTANT: Render all text clearly and legibly with proper spelling, sharp edges, and high contrast. Text should be perfectly readable and well-formed with correct typography."
        
        # Add style information with detailed descriptions
        if style:
            if style.lower() == "anime":
                enhanced_prompt += " Style: Japanese anime/manga art style with large expressive eyes, vibrant colors, clean line art, cel-shaded appearance, and characteristic anime facial features and proportions."
            elif style.lower() == "photorealistic":
                enhanced_prompt += " Style: photorealistic, lifelike, natural lighting, realistic textures and materials."
            elif style.lower() == "artistic":
                enhanced_prompt += " Style: artistic, painterly, creative interpretation with artistic flair."
            elif style.lower() == "abstract":
                enhanced_prompt += " Style: abstract art with non-representational forms, bold colors, and creative composition."
            elif style.lower() == "modern":
                enhanced_prompt += " Style: modern contemporary art with clean lines, minimalist approach, and current design trends."
            elif style.lower() == "classical":
                enhanced_prompt += " Style: classical art with traditional techniques, refined composition, and timeless aesthetic."
            else:
                enhanced_prompt += f" Style: {style}."
        
        # Add quality and dimension hints
        if quality == "high":
            enhanced_prompt += " Create with exceptional detail and clarity."
        elif quality == "ultra":
            enhanced_prompt += " Ultra-high resolution, photorealistic, studio lighting, perfect composition."
        
        enhanced_prompt += f" Image dimensions should be {width}x{height} pixels."
        
        # Add best practices from nanobanana.md
        enhanced_prompt += " Ensure high fidelity, sharp details, and professional quality."
        
        return enhanced_prompt
    
    def _enhance_prompt_for_editing(
        self,
        prompt: str,
        edit_instruction: str,
        style: Optional[str] = None,
        quality: str = "standard"
    ) -> str:
        """Enhance prompt for image editing with additional parameters and improved text handling"""
        enhanced_prompt = f"Edit this image based on the following instruction: {edit_instruction}"
        
        if prompt:
            enhanced_prompt += f" Context: {prompt}."
        
        # Add text rendering instructions if text editing is mentioned
        text_keywords = ['text', 'word', 'letter', 'sign', 'label', 'title', 'caption', 'writing', 'typography', 'font']
        if any(keyword in edit_instruction.lower() or (prompt and keyword in prompt.lower()) for keyword in text_keywords):
            enhanced_prompt += " IMPORTANT: When editing or adding text, ensure all text is clearly readable, properly spelled, and has sharp, well-defined edges with high contrast."
        
        # Add style information with detailed descriptions
        if style:
            if style.lower() == "anime":
                enhanced_prompt += " Apply Japanese anime/manga art style with large expressive eyes, vibrant colors, clean line art, cel-shaded appearance, and characteristic anime facial features and proportions."
            elif style.lower() == "photorealistic":
                enhanced_prompt += " Apply photorealistic style with lifelike appearance, natural lighting, and realistic textures."
            elif style.lower() == "artistic":
                enhanced_prompt += " Apply artistic style with painterly effects and creative interpretation."
            elif style.lower() == "abstract":
                enhanced_prompt += " Apply abstract art style with non-representational forms and bold colors."
            elif style.lower() == "modern":
                enhanced_prompt += " Apply modern contemporary style with clean lines and minimalist approach."
            elif style.lower() == "classical":
                enhanced_prompt += " Apply classical art style with traditional techniques and refined composition."
            else:
                enhanced_prompt += f" Apply {style} style."
        
        # Add quality hints
        if quality == "high":
            enhanced_prompt += " Maintain exceptional detail and clarity in the edited result."
        
        # Add best practices from nanobanana.md
        enhanced_prompt += " Preserve the original image quality while making the requested changes. Ensure seamless integration of edits."
        
        return enhanced_prompt
    
    async def compose_images(
        self,
        images: List[Image.Image],
        prompt: str,
        composition_type: str = "combine",
        style: Optional[str] = None,
        quality: str = "standard"
    ) -> Dict[str, Any]:
        """Compose multiple images into a new image using Gemini"""
        try:
            if len(images) > 3:
                return {
                    "success": False,
                    "error": "Maximum 3 images supported for composition",
                    "message": "Too many input images"
                }
            
            # Enhance prompt for composition
            enhanced_prompt = self._enhance_prompt_for_composition(
                prompt, composition_type, style, quality
            )
            
            logger.info(f"Composing {len(images)} images with prompt: {enhanced_prompt[:100]}...")
            
            # Prepare content with multiple images
            contents = [enhanced_prompt] + images
            
            # Generate composed image using Gemini
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=contents,
                config={
                    'max_output_tokens': self.max_tokens,
                    'temperature': self.temperature,
                }
            )
            
            # Extract image from response
            if response.candidates and len(response.candidates) > 0:
                candidate = response.candidates[0]
                
                if hasattr(candidate, 'content') and candidate.content.parts:
                    for part in candidate.content.parts:
                        if hasattr(part, 'inline_data') and part.inline_data:
                            image_data = part.inline_data.data
                            if isinstance(image_data, bytes):
                                image_data = base64.b64encode(image_data).decode('utf-8')
                            
                            return {
                                "success": True,
                                "image_data": image_data,
                                "mime_type": part.inline_data.mime_type,
                                "message": "Images composed successfully"
                            }
            
            return {
                "success": False,
                "error": "No image generated in composition",
                "message": "Image composition failed"
            }
            
        except Exception as e:
            logger.error(f"Image composition failed: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "message": "Image composition failed"
            }
    
    async def transfer_style(
        self,
        content_image: Image.Image,
        style_image: Image.Image,
        prompt: str,
        intensity: float = 0.7,
        quality: str = "standard"
    ) -> Dict[str, Any]:
        """Transfer style from one image to another using Gemini"""
        try:
            # Enhance prompt for style transfer
            enhanced_prompt = self._enhance_prompt_for_style_transfer(
                prompt, intensity, quality
            )
            
            logger.info(f"Transferring style with prompt: {enhanced_prompt[:100]}...")
            
            # Prepare content with both images
            contents = [content_image, style_image, enhanced_prompt]
            
            # Generate style-transferred image using Gemini
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=contents,
                config={
                    'max_output_tokens': self.max_tokens,
                    'temperature': self.temperature,
                }
            )
            
            # Extract image from response
            if response.candidates and len(response.candidates) > 0:
                candidate = response.candidates[0]
                
                if hasattr(candidate, 'content') and candidate.content.parts:
                    for part in candidate.content.parts:
                        if hasattr(part, 'inline_data') and part.inline_data:
                            image_data = part.inline_data.data
                            if isinstance(image_data, bytes):
                                image_data = base64.b64encode(image_data).decode('utf-8')
                            
                            return {
                                "success": True,
                                "image_data": image_data,
                                "mime_type": part.inline_data.mime_type,
                                "message": "Style transferred successfully"
                            }
            
            return {
                "success": False,
                "error": "No image generated in style transfer",
                "message": "Style transfer failed"
            }
            
        except Exception as e:
            logger.error(f"Style transfer failed: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "message": "Style transfer failed"
            }
    
    def _enhance_prompt_for_composition(
        self,
        prompt: str,
        composition_type: str,
        style: Optional[str] = None,
        quality: str = "standard"
    ) -> str:
        """Enhance prompt for multi-image composition"""
        enhanced = f"Create a professional e-commerce fashion photo. Take the provided images and {prompt}. "
        
        if composition_type == "combine":
            enhanced += "Combine all elements from the provided images into a cohesive new scene. "
        elif composition_type == "overlay":
            enhanced += "Overlay elements from the images while maintaining realistic lighting and shadows. "
        elif composition_type == "blend":
            enhanced += "Seamlessly blend the images together creating a natural composition. "
        
        if style:
            enhanced += f"Apply {style} artistic style to the final composition. "
        
        if quality == "high":
            enhanced += "Generate in high resolution with exceptional detail and clarity. "
        
        enhanced += "Ensure realistic lighting, shadows, and perspective throughout the composition."
        
        return enhanced
    
    def _enhance_prompt_for_style_transfer(
        self,
        prompt: str,
        intensity: float,
        quality: str = "standard"
    ) -> str:
        """Enhance prompt for style transfer with detailed style guidance"""
        # Check if the prompt or style image suggests anime style
        anime_keywords = ['anime', 'manga', 'japanese animation', 'cel-shaded', 'cartoon']
        is_anime_style = any(keyword in prompt.lower() for keyword in anime_keywords)
        
        if is_anime_style:
            enhanced = f"Transform the ENTIRE content image into Japanese anime/manga art style using the style reference. {prompt}. "
            enhanced += "Apply anime characteristics to ALL elements: convert the entire scene including background, foreground, objects, and characters into anime style with large expressive eyes, vibrant colors, clean line art, cel-shaded appearance, smooth gradients, and characteristic anime facial features and proportions. "
        else:
            enhanced = f"Transform the ENTIRE content image using the artistic style from the style reference image. {prompt}. "
        
        if intensity < 0.3:
            enhanced += "Apply the style subtly, preserving most of the original content details and composition. "
        elif intensity > 0.7:
            enhanced += "Apply the style strongly, dramatically transforming the image with bold artistic interpretation while preserving the basic subject and composition. "
        else:
            enhanced += "Apply the style moderately, balancing artistic transformation with content preservation. "
        
        if quality == "high":
            enhanced += "Generate in high resolution with exceptional artistic detail and clarity. "
        
        if is_anime_style:
            enhanced += "Ensure the ENTIRE result has the distinctive anime/manga aesthetic with smooth shading, vibrant colors, and clean line work typical of Japanese animation. Transform every pixel, including background elements, lighting, shadows, and all objects into anime style."
        else:
            enhanced += "Preserve the original composition and subject matter, but render ALL elements including background, foreground, objects, lighting, and shadows with the artistic style, color palette, and visual characteristics from the style reference image."
        
        return enhanced
    
    async def health_check(self) -> Dict[str, Any]:
        """Check if Gemini service is available and working"""
        try:
            # Simple test generation
            test_prompt = "Generate a simple test image of a blue circle"
            
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=test_prompt,
                config={
                    'max_output_tokens': 100,
                    'temperature': 0.1
                }
            )
            
            return {
                "success": True,
                "message": "Gemini service is available",
                "model": self.model_name
            }
            
        except Exception as e:
            logger.error(f"Gemini health check failed: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "message": "Gemini service is not available"
            }