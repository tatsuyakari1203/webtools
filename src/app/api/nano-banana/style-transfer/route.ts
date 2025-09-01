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

  const genAI = new GoogleGenAI({ apiKey: GOOGLE_API_KEY })

  try {
    const formData = await request.formData()
    const contentImage = formData.get('content_image') as File
    const styleImage = formData.get('style_image') as File
    const prompt = formData.get('prompt') as string
    const intensity = formData.get('intensity') as string || '0.5'
    const quality = formData.get('quality') as string || 'ultra'

    if (!contentImage || !styleImage || !prompt) {
      return NextResponse.json(
        { success: false, error: 'Content image, style image, and prompt are required' },
        { status: 400 }
      )
    }

    // Convert images to base64
    const contentBuffer = await contentImage.arrayBuffer()
    const styleBuffer = await styleImage.arrayBuffer()
    const contentBase64 = Buffer.from(contentBuffer).toString('base64')
    const styleBase64 = Buffer.from(styleBuffer).toString('base64')

    // Create enhanced prompt for style transfer
    const intensityValue = parseFloat(intensity)
    let intensityDescription = ''
    if (intensityValue <= 0.3) {
      intensityDescription = 'Apply the style subtly, maintaining most of the original content characteristics.'
    } else if (intensityValue <= 0.7) {
      intensityDescription = 'Apply the style moderately, balancing original content with style elements.'
    } else {
      intensityDescription = 'Apply the style strongly, emphasizing the style characteristics while preserving content structure.'
    }

    const enhancedPrompt = `Transfer the artistic style from the second image to the first image. ${intensityDescription} ${prompt}. Quality: ${quality}. Maintain the composition and main elements of the content image while adopting the visual style, color palette, and artistic techniques from the style reference.`

    // Prepare the content for Gemini
    const content = [
      { text: enhancedPrompt },
      {
        inlineData: {
          mimeType: contentImage.type,
          data: contentBase64
        }
      },
      {
        inlineData: {
          mimeType: styleImage.type,
          data: styleBase64
        }
      }
    ]

    // Generate style-transferred image with Gemini
    const response = await genAI.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: content
    })

    // Extract image data from response
    const candidates = response.candidates
    if (!candidates || candidates.length === 0) {
      throw new Error('No image generated')
    }

    const parts = candidates[0].content?.parts
    let imageData = null

    if (!parts) {
      throw new Error('No content parts found in response')
    }

    for (const part of parts) {
      if (part.inlineData) {
        imageData = part.inlineData.data
        break
      }
    }

    if (!imageData) {
      throw new Error('No image data found in response')
    }

    return NextResponse.json({
      success: true,
      image_data: imageData
    })

  } catch (error) {
    console.error('Error in style transfer:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to transfer style' },
      { status: 500 }
    )
  }
}
