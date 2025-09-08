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
    const image = formData.get('image') as File
    const prompt = formData.get('prompt') as string || ''
    const editInstruction = formData.get('edit_instruction') as string
    const quality = formData.get('quality') as string || 'ultra'

    if (!image || !editInstruction) {
      return NextResponse.json(
        { success: false, error: 'Image and edit instruction are required' },
        { status: 400 }
      )
    }

    // Convert image to base64
    const imageBuffer = await image.arrayBuffer()
    const base64Image = Buffer.from(imageBuffer).toString('base64')

    // Create simple prompt for editing
    const enhancedPrompt = `${prompt ? `Image description: ${prompt}. ` : ''}Edit instruction: ${editInstruction}. Quality: ${quality}.`

    // Prepare the content for Gemini
    const content = [
      { text: enhancedPrompt },
      {
        inlineData: {
          mimeType: image.type,
          data: base64Image
        }
      }
    ]

    // Generate edited image with Gemini
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
    console.error('Error in image editing:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to edit image' },
      { status: 500 }
    )
  }
}
