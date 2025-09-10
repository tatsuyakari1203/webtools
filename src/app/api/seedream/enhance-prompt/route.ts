import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'

function createSeedreamPromptEnhancement(originalPrompt: string, category: string): string {
  // Chỉ hỗ trợ image editing
  const basePrompt = `Enhance this image editing instruction to be more specific and detailed: "${originalPrompt}"

Transform the instruction into a comprehensive editing guide that includes:
- Specific adjustment values and techniques
- Target areas or elements to modify
- Visual effects and enhancements to apply
- Color, lighting, and composition improvements
- Professional editing workflow steps

Examples:
• "Make it brighter" → "Increase overall exposure by +0.7 stops, lift shadows by 25%, enhance highlights in the sky area while preserving detail, boost vibrance by 15% for warmer tones, apply subtle HDR effect to balance contrast"
• "Add vintage effect" → "Apply warm color grading with lifted blacks and faded highlights, add subtle film grain texture, reduce saturation by 10%, apply vignette effect with 20% opacity, enhance golden hour tones in highlights"
• "Improve colors" → "Enhance color vibrancy using selective color adjustments, boost blues in sky by +20%, warm up skin tones with +5 temperature, increase saturation in greens by 15%, apply color balance correction for natural look"

Provide the enhanced editing instruction:`;

  return basePrompt;
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
    const { prompt, category = 'text-to-image' } = body

    if (!prompt || !prompt.trim()) {
      return NextResponse.json(
        { success: false, error: 'Prompt is required' },
        { status: 400 }
      )
    }

    const genAI = new GoogleGenAI({ apiKey: GOOGLE_API_KEY })

    const enhancementPrompt = createSeedreamPromptEnhancement(prompt, category)

    const result = await genAI.models.generateContent({
      model: 'models/gemini-1.5-flash',
      contents: enhancementPrompt
    })

    const candidates = result.candidates
    if (!candidates || candidates.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No enhanced prompt generated' },
        { status: 500 }
      )
    }

    const parts = candidates[0].content?.parts
    let enhancedPrompt = ''

    if (!parts) {
      return NextResponse.json(
        { success: false, error: 'No content parts found in response' },
        { status: 500 }
      )
    }

    for (const part of parts) {
      if (part.text) {
        enhancedPrompt += part.text
      }
    }

    if (!enhancedPrompt) {
      return NextResponse.json(
        { success: false, error: 'Failed to enhance prompt' },
        { status: 500 }
      )
    }

    // Ensure enhanced prompt doesn't exceed 2000 characters
    let finalPrompt = enhancedPrompt.trim()
    if (finalPrompt.length > 2000) {
      finalPrompt = finalPrompt.substring(0, 2000).trim()
      // Try to cut at the last complete sentence
      const lastPeriod = finalPrompt.lastIndexOf('.')
      const lastExclamation = finalPrompt.lastIndexOf('!')
      const lastQuestion = finalPrompt.lastIndexOf('?')
      const lastSentenceEnd = Math.max(lastPeriod, lastExclamation, lastQuestion)
      
      if (lastSentenceEnd > 1800) { // Only cut at sentence if it's not too short
        finalPrompt = finalPrompt.substring(0, lastSentenceEnd + 1)
      }
    }

    return NextResponse.json({
      success: true,
      original_prompt: prompt,
      enhanced_prompt: finalPrompt,
      category
    })

  } catch (error) {
    console.error('Seedream prompt enhancement error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to enhance prompt' },
      { status: 500 }
    )
  }
}