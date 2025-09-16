import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'

function createSystemInstruction(): string {
  return `You are an expert prompt engineer specializing in Gemini 2.5 Flash image generation. Your expertise includes:

- Understanding visual composition and storytelling
- Crafting descriptive, narrative-driven prompts
- Optimizing prompts for different image categories
- Balancing technical specifications with creative vision

Core Principle: Describe the scene, don't just list keywords. Use rich, narrative descriptions that leverage the model's deep language understanding.

Your enhanced prompts should read like detailed scene descriptions or visual narratives, creating cohesive stories of what should be seen rather than disconnected keyword lists.`;
}

function createImprovementPrompt(originalPrompt: string, category: string): string {
  const basePrompt = `Enhance and improve the following prompt for ${category} image generation:

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
- Being highly specific about the desired changes with rich descriptive language
- Adding comprehensive quality details (lighting, colors, composition, mood)
- Describing the desired visual outcome as a complete scene
- Creating actionable instructions that tell a visual story
- Specifying the transformation in narrative, descriptive terms
- Ensuring the edit instruction reads like a scene description`
  };

  const guidance = categorySpecificGuidance[category as keyof typeof categorySpecificGuidance] || categorySpecificGuidance.photorealistic;

  return `${basePrompt}${guidance}

Provide an improved version that reads like a detailed scene description or visual narrative. Focus on creating a cohesive, descriptive paragraph that tells the story of what should be seen, rather than a list of disconnected elements. The enhanced prompt should leverage Gemini 2.5 Flash's strength in understanding rich, descriptive language.`;
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
    const { prompt, category = 'photorealistic' } = body

    if (!prompt || !prompt.trim()) {
      return NextResponse.json(
        { success: false, error: 'Prompt is required' },
        { status: 400 }
      )
    }

    const genAI = new GoogleGenAI({ apiKey: GOOGLE_API_KEY })

    const improvementPrompt = createImprovementPrompt(prompt, category)

    const result = await genAI.models.generateContentStream({
      model: 'gemini-2.5-flash',
      systemInstruction: createSystemInstruction(),
      generationConfig: {
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 8192,
      },
      thinkingConfig: {
        includeThinkingInResponse: true
      },
      contents: [{ role: 'user', parts: [{ text: improvementPrompt }] }]
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