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

// Enhanced system instruction following prompt guide principles
function createSystemInstruction(): string {
  return `You are an expert visual analyst specializing in creating rich, narrative descriptions for AI image generation workflows. Your expertise includes:

- Understanding visual composition, lighting, and storytelling elements
- Crafting descriptive, narrative-driven descriptions that capture the essence of scenes
- Optimizing descriptions for dual-prompt image editing workflows
- Balancing technical accuracy with creative vision

Core Principle: Describe the scene, don't just list keywords. Use rich, narrative descriptions that leverage advanced language understanding to create cohesive visual stories.

Your descriptions should read like detailed scene narratives that paint a complete picture of what's happening, creating immersive stories of the visual content rather than disconnected element lists.

IMPORTANT: Return ONLY the description without any introductory text, explanations, or meta-commentary. Do not include phrases like 'This image shows' or 'The description is' - start directly with the visual narrative.`;
}

// Optimized narrative-style prompt for image description
function createDescriptionPrompt(): string {
  return `Create a rich, narrative description of this image that captures the complete visual story. Write as if you're painting a detailed scene with words, focusing on the atmosphere, relationships between elements, and the overall narrative flow.

Begin by establishing the setting and environment, then weave together the characters, objects, lighting, and mood into a cohesive visual narrative. Describe how elements interact with each other and contribute to the overall scene's story.

Focus on creating a flowing description that captures the essence and atmosphere of the image, including spatial relationships, lighting conditions, color harmonies, textures, and the emotional tone of the scene. If there are people, describe their expressions, postures, and interactions naturally within the narrative flow.

Include specific details about materials, surfaces, and environmental elements that contribute to the scene's authenticity. Mention any text, signs, or distinctive features that are clearly visible and relevant to the overall composition.

Your description should be comprehensive enough to serve as a foundation for image editing workflows, providing rich context that can guide precise modifications while maintaining the original scene's integrity and atmosphere.`;
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
    message: 'Enhanced Image Description API is running',
    endpoint: '/api/nano-banana/describe-image',
    method: 'POST',
    description: 'Generate rich, narrative-style descriptions for uploaded images using Gemini 2.5 Flash with thinking mode',
    features: [
      'Narrative-style descriptions optimized for dual-prompt workflows',
      'Enhanced visual analysis with thinking mode',
      'Context-aware prompting for better image understanding',
      'Optimized for image editing and generation workflows'
    ],
    model: 'gemini-2.5-flash',
    capabilities: 'Advanced visual understanding with thinking mode enabled'
  });
}