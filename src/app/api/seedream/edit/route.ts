import { NextRequest, NextResponse } from 'next/server';

interface SeedreamRequest {
  prompt: string;
  image_urls?: string[];
  images?: string[]; // Base64 encoded images
  image_size?: {
    width: number;
    height: number;
  };
  num_images?: number;
  seed?: number;
  sync_mode?: boolean;
}

interface SeedreamResponse {
  images: Array<{
    url: string;
  }>;
  seed: number;
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

    const body: SeedreamRequest = await request.json();
    
    // Validate required fields
    const images = body.images || body.image_urls || [];
    if (!body.prompt || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: prompt and images are required' },
        { status: 400 }
      );
    }

    // Validate images array length (max 10 according to API docs)
    if (images.length > 10) {
      return NextResponse.json(
        { error: 'Maximum 10 images allowed' },
        { status: 400 }
      );
    }

    // Prepare the request payload
    const payload: any = {
      prompt: body.prompt,
      image_size: body.image_size || { width: 1280, height: 1280 },
      num_images: body.num_images || 1,
      sync_mode: body.sync_mode || false,
      ...(body.seed && { seed: body.seed })
    };

    // Handle images - FAL API expects image_urls field
    if (body.images && body.images.length > 0) {
      // For base64 images, we need to convert them to data URLs
      payload.image_urls = body.images.map(base64 => {
        // Check if it's already a data URL
        if (base64.startsWith('data:')) {
          return base64;
        }
        // Convert base64 to data URL
        return `data:image/png;base64,${base64}`;
      });
    } else if (body.image_urls && body.image_urls.length > 0) {
      // If we have image URLs, use them directly
      payload.image_urls = body.image_urls;
    }

    // Make request to FAL API
    const response = await fetch('https://fal.run/fal-ai/bytedance/seedream/v4/edit', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${falApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('FAL API Error:', errorText);
      return NextResponse.json(
        { error: 'Failed to process image editing request' },
        { status: response.status }
      );
    }

    const result: SeedreamResponse = await response.json();
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Seedream API Error:', error);
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