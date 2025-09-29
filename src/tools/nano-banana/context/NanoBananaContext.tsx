'use client'

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'

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
  editImageDescription: string
  
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
  
  // Prompt history for undo/retry functionality
  originalGeneratePrompt: string
  originalEditPrompt: string
  lastGenerateImproveSettings: {
    category: string
    timestamp: number
  } | null
  lastEditImproveSettings: {
    category: string
    includeImage: boolean
    timestamp: number
  } | null
  
  // Session management
  conversationId: string | null
  lastGeneratedImages: string[]
  
  // Postfix system state
  mainImageIndex: number
  mainImageSize: { width: number; height: number } | null
  autoScaleEnabled: boolean
  
  // Upscale settings
  upscaleEnabled: boolean
}

interface NanoBananaContextType {
  state: NanoBananaState
  updateGenerateState: (updates: Partial<Pick<NanoBananaState, 'generatePrompt' | 'generateImageSize' | 'generateImageCount'>>) => void
  updateEditState: (updates: Partial<Pick<NanoBananaState, 'editImage' | 'editImagePreview' | 'editPrompt' | 'editInstruction' | 'editImageDescription'>>) => void
  updateComposeState: (updates: Partial<Pick<NanoBananaState, 'composeImages' | 'composeImagePreviews' | 'composePrompt' | 'composeCompositionType'>>) => void
  updateStyleState: (updates: Partial<Pick<NanoBananaState, 'styleContentImage' | 'styleStyleImage' | 'styleContentImagePreview' | 'styleStyleImagePreview' | 'stylePrompt' | 'styleStrength'>>) => void

  // Prompt history management
  saveOriginalGeneratePrompt: (prompt: string) => void
  saveOriginalEditPrompt: (prompt: string) => void
  undoGeneratePrompt: () => void
  undoEditPrompt: () => void
  saveGenerateImproveSettings: (category: string) => void
  saveEditImproveSettings: (category: string, includeImage: boolean) => void
  retryGenerateImprove: () => Promise<void>
  retryEditImprove: () => Promise<void>
  canUndoGenerate: () => boolean
  canUndoEdit: () => boolean
  canRetryGenerate: () => boolean
  canRetryEdit: () => boolean

  startNewSession: () => void
  setConversationId: (id: string | null) => void
  setLastGeneratedImages: (images: string[]) => void
  
  // Postfix functions
  setMainImageIndex: (index: number) => void
  setMainImageSize: (size: { width: number; height: number } | null) => void
  setAutoScaleEnabled: (enabled: boolean) => void
  updatePostfixState: (updates: Partial<Pick<NanoBananaState, 'mainImageIndex' | 'mainImageSize' | 'autoScaleEnabled'>>) => void
  
  // Upscale functions
  setUpscaleEnabled: (enabled: boolean) => void
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
  editImageDescription: '',
  
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
  
  // Prompt history for undo/retry functionality
  originalGeneratePrompt: '',
  originalEditPrompt: '',
  lastGenerateImproveSettings: null,
  lastEditImproveSettings: null,
  
  // Session management
  conversationId: null,
  lastGeneratedImages: [],
  
  // Postfix system state
  mainImageIndex: 0,
  mainImageSize: null,
  autoScaleEnabled: true,
  
  // Upscale settings
  upscaleEnabled: false
}

const NanoBananaContext = createContext<NanoBananaContextType | undefined>(undefined)

export function NanoBananaProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<NanoBananaState>(defaultState)
  
  const updateGenerateState = useCallback((updates: Partial<Pick<NanoBananaState, 'generatePrompt' | 'generateImageSize' | 'generateImageCount'>>) => {
    setState(prev => ({ ...prev, ...updates }))
  }, [])
  
  const updateEditState = useCallback((updates: Partial<Pick<NanoBananaState, 'editImage' | 'editImagePreview' | 'editPrompt' | 'editInstruction' | 'editImageDescription'>>) => {
    setState(prev => ({ ...prev, ...updates }))
  }, [])
  
  const updateComposeState = useCallback((updates: Partial<Pick<NanoBananaState, 'composeImages' | 'composeImagePreviews' | 'composePrompt' | 'composeCompositionType'>>) => {
    setState(prev => ({ ...prev, ...updates }))
  }, [])
  
  const updateStyleState = useCallback((updates: Partial<Pick<NanoBananaState, 'styleContentImage' | 'styleStyleImage' | 'styleContentImagePreview' | 'styleStyleImagePreview' | 'stylePrompt' | 'styleStrength'>>) => {
    setState(prev => ({ ...prev, ...updates }))
  }, [])
  
  const startNewSession = useCallback(() => {
    setState(prev => ({ ...prev, conversationId: null }))
  }, [])
  
  const setConversationId = useCallback((id: string | null) => {
    setState(prev => ({ ...prev, conversationId: id }))
  }, [])
  
  const setLastGeneratedImages = useCallback((images: string[]) => {
    setState(prev => ({ ...prev, lastGeneratedImages: images }))
  }, [])

  // Prompt history management methods
  const saveOriginalGeneratePrompt = useCallback((prompt: string) => {
    setState(prev => ({ ...prev, originalGeneratePrompt: prompt }))
  }, [])

  const saveOriginalEditPrompt = useCallback((prompt: string) => {
    setState(prev => ({ ...prev, originalEditPrompt: prompt }))
  }, [])

  const undoGeneratePrompt = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      generatePrompt: prev.originalGeneratePrompt,
      lastGenerateImproveSettings: null
    }))
  }, [])

  const undoEditPrompt = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      editPrompt: prev.originalEditPrompt,
      lastEditImproveSettings: null
    }))
  }, [])

  const saveGenerateImproveSettings = useCallback((category: string) => {
    setState(prev => ({ 
      ...prev, 
      lastGenerateImproveSettings: { category, timestamp: Date.now() }
    }))
  }, [])

  const saveEditImproveSettings = useCallback((category: string, includeImage: boolean) => {
    setState(prev => ({ 
      ...prev, 
      lastEditImproveSettings: { category, includeImage, timestamp: Date.now() }
    }))
  }, [])

  const retryGenerateImprove = useCallback(async () => {
    // This will be implemented by the components that use it
    // as it needs access to the improve prompt logic
  }, [])

  const retryEditImprove = useCallback(async () => {
    // This will be implemented by the components that use it
    // as it needs access to the improve prompt logic
  }, [])

  const canUndoGenerate = useCallback(() => {
    return state.originalGeneratePrompt !== '' && state.generatePrompt !== state.originalGeneratePrompt
  }, [state.originalGeneratePrompt, state.generatePrompt])

  const canUndoEdit = useCallback(() => {
    return state.originalEditPrompt !== '' && state.editPrompt !== state.originalEditPrompt
  }, [state.originalEditPrompt, state.editPrompt])

  const canRetryGenerate = useCallback(() => {
    return state.lastGenerateImproveSettings !== null && state.originalGeneratePrompt !== ''
  }, [state.lastGenerateImproveSettings, state.originalGeneratePrompt])

  const canRetryEdit = useCallback(() => {
    return state.lastEditImproveSettings !== null && state.originalEditPrompt !== ''
  }, [state.lastEditImproveSettings, state.originalEditPrompt])

  // Postfix system functions
  const setMainImageIndex = useCallback((index: number) => {
    setState(prev => ({ ...prev, mainImageIndex: index }))
  }, [])

  const setMainImageSize = useCallback((size: { width: number; height: number } | null) => {
    setState(prev => ({ ...prev, mainImageSize: size }))
  }, [])

  const setAutoScaleEnabled = useCallback((enabled: boolean) => {
    setState(prev => ({ ...prev, autoScaleEnabled: enabled }))
  }, [])

  const updatePostfixState = useCallback((updates: Partial<Pick<NanoBananaState, 'mainImageIndex' | 'mainImageSize' | 'autoScaleEnabled'>>) => {
    setState(prev => ({ ...prev, ...updates }))
  }, [])

  // Upscale system functions
  const setUpscaleEnabled = useCallback((enabled: boolean) => {
    setState(prev => ({ ...prev, upscaleEnabled: enabled }))
  }, [])

  return (
    <NanoBananaContext.Provider value={{
      state,
      updateGenerateState,
      updateEditState,
      updateComposeState,
      updateStyleState,

      // Prompt history management
      saveOriginalGeneratePrompt,
      saveOriginalEditPrompt,
      undoGeneratePrompt,
      undoEditPrompt,
      saveGenerateImproveSettings,
      saveEditImproveSettings,
      retryGenerateImprove,
      retryEditImprove,
      canUndoGenerate,
      canUndoEdit,
      canRetryGenerate,
      canRetryEdit,

      startNewSession,
      setConversationId,
      setLastGeneratedImages,

      // Postfix system management
      setMainImageIndex,
      setMainImageSize,
      setAutoScaleEnabled,
      updatePostfixState,

      // Upscale system management
      setUpscaleEnabled
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