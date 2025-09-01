import { NextRequest, NextResponse } from 'next/server'
const { GoogleGenAI } = require('@google/genai')

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY

if (!GOOGLE_API_KEY) {
  throw new Error('GOOGLE_API_KEY is required')
}

const ai = new GoogleGenAI({ apiKey: GOOGLE_API_KEY })

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { prompt, width = 1024, height = 1024, style = 'photorealistic', quality = 'ultra' } = body

    if (!prompt || !prompt.trim()) {
      return NextResponse.json(
        { success: false, error: 'Prompt is required' },
        { status: 400 }
      )
    }

    // Enhance prompt based on style
    let enhancedPrompt = prompt
    switch (style) {
      case 'photorealistic':
        enhancedPrompt = `${prompt}, photorealistic, high quality, detailed, professional photography`
        break
      case 'artistic':
        enhancedPrompt = `${prompt}, artistic style, creative, expressive, fine art`
        break
      case 'cartoon':
        enhancedPrompt = `${prompt}, cartoon style, animated, colorful, fun`
        break
      case 'anime':
        enhancedPrompt = `${prompt}, anime style, manga, Japanese animation`
        break
      case 'abstract':
        enhancedPrompt = `${prompt}, abstract art, conceptual, modern art`
        break
    }

    // Add size specification to prompt
    enhancedPrompt += `, ${width}x${height} resolution`

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: enhancedPrompt,
    })

    // Extract image data from response
    const candidates = response.candidates
    if (!candidates || candidates.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No image generated' },
        { status: 500 }
      )
    }

    const parts = candidates[0].content.parts
    let imageData = null

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
      prompt: enhancedPrompt,
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
