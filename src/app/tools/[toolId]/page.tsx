import { getToolById } from "@/lib/tools-registry"
import { notFound } from "next/navigation"
import Calculator from "@/tools/calculator/Calculator"
import TextFormatterTool from "@/components/tools/TextFormatterTool"
import ImageNameProcessor from "@/tools/image-name-processor/ImageNameProcessor"
import ImageConverter from "@/tools/image-converter"
import GoogleDocsToMarkdown from "@/tools/google-docs-to-markdown/GoogleDocsToMarkdown"
import OCRTool from "@/tools/ocr/OCRTool"
import Codebase2Json from "@/tools/codebase2json"
import PomodoroTimer from "@/tools/pomodoro/PomodoroTimer"
import NanoBanana from "@/tools/nano-banana/NanoBanana"
import SocialCrop from "@/tools/social-crop"
import WhatIsMyIP from "@/tools/what-is-my-ip"
import ComingSoonTool from "@/components/tools/ComingSoonTool"
import { ToolStructuredData } from "@/components/StructuredData"
import type { Metadata } from "next"

interface ToolPageProps {
  params: Promise<{ toolId: string }>
}

export default async function ToolPage({ params }: ToolPageProps) {
  const { toolId } = await params
  const tool = getToolById(toolId)
  
  if (!tool) {
    notFound()
  }

  const toolUrl = `https://webtools.example.com/tools/${toolId}`

  // Render specific tool component based on toolId
  const renderTool = () => {
    switch (toolId) {
      case "calculator":
        return <Calculator />
      case "text-formatter":
        return <TextFormatterTool />
      case "image-name-processor":
        return <ImageNameProcessor />
      case "image-converter":
        return <ImageConverter />
      case "google-docs-to-markdown":
        return <GoogleDocsToMarkdown />
      case "ocr":
        return <OCRTool />
      case "codebase2json":
        return <Codebase2Json />
      case "pomodoro":
        return <PomodoroTimer />
      case "nano-banana":
        return <NanoBanana />
      case "social-crop":
        return <SocialCrop />
      case "what-is-my-ip":
        return <WhatIsMyIP />
      default:
        return <ComingSoonTool tool={tool} />
    }
  }

  return (
    <>
      <ToolStructuredData tool={tool} url={toolUrl} />
      {renderTool()}
    </>
  )
}

// Generate metadata for each tool
export async function generateMetadata({ params }: ToolPageProps): Promise<Metadata> {
  const { toolId } = await params
  const tool = getToolById(toolId)
  
  if (!tool) {
    return {
      title: 'Tool Not Found',
      description: 'The requested tool could not be found.',
    }
  }

  const toolUrl = `https://webtools.example.com/tools/${toolId}`
  
  return {
    title: `${tool.name} - WebTools Platform`,
    description: tool.description,
    keywords: [tool.name, tool.category, 'online tool', 'free tool', 'web tool'],
    openGraph: {
      title: `${tool.name} - WebTools Platform`,
      description: tool.description,
      url: toolUrl,
      type: 'website',
      siteName: 'WebTools Platform',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${tool.name} - WebTools Platform`,
      description: tool.description,
    },
    alternates: {
      canonical: toolUrl,
    },
  }
}

// Generate static params for known tools
export async function generateStaticParams() {
  // Import tools registry dynamically to avoid build issues
  const { toolsRegistry } = await import("@/lib/tools-registry")
  
  return toolsRegistry.map((tool) => ({
    toolId: tool.id,
  }))
}