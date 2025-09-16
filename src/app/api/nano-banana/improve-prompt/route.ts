import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'

function createSystemInstruction(): string {
  return `You are an expert prompt engineer specializing in Gemini 2.5 Flash image generation. Your expertise includes:

- Understanding visual composition and storytelling
- Crafting descriptive, narrative-driven prompts
- Optimizing prompts for different image categories
- Balancing technical specifications with creative vision

Core Principle: Describe the scene, don't just list keywords. Use rich, narrative descriptions that leverage the model's deep language understanding.

For EDIT prompts specifically: Stay extremely close to the original prompt content. Focus only on clarifying and detailing the specific changes requested, not on describing the entire image. Preserve the original intent and only enhance the editing instructions.

IMPORTANT: Return ONLY the improved prompt without any introductory text, explanations, or meta-commentary. Do not include phrases like 'Here's an enhanced prompt' or similar introductions.

Your enhanced prompts should read like detailed scene descriptions or visual narratives, creating cohesive stories of what should be seen rather than disconnected keyword lists.`;
}

function createImprovementPrompt(originalPrompt: string, category: string, hasImage: boolean = false): string {
  const basePrompt = hasImage 
    ? `Enhance and improve the following prompt for ${category} image generation based on the provided input image:

Original prompt: "${originalPrompt}"

Analyze the input image and improve this prompt by incorporating visual elements, composition, lighting, and style details you observe in the image. Please improve this prompt by:`
    : `Enhance and improve the following prompt for ${category} image generation:

Original prompt: "${originalPrompt}"

Please improve this prompt by:`;

  const categorySpecificGuidance = {
    photorealistic: `
- Creating a narrative description of the scene with photography terms
- Adding specific camera angles, lens types (85mm portrait, wide-angle, etc.), and lighting setups
- Including fine details about textures, materials, and environmental context
- Specifying professional lighting (golden hour, softbox, three-point lighting)
- Mentioning depth of field effects (bokeh, sharp focus) and composition techniques
- Describing the mood and atmosphere of the scene`,
    
    artistic: `
- Crafting a descriptive narrative that captures the artistic vision
- Specifying artistic medium, technique, and style with rich descriptive language
- Adding details about brushwork, color palette, and artistic movement characteristics
- Including composition elements and visual hierarchy in story form
- Describing the emotional tone and artistic intent behind the piece
- Mentioning specific artistic techniques and their visual effects`,
    
    product: `
- Creating a detailed scene description for commercial photography
- Specifying studio lighting setups (softbox, three-point lighting) and camera angles
- Adding rich descriptions of materials, finishes, textures, and surfaces
- Including environmental context and staging details
- Describing the mood and professional presentation style
- Mentioning specific photography techniques for product showcase`,
    
    minimalist: `
- Emphasizing negative space and simplicity in narrative form
- Describing clean, uncluttered composition with rich detail
- Specifying minimal color palette and its emotional impact
- Adding subtle lighting and shadow descriptions
- Focusing on essential elements and their relationships
- Creating a sense of calm and purposeful design`,
    
    illustration: `
- Building a narrative around the illustration style and technique
- Adding detailed descriptions of color schemes and visual approaches
- Including rich descriptions of design elements and their interactions
- Specifying illustration medium and artistic execution
- Describing the mood and storytelling aspects of the illustration
- Mentioning how visual elements support the overall narrative`,
    
    logo: `
- Creating a comprehensive brand story and visual identity description
- Specifying design philosophy, style approach, and visual language
- Adding detailed typography and text treatment descriptions
- Including brand personality manifestation in visual elements
- Describing target audience connection and emotional resonance
- Mentioning scalability and versatility in contextual scenarios`,
    
    edit: `
- Staying extremely close to the original prompt content and intent
- Focusing ONLY on clarifying and detailing the specific changes requested
- Using precise editing language like "change only the X to Y", "add Z while keeping everything else unchanged", "remove A from the scene"
- Avoiding redescribing the entire image - only enhance the editing instructions
- Making the change instructions more specific and actionable
- Preserving all original elements that are not being modified
- Ensuring the edit focuses on the transformation, not the whole scene description`
  };

  const guidance = categorySpecificGuidance[category as keyof typeof categorySpecificGuidance] || categorySpecificGuidance.photorealistic;

  const finalInstructions = category === 'edit' 
    ? `

For EDIT prompts: Stay extremely close to the original prompt. Only clarify and detail the specific changes requested. Do not redescribe the entire scene - focus solely on making the editing instructions more precise and actionable. Preserve the original intent and content.

Return ONLY the improved prompt text without any introductory phrases, explanations, or commentary. Start directly with the enhanced prompt content.`
    : `

Provide an improved version that reads like a detailed scene description or visual narrative. Focus on creating a cohesive, descriptive paragraph that tells the story of what should be seen, rather than a list of disconnected elements. The enhanced prompt should leverage Gemini 2.5 Flash's strength in understanding rich, descriptive language.

Return ONLY the improved prompt text without any introductory phrases, explanations, or commentary. Start directly with the enhanced prompt content.`;

  return `${basePrompt}${guidance}${finalInstructions}`;
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
    let prompt: string
    let category: string = 'photorealistic'
    let imageFile: File | null = null

    // Check if request is FormData (has image) or JSON
    const contentType = request.headers.get('content-type')
    
    if (contentType?.includes('multipart/form-data')) {
      // Handle FormData (with image)
      const formData = await request.formData()
      prompt = formData.get('prompt') as string
      category = (formData.get('category') as string) || 'photorealistic'
      imageFile = formData.get('image') as File
    } else {
      // Handle JSON (without image)
      const body = await request.json()
      prompt = body.prompt
      category = body.category || 'photorealistic'
    }

    if (!prompt || !prompt.trim()) {
      return NextResponse.json(
        { success: false, error: 'Prompt is required' },
        { status: 400 }
      )
    }

    const genAI = new GoogleGenAI({ apiKey: GOOGLE_API_KEY })

    const improvementPrompt = createImprovementPrompt(prompt, category, !!imageFile)

    // Prepare content parts
    const parts: any[] = [{ text: improvementPrompt }]
    
    // Add image if provided
    if (imageFile) {
      const imageBytes = await imageFile.arrayBuffer()
      const imageBase64 = Buffer.from(imageBytes).toString('base64')
      
      parts.push({
        inlineData: {
          data: imageBase64,
          mimeType: imageFile.type
        }
      })
    }

    const result = await genAI.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: [
        { role: 'user', parts: [{ text: createSystemInstruction() }] },
        { role: 'user', parts }
      ]
    })

    // Create a streaming response
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          let improvedPrompt = ''
          
          for await (const chunk of result) {
            const chunkText = chunk.text
            if (chunkText) {
              improvedPrompt += chunkText
              
              // Send streaming chunk
              const data = JSON.stringify({
                type: 'chunk',
                content: chunkText,
                accumulated: improvedPrompt
              })
              controller.enqueue(encoder.encode(`data: ${data}\n\n`))
            }
          }
          
          // Send final result
          const finalData = JSON.stringify({
            type: 'complete',
            success: true,
            original_prompt: prompt,
            improved_prompt: improvedPrompt.trim(),
            category
          })
          controller.enqueue(encoder.encode(`data: ${finalData}\n\n`))
          
        } catch (streamError) {
          console.error('Streaming error:', streamError)
          const errorData = JSON.stringify({
            type: 'error',
            success: false,
            error: 'Failed to improve prompt during streaming'
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
    console.error('Prompt improvement error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to improve prompt' },
      { status: 500 }
    )
  }
}