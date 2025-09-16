'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react'

interface NanoBananaState {
  // Generate tab state
  generatePrompt: string
  generateImageSize: number[]
  generateImageCount: number[]
  
  // Edit tab state
  editImage: File | null
  editImagePreview: string | null
  editPrompt: string
  editInstruction: string
  
  // Compose tab state
  composeImages: File[]
  composeImagePreviews: string[]
  composePrompt: string
  composeCompositionType: string
  
  // Style Transfer tab state
  styleContentImage: File | null
  styleStyleImage: File | null
  styleContentImagePreview: string
  styleStyleImagePreview: string
  stylePrompt: string
  styleStrength: number[]
  
  // Session management
  conversationId: string | null
  lastGeneratedImages: string[]
}

interface NanoBananaContextType {
  state: NanoBananaState
  updateGenerateState: (updates: Partial<Pick<NanoBananaState, 'generatePrompt' | 'generateImageSize' | 'generateImageCount'>>) => void
  updateEditState: (updates: Partial<Pick<NanoBananaState, 'editImage' | 'editImagePreview' | 'editPrompt' | 'editInstruction'>>) => void
  updateComposeState: (updates: Partial<Pick<NanoBananaState, 'composeImages' | 'composeImagePreviews' | 'composePrompt' | 'composeCompositionType'>>) => void
  updateStyleState: (updates: Partial<Pick<NanoBananaState, 'styleContentImage' | 'styleStyleImage' | 'styleContentImagePreview' | 'styleStyleImagePreview' | 'stylePrompt' | 'styleStrength'>>) => void
  startNewSession: () => void
  setConversationId: (id: string | null) => void
  setLastGeneratedImages: (images: string[]) => void
}

const defaultState: NanoBananaState = {
  // Generate tab state
  generatePrompt: '',
  generateImageSize: [1024, 1024],
  generateImageCount: [1],
  
  // Edit tab state
  editImage: null,
  editImagePreview: '',
  editPrompt: '',
  editInstruction: '',
  
  // Compose tab state
  composeImages: [],
  composeImagePreviews: [],
  composePrompt: '',
  composeCompositionType: 'combine',
  
  // Style Transfer tab state
  styleContentImage: null,
  styleStyleImage: null,
  styleContentImagePreview: '',
  styleStyleImagePreview: '',
  stylePrompt: '',
  styleStrength: [0.5],
  
  // Session management
  conversationId: null,
  lastGeneratedImages: []
}

const NanoBananaContext = createContext<NanoBananaContextType | undefined>(undefined)

export function NanoBananaProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<NanoBananaState>(defaultState)
  
  const updateGenerateState = (updates: Partial<Pick<NanoBananaState, 'generatePrompt' | 'generateImageSize' | 'generateImageCount'>>) => {
    setState(prev => ({ ...prev, ...updates }))
  }
  
  const updateEditState = (updates: Partial<Pick<NanoBananaState, 'editImage' | 'editImagePreview' | 'editPrompt' | 'editInstruction'>>) => {
    setState(prev => ({ ...prev, ...updates }))
  }
  
  const updateComposeState = (updates: Partial<Pick<NanoBananaState, 'composeImages' | 'composeImagePreviews' | 'composePrompt' | 'composeCompositionType'>>) => {
    setState(prev => ({ ...prev, ...updates }))
  }
  
  const updateStyleState = (updates: Partial<Pick<NanoBananaState, 'styleContentImage' | 'styleStyleImage' | 'styleContentImagePreview' | 'styleStyleImagePreview' | 'stylePrompt' | 'styleStrength'>>) => {
    setState(prev => ({ ...prev, ...updates }))
  }
  
  const startNewSession = () => {
    setState(prev => ({ ...prev, conversationId: null }))
  }
  
  const setConversationId = (id: string | null) => {
    setState(prev => ({ ...prev, conversationId: id }))
  }
  
  const setLastGeneratedImages = (images: string[]) => {
    setState(prev => ({ ...prev, lastGeneratedImages: images }))
  }

  return (
    <NanoBananaContext.Provider value={{
      state,
      updateGenerateState,
      updateEditState,
      updateComposeState,
      updateStyleState,
      startNewSession,
      setConversationId,
      setLastGeneratedImages
    }}>
      {children}
    </NanoBananaContext.Provider>
  )
}

export function useNanoBanana() {
  const context = useContext(NanoBananaContext)
  if (context === undefined) {
    throw new Error('useNanoBanana must be used within a NanoBananaProvider')
  }
  return context
}