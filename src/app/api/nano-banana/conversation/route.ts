import { NextRequest, NextResponse } from 'next/server'
const { GoogleGenAI } = require('@google/genai')

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { conversation_id, previous_image_data, edit_instruction, style, quality } = body

    if (!previous_image_data || !edit_instruction) {
      return NextResponse.json(
        { success: false, error: 'Previous image data and edit instruction are required' },
        { status: 400 }
      )
    }

    // Initialize Gemini AI
    const genAI = new GoogleGenAI({
      apiKey: process.env.GOOGLE_API_KEY
    })

    // Enhance prompt based on style and quality
    const stylePrompts = {
      photorealistic: 'Maintain photorealistic quality with natural lighting and realistic details.',
      artistic: 'Apply artistic enhancements with creative flair and expressive style.',
      cartoon: 'Transform to cartoon-style with bold colors and simplified forms.',
      anime: 'Apply anime-style characteristics and aesthetics.',
      abstract: 'Create abstract artistic interpretations with creative visual elements.'
    }

    const qualityPrompts = {
      ultra: 'Ultra high quality with maximum detail and precision.',
      high: 'High quality with excellent detail and clarity.',
      medium: 'Good quality with balanced detail and processing speed.',
      low: 'Basic quality for quick processing.'
    }

    const stylePrompt = stylePrompts[style as keyof typeof stylePrompts] || stylePrompts.photorealistic
    const qualityPrompt = qualityPrompts[quality as keyof typeof qualityPrompts] || qualityPrompts.ultra

    const enhancedPrompt = `Based on the provided image, make the following refinement: ${edit_instruction}. ${stylePrompt} ${qualityPrompt} Maintain the overall composition while implementing the requested changes precisely.`

    // Prepare the content for Gemini
    const content = [
      { text: enhancedPrompt },
      {
        inlineData: {
          mimeType: 'image/png',
          data: previous_image_data
        }
      }
    ]

    // Generate refined image with Gemini
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
      image_data: imageData,
      conversation_id: conversation_id || `conv_${Date.now()}`
    })

  } catch (error) {
    console.error('Error in conversation refinement:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to refine image' },
      { status: 500 }
    )
  }
}