import { Banana, Calculator, Crop, FileCode, FileText, Globe, Image, ImageIcon, Key, Palette, ScanText, Timer, Type } from "lucide-react"
import React from "react"

export interface Tool {
  id: string
  name: string
  description: string
  category: string
  icon: React.ComponentType<{ className?: string }>
  path: string
  featured?: boolean
  componentPath: string
  requiresInvite?: boolean
  allowedUsers?: string[]
  inviteDescription?: string
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
    componentPath: "@/tools/calculator/Calculator",
  },
  {
    id: "text-formatter",
    name: "Text Formatter",
    description: "Format and transform text in various ways",
    category: "Text",
    icon: Type,
    path: "/tools/text-formatter",
    featured: false,
    componentPath: "@/components/tools/TextFormatterTool",
  },
  {
    id: "image-name-processor",
    name: "Image Name Processor",
    description: "Process and optimize image file names for easy searching in Lightroom",
    category: "Image",
    icon: Image,
    path: "/tools/image-name-processor",
    featured: true,
    componentPath: "@/tools/image-name-processor/ImageNameProcessor",
  },
  {
    id: "image-converter",
    name: "Image Converter",
    description: "Convert, compress, and optimize images with bulk processing support",
    category: "Image",
    icon: ImageIcon,
    path: "/tools/image-converter",
    featured: false,
    componentPath: "@/tools/image-converter",
  },
  {
    id: "google-docs-to-markdown",
    name: "Google Docs to Markdown",
    description: "Convert Google Docs content to Markdown format with advanced formatting support",
    category: "Text",
    icon: FileText,
    path: "/tools/google-docs-to-markdown",
    featured: true,
    componentPath: "@/tools/google-docs-to-markdown/GoogleDocsToMarkdown",
  },
  {
    id: "ocr",
    name: "OCR Tool",
    description: "Extract text from images using AI",
    category: "AI",
    icon: ScanText,
    path: "/tools/ocr",
    featured: false,
    componentPath: "@/tools/ocr/OCRTool",
  },
  {
    id: "codebase2json",
    name: "Codebase to JSON",
    description: "Convert codebase structure and content to JSON format for analysis",
    category: "Developer",
    icon: FileCode,
    path: "/tools/codebase2json",
    featured: false,
    componentPath: "@/tools/codebase2json",
  },
  {
    id: "pomodoro",
    name: "Pomodoro Timer",
    description: "Focus timer using the Pomodoro Technique for productivity",
    category: "Productivity",
    icon: Timer,
    path: "/tools/pomodoro",
    featured: true,
    componentPath: "@/tools/pomodoro/PomodoroTimer",
  },
  {
    id: "nano-banana",
    name: "Nano Banana",
    description: "AI-powered image generation, editing and composition tool using Gemini AI",
    category: "AI",
    icon: Banana,
    path: "/tools/nano-banana",
    featured: true,
    componentPath: "@/tools/nano-banana/NanoBanana",
    requiresInvite: true,
    inviteDescription: "This AI tool requires special access due to API costs and usage limits.",
  },
  {
    id: "social-crop",
    name: "Social Crop",
    description: "Crop and resize images for perfect social media posts",
    category: "Image",
    icon: Crop,
    path: "/tools/social-crop",
    featured: false,
    componentPath: "@/tools/social-crop",
  },
  {
    id: "what-is-my-ip",
    name: "What is my IP?",
    description: "Discover your public IP address and detailed location information",
    category: "Network",
    icon: Globe,
    path: "/tools/what-is-my-ip",
    featured: false,
    componentPath: "@/tools/what-is-my-ip",
  },
  {
    id: "token-generator",
    name: "Token Generator",
    description: "Generate random string with the chars you want, uppercase or lowercase letters, numbers and/or symbols",
    category: "Utilities",
    icon: Key,
    path: "/tools/token-generator",
    featured: false,
    componentPath: "@/tools/token-generator",
  },




  {
    id: "ai-image-studio",
    name: "AI Image Studio",
    description: "Edit images with advanced AI models like Seedream and Flux Kontext",
    category: "AI",
    icon: Palette,
    path: "/tools/ai-image-studio",
    featured: true,
    componentPath: "@/tools/ai-image-studio/AIImageStudio",
    requiresInvite: true,
    inviteDescription: "This AI tool requires special access due to API costs and usage limits.",
  },
  {
    id: "frame",
    name: "Frame",
    description: "Create professional photo frames with EXIF metadata and camera information",
    category: "Image",
    icon: ImageIcon,
    path: "/tools/frame",
    featured: false,
    componentPath: "@/components/tools/ComingSoonTool",
  },]

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

export const getProtectedTools = (): Tool[] => {
  return toolsRegistry.filter(tool => tool.requiresInvite)
}

export const isToolProtected = (toolId: string): boolean => {
  const tool = getToolById(toolId)
  return tool?.requiresInvite || false
}

export const getToolInviteInfo = (toolId: string): { requiresInvite: boolean; description?: string; allowedUsers?: string[] } => {
  const tool = getToolById(toolId)
  return {
    requiresInvite: tool?.requiresInvite || false,
    description: tool?.inviteDescription,
    allowedUsers: tool?.allowedUsers
  }
}

export const canUserAccessTool = (toolId: string, userName: string): boolean => {
  const tool = getToolById(toolId)
  if (!tool?.requiresInvite) {
    return true // Public tool
  }
  
  if (!tool.allowedUsers) {
    return true // No user restrictions
  }
  
  return tool.allowedUsers.includes(userName)
}