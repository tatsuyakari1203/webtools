'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ChevronDown, ChevronRight, BookOpen, Lightbulb, Camera, Palette, Edit, Layers, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PromptExample {
  title: string
  prompt: string
  category: string
  description?: string
}

const PromptGuideTab: React.FC = () => {
  const [language, setLanguage] = useState<'vi' | 'en'>('vi')
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    basics: true,
    photorealistic: false,
    stylized: false,
    text: false,
    product: false,
    editing: false,
    composition: false,
    advanced: false
  })

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const content = {
    vi: {
      title: "Hướng Dẫn Viết Prompt",
      subtitle: "Tối ưu hóa prompt để tạo ra hình ảnh chất lượng cao với Gemini 2.5 Flash",
      principle: {
        title: "Nguyên Tắc Cơ Bản",
        content: "Mô tả cảnh, đừng chỉ liệt kê từ khóa. Sức mạnh cốt lõi của mô hình là khả năng hiểu ngôn ngữ sâu sắc. Một đoạn văn mô tả, tường thuật sẽ luôn tạo ra hình ảnh tốt hơn và mạch lạc hơn so với danh sách các từ không liên quan."
      },
      sections: {
        basics: {
          title: "Kỹ Thuật Cơ Bản",
          icon: BookOpen,
          tips: [
            "Sử dụng mô tả chi tiết thay vì từ khóa rời rạc",
            "Bao gồm thông tin về ánh sáng, góc máy, và bối cảnh",
            "Chỉ định tỷ lệ khung hình (landscape, portrait, square)",
            "Sử dụng thuật ngữ nhiếp ảnh cho hình ảnh thực tế",
            "Mô tả cảm xúc và tâm trạng mong muốn"
          ]
        },
        photorealistic: {
          title: "Hình Ảnh Thực Tế",
          icon: Camera,
          description: "Sử dụng thuật ngữ nhiếp ảnh để tạo hình ảnh chân thực",
          examples: [
            {
              title: "Chân dung chuyên nghiệp",
              prompt: "Một bức chân dung cận cảnh chân thực của một nghệ nhân gốm người Nhật lớn tuổi với những nếp nhăn sâu do nắng và nụ cười ấm áp, hiểu biết. Ông đang cẩn thận kiểm tra một chiếc chén trà vừa tráng men. Bối cảnh là xưởng làm việc mộc mạc, ngập tràn ánh nắng. Cảnh được chiếu sáng bởi ánh sáng vàng óng mềm mại của giờ vàng xuyên qua cửa sổ, làm nổi bật kết cấu tinh tế của đất sét. Chụp bằng ống kính chân dung 85mm, tạo nền mờ mềm mại (bokeh). Tâm trạng tổng thể là thanh thản và thành thạo. Định hướng chân dung dọc.",
              category: "Chân dung"
            }
          ]
        },
        stylized: {
          title: "Minh Họa Phong Cách",
          icon: Palette,
          description: "Tạo sticker, icon hoặc tài sản với phong cách rõ ràng",
          examples: [
            {
              title: "Sticker kawaii",
              prompt: "Một sticker phong cách kawaii của một chú gấu trúc đỏ vui vẻ đội chiếc mũ tre nhỏ. Nó đang nhai một lá tre xanh. Thiết kế có đường viền đậm, sạch, tô màu cel đơn giản và bảng màu sống động. Nền phải là màu trắng.",
              category: "Sticker"
            }
          ]
        },
        text: {
          title: "Văn Bản Trong Hình",
          icon: Edit,
          description: "Gemini xuất sắc trong việc hiển thị văn bản",
          examples: [
            {
              title: "Logo quán cà phê",
              prompt: "Tạo một logo hiện đại, tối giản cho quán cà phê tên 'The Daily Grind'. Văn bản phải có phông chữ sans-serif sạch, đậm. Thiết kế nên có biểu tượng đơn giản, cách điệu của hạt cà phê được tích hợp liền mạch với văn bản. Bảng màu là đen và trắng.",
              category: "Logo"
            }
          ]
        },
        product: {
          title: "Chụp Sản Phẩm",
          icon: Layers,
          description: "Hoàn hảo cho tạo ảnh sản phẩm sạch, chuyên nghiệp",
          examples: [
            {
              title: "Ảnh sản phẩm studio",
              prompt: "Một bức ảnh sản phẩm độ phân giải cao, chiếu sáng studio của một chiếc cốc cà phê gốm tối giản màu đen mờ, được trình bày trên bề mặt bê tông đánh bóng. Ánh sáng là thiết lập softbox ba điểm được thiết kế để tạo ra những điểm sáng mềm mại, khuếch tán và loại bỏ bóng đổ khắc nghiệt. Góc máy là góc chụp hơi nâng 45 độ để thể hiện những đường nét sạch sẽ. Siêu thực tế, với tiêu điểm sắc nét trên hơi nước bốc lên từ cà phê. Hình vuông.",
              category: "Sản phẩm"
            }
          ]
        },
        editing: {
          title: "Chỉnh Sửa Hình Ảnh",
          icon: Edit,
          description: "Thêm, xóa hoặc sửa đổi các yếu tố trong hình ảnh",
          examples: [
            {
              title: "Thêm phụ kiện",
              prompt: "Sử dụng hình ảnh được cung cấp của con mèo của tôi, vui lòng thêm một chiếc mũ phù thủy len nhỏ trên đầu nó. Làm cho nó trông như đang ngồi thoải mái và phù hợp với ánh sáng mềm mại của bức ảnh.",
              category: "Chỉnh sửa"
            }
          ]
        },
        composition: {
          title: "Kết Hợp Nhiều Hình",
          icon: Layers,
          description: "Sử dụng nhiều hình ảnh để tạo cảnh mới",
          examples: [
            {
              title: "Thời trang e-commerce",
              prompt: "Tạo một bức ảnh thời trang e-commerce chuyên nghiệp. Lấy chiếc váy hoa xanh từ hình đầu tiên và để người phụ nữ từ hình thứ hai mặc nó. Tạo một bức ảnh toàn thân thực tế của người phụ nữ mặc váy, với ánh sáng và bóng đổ được điều chỉnh để phù hợp với môi trường ngoài trời.",
              category: "Kết hợp"
            }
          ]
        },
        advanced: {
          title: "Kỹ Thuật Nâng Cao",
          icon: Lightbulb,
          tips: [
            "Sử dụng hướng dẫn từng bước cho cảnh phức tạp",
            "Áp dụng 'Semantic Negative Prompts' - mô tả tích cực thay vì phủ định",
            "Kiểm soát máy ảnh với thuật ngữ điện ảnh",
            "Lặp lại và tinh chỉnh qua nhiều lượt hội thoại",
            "Bảo tồn chi tiết quan trọng bằng mô tả chi tiết"
          ]
        }
      }
    },
    en: {
      title: "Prompt Writing Guide",
      subtitle: "Optimize prompts to create high-quality images with Gemini 2.5 Flash",
      principle: {
        title: "Core Principle",
        content: "Describe the scene, don't just list keywords. The model's core strength is its deep language understanding. A narrative, descriptive paragraph will almost always produce a better, more coherent image than a list of disconnected words."
      },
      sections: {
        basics: {
          title: "Basic Techniques",
          icon: BookOpen,
          tips: [
            "Use detailed descriptions instead of scattered keywords",
            "Include information about lighting, camera angles, and context",
            "Specify aspect ratio (landscape, portrait, square)",
            "Use photography terms for realistic images",
            "Describe desired emotions and mood"
          ]
        },
        photorealistic: {
          title: "Photorealistic Images",
          icon: Camera,
          description: "Use photography terms to create realistic images",
          examples: [
            {
              title: "Professional portrait",
              prompt: "A photorealistic close-up portrait of an elderly Japanese ceramicist with deep, sun-etched wrinkles and a warm, knowing smile. He is carefully inspecting a freshly glazed tea bowl. The setting is his rustic, sun-drenched workshop. The scene is illuminated by soft, golden hour light streaming through a window, highlighting the fine texture of the clay. Captured with an 85mm portrait lens, resulting in a soft, blurred background (bokeh). The overall mood is serene and masterful. Vertical portrait orientation.",
              category: "Portrait"
            }
          ]
        },
        stylized: {
          title: "Stylized Illustrations",
          icon: Palette,
          description: "Create stickers, icons, or assets with clear style",
          examples: [
            {
              title: "Kawaii sticker",
              prompt: "A kawaii-style sticker of a happy red panda wearing a tiny bamboo hat. It's munching on a green bamboo leaf. The design features bold, clean outlines, simple cel-shading, and a vibrant color palette. The background must be white.",
              category: "Sticker"
            }
          ]
        },
        text: {
          title: "Text in Images",
          icon: Edit,
          description: "Gemini excels at rendering text",
          examples: [
            {
              title: "Coffee shop logo",
              prompt: "Create a modern, minimalist logo for a coffee shop called 'The Daily Grind'. The text should be in a clean, bold, sans-serif font. The design should feature a simple, stylized icon of a coffee bean seamlessly integrated with the text. The color scheme is black and white.",
              category: "Logo"
            }
          ]
        },
        product: {
          title: "Product Photography",
          icon: Layers,
          description: "Perfect for creating clean, professional product shots",
          examples: [
            {
              title: "Studio product shot",
              prompt: "A high-resolution, studio-lit product photograph of a minimalist ceramic coffee mug in matte black, presented on a polished concrete surface. The lighting is a three-point softbox setup designed to create soft, diffused highlights and eliminate harsh shadows. The camera angle is a slightly elevated 45-degree shot to showcase its clean lines. Ultra-realistic, with sharp focus on the steam rising from the coffee. Square image.",
              category: "Product"
            }
          ]
        },
        editing: {
          title: "Image Editing",
          icon: Edit,
          description: "Add, remove, or modify elements in images",
          examples: [
            {
              title: "Adding accessories",
              prompt: "Using the provided image of my cat, please add a small, knitted wizard hat on its head. Make it look like it's sitting comfortably and matches the soft lighting of the photo.",
              category: "Editing"
            }
          ]
        },
        composition: {
          title: "Multi-Image Composition",
          icon: Layers,
          description: "Use multiple images to create new scenes",
          examples: [
            {
              title: "E-commerce fashion",
              prompt: "Create a professional e-commerce fashion photo. Take the blue floral dress from the first image and let the woman from the second image wear it. Generate a realistic, full-body shot of the woman wearing the dress, with the lighting and shadows adjusted to match the outdoor environment.",
              category: "Composition"
            }
          ]
        },
        advanced: {
          title: "Advanced Techniques",
          icon: Lightbulb,
          tips: [
            "Use step-by-step instructions for complex scenes",
            "Apply 'Semantic Negative Prompts' - describe positively instead of negatively",
            "Control camera with cinematic language",
            "Iterate and refine through multiple conversation turns",
            "Preserve critical details with detailed descriptions"
          ]
        }
      }
    }
  }

  const currentContent = content[language]

  const renderSection = (sectionKey: string, section: any) => {
    const IconComponent = section.icon
    const isOpen = openSections[sectionKey]

    return (
      <Collapsible key={sectionKey} open={isOpen} onOpenChange={() => toggleSection(sectionKey)}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between p-4 h-auto">
            <div className="flex items-center gap-3">
              <IconComponent className="h-5 w-5 text-primary" />
              <div className="text-left">
                <h3 className="font-semibold">{section.title}</h3>
                {section.description && (
                  <p className="text-sm text-muted-foreground">{section.description}</p>
                )}
              </div>
            </div>
            {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="px-4 pb-4">
          <div className="space-y-4">
            {section.tips && (
              <ul className="space-y-2">
                {section.tips.map((tip: string, index: number) => (
                  <li key={index} className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                    <span className="text-sm">{tip}</span>
                  </li>
                ))}
              </ul>
            )}
            {section.examples && (
              <div className="space-y-3">
                {section.examples.map((example: PromptExample, index: number) => (
                  <Card key={index} className="border-l-4 border-l-primary">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm">{example.title}</CardTitle>
                        <Badge variant="secondary" className="text-xs">{example.category}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {example.prompt}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    )
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              {currentContent.title}
            </CardTitle>
            <CardDescription className="mt-1">
              {currentContent.subtitle}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={language === 'vi' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setLanguage('vi')}
              className="flex items-center gap-1"
            >
              🇻🇳 Tiếng Việt
            </Button>
            <Button
              variant={language === 'en' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setLanguage('en')}
              className="flex items-center gap-1"
            >
              🇺🇸 English
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-6">
            {/* Core Principle */}
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-primary" />
                  {currentContent.principle.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">
                  {currentContent.principle.content}
                </p>
              </CardContent>
            </Card>

            <Separator />

            {/* Sections */}
            <div className="space-y-2">
              {Object.entries(currentContent.sections).map(([key, section]) =>
                renderSection(key, section)
              )}
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

export default PromptGuideTab