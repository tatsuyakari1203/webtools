import { ToolConfig, ToolCategory } from '@/types/tools';
import { lazy } from 'react';

export const TOOLS_REGISTRY: ToolConfig[] = [
  {
    id: 'calculator',
    name: 'Calculator',
    description: 'Máy tính đơn giản với các phép toán cơ bản',
    icon: 'Calculator',
    category: 'utilities',
    path: '/tools/calculator',
    component: lazy(() => import('@/tools/calculator'))
  },
  {
    id: 'text-formatter',
    name: 'Text Formatter',
    description: 'Định dạng và chỉnh sửa văn bản',
    icon: 'FileText',
    category: 'text',
    path: '/tools/text-formatter',
    component: lazy(() => import('@/tools/text-formatter'))
  },
  {
    id: 'image-name-processor',
    name: 'Xử lý tên ảnh',
    description: 'Xử lý và tối ưu hóa tên file ảnh để dễ tìm kiếm trong Lightroom',
    icon: 'Image',
    category: 'image',
    path: '/tools/image-name-processor',
    component: lazy(() => import('@/tools/image-name-processor'))
  },
  {
    id: 'image-converter',
    name: 'Image Converter',
    description: 'Convert, compress, and optimize images with bulk processing support',
    icon: 'ImageIcon',
    category: 'image',
    path: '/tools/image-converter',
    component: lazy(() => import('@/tools/image-converter'))
  }
];

export const TOOL_CATEGORIES: ToolCategory[] = [
  {
    id: 'utilities',
    name: 'Tiện ích',
    description: 'Các công cụ tiện ích hàng ngày',
    tools: TOOLS_REGISTRY.filter(tool => tool.category === 'utilities')
  },
  {
    id: 'text',
    name: 'Văn bản',
    description: 'Công cụ xử lý văn bản',
    tools: TOOLS_REGISTRY.filter(tool => tool.category === 'text')
  },
  {
    id: 'image',
    name: 'Hình ảnh',
    description: 'Công cụ xử lý hình ảnh',
    tools: TOOLS_REGISTRY.filter(tool => tool.category === 'image')
  }
];

export function getToolById(id: string): ToolConfig | undefined {
  return TOOLS_REGISTRY.find(tool => tool.id === id);
}