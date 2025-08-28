import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { OCRResponse } from '@/tools/ocr/types';

export const dynamic = 'force-dynamic';

// Khởi tạo Google GenAI client
const genAI = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY || '' });

// Hàm chuyển đổi file thành base64 tối ưu cho Node.js
async function fileToBase64(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return buffer.toString('base64');
}

// Hàm xác định MIME type từ file
function getMimeType(file: File): string {
  const extension = file.name.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'gif':
      return 'image/gif';
    case 'webp':
      return 'image/webp';
    case 'bmp':
      return 'image/bmp';
    default:
      return 'image/jpeg';
  }
}

// Hàm tạo prompt tối ưu cho OCR
function createPrompt(language: string, accuracy: string): string {
  // Chỉ thêm ngôn ngữ cụ thể nếu không phải auto
  const langHint = language !== 'auto' ? ` in ${language}` : '';
  
  // Prompt ngắn gọn và hiệu quả
  return `Extract all text from this image${langHint}. Return only the text, no explanations.`;
}

export async function POST(request: NextRequest) {
  const requestId = Math.random().toString(36).substr(2, 9);
  console.log(`[OCR-${requestId}] Starting OCR request`);
  
  try {
    // Kiểm tra API key
    if (!process.env.GOOGLE_API_KEY) {
      console.error(`[OCR-${requestId}] Google API key not configured`);
      return NextResponse.json(
        { error: 'Google API key không được cấu hình' },
        { status: 500 }
      );
    }

    // Parse form data
    console.log(`[OCR-${requestId}] Parsing form data`);
    const formData = await request.formData();
    const file = formData.get('image') as File;
    const language = (formData.get('language') as string) || 'auto';
    const accuracy = (formData.get('accuracy') as string) || 'balanced';

    console.log(`[OCR-${requestId}] Request parameters:`, {
      language,
      accuracy,
      hasFile: !!file
    });

    if (!file) {
      console.error(`[OCR-${requestId}] No image file found in request`);
      return NextResponse.json(
        { error: 'Không tìm thấy file hình ảnh' },
        { status: 400 }
      );
    }

    // Log file information
    console.log(`[OCR-${requestId}] File info:`, {
      name: file.name,
      size: file.size,
      type: file.type,
      sizeInMB: (file.size / (1024 * 1024)).toFixed(2)
    });

    // Kiểm tra kích thước file (10MB)
    if (file.size > 10 * 1024 * 1024) {
      console.error(`[OCR-${requestId}] File too large: ${file.size} bytes`);
      return NextResponse.json(
        { error: 'File quá lớn. Kích thước tối đa là 10MB' },
        { status: 400 }
      );
    }

    // Kiểm tra loại file
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'];
    if (!allowedTypes.includes(file.type)) {
      console.error(`[OCR-${requestId}] Unsupported file type: ${file.type}`);
      return NextResponse.json(
        { error: 'Loại file không được hỗ trợ. Chỉ chấp nhận: JPG, PNG, GIF, WebP, BMP' },
        { status: 400 }
      );
    }

    const startTime = Date.now();
    console.log(`[OCR-${requestId}] Starting OCR processing at ${new Date(startTime).toISOString()}`);

    try {
      // Chuyển đổi file thành base64
      console.log(`[OCR-${requestId}] Converting file to base64`);
      const base64Data = await fileToBase64(file);
      const mimeType = getMimeType(file);
      
      console.log(`[OCR-${requestId}] File conversion completed:`, {
        mimeType,
        base64Length: base64Data.length
      });

      // Tạo prompt
      console.log(`[OCR-${requestId}] Creating prompt for language: ${language}, accuracy: ${accuracy}`);
      const prompt = createPrompt(language, accuracy);

      // Gọi API để xử lý OCR với streaming và timeout
      console.log(`[OCR-${requestId}] Sending streaming request to GenAI with model: models/gemini-2.5-flash-lite`);
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 30000); // 30s timeout
      });
      
      const genAIPromise = genAI.models.generateContentStream({
        model: 'models/gemini-2.5-flash-lite',
        contents: [
          {
            role: 'user',
            parts: [
              { text: prompt },
              {
                inlineData: {
                  data: base64Data,
                  mimeType: mimeType
                }
              }
            ]
          }
        ]
      });
      
      const stream = await Promise.race([genAIPromise, timeoutPromise]);

      console.log(`[OCR-${requestId}] GenAI streaming request initiated`);
      let extractedText = '';
      
      // Collect all chunks from the stream
      for await (const chunk of stream) {
        if (chunk.text) {
          extractedText += chunk.text;
        }
      }
      
      console.log(`[OCR-${requestId}] GenAI streaming completed`);
      extractedText = extractedText.trim();

      const processingTime = Date.now() - startTime;
      
      console.log(`[OCR-${requestId}] OCR processing completed:`, {
        textLength: extractedText.length,
        processingTimeMs: processingTime,
        hasText: extractedText.length > 0
      });

      // Tính toán confidence score dựa trên độ dài văn bản và thời gian xử lý
      let confidence = 0.85; // Base confidence
      if (extractedText.length > 100) confidence += 0.1;
      if (processingTime < 3000) confidence += 0.05;
      if (accuracy === 'accurate') confidence += 0.05;
      confidence = Math.min(confidence, 0.99);

      const ocrResponse: OCRResponse = {
        success: true,
        text: extractedText,
        confidence: parseFloat(confidence.toFixed(2)),
        processingTime
      };

      console.log(`[OCR-${requestId}] Returning successful response:`, {
        confidence: ocrResponse.confidence,
        processingTime: ocrResponse.processingTime,
        textPreview: extractedText.substring(0, 100) + (extractedText.length > 100 ? '...' : '')
      });

      return NextResponse.json(ocrResponse);

    } catch (genAIError: unknown) {
      console.error(`[OCR-${requestId}] Google GenAI Error:`, {
        error: genAIError,
        message: genAIError instanceof Error ? genAIError.message : 'Unknown error',
        stack: genAIError instanceof Error ? genAIError.stack : undefined
      });
      
      let errorMessage = 'Lỗi khi xử lý hình ảnh với Google GenAI';
      if (genAIError instanceof Error) {
        if (genAIError.message?.includes('API_KEY')) {
          errorMessage = 'API key không hợp lệ hoặc đã hết hạn';
          console.error(`[OCR-${requestId}] API key error detected`);
        } else if (genAIError.message?.includes('QUOTA')) {
          errorMessage = 'Đã vượt quá giới hạn sử dụng API';
          console.error(`[OCR-${requestId}] Quota exceeded error detected`);
        } else if (genAIError.message?.includes('SAFETY')) {
          errorMessage = 'Hình ảnh bị từ chối do vi phạm chính sách an toàn';
          console.error(`[OCR-${requestId}] Safety policy violation detected`);
        }
      }

      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      );
    }

  } catch (error: unknown) {
    console.error(`[OCR-${requestId}] Unexpected server error:`, {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Lỗi server nội bộ' 
      },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  try {
    // Kiểm tra API key
    if (!process.env.GOOGLE_API_KEY) {
      return NextResponse.json(
        { 
          status: 'error',
          message: 'Google API key không được cấu hình',
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: 'healthy',
      service: 'OCR API',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });
  } catch (err: unknown) {
    console.error('OCR Health Check Error:', err);
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        service: 'OCR Health Check',
        error: err instanceof Error ? err.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}