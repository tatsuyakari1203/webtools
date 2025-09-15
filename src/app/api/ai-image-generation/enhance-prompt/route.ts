import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'

function createPromptEnhancement(originalPrompt: string, category: string, model: string, imageContext?: string): string {
  // Base prompt for different models
  let basePrompt = '';
  
  if (model === 'seedream') {
    basePrompt = `You are an expert image editing assistant. Your task is to enhance and refine user editing instructions following Seedream 4.0 guidelines for clear, concise, and natural language commands.`;
    
    if (imageContext) {
      basePrompt += `\n\nImage analysis: ${imageContext}`;
    }
    
    basePrompt += `\n\nUser's editing instruction: "${originalPrompt}"`;
    
    basePrompt += `\n\nPlease enhance this instruction by:
1. Using clear, natural language descriptions (avoid technical jargon and specific numerical values)
2. Focusing on the desired visual outcome rather than technical steps
3. Keeping instructions concise and unambiguous
4. Describing transformations in simple, actionable terms
5. Avoiding overly detailed technical specifications that may confuse the AI model`;
    
    basePrompt += `\n\nExamples of good enhanced commands:
- "Make the image warmer and more golden, like sunset lighting"
- "Add a vintage film look with slightly faded colors"
- "Brighten the subject's eyes and add soft lighting around them"
- "Convert to black and white but keep the red elements in color"
- "Make the colors more vibrant and the contrast stronger"
- "Add a dreamy, soft focus effect to the background"`;
  } else if (model === 'flux-kontext') {
    basePrompt = `You are an expert image context assistant. Your task is to enhance and refine user instructions for the Flux Kontext model, which specializes in adding objects or elements to images based on textual prompts.`;
    
    if (imageContext) {
      basePrompt += `\n\nImage analysis: ${imageContext}`;
    }
    
    basePrompt += `\n\nUser's instruction: "${originalPrompt}"`;
    
    basePrompt += `\n\nPlease enhance this instruction by:
1. Using clear, natural language descriptions that specify what objects to add to the image
2. Focusing on the desired visual outcome and placement of new elements
3. Keeping instructions concise and unambiguous
4. Describing the new elements in simple, actionable terms
5. Avoiding overly detailed technical specifications that may confuse the AI model`;
    
    basePrompt += `\n\nExamples of good enhanced commands:
- "Add a small brown dog sitting next to the chair"
- "Place a bouquet of colorful flowers on the table"
- "Add a steaming cup of coffee in the foreground"
- "Put a vintage clock on the wall behind the sofa"
- "Add a small potted plant on the windowsill"`;
  } else {
    // Default generic enhancement prompt
    basePrompt = `You are an expert image assistant. Your task is to enhance and refine user instructions for AI image generation or editing.`;
    
    if (imageContext) {
      basePrompt += `\n\nImage analysis: ${imageContext}`;
    }
    
    basePrompt += `\n\nUser's instruction: "${originalPrompt}"`;
    
    basePrompt += `\n\nPlease enhance this instruction by:
1. Using clear, natural language descriptions
2. Focusing on the desired visual outcome
3. Keeping instructions concise and unambiguous
4. Describing the desired result in simple, actionable terms
5. Avoiding overly detailed technical specifications that may confuse the AI model`;
  }
  
  basePrompt += `\n\nProvide the enhanced instruction as a natural paragraph (not markdown format):`;

  return basePrompt;
}

export async function POST(request: NextRequest) {
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
    
    let imageContext = undefined
    
    // Analyze image if provided
    if (image) {
      try {
        const visionResult = await genAI.models.generateContent({
          model: 'models/gemini-1.5-flash',
          contents: [{
            parts: [
              {
                text: 'Analyze this image and describe its content, including: objects, people, colors, lighting, composition, style, and any notable visual elements. Be specific and detailed for image editing context.'
              },
              {
                inlineData: {
                  mimeType: 'image/jpeg',
                  data: image
                }
              }
            ]
          }]
        })
        
        const visionCandidates = visionResult.candidates
        if (visionCandidates && visionCandidates.length > 0) {
          const visionParts = visionCandidates[0].content?.parts
          if (visionParts) {
            imageContext = ''
            for (const part of visionParts) {
              if (part.text) {
                imageContext += part.text
              }
            }
          }
        }
      } catch (visionError) {
        console.error('Vision API error:', visionError)
        // Continue without image context if vision fails
      }
    }

    const enhancementPrompt = createPromptEnhancement(prompt, category, model, imageContext)

    const result = await genAI.models.generateContent({
      model: 'models/gemini-1.5-flash',
      contents: enhancementPrompt
    })

    const candidates = result.candidates
    if (!candidates || candidates.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No enhanced prompt generated' },
        { status: 500 }
      )
    }

    const parts = candidates[0].content?.parts
    let enhancedPrompt = ''

    if (!parts) {
      return NextResponse.json(
        { success: false, error: 'No content parts found in response' },
        { status: 500 }
      )
    }

    for (const part of parts) {
      if (part.text) {
        enhancedPrompt += part.text
      }
    }

    if (!enhancedPrompt) {
      return NextResponse.json(
        { success: false, error: 'Failed to enhance prompt' },
        { status: 500 }
      )
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

    return NextResponse.json({
      success: true,
      original_prompt: prompt,
      enhanced_prompt: finalPrompt,
      category,
      model
    })

  } catch (error) {
    console.error('Prompt enhancement error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to enhance prompt' },
      { status: 500 }
    )
  }
}