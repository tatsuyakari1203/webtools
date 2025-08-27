import { Calculator, Type, Image } from "lucide-react"
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
    featured: true,
  },
  {
    id: "text-formatter",
    name: "Text Formatter",
    description: "Định dạng và chuyển đổi văn bản theo nhiều cách khác nhau",
    category: "Text",
    icon: Type,
    path: "/tools/text-formatter",
    featured: true,
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