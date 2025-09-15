import { NextRequest, NextResponse } from 'next/server';

// Redirect to new API structure
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Add model parameter for the new API
    const newBody = {
      ...body,
      model: 'seedream'
    };
    
    // Forward the request to the new API endpoint
    const response = await fetch(new URL('/api/ai-image-generation/enhance-prompt', request.url).toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', errorText);
      return NextResponse.json(
        { success: false, error: 'Failed to process request' },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}