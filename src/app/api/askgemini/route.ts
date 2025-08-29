import { NextRequest, NextResponse } from 'next/server';
import { AskGeminiRequest, AskGeminiHealthResponse, validateAskGeminiRequest } from './types';
import { GeminiService } from './gemini.service';
import { checkRateLimit } from './rate-limiter';

export const dynamic = 'force-dynamic';

// Khởi tạo Gemini service
let geminiService: GeminiService | null = null;

function getGeminiService(): GeminiService {
  if (!geminiService) {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      throw new Error('Google API key không được cấu hình');
    }
    geminiService = new GeminiService(apiKey);
  }
  return geminiService;
}

/**
 * Tạo CORS headers
 */
function setCorsHeaders(response: NextResponse, origin: string | null): void {
  if (origin) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }
}

/**
 * Tạo error response với CORS headers
 */
function createErrorResponse(
  error: string, 
  status: number, 
  origin: string | null
): NextResponse {
  const response = NextResponse.json(
    { success: false, error },
    { status }
  );
  setCorsHeaders(response, origin);
  return response;
}

export async function POST(request: NextRequest) {
  const requestId = Math.random().toString(36).substr(2, 9);
  console.log(`[AskGemini-${requestId}] Starting request`);
  
  // Lấy origin để set CORS headers
  const origin = request.headers.get('origin');
  
  try {
    // Kiểm tra rate limit
    const rateLimitResult = checkRateLimit(request);
    if (!rateLimitResult.allowed) {
      console.warn(`[AskGemini-${requestId}] Rate limit exceeded`);
      const response = createErrorResponse(
        `Rate limit exceeded. Try again in ${rateLimitResult.retryAfter} seconds.`,
        429,
        origin
      );
      response.headers.set('Retry-After', rateLimitResult.retryAfter?.toString() || '60');
      response.headers.set('X-RateLimit-Limit', '100');
      response.headers.set('X-RateLimit-Remaining', '0');
      response.headers.set('X-RateLimit-Reset', new Date(rateLimitResult.resetTime).toISOString());
      return response;
    }

    // Parse và validate request body
    console.log(`[AskGemini-${requestId}] Parsing request body`);
    const body: AskGeminiRequest = await request.json();
    
    // Validate request
    const validation = validateAskGeminiRequest(body);
    if (!validation.isValid) {
      console.error(`[AskGemini-${requestId}] Validation failed:`, validation.errors);
      return createErrorResponse(
        `Validation failed: ${validation.errors.join(', ')}`,
        400,
        origin
      );
    }

    console.log(`[AskGemini-${requestId}] Request parameters:`, {
      promptLength: body.prompt?.length || 0,
      hasContext: !!body.context,
      type: body.type,
      stream: body.stream,
      maxTokens: body.maxTokens,
      temperature: body.temperature
    });

    // Lấy Gemini service
    const service = getGeminiService();
    
    // Lấy thông tin model sẽ được sử dụng
    const modelInfo = service.getModelInfo(body.type);
    console.log(`[AskGemini-${requestId}] Using model: ${modelInfo.name}`);

    const startTime = Date.now();
    console.log(`[AskGemini-${requestId}] Starting Gemini processing at ${new Date(startTime).toISOString()}`);

    // Kiểm tra nếu client yêu cầu streaming
    if (body.stream) {
      console.log(`[AskGemini-${requestId}] Streaming response requested`);
      
      try {
        const stream = await service.generateContentStream(body);
        
        // Tạo response với streaming
        const response = new Response(stream, {
          status: 200,
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'X-Model-Used': modelInfo.name,
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString()
          }
        });
        
        // Set CORS headers cho streaming response
        if (origin) {
          response.headers.set('Access-Control-Allow-Origin', origin);
          response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
          response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        }
        
        console.log(`[AskGemini-${requestId}] Streaming response initiated`);
        return response;
      } catch (error) {
        console.error(`[AskGemini-${requestId}] Streaming error:`, error);
        return createErrorResponse(
          error instanceof Error ? error.message : 'Streaming error occurred',
          500,
          origin
        );
      }
    }

    // Non-streaming response
    try {
      const result = await service.generateContent(body);
      
      const processingTime = Date.now() - startTime;
      console.log(`[AskGemini-${requestId}] Processing completed:`, {
        success: result.success,
        responseLength: result.response?.length || 0,
        processingTimeMs: processingTime,
        model: result.model
      });

      // Tạo response với CORS headers và rate limit info
      const response = NextResponse.json({
        ...result,
        model: modelInfo.name
      });
      
      setCorsHeaders(response, origin);
      response.headers.set('X-Model-Used', modelInfo.name);
      response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
      response.headers.set('X-RateLimit-Reset', new Date(rateLimitResult.resetTime).toISOString());
      
      return response;
    } catch (error) {
      console.error(`[AskGemini-${requestId}] Processing error:`, error);
      
      return createErrorResponse(
        error instanceof Error ? error.message : 'Internal server error',
        500,
        origin
      );
    }
  } catch (error) {
    console.error(`[AskGemini-${requestId}] Request error:`, error);
    
    // Xử lý lỗi đặc biệt
    if (error instanceof Error && error.message.includes('Google API key')) {
      return createErrorResponse('Google API key không được cấu hình', 500, origin);
    }
    
    return createErrorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      500,
      origin
    );
  }
}

export async function GET() {
  const requestId = Math.random().toString(36).substr(2, 9);
  console.log(`[AskGemini-${requestId}] Health check request`);
  
  try {
    // Kiểm tra API key
    if (!process.env.GOOGLE_API_KEY) {
      const response: AskGeminiHealthResponse = {
        status: 'error',
        service: 'askGemini',
        timestamp: new Date().toISOString(),
        version: '2.0.0',
        description: 'AI-powered question answering service using Google Gemini',
        error: 'Google API key not configured'
      };
      return NextResponse.json(response, { status: 500 });
    }

    // Kiểm tra health của Gemini service
    const service = getGeminiService();
    const healthCheck = await service.healthCheck();
    
    if (healthCheck.healthy) {
      const response: AskGeminiHealthResponse = {
        status: 'healthy',
        service: 'askGemini',
        timestamp: new Date().toISOString(),
        version: '2.0.0',
        description: 'AI-powered question answering service using Google Gemini with advanced features'
      };
      console.log(`[AskGemini-${requestId}] Health check passed`);
      return NextResponse.json(response);
    } else {
      const response: AskGeminiHealthResponse = {
        status: 'error',
        service: 'askGemini',
        timestamp: new Date().toISOString(),
        version: '2.0.0',
        description: 'AI-powered question answering service using Google Gemini',
        error: healthCheck.message || 'Service unhealthy'
      };
      console.error(`[AskGemini-${requestId}] Health check failed:`, healthCheck.message);
      return NextResponse.json(response, { status: 500 });
    }
  } catch (error) {
    console.error(`[AskGemini-${requestId}] Health check error:`, error);
    const response: AskGeminiHealthResponse = {
      status: 'error',
      service: 'askGemini',
      timestamp: new Date().toISOString(),
      version: '2.0.0',
      description: 'AI-powered question answering service using Google Gemini',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
    return NextResponse.json(response, { status: 500 });
  }
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  
  const response = new NextResponse(null, { status: 200 });
  
  if (origin) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    response.headers.set('Access-Control-Max-Age', '86400'); // 24 hours
  }
  
  return response;
}