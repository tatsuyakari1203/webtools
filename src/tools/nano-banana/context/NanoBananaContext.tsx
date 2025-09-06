'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react'

interface NanoBananaState {
  // Generate tab state
  generatePrompt: string
  generateStyle: string
  generateImageSize: number[]
  
  // Edit tab state
  editImage: File | null
  editImagePreview: string | null
  editPrompt: string
  editInstruction: string
  editStyle: string
  
  // Compose tab state
  composeImages: File[]
  composeImagePreviews: string[]
  composePrompt: string
  composeCompositionType: string
  composeStyle: string
  
  // Style Transfer tab state
  styleContentImage: File | null
  styleStyleImage: File | null
  styleContentImagePreview: string
  styleStyleImagePreview: string
  stylePrompt: string
  styleStrength: number[]
}

interface NanoBananaContextType {
  state: NanoBananaState
  updateGenerateState: (updates: Partial<Pick<NanoBananaState, 'generatePrompt' | 'generateStyle' | 'generateImageSize'>>) => void
  updateEditState: (updates: Partial<Pick<NanoBananaState, 'editImage' | 'editImagePreview' | 'editPrompt' | 'editInstruction' | 'editStyle'>>) => void
  updateComposeState: (updates: Partial<Pick<NanoBananaState, 'composeImages' | 'composeImagePreviews' | 'composePrompt' | 'composeCompositionType' | 'composeStyle'>>) => void
  updateStyleState: (updates: Partial<Pick<NanoBananaState, 'styleContentImage' | 'styleStyleImage' | 'styleContentImagePreview' | 'styleStyleImagePreview' | 'stylePrompt' | 'styleStrength'>>) => void
}

const defaultState: NanoBananaState = {
  // Generate tab
  generatePrompt: '',
  generateStyle: 'photorealistic',
  generateImageSize: [1024],
  
  // Edit tab
  editImage: null,
  editImagePreview: null,
  editPrompt: '',
  editInstruction: '',
  editStyle: 'photorealistic',
  
  // Compose tab
  composeImages: [],
  composeImagePreviews: [],
  composePrompt: '',
  composeCompositionType: 'combine',
  composeStyle: 'photorealistic',
  
  // Style Transfer tab
  styleContentImage: null,
  styleStyleImage: null,
  styleContentImagePreview: '',
  styleStyleImagePreview: '',
  stylePrompt: '',
  styleStrength: [0.7]
}

const NanoBananaContext = createContext<NanoBananaContextType | undefined>(undefined)

export function NanoBananaProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<NanoBananaState>(defaultState)
  
  const updateGenerateState = (updates: Partial<Pick<NanoBananaState, 'generatePrompt' | 'generateStyle' | 'generateImageSize'>>) => {
    setState(prev => ({ ...prev, ...updates }))
  }
  
  const updateEditState = (updates: Partial<Pick<NanoBananaState, 'editImage' | 'editImagePreview' | 'editPrompt' | 'editInstruction' | 'editStyle'>>) => {
    setState(prev => ({ ...prev, ...updates }))
  }
  
  const updateComposeState = (updates: Partial<Pick<NanoBananaState, 'composeImages' | 'composeImagePreviews' | 'composePrompt' | 'composeCompositionType' | 'composeStyle'>>) => {
    setState(prev => ({ ...prev, ...updates }))
  }
  
  const updateStyleState = (updates: Partial<Pick<NanoBananaState, 'styleContentImage' | 'styleStyleImage' | 'styleContentImagePreview' | 'styleStyleImagePreview' | 'stylePrompt' | 'styleStrength'>>) => {
    setState(prev => ({ ...prev, ...updates }))
  }
  
  return (
    <NanoBananaContext.Provider value={{
      state,
      updateGenerateState,
      updateEditState,
      updateComposeState,
      updateStyleState
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