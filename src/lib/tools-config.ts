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
  },
  {
    id: 'ocr',
    name: 'OCR Tool',
    description: 'Trích xuất văn bản từ hình ảnh bằng AI',
    icon: 'ScanText',
    category: 'ai',
    path: '/tools/ocr',
    component: lazy(() => import('@/tools/ocr'))
  },
  {
    id: 'pomodoro',
    name: 'Pomodoro Timer',
    description: 'Bộ đếm thời gian tập trung sử dụng kỹ thuật Pomodoro để tăng năng suất',
    icon: 'Timer',
    category: 'productivity',
    path: '/tools/pomodoro',
    component: lazy(() => import('@/tools/pomodoro'))
  },
  {
    id: 'token-generator',
    name: 'Token Generator',
    description: 'Tạo chuỗi ngẫu nhiên với các ký tự bạn muốn, chữ hoa, chữ thường, số và/hoặc ký hiệu',
    icon: 'Key',
    category: 'utilities',
    path: '/tools/token-generator',
    component: lazy(() => import('@/tools/token-generator'))
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
  },
  {
    id: 'ai',
    name: 'AI & Machine Learning',
    description: 'Công cụ sử dụng trí tuệ nhân tạo',
    tools: TOOLS_REGISTRY.filter(tool => tool.category === 'ai')
  },
  {
    id: 'productivity',
    name: 'Năng suất',
    description: 'Công cụ tăng năng suất làm việc',
    tools: TOOLS_REGISTRY.filter(tool => tool.category === 'productivity')
  }
];

export function getToolById(id: string): ToolConfig | undefined {
  return TOOLS_REGISTRY.find(tool => tool.id === id);
}