import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export const dynamic = 'force-dynamic';

type OperationType = 'edit' | 'compose' | 'style_transfer';

async function convertFileToBase64(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return buffer.toString('base64');
}

function createEnhancedPrompt(instruction: string, operationType: OperationType, numImages: number = 1): string {
  let basePrompt = '';
  
  switch (operationType) {
    case 'edit':
      basePrompt = `You are an expert image editor. Please edit the provided image according to this instruction: "${instruction}". Maintain the original image quality and style while making the requested changes.`;
      break;
    case 'compose':
      basePrompt = `You are an expert image compositor. Please create a new composition using the provided images according to this instruction: "${instruction}". Blend the images seamlessly.`;
      break;
    case 'style_transfer':
      basePrompt = `You are an expert in artistic style transfer. Please apply the style from one image to another according to this instruction: "${instruction}".`;
      break;
  }
  
  if (numImages > 1) {
    basePrompt += ` Generate ${numImages} different high-quality variations.`;
  } else {
    basePrompt += ' Generate a high-quality edited image.';
  }
  
  return basePrompt;
}

export async function POST(request: NextRequest) {
  try {
    console.log('=== Edit API Request Started ===');
    
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      console.error('Google API key not configured');
      return NextResponse.json({ error: 'Google API key not configured' }, { status: 500 });
    }

    const formData = await request.formData();
    const instruction = formData.get('instruction') as string;
    const operationType = (formData.get('operationType') as OperationType) || 'edit';
    const numImages = parseInt(formData.get('numImages') as string) || 1;
    
    console.log('Request parameters:', {
      instruction: instruction?.substring(0, 100) + '...',
      operationType,
      numImages
    });
    
    const images: File[] = [];
    let imageIndex = 0;
    while (true) {
      const image = formData.get(`image${imageIndex === 0 ? '' : imageIndex}`) as File;
      if (!image) break;
      images.push(image);
      imageIndex++;
    }

    console.log(`Found ${images.length} images:`, images.map(img => ({ name: img.name, size: img.size, type: img.type })));

    if (images.length === 0) {
      console.error('No images provided');
      return NextResponse.json({ error: 'At least one image is required' }, { status: 400 });
    }

    if (!instruction) {
      console.error('No instruction provided');
      return NextResponse.json({ error: 'Edit instruction is required' }, { status: 400 });
    }

    if (operationType === 'compose' && images.length < 2) {
      console.error('Compose operation requires at least 2 images');
      return NextResponse.json({ error: 'Compose operation requires at least 2 images' }, { status: 400 });
    }

    if (operationType === 'style_transfer' && images.length < 2) {
      console.error('Style transfer requires at least 2 images');
      return NextResponse.json({ error: 'Style transfer requires at least 2 images' }, { status: 400 });
    }

    console.log('Converting images to base64...');
    const base64Images = await Promise.all(images.map(image => convertFileToBase64(image)));
    console.log('Base64 conversion completed');
    
    const enhancedPrompt = createEnhancedPrompt(instruction, operationType, numImages);
    console.log('Enhanced prompt:', enhancedPrompt.substring(0, 200) + '...');
    
    const ai = new GoogleGenAI({ apiKey });
    console.log('Using model: gemini-2.5-flash-image-preview');

    const contents = [{
      parts: [
        { text: enhancedPrompt },
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
      console.log(`Sending request ${index + 1}/${numImages} to Gemini...`);
      const response = await ai.models.generateContent({
        model: 'models/gemini-2.5-flash-image-preview',
        contents
      });
      console.log(`Received response ${index + 1}/${numImages} from Gemini`);
      
      // Debug logging for response structure
      console.log('Response structure:', {
        hasCandidates: !!response.candidates,
        candidatesLength: response.candidates?.length || 0,
        responseKeys: Object.keys(response)
      });
      
      const candidates = response.candidates;
      if (!candidates || candidates.length === 0) {
        console.error('No candidates in response:', response);
        throw new Error('No candidates in response');
      }

      console.log('Candidate structure:', {
        hasContent: !!candidates[0].content,
        contentKeys: candidates[0].content ? Object.keys(candidates[0].content) : [],
        hasParts: !!candidates[0].content?.parts,
        partsLength: candidates[0].content?.parts?.length || 0
      });

      const parts = candidates[0].content?.parts;
      if (!parts || parts.length === 0) {
        console.error('No parts in response:', candidates[0]);
        throw new Error('No parts in response');
      }
      
      console.log('Parts analysis:', parts.map((part, i) => ({
        index: i,
        hasText: !!part.text,
        hasInlineData: !!part.inlineData,
        inlineDataKeys: part.inlineData ? Object.keys(part.inlineData) : [],
        mimeType: part.inlineData?.mimeType
      })));
      
      const imageParts = parts.filter(part => part.inlineData);
      if (imageParts.length === 0) {
        console.error('No image data in response. Parts:', parts);
        console.error('Full response for debugging:', JSON.stringify(response, null, 2));
        throw new Error('No image data in response - Gemini may not support image editing for this request');
      }

      console.log(`Found ${imageParts.length} image parts in response ${index + 1}`);
      // Return the first image from this request
      return imageParts[0].inlineData!.data;
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

  } catch (error) {
    console.error('=== Edit API Error ===');
    console.error('Error type:', error?.constructor?.name);
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    // More specific error messages
    let errorMessage = 'Failed to edit image';
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        errorMessage = 'Invalid API key';
      } else if (error.message.includes('quota')) {
        errorMessage = 'API quota exceeded';
      } else if (error.message.includes('model')) {
        errorMessage = 'Model not available';
      } else if (error.message.includes('candidates')) {
        errorMessage = 'No response generated';
      } else if (error.message.includes('image data')) {
        errorMessage = 'No image generated';
      }
    }
    
    return NextResponse.json({ 
      error: errorMessage,
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
