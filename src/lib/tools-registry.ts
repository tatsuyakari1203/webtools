import { Calculator, Type, Image, ImageIcon, FileText, ScanText, FileCode, Timer, Banana, Crop } from "lucide-react"
import React from "react"

export interface Tool {
  id: string
  name: string
  description: string
  category: string
  icon: React.ComponentType<{ className?: string }>
  path: string
  featured?: boolean
}

export const toolsRegistry: Tool[] = [
  {
    id: "calculator",
    name: "Calculator",
    description: "Basic calculator with arithmetic operations",
    category: "Math",
    icon: Calculator,
    path: "/tools/calculator",
    featured: false,
  },
  {
    id: "text-formatter",
    name: "Text Formatter",
    description: "Format and transform text in various ways",
    category: "Text",
    icon: Type,
    path: "/tools/text-formatter",
    featured: false,
  },
  {
    id: "image-name-processor",
    name: "Image Name Processor",
    description: "Process and optimize image file names for easy searching in Lightroom",
    category: "Image",
    icon: Image,
    path: "/tools/image-name-processor",
    featured: true,
  },
  {
    id: "image-converter",
    name: "Image Converter",
    description: "Convert, compress, and optimize images with bulk processing support",
    category: "Image",
    icon: ImageIcon,
    path: "/tools/image-converter",
    featured: false,
  },
  {
    id: "google-docs-to-markdown",
    name: "Google Docs to Markdown",
    description: "Convert Google Docs content to Markdown format with advanced formatting support",
    category: "Text",
    icon: FileText,
    path: "/tools/google-docs-to-markdown",
    featured: true,
  },
  {
    id: "ocr",
    name: "OCR Tool",
    description: "Extract text from images using AI",
    category: "AI",
    icon: ScanText,
    path: "/tools/ocr",
    featured: false,
  },
  {
    id: "codebase2json",
    name: "Codebase to JSON",
    description: "Convert codebase structure and content to JSON format for analysis",
    category: "Developer",
    icon: FileCode,
    path: "/tools/codebase2json",
    featured: false,
  },
  {
    id: "pomodoro",
    name: "Pomodoro Timer",
    description: "Focus timer using the Pomodoro Technique for productivity",
    category: "Productivity",
    icon: Timer,
    path: "/tools/pomodoro",
    featured: true,
  },
  {
    id: "nano-banana",
    name: "Nano Banana",
    description: "AI-powered image generation, editing and composition tool using Gemini AI",
    category: "AI",
    icon: Banana,
    path: "/tools/nano-banana",
    featured: true,
  },
  {
    id: "social-crop",
    name: "Social Crop",
    description: "Crop and resize images for perfect social media posts",
    category: "Image",
    icon: Crop,
    path: "/tools/social-crop",
    featured: false,
  },
]

export const getToolById = (id: string): Tool | undefined => {
  return toolsRegistry.find(tool => tool.id === id)
}

export const getToolsByCategory = (category: string): Tool[] => {
  return toolsRegistry.filter(tool => tool.category === category)
}

export const getFeaturedTools = (): Tool[] => {
  return toolsRegistry.filter(tool => tool.featured)
}

export const getAllCategories = (): string[] => {
  return Array.from(new Set(toolsRegistry.map(tool => tool.category)))
}