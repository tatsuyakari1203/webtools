import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'

function createPromptEnhancement(originalPrompt: string, category: string, model: string, hasImage?: string): string {
  // Base prompt for different models
  let basePrompt = '';
  
  if (model === 'seedream') {
    basePrompt = `You are an expert image editing assistant. Your task is to enhance and refine user editing instructions following Seedream 4.0 guidelines for clear, concise, and natural language commands.`;
    
    if (hasImage) {
      basePrompt += `\n\nAnalyze the provided image and enhance the editing instruction based on the visual context you observe.`;
    }
    
    basePrompt += `\n\nUser's editing instruction: "${originalPrompt}"`;
    
    basePrompt += `\n\nPlease enhance this instruction by:
1. Using clear, natural language descriptions (avoid technical jargon and specific numerical values)
2. Focusing on the desired visual outcome rather than technical steps
3. Keeping instructions concise and unambiguous
4. Describing transformations in simple, actionable terms
5. Avoiding overly detailed technical specifications that may confuse the AI model`;
    
    if (hasImage) {
      basePrompt += `\n6. Incorporating visual elements, composition, lighting, and style details you observe in the provided image`;
    }
    
    basePrompt += `\n\nExamples of good enhanced commands:
- "Make the image warmer and more golden, like sunset lighting"
- "Add a vintage film look with slightly faded colors"
- "Brighten the subject's eyes and add soft lighting around them"
- "Convert to black and white but keep the red elements in color"
- "Make the colors more vibrant and the contrast stronger"
- "Add a dreamy, soft focus effect to the background"`;
  } else if (model === 'flux-kontext') {
    basePrompt = `You are an expert image context assistant. Your task is to enhance and refine user instructions for the Flux Kontext model, which specializes in adding objects or elements to images based on textual prompts.`;
    
    if (hasImage) {
      basePrompt += `\n\nAnalyze the provided image and enhance the instruction based on the visual context, composition, and existing elements you observe.`;
    }
    
    basePrompt += `\n\nUser's instruction: "${originalPrompt}"`;
    
    basePrompt += `\n\nPlease enhance this instruction by:
1. Using clear, natural language descriptions that specify what objects to add to the image
2. Focusing on the desired visual outcome and placement of new elements
3. Keeping instructions concise and unambiguous
4. Describing the new elements in simple, actionable terms
5. Avoiding overly detailed technical specifications that may confuse the AI model`;
    
    if (hasImage) {
      basePrompt += `\n6. Considering the existing composition, lighting, and style in the provided image for seamless integration`;
    }
    
    basePrompt += `\n\nExamples of good enhanced commands:
- "Add a small brown dog sitting next to the chair"
- "Place a bouquet of colorful flowers on the table"
- "Add a steaming cup of coffee in the foreground"
- "Put a vintage clock on the wall behind the sofa"
- "Add a small potted plant on the windowsill"`;
  } else {
    // Default generic enhancement prompt
    basePrompt = `You are an expert image assistant. Your task is to enhance and refine user instructions for AI image generation or editing.`;
    
    if (hasImage) {
      basePrompt += `\n\nAnalyze the provided image and enhance the instruction based on the visual context you observe.`;
    }
    
    basePrompt += `\n\nUser's instruction: "${originalPrompt}"`;
    
    basePrompt += `\n\nPlease enhance this instruction by:
1. Using clear, natural language descriptions
2. Focusing on the desired visual outcome
3. Keeping instructions concise and unambiguous
4. Describing the desired result in simple, actionable terms
5. Avoiding overly detailed technical specifications that may confuse the AI model`;
  }
  
  basePrompt += `\n\nIMPORTANT: Always respond in English only, regardless of the input language. Provide the enhanced instruction as a natural paragraph (not markdown format):`;

  return basePrompt;
}

export async function POST(request: NextRequest) {
  console.log('🚀 Enhance-prompt API request started');

  const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY

  if (!GOOGLE_API_KEY) {
    return NextResponse.json(
      { success: false, error: 'GOOGLE_API_KEY is not configured' },
      { status: 500 }
    )
  }

  try {
    const body = await request.json()
    const { prompt, category = 'image-editing', image, model = 'seedream' } = body

    if (!prompt || !prompt.trim()) {
      return NextResponse.json(
        { success: false, error: 'Prompt is required' },
        { status: 400 }
      )
    }

    const genAI = new GoogleGenAI({ apiKey: GOOGLE_API_KEY })
    
    // Create enhancement prompt without pre-analyzing image
    const enhancementPrompt = createPromptEnhancement(prompt, category, model, image ? 'Based on the provided image context' : undefined)
    console.log('📝 Generated enhancement prompt, calling Gemini 2.5 Flash...');

    // Prepare content parts - include image directly if provided
    const parts: Array<{ text: string } | { inlineData: { data: string; mimeType: string } }> = [{ text: enhancementPrompt }]
    
    // Add image directly to the request if provided
    if (image) {
      // Handle base64 image data
      let imageData = image
      let mimeType = 'image/jpeg'
      
      // Remove data URL prefix if present
      if (image.startsWith('data:')) {
        const [header, data] = image.split(',')
        imageData = data
        const mimeMatch = header.match(/data:([^;]+)/)
        if (mimeMatch) {
          mimeType = mimeMatch[1]
        }
      }
      
      console.log(`🖼️ Image processed: ${mimeType}, size: ${(imageData.length * 0.75 / 1024).toFixed(1)}KB`);
      
      parts.push({
        inlineData: {
          data: imageData,
          mimeType: mimeType
        }
      })
    }

    // Add timeout for better performance (similar to improve-prompt)
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), 45000); // 45s timeout
    });

    console.log('🤖 Calling Gemini 2.5 Flash with optimized thinking mode...');
    const genAIPromise = genAI.models.generateContentStream({
      model: 'models/gemini-flash-latest',
      contents: [
        { role: 'user', parts }
      ],
      config: {
        // Optimize thinking mode for faster response
        thinkingConfig: { thinkingBudget: 500 } // Reduced thinking budget for faster response
      }
    });

    const result = await Promise.race([genAIPromise, timeoutPromise]) as AsyncIterable<{ text?: string }>;

    // Optimized streaming response
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          let enhancedPrompt = ''
          
          for await (const chunk of result) {
            const chunkText = chunk.text
            if (chunkText) {
              enhancedPrompt += chunkText
              
              // Simplified streaming chunk (less JSON processing)
              const data = JSON.stringify({
                type: 'chunk',
                content: chunkText,
                accumulated: enhancedPrompt
              })
              controller.enqueue(encoder.encode(`data: ${data}\n\n`))
            }
          }
          
          // Ensure enhanced prompt doesn't exceed 2000 characters
          let finalPrompt = enhancedPrompt.trim()
          if (finalPrompt.length > 2000) {
            finalPrompt = finalPrompt.substring(0, 2000).trim()
            // Try to cut at the last complete sentence
            const lastPeriod = finalPrompt.lastIndexOf('.')
            const lastExclamation = finalPrompt.lastIndexOf('!')
            const lastQuestion = finalPrompt.lastIndexOf('?')
            const lastSentenceEnd = Math.max(lastPeriod, lastExclamation, lastQuestion)
            
            if (lastSentenceEnd > 1800) { // Only cut at sentence if it's not too short
              finalPrompt = finalPrompt.substring(0, lastSentenceEnd + 1)
            }
          }
          
          // Send final result
          const finalData = JSON.stringify({
            type: 'complete',
            success: true,
            original_prompt: prompt,
            enhanced_prompt: finalPrompt,
            category,
            model
          })
          controller.enqueue(encoder.encode(`data: ${finalData}\n\n`))
          
        } catch (streamError) {
          console.error('Streaming error:', streamError)
          const errorData = JSON.stringify({
            type: 'error',
            success: false,
            error: 'Failed to enhance prompt during streaming'
          })
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`))
        } finally {
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    })

  } catch (error) {
    console.error('Prompt enhancement error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to enhance prompt' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Optimized Prompt Enhancement API is running",
    description: "Enhanced prompt enhancement service using Gemini 2.5 Flash with optimized thinking mode for faster response times",
    features: [
      "45s timeout for reliable performance",
      "Optimized thinking mode (500 budget)",
      "Real-time streaming responses",
      "Performance logging and monitoring",
      "Streamlined JSON processing",
      "Image analysis support"
    ],
    model: "gemini-2.5-flash",
    capabilities: [
      "Text prompt enhancement",
      "Image-based prompt improvement", 
      "Model-specific optimization (seedream, flux-kontext)",
      "Real-time streaming responses"
    ],
    performance: "Optimized for speed with reduced thinking budget and timeout protection"
  })
}