import { NextRequest, NextResponse } from 'next/server';

export interface SeedVR2UpscaleRequest {
  image_url?: string;
  image?: string; // Base64 encoded image
  upscale_factor?: number;
  seed?: number;
}

export interface SeedVR2UpscaleResponse {
  image: {
    content_type: string;
    url: string;
  };
}

// Calculate optimal upscale factor to stay within 3840x2160 limit
function calculateOptimalUpscaleFactor(
  originalWidth: number, 
  originalHeight: number
): number {
  const maxWidth = 3840;
  const maxHeight = 2160;
  
  // Calculate maximum possible factor for each dimension (with decimal precision)
  const maxFactorWidth = maxWidth / originalWidth;
  const maxFactorHeight = maxHeight / originalHeight;
  
  // Use the smaller of the two to ensure both dimensions stay within limits
  const maxPossibleFactor = Math.min(maxFactorWidth, maxFactorHeight);
  
  // Use the maximum possible factor (optimal upscaling) instead of requested factor
  // This ensures we always get the best quality possible within limits
  const optimalFactor = Math.max(1, maxPossibleFactor);
  
  console.log(`Upscale calculation: ${originalWidth}x${originalHeight} -> max factor: ${optimalFactor.toFixed(2)}`);
  
  return Math.round(optimalFactor * 100) / 100;
}

// Extract dimensions from base64 image (simplified approach)
async function getImageDimensionsFromBase64(base64: string): Promise<{ width: number; height: number }> {
  try {
    // Remove data URL prefix if present
    const cleanBase64 = base64.replace(/^data:image\/[a-z]+;base64,/, '');
    
    // Convert base64 to buffer
    const buffer = Buffer.from(cleanBase64, 'base64');
    
    // Check if it's a PNG image (starts with PNG signature)
    if (buffer.length >= 24 && buffer.toString('hex', 0, 8) === '89504e470d0a1a0a') {
      // PNG format: width and height are at bytes 16-19 and 20-23
      const width = buffer.readUInt32BE(16);
      const height = buffer.readUInt32BE(20);
      return { width, height };
    }
    
    // Check if it's a JPEG image (starts with FFD8)
    if (buffer.length >= 4 && buffer[0] === 0xFF && buffer[1] === 0xD8) {
      // For JPEG, we need to parse the segments to find SOF
      let offset = 2;
      while (offset < buffer.length - 8) {
        if (buffer[offset] === 0xFF) {
          const marker = buffer[offset + 1];
          // SOF0, SOF1, SOF2 markers contain dimensions
          if (marker >= 0xC0 && marker <= 0xC3) {
            const height = buffer.readUInt16BE(offset + 5);
            const width = buffer.readUInt16BE(offset + 7);
            return { width, height };
          }
          // Skip this segment
          const segmentLength = buffer.readUInt16BE(offset + 2);
          offset += 2 + segmentLength;
        } else {
          offset++;
        }
      }
    }
    
    // If we can't determine dimensions, throw error
    throw new Error('Unable to determine image dimensions from base64 data');
    
  } catch (error) {
    console.error('Error getting image dimensions:', error);
    throw new Error('Failed to parse image dimensions');
  }
}

export async function POST(request: NextRequest) {
  try {
    const falApiKey = process.env.FAL_API_KEY;
    
    if (!falApiKey) {
      return NextResponse.json(
        { error: 'FAL API key not configured' },
        { status: 500 }
      );
    }

    const body: SeedVR2UpscaleRequest = await request.json();
    
    // Validate required fields
    if (!body.image_url && !body.image) {
      return NextResponse.json(
        { error: 'Either image_url or image (base64) is required' },
        { status: 400 }
      );
    }

    // Prepare the request payload
    const payload: {
      image_url: string;
      upscale_factor: number;
      seed?: number;
    } = {
      image_url: '',
      upscale_factor: 2,
      seed: body.seed
    };

    // Handle image input
    if (body.image) {
      // Convert base64 to data URL if needed
      const imageDataUrl = body.image.startsWith('data:') 
        ? body.image 
        : `data:image/png;base64,${body.image}`;
      
      payload.image_url = imageDataUrl;
      
      // Get image dimensions to calculate optimal upscale factor
      try {
        const dimensions = await getImageDimensionsFromBase64(body.image);
        const optimalFactor = calculateOptimalUpscaleFactor(
          dimensions.width, 
          dimensions.height
        );
        payload.upscale_factor = optimalFactor;
      } catch {
        console.warn('Could not determine image dimensions, using default factor');
        const conservativeFactor = Math.min(body.upscale_factor || 2, 4);
        payload.upscale_factor = Math.round(conservativeFactor * 100) / 100; // Conservative fallback with 2 decimal places
      }
    } else if (body.image_url) {
      payload.image_url = body.image_url;
      // For external URLs, we can't easily get dimensions, so use conservative approach
      const conservativeFactor = Math.min(body.upscale_factor || 2, 3);
      payload.upscale_factor = Math.round(conservativeFactor * 100) / 100;
    }

    // Ensure upscale factor is within valid range (1-10 according to API) and round to 2 decimal places
    const clampedFactor = Math.max(1, Math.min(10, payload.upscale_factor));
    payload.upscale_factor = Math.round(clampedFactor * 100) / 100;

    console.log('SeedVR2 Upscale Request:', {
      hasImage: !!payload.image_url,
      upscale_factor: payload.upscale_factor,
      seed: payload.seed
    });

    // Make request to FAL API
    const response = await fetch('https://fal.run/fal-ai/seedvr/upscale/image', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${falApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('SeedVR2 API Error:', errorText);
      return NextResponse.json(
        { error: 'Failed to process image upscaling request' },
        { status: response.status }
      );
    }

    const result: SeedVR2UpscaleResponse = await response.json();
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('SeedVR2 Upscale API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}