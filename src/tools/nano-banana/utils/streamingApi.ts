/**
 * Utility functions for handling streaming API responses
 */

export interface StreamingResponse {
  type: 'chunk' | 'complete' | 'error'
  content?: string
  accumulated?: string
  success?: boolean
  original_prompt?: string
  improved_prompt?: string
  category?: string
  error?: string
}

/**
 * Handle streaming response from improve-prompt API
 */
export async function handleStreamingImprovePrompt(
  prompt: string,
  category: string,
  onChunk?: (chunk: string, accumulated: string) => void,
  onComplete?: (improvedPrompt: string) => void,
  onError?: (error: string) => void
): Promise<string> {
  try {
    const response = await fetch('/api/nano-banana/improve-prompt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: prompt.trim(),
        category
      })
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('No response body reader available')
    }

    const decoder = new TextDecoder()
    let improvedPrompt = ''

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data: StreamingResponse = JSON.parse(line.slice(6))
              
              if (data.type === 'chunk' && data.content) {
                onChunk?.(data.content, data.accumulated || '')
              } else if (data.type === 'complete') {
                if (data.success && data.improved_prompt) {
                  improvedPrompt = data.improved_prompt
                  onComplete?.(improvedPrompt)
                } else {
                  throw new Error(data.error || 'Failed to improve prompt')
                }
              } else if (data.type === 'error') {
                throw new Error(data.error || 'Streaming error occurred')
              }
            } catch (parseError) {
              // Skip malformed JSON lines
              console.warn('Failed to parse streaming data:', parseError)
            }
          }
        }
      }
    } finally {
      reader.releaseLock()
    }

    if (!improvedPrompt) {
      throw new Error('No improved prompt received')
    }

    return improvedPrompt
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    onError?.(errorMessage)
    throw error
  }
}

/**
 * Fallback function for non-streaming API calls (backward compatibility)
 */
export async function handleNonStreamingImprovePrompt(
  prompt: string,
  category: string
): Promise<string> {
  const response = await fetch('/api/nano-banana/improve-prompt', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt: prompt.trim(),
      category
    })
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }

  const data = await response.json()
  if (data.success && data.improved_prompt) {
    return data.improved_prompt
  } else {
    throw new Error(data.error || 'Failed to improve prompt')
  }
}