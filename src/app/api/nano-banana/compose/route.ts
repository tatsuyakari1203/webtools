import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:7777'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    
    const response = await fetch(`${BACKEND_URL}/api/compose`, {
      method: 'POST',
      body: formData
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response from backend' }));
      return NextResponse.json(errorData, { status: response.status });
    }
    
    // Stream the response back to the client
    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });

  } catch (error) {
    console.error('Proxy error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to connect to backend' },
      { status: 500 }
    )
  }
}
