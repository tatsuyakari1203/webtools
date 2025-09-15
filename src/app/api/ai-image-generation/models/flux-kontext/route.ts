import { NextRequest, NextResponse } from 'next/server';

export interface FluxKontextRequest {
  prompt: string;
  image_url: string;
  aspect_ratio?: string;
  num_images?: number;
  output_format?: 'jpeg' | 'png';
  sync_mode?: boolean;
  safety_tolerance?: string;
  guidance_scale?: number;
  seed?: number;
  enhance_prompt?: boolean;
}

export interface FluxKontextResponse {
  images: Array<{
    url: string;
    width?: number;
    height?: number;
  }>;
  prompt: string;
  seed: number;
  has_nsfw_concepts: boolean[];
  timings: Record<string, number>;
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

    const body: FluxKontextRequest = await request.json();
    
    // Validate required fields
    if (!body.prompt || !body.image_url) {
      return NextResponse.json(
        { error: 'Missing required fields: prompt and image_url are required' },
        { status: 400 }
      );
    }

    // Prepare the request payload
    const payload: FluxKontextRequest = {
      prompt: body.prompt,
      image_url: body.image_url,
      aspect_ratio: body.aspect_ratio || '1:1',
      num_images: body.num_images || 1,
      output_format: body.output_format || 'jpeg',
      sync_mode: body.sync_mode || false,
      safety_tolerance: body.safety_tolerance || '2',
      guidance_scale: body.guidance_scale || 3.5,
      seed: body.seed,
      enhance_prompt: body.enhance_prompt || false
    };

    // Make request to FAL API
    const response = await fetch('https://queue.fal.run/fal-ai/flux-pro/kontext', {
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
        { error: 'Failed to process image generation request' },
        { status: response.status }
      );
    }

    // For flux-kontext, we need to handle the queue response
    const queueResponse = await response.json();
    
    // If sync_mode is false, return the queue response directly
    if (!body.sync_mode) {
      return NextResponse.json(queueResponse);
    }
    
    // If sync_mode is true, we need to poll for the result
    const requestId = queueResponse.request_id;
    if (!requestId) {
      return NextResponse.json(
        { error: 'No request ID returned from API' },
        { status: 500 }
      );
    }
    
    // Poll for the result (simplified implementation)
    let result = null;
    let attempts = 0;
    const maxAttempts = 30; // 30 attempts with 2s delay = max 1 minute wait
    
    while (attempts < maxAttempts) {
      attempts++;
      
      // Wait 2 seconds between polls
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const resultResponse = await fetch(`https://queue.fal.run/fal-ai/flux-pro/kontext/requests/${requestId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Key ${falApiKey}`,
        },
      });
      
      if (resultResponse.ok) {
        result = await resultResponse.json();
        break;
      }
      
      // If we get a 404, the result is not ready yet
      if (resultResponse.status !== 404) {
        const errorText = await resultResponse.text();
        console.error('FAL API Error:', errorText);
        return NextResponse.json(
          { error: 'Failed to retrieve image generation result' },
          { status: resultResponse.status }
        );
      }
    }
    
    if (!result) {
      return NextResponse.json(
        { error: 'Timed out waiting for image generation result' },
        { status: 504 }
      );
    }
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Flux Kontext API Error:', error);
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