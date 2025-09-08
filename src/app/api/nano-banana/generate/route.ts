import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'

export async function POST(request: NextRequest) {
  const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY

  if (!GOOGLE_API_KEY) {
    return NextResponse.json(
      { success: false, error: 'GOOGLE_API_KEY is not configured' },
      { status: 500 }
    )
  }

  const ai = new GoogleGenAI({ apiKey: GOOGLE_API_KEY })
  try {
    const body = await request.json()
    const { prompt, width = 1024, height = 1024, style = 'photorealistic' } = body

    if (!prompt || !prompt.trim()) {
      return NextResponse.json(
        { success: false, error: 'Prompt is required' },
        { status: 400 }
      )
    }

    // Use original prompt without style-based enhancement to avoid result distortion
    // Add size specification to prompt
    const finalPrompt = `${prompt}, ${width}x${height} resolution`

    const response = await ai.models.generateContent({
      model: 'models/gemini-2.5-flash-image-preview',
      contents: [{
        parts: [{ text: finalPrompt }]
      }]
    })

    // Extract image data from response
    const candidates = response.candidates
    if (!candidates || candidates.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No image generated' },
        { status: 500 }
      )
    }

    const parts = candidates[0].content?.parts
    let imageData = null

    if (!parts) {
      return NextResponse.json(
        { success: false, error: 'No content parts found in response' },
        { status: 500 }
      )
    }

    for (const part of parts) {
      if (part.inlineData) {
        imageData = part.inlineData.data
        break
      }
    }

    if (!imageData) {
      return NextResponse.json(
        { success: false, error: 'No image data found in response' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      image_data: imageData,
      prompt: finalPrompt,
      width,
      height,
      style
    })

  } catch (error) {
    console.error('Image generation error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate image' },
      { status: 500 }
    )
  }
}
