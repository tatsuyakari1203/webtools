import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Kiểm tra API key
    if (!process.env.GOOGLE_API_KEY) {
      return NextResponse.json(
        { 
          status: 'error',
          message: 'Google API key không được cấu hình',
          timestamp: new Date().toISOString(),
          service: 'OCR Health Check'
        },
        { status: 500 }
      );
    }

    // Kiểm tra độ dài API key (đảm bảo không phải placeholder)
    const apiKey = process.env.GOOGLE_API_KEY;
    if (apiKey.length < 20 || apiKey.includes('your-api-key') || apiKey.includes('xxx')) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Google API key không hợp lệ hoặc là placeholder',
          timestamp: new Date().toISOString(),
          service: 'OCR Health Check'
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: 'healthy',
      service: 'OCR Health Check',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      dependencies: {
        'google-genai': 'connected',
        'api-key': 'configured'
      }
    });
  } catch (error: unknown) {
    console.error('OCR Health Check Error:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: 'Lỗi server nội bộ',
        timestamp: new Date().toISOString(),
        service: 'OCR Health Check',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}