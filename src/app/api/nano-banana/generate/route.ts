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
    const { prompt, width = 1024, height = 1024, style = 'photorealistic', num_images = 1 } = body

    if (!prompt || !prompt.trim()) {
      return NextResponse.json(
        { success: false, error: 'Prompt is required' },
        { status: 400 }
      )
    }

    // Validate num_images
    const imageCount = Math.min(Math.max(1, parseInt(num_images) || 1), 4)

    // Use original prompt without style-based enhancement to avoid result distortion
    // Add size specification to prompt
    const finalPrompt = `${prompt}, ${width}x${height} resolution`

    // Generate multiple images by making multiple API calls
    const imagePromises = Array.from({ length: imageCount }, async () => {
      const response = await ai.models.generateContent({
        model: 'models/gemini-2.5-flash-image',
        contents: [{
          parts: [{ text: finalPrompt }]
        }]
      })

      // Extract image data from response
      const candidates = response.candidates
      if (!candidates || candidates.length === 0) {
        throw new Error('No image generated')
      }

      const parts = candidates[0].content?.parts
      if (!parts) {
        throw new Error('No content parts found in response')
      }

      for (const part of parts) {
        if (part.inlineData) {
          return part.inlineData.data
        }
      }

      throw new Error('No image data found in response')
    })

    const imageDataArray = await Promise.all(imagePromises)

    console.log('API Debug - imageCount:', imageCount)
    console.log('API Debug - imageDataArray.length:', imageDataArray.length)
    console.log('API Debug - returning array:', imageCount !== 1)

    const response = {
      success: true,
      image_data: imageCount === 1 ? imageDataArray[0] : imageDataArray,
      prompt: finalPrompt,
      width,
      height,
      style,
      num_images: imageCount
    }

    console.log('API Debug - response.image_data is array:', Array.isArray(response.image_data))

    return NextResponse.json(response)

  } catch (error) {
    console.error('Image generation error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate image' },
      { status: 500 }
    )
  }
}
