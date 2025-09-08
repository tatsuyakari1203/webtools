import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'

function createImprovementPrompt(originalPrompt: string, category: string): string {
  const categoryPrompts = {
    photorealistic: `
You are an expert photography prompt writer. Transform the following basic prompt into a concise, improved photorealistic image description.

Original prompt: "${originalPrompt}"

Improve this prompt by:
1. Adding basic lighting and atmosphere (avoid overly technical camera details)
2. Including key environmental context
3. Mentioning important visual elements and composition
4. Keep it concise and editable - avoid excessive technical jargon

Write a clear, moderate-length description that enhances the original while staying flexible for further editing.

Improved prompt:`,

    artistic: `
You are an expert art prompt writer. Transform the following basic prompt into a concise, improved artistic image description.

Original prompt: "${originalPrompt}"

Improve this prompt by:
1. Adding artistic style and basic medium
2. Including color palette and mood
3. Mentioning key composition elements
4. Keep it concise and editable - avoid overly complex artistic jargon

Write a clear, moderate-length description that enhances the original while staying flexible for further editing.

Improved prompt:`,

    product: `
You are an expert product photography prompt writer. Transform the following basic prompt into a detailed commercial product image description.

Original prompt: "${originalPrompt}"

Improve this prompt by:
1. Describing professional studio lighting setup
2. Specifying background and surface details
3. Adding camera angle and composition
4. Including product positioning and presentation
5. Mentioning quality and commercial appeal

Write a single, cohesive paragraph that describes a professional product shot.

Improved prompt:`,

    minimalist: `
You are an expert minimalist design prompt writer. Transform the following basic prompt into a detailed minimalist image description.

Original prompt: "${originalPrompt}"

Improve this prompt by:
1. Emphasizing negative space and simplicity
2. Describing clean, uncluttered composition
3. Specifying minimal color palette
4. Adding subtle lighting and shadows
5. Focusing on essential elements only

Write a single, cohesive paragraph that describes a clean, minimalist scene.

Improved prompt:`,

    illustration: `
You are an expert illustration prompt writer. Transform the following basic prompt into a concise, improved illustration description.

Original prompt: "${originalPrompt}"

Improve this prompt by:
1. Adding illustration style and basic technique
2. Including color scheme and visual approach
3. Mentioning key design elements
4. Keep it concise and editable - avoid overly technical illustration terms

Write a clear, moderate-length description that enhances the original while staying flexible for further editing.

Improved prompt:`,

    logo: `
You are an expert logo design prompt writer. Transform the following basic prompt into a detailed logo design description.

Original prompt: "${originalPrompt}"

Improve this prompt by:
1. Specifying design style and approach
2. Describing typography and text treatment
3. Adding color scheme and visual elements
4. Including brand personality and target audience
5. Mentioning scalability and versatility

Write a single, cohesive paragraph that describes the logo design concept.

Improved prompt:`,

    edit: `
Improve the following edit instruction to be more specific and actionable:

Original: "${originalPrompt}"

Enhance it by:
1. Being more specific about what to change
2. Adding quality details (lighting, colors, composition)
3. Describing the desired visual outcome clearly
4. Keeping it concise but comprehensive

Improved instruction:`
  }

  return categoryPrompts[category as keyof typeof categoryPrompts] || categoryPrompts.photorealistic
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

    const result = await genAI.models.generateContent({
      model: 'models/gemini-1.5-flash',
      contents: improvementPrompt
    })

    const candidates = result.candidates
    if (!candidates || candidates.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No improved prompt generated' },
        { status: 500 }
      )
    }

    const parts = candidates[0].content?.parts
    let improvedPrompt = ''

    if (!parts) {
      return NextResponse.json(
        { success: false, error: 'No content parts found in response' },
        { status: 500 }
      )
    }

    for (const part of parts) {
      if (part.text) {
        improvedPrompt += part.text
      }
    }

    if (!improvedPrompt) {
      return NextResponse.json(
        { success: false, error: 'Failed to improve prompt' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      original_prompt: prompt,
      improved_prompt: improvedPrompt.trim(),
      category
    })

  } catch (error) {
    console.error('Prompt improvement error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to improve prompt' },
      { status: 500 }
    )
  }
}