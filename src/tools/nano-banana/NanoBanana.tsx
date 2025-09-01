'use client'

import React, { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Wand2, Edit, Combine, Palette } from 'lucide-react'
import { GenerateTab } from './components/GenerateTab'
import { EditTab } from './components/EditTab'
import { ComposeTab } from './components/ComposeTab'
import { StyleTransferTab } from './components/StyleTransferTab'
import { ResultDisplay } from './components/ResultDisplay'

const NanoBanana: React.FC = () => {
  const [activeTab, setActiveTab] = useState('generate')
  const [loading, setLoading] = useState(false)
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="flex items-center justify-center gap-2 text-3xl font-bold">
          <Wand2 className="h-8 w-8" />
          Nano Banana - AI Image Generator
        </h1>
        <p className="text-muted-foreground">
          Generate, edit, and transform images using advanced AI
        </p>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Left Panel - Controls */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="generate" className="flex items-center gap-1">
              <Wand2 className="h-4 w-4" />
              Generate
            </TabsTrigger>
            <TabsTrigger value="edit" className="flex items-center gap-1">
              <Edit className="h-4 w-4" />
              Edit
            </TabsTrigger>
            <TabsTrigger value="compose" className="flex items-center gap-1">
              <Combine className="h-4 w-4" />
              Compose
            </TabsTrigger>
            <TabsTrigger value="style" className="flex items-center gap-1">
              <Palette className="h-4 w-4" />
              Style
            </TabsTrigger>
          </TabsList>

          <TabsContent value="generate">
            <GenerateTab 
              loading={loading}
              setLoading={setLoading}
              setGeneratedImage={setGeneratedImage}
            />
          </TabsContent>

          <TabsContent value="edit">
            <EditTab 
              loading={loading}
              setLoading={setLoading}
              setGeneratedImage={setGeneratedImage}
            />
          </TabsContent>

          <TabsContent value="compose">
            <ComposeTab 
              loading={loading}
              setLoading={setLoading}
              setGeneratedImage={setGeneratedImage}
            />
          </TabsContent>

          <TabsContent value="style">
            <StyleTransferTab 
              loading={loading}
              setLoading={setLoading}
              setGeneratedImage={setGeneratedImage}
            />
          </TabsContent>
        </Tabs>

        {/* Right Panel - Result */}
        <ResultDisplay 
          image={generatedImage}
          loading={loading}
          setGeneratedImage={setGeneratedImage}
          setLoading={setLoading}
        />
      </div>
    </div>
  )
}

export default NanoBanana