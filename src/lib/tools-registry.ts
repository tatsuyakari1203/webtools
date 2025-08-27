import { Calculator, Type, Hash, Code, Palette, Clock } from "lucide-react"
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
    id: "hash-generator",
    name: "Hash Generator",
    description: "Tạo hash MD5, SHA1, SHA256 cho văn bản",
    category: "Security",
    icon: Hash,
    path: "/tools/hash-generator",
    featured: false,
  },
  {
    id: "base64-encoder",
    name: "Base64 Encoder/Decoder",
    description: "Mã hóa và giải mã Base64",
    category: "Encoding",
    icon: Code,
    path: "/tools/base64-encoder",
    featured: false,
  },
  {
    id: "color-picker",
    name: "Color Picker",
    description: "Chọn màu và chuyển đổi giữa các định dạng màu",
    category: "Design",
    icon: Palette,
    path: "/tools/color-picker",
    featured: false,
  },
  {
    id: "timestamp-converter",
    name: "Timestamp Converter",
    description: "Chuyển đổi timestamp và định dạng thời gian",
    category: "Time",
    icon: Clock,
    path: "/tools/timestamp-converter",
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