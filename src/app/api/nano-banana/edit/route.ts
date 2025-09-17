import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function GET() {
  return NextResponse.json({
    name: 'Nano Banana Edit API',
    description: 'Edit and transform images using AI. Supports various operations like compose, style transfer, and general editing.',
    version: '1.0.0',
    endpoints: {
      POST: {
        description: 'Edit images with AI',
        parameters: {
          images: 'Array of image files (required)',
          instruction: 'Edit instruction text (required)',
          operationType: 'Type of operation: compose, style_transfer, or edit (optional)',
          imageDescription: 'Description of the images (optional)',
          numImages: 'Number of images to generate (default: 1, max: 4)'
        },
        response: {
          success: 'Array of base64 encoded edited images',
          error: 'Error message with status code'
        }
      }
    },
    features: [
      'Image composition and blending',
      'Style transfer between images', 
      'General image editing with natural language',
      'Multiple image generation',
      'SynthID watermark on all generated images'
    ]
  });
}

export const dynamic = 'force-dynamic';

type OperationType = 'edit' | 'compose' | 'style_transfer';

async function convertFileToBase64(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return buffer.toString('base64');
}

function createSimplePrompt(instruction: string, imageDescription?: string): string {
  let prompt = instruction;
  
  // Add image description context if provided
  if (imageDescription && imageDescription.trim()) {
    prompt = `${imageDescription.trim()}\n\n${instruction}`;
  }
  
  return prompt;
}

export async function POST(request: NextRequest) {
  try {
    console.log('Edit API request started');
    
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      console.error('Google API key not configured');
      return NextResponse.json({ error: 'Google API key not configured' }, { status: 500 });
    }

    const formData = await request.formData();
    const instruction = formData.get('instruction') as string;
    const imageDescription = formData.get('imageDescription') as string;
    const operationType = (formData.get('operationType') as OperationType) || 'edit';
    const numImages = parseInt(formData.get('numImages') as string) || 1;
    
    console.log(`Processing ${operationType} operation with ${numImages} image(s)`);
    
    const images: File[] = [];
    let imageIndex = 0;
    while (true) {
      const image = formData.get(`image${imageIndex === 0 ? '' : imageIndex}`) as File;
      if (!image) break;
      images.push(image);
      imageIndex++;
    }

    console.log(`Found ${images.length} images`);

    if (images.length === 0) {
      return NextResponse.json({ error: 'At least one image is required' }, { status: 400 });
    }

    if (!instruction) {
      return NextResponse.json({ error: 'Edit instruction is required' }, { status: 400 });
    }

    if (operationType === 'compose' && images.length < 2) {
      return NextResponse.json({ error: 'Compose operation requires at least 2 images' }, { status: 400 });
    }

    if (operationType === 'style_transfer' && images.length < 2) {
      return NextResponse.json({ error: 'Style transfer requires at least 2 images' }, { status: 400 });
    }

    const base64Images = await Promise.all(images.map(image => convertFileToBase64(image)));
    
    const simplePrompt = createSimplePrompt(instruction, imageDescription);
    console.log('Prompt created');
    
    const ai = new GoogleGenAI({ apiKey });
    console.log('Using model: gemini-2.5-flash-image-preview');

    const contents = [{
      parts: [
        { text: simplePrompt },
        ...base64Images.map((base64Image, index) => ({
          inlineData: {
            mimeType: images[index].type,
            data: base64Image,
          },
        })),
      ]
    }];

    console.log('Generating', numImages, 'images...');
    
    // Generate multiple images by making multiple API calls like in generate route
    const imagePromises = Array.from({ length: numImages }, async (_, index) => {
      // Retry logic for better reliability
      let lastError: Error | null = null;
      const maxRetries = 2;
      
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          console.log(`Attempt ${attempt + 1}/${maxRetries} for image ${index + 1}`);
          
          const genAIPromise = ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents
          });
          
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Request timeout')), 60000);
          });
          
          const response = await Promise.race([genAIPromise, timeoutPromise]) as any;
      
      // Debug logging for response structure
      console.log('Response structure:', {
        hasResponse: !!response,
        responseKeys: response ? Object.keys(response) : [],
        hasCandidates: !!response?.candidates,
        candidatesLength: response?.candidates?.length || 0
      });
      
      const candidates = response.candidates;
      if (!candidates || candidates.length === 0) {
        console.error('No candidates in response. Full response:', JSON.stringify(response, null, 2));
        throw new Error('No candidates in response');
      }

      // Debug candidate structure
      console.log('Candidate structure:', {
        hasContent: !!candidates[0].content,
        contentKeys: candidates[0].content ? Object.keys(candidates[0].content) : [],
        hasParts: !!candidates[0].content?.parts,
        partsLength: candidates[0].content?.parts?.length || 0
      });

          const parts = candidates[0].content?.parts;
          if (!parts || parts.length === 0) {
            console.error('No parts in response. Candidate content:', JSON.stringify(candidates[0], null, 2));
            throw new Error('No parts in response');
          }
          
          const imageParts = parts.filter((part: any) => part.inlineData);
          if (imageParts.length === 0) {
            throw new Error('No image data in response');
          }

          // Return the first image from this request
          return imageParts[0].inlineData!.data;
          
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
          console.error(`Attempt ${attempt + 1} failed:`, lastError.message);
          
          if (attempt === maxRetries - 1) {
            throw lastError;
          }
          
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      throw lastError || new Error('All retry attempts failed');
    });

    const imageDataArray = await Promise.all(imagePromises);
    console.log('Generated images:', imageDataArray.length);
    
    if (numImages === 1 && imageDataArray.length === 1) {
      return NextResponse.json({
        success: true,
        imageData: imageDataArray[0],
        operationType,
        prompt: instruction,
        parameters: { numImages, operationType }
      });
    } else {
      return NextResponse.json({
        success: true,
        imageData: imageDataArray,
        operationType,
        prompt: instruction,
        parameters: { numImages, operationType }
      });
    }

  } catch (error: unknown) {
    console.error('=== Edit API Error ===');
    console.error('Error type:', typeof error);
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    let errorMessage = 'Failed to edit image';
    let statusCode = 500;
    
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        errorMessage = 'Invalid or missing API key configuration';
        statusCode = 500;
      } else if (error.message.includes('quota')) {
        errorMessage = 'API quota exceeded. Please try again later';
        statusCode = 429;
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Request timed out. The image editing process took too long';
        statusCode = 408;
      } else if (error.message.includes('model')) {
        errorMessage = 'Image editing model is currently unavailable';
        statusCode = 503;
      } else if (error.message.includes('No candidates')) {
        errorMessage = 'AI model could not generate a response. Please try with different images or instructions';
        statusCode = 422;
      } else if (error.message.includes('No parts')) {
        errorMessage = 'AI model response was incomplete. Please try again';
        statusCode = 422;
      } else if (error.message.includes('No image data')) {
        errorMessage = 'AI model could not generate edited images. Please try with different instructions';
        statusCode = 422;
      } else if (error.message.includes('retry attempts failed')) {
        errorMessage = 'Multiple attempts failed. Please check your images and try again';
        statusCode = 422;
      }
    }
    
    return NextResponse.json({ 
      error: errorMessage,
      details: error instanceof Error ? error.message : String(error),
      suggestion: 'Try with different images, simpler instructions, or wait a moment before retrying'
    }, { status: statusCode });
  }
}
