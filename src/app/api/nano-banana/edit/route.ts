import { NextRequest, NextResponse } from 'next/server'
const { GoogleGenAI } = require('@google/genai')

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const image = formData.get('image') as File
    const prompt = formData.get('prompt') as string || ''
    const editInstruction = formData.get('edit_instruction') as string
    const style = formData.get('style') as string || 'photorealistic'
    const quality = formData.get('quality') as string || 'ultra'

    if (!image || !editInstruction) {
      return NextResponse.json(
        { success: false, error: 'Image and edit instruction are required' },
        { status: 400 }
      )
    }

    // Initialize Gemini AI
    const genAI = new GoogleGenAI({
      apiKey: process.env.GOOGLE_API_KEY
    })

    // Convert image to base64
    const imageBuffer = await image.arrayBuffer()
    const base64Image = Buffer.from(imageBuffer).toString('base64')

    // Enhance prompt based on style
    const stylePrompts = {
      photorealistic: 'Create a photorealistic image with natural lighting and realistic details.',
      artistic: 'Create an artistic interpretation with creative flair and expressive style.',
      cartoon: 'Create a cartoon-style image with bold colors and simplified forms.',
      anime: 'Create an anime-style image with characteristic anime aesthetics.',
      abstract: 'Create an abstract artistic interpretation with creative visual elements.'
    }

    const enhancedPrompt = `${stylePrompts[style as keyof typeof stylePrompts] || stylePrompts.photorealistic} ${prompt ? `Image description: ${prompt}. ` : ''}Edit instruction: ${editInstruction}. Quality: ${quality}.`

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

    const parts = candidates[0].content.parts
    let imageData = null

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
