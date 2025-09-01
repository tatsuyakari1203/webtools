import { NextRequest, NextResponse } from 'next/server'
const { GoogleGenAI } = require('@google/genai')

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const images = formData.getAll('images') as File[]
    const prompt = formData.get('prompt') as string
    const compositionType = formData.get('composition_type') as string || 'combine'
    const style = formData.get('style') as string || 'photorealistic'
    const quality = formData.get('quality') as string || 'ultra'

    if (!images || images.length < 2 || !prompt) {
      return NextResponse.json(
        { success: false, error: 'At least 2 images and prompt are required' },
        { status: 400 }
      )
    }

    // Initialize Gemini AI
    const genAI = new GoogleGenAI({
      apiKey: process.env.GOOGLE_API_KEY
    })

    // Convert images to base64
    const imageContents = []
    for (const image of images) {
      const imageBuffer = await image.arrayBuffer()
      const base64Image = Buffer.from(imageBuffer).toString('base64')
      imageContents.push({
        inlineData: {
          mimeType: image.type,
          data: base64Image
        }
      })
    }

    // Enhance prompt based on style and composition type
    const stylePrompts = {
      photorealistic: 'Create a photorealistic composition with natural lighting and realistic details.',
      artistic: 'Create an artistic composition with creative flair and expressive style.',
      cartoon: 'Create a cartoon-style composition with bold colors and simplified forms.',
      anime: 'Create an anime-style composition with characteristic anime aesthetics.',
      abstract: 'Create an abstract artistic composition with creative visual elements.'
    }

    const compositionPrompts = {
      collage: 'Create a collage by arranging the images in an artistic layout.',
      blend: 'Seamlessly blend the images together into a unified composition.',
      overlay: 'Layer the images with creative overlays and transparency effects.',
      combine: 'Combine the images into a cohesive scene or narrative.'
    }

    const enhancedPrompt = `${stylePrompts[style as keyof typeof stylePrompts] || stylePrompts.photorealistic} ${compositionPrompts[compositionType as keyof typeof compositionPrompts] || compositionPrompts.combine} ${prompt}. Quality: ${quality}.`

    // Prepare the content for Gemini
    const content = [
      { text: enhancedPrompt },
      ...imageContents
    ]

    // Generate composed image with Gemini
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
    console.error('Error in image composition:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to compose images' },
      { status: 500 }
    )
  }
}
