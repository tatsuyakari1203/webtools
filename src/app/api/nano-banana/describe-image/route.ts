import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export const dynamic = 'force-dynamic';

// Khởi tạo Google GenAI client
const genAI = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY || '' });

// Hàm chuyển đổi file thành base64
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

// Function to create detailed prompt for image description
function createDescriptionPrompt(): string {
  return `Provide a comprehensive, detailed description of this image in English. Focus on the actual content and what you see. Include:

1. **Overall Context**: The space, environment, setting, time of day (day/night)
2. **Main Characters/Objects**: 
   - Number, gender, estimated age
   - Clothing, colors, style
   - Posture, expressions, actions
   - Notable identifying features
3. **Position and Space**:
   - Position of objects within the frame
   - Distance, proportions, perspective
   - Foreground, background elements
4. **Lighting and Colors**:
   - Light source, direction of lighting
   - Dominant color tones
   - Shadows, contrast
5. **Special Details**:
   - Objects, accessories, items visible
   - Textures, materials, surfaces
   - Text, signs, or writing if present
6. **Emotion and Atmosphere**: Mood, feelings, activity happening in the scene

Provide only the description without any introductory phrases or analysis commentary. Focus on describing what is actually visible rather than artistic or technical qualities.`;
}

export async function POST(request: NextRequest) {
  const requestId = Math.random().toString(36).substr(2, 9);
  console.log(`[DESCRIBE-${requestId}] Starting image description request`);
  
  try {
    // Kiểm tra API key
    if (!process.env.GOOGLE_API_KEY) {
      console.error(`[DESCRIBE-${requestId}] Google API key not configured`);
      return NextResponse.json(
        { error: 'Google API key không được cấu hình' },
        { status: 500 }
      );
    }

    // Parse form data
    console.log(`[DESCRIBE-${requestId}] Parsing form data`);
    const formData = await request.formData();
    const file = formData.get('image') as File;

    console.log(`[DESCRIBE-${requestId}] Request parameters:`, {
      hasFile: !!file
    });

    if (!file) {
      console.error(`[DESCRIBE-${requestId}] No image file found in request`);
      return NextResponse.json(
        { error: 'Không tìm thấy file hình ảnh' },
        { status: 400 }
      );
    }

    // Log file information
    console.log(`[DESCRIBE-${requestId}] File info:`, {
      name: file.name,
      size: file.size,
      type: file.type,
      sizeInMB: (file.size / (1024 * 1024)).toFixed(2)
    });

    // Kiểm tra kích thước file (10MB)
    if (file.size > 10 * 1024 * 1024) {
      console.error(`[DESCRIBE-${requestId}] File too large: ${file.size} bytes`);
      return NextResponse.json(
        { error: 'File quá lớn. Kích thước tối đa là 10MB' },
        { status: 400 }
      );
    }

    // Kiểm tra loại file
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'];
    if (!allowedTypes.includes(file.type)) {
      console.error(`[DESCRIBE-${requestId}] Unsupported file type: ${file.type}`);
      return NextResponse.json(
        { error: 'Loại file không được hỗ trợ. Chỉ chấp nhận: JPG, PNG, GIF, WebP, BMP' },
        { status: 400 }
      );
    }

    const startTime = Date.now();
    console.log(`[DESCRIBE-${requestId}] Starting image description processing at ${new Date(startTime).toISOString()}`);

    try {
      // Chuyển đổi file thành base64
      console.log(`[DESCRIBE-${requestId}] Converting file to base64`);
      const base64Data = await fileToBase64(file);
      const mimeType = getMimeType(file);
      
      console.log(`[DESCRIBE-${requestId}] File conversion completed:`, {
        mimeType,
        base64Length: base64Data.length
      });

      // Tạo prompt
      console.log(`[DESCRIBE-${requestId}] Creating description prompt`);
      const prompt = createDescriptionPrompt();

      // Gọi API để xử lý mô tả ảnh với streaming và timeout
      console.log(`[DESCRIBE-${requestId}] Sending streaming request to GenAI with model: models/gemini-2.5-flash-lite`);
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 45000); // 45s timeout cho mô tả chi tiết
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
      
      const stream = await Promise.race([genAIPromise, timeoutPromise]) as AsyncIterable<{ text?: string }>;

      console.log(`[DESCRIBE-${requestId}] GenAI streaming request initiated`);
      let description = '';
      
      // Collect all chunks from the stream
      for await (const chunk of stream) {
        if (chunk.text) {
          description += chunk.text;
        }
      }
      
      console.log(`[DESCRIBE-${requestId}] GenAI streaming completed`);
      description = description.trim();

      const processingTime = Date.now() - startTime;
      
      console.log(`[DESCRIBE-${requestId}] Image description completed:`, {
        descriptionLength: description.length,
        processingTimeMs: processingTime,
        hasDescription: description.length > 0
      });

      const response = {
        success: true,
        description: description,
        processingTime
      };

      console.log(`[DESCRIBE-${requestId}] Returning successful response:`, {
        processingTime: response.processingTime,
        descriptionPreview: description.substring(0, 100) + (description.length > 100 ? '...' : '')
      });

      return NextResponse.json(response);

    } catch (genAIError: unknown) {
      console.error(`[DESCRIBE-${requestId}] Google GenAI Error:`, {
        error: genAIError,
        message: genAIError instanceof Error ? genAIError.message : 'Unknown error',
        stack: genAIError instanceof Error ? genAIError.stack : undefined
      });
      
      return NextResponse.json(
        { 
          success: false,
          error: 'Lỗi khi xử lý mô tả ảnh. Vui lòng thử lại sau.' 
        },
        { status: 500 }
      );
    }

  } catch (error: unknown) {
    console.error(`[DESCRIBE-${requestId}] Unexpected error:`, {
      error: error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Lỗi không xác định. Vui lòng thử lại sau.' 
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Image Description API is running',
    endpoint: '/api/nano-banana/describe-image',
    method: 'POST',
    description: 'Generate detailed Vietnamese description for uploaded images'
  });
}