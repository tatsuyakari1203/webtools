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

// Creative prompt generator for AI image generation
function createSystemInstruction(): string {
  return `You are a creative prompt engineer specializing in transforming images into inspiring AI generation prompts.

Your role is to capture the ESSENCE and CREATIVE POTENTIAL of images, not just describe them analytically.

Your expertise includes:
- Identifying artistic style, mood, and aesthetic direction
- Capturing character essence and personality traits
- Recognizing composition, lighting, and visual storytelling elements
- Translating visual concepts into generative language

Core principles:
1. CREATIVE INTERPRETATION: Focus on the artistic vision and concept, not just physical details
2. GENERATIVE LANGUAGE: Use language that inspires AI creativity and variation
3. MOOD & ATMOSPHERE: Capture the emotional tone and artistic style
4. ESSENTIAL DETAILS: Include key visual elements that define the concept
5. INSPIRATIONAL FLOW: Write prompts that spark creative generation

IMPORTANT: Return ONLY the creative prompt itself. Do NOT include any introductory phrases like "Here's a creative AI generation prompt inspired by the image:" or explanatory text. Start directly with the prompt content.`;
}

// Creative prompt generator for inspiring AI image generation
function createDescriptionPrompt(): string {
  return `Transform this image into a creative AI generation prompt that captures its essence and artistic potential.

Start with the overall concept, artistic style, and mood. What story does this image tell? What aesthetic or genre does it represent?

Describe the subject's character and presence - their personality, energy, and role in the scene. Focus on the essence rather than just physical details.

Capture the visual style elements: lighting mood, color palette, composition style, and any artistic techniques or effects.

Include key visual elements that define the concept: important clothing styles, distinctive accessories, environmental context, and any symbolic or thematic elements.

End with the atmosphere and creative direction that would inspire varied but faithful recreations.

Guidelines:
- Focus on CREATIVE ESSENCE over analytical description
- Use INSPIRATIONAL LANGUAGE that sparks AI creativity
- Capture MOOD, STYLE, and ARTISTIC DIRECTION
- Include key details that define the CONCEPT
- Write as a GENERATIVE PROMPT, not a factual report
- Allow room for ARTISTIC INTERPRETATION and variation
- Think like a creative director giving vision to an artist

Create a prompt that captures the spirit and allows AI to recreate with creative freedom while maintaining the core concept.`;
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

      // Tạo prompt và system instruction
      console.log(`[DESCRIBE-${requestId}] Creating enhanced description prompt with system instruction`);
      const prompt = createDescriptionPrompt();
      const systemInstruction = createSystemInstruction();

      // Gọi API với Gemini 2.5 Flash và thinking mode
      console.log(`[DESCRIBE-${requestId}] Sending streaming request to GenAI with model: gemini-2.5-flash (thinking mode enabled)`);
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 60000); // 60s timeout cho thinking mode
      });
      
      const genAIPromise = genAI.models.generateContentStream({
        model: 'gemini-2.5-flash',
        contents: [
          { role: 'user', parts: [{ text: systemInstruction }] },
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
        ],
        config: {
          // Thinking mode enabled by default for 2.5 Flash
          // thinkingConfig: { thinkingBudget: 1000 } // Optional: can adjust thinking budget
        }
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
    message: "Creative AI Prompt Generator",
    description: "Transform images into inspiring AI generation prompts that capture artistic essence",
    features: [
      "Creative prompt engineering from images",
      "Artistic style and mood identification", 
      "Character essence and personality capture",
      "Inspirational language for AI creativity"
    ],
    capabilities: [
      "Concept and vision extraction",
      "Artistic direction interpretation", 
      "Creative storytelling elements",
      "Generative prompt optimization"
    ],
    improvements: [
      "Shifted from analytical description to creative interpretation",
      "Focus on artistic essence over physical details",
      "Inspirational language that sparks AI creativity",
      "Creative freedom while maintaining core concept"
    ],
    usage: "POST /api/nano-banana/describe-image with image file"
  });
}