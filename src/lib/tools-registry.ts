import { Calculator, Type, Image, ImageIcon, FileText } from "lucide-react"
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
    description: "Máy tính cơ bản với các phép toán số học",
    category: "Math",
    icon: Calculator,
    path: "/tools/calculator",
    featured: false,
  },
  {
    id: "text-formatter",
    name: "Text Formatter",
    description: "Định dạng và chuyển đổi văn bản theo nhiều cách khác nhau",
    category: "Text",
    icon: Type,
    path: "/tools/text-formatter",
    featured: false,
  },
  {
    id: "image-name-processor",
    name: "Xử lý tên ảnh",
    description: "Xử lý và tối ưu hóa tên file ảnh để dễ tìm kiếm trong Lightroom",
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