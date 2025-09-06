'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toolsRegistry } from '@/lib/tools-registry';

export default function ToolsGrid() {
  
  const getCategoryName = (categoryId: string) => {
    const categoryMap: Record<string, string> = {
      'Math': 'Toán học',
      'Text': 'Văn bản', 
      'Image': 'Hình ảnh',
      'AI': 'Trí tuệ nhân tạo',
      'Developer': 'Phát triển',
      'Productivity': 'Năng suất',
      'Network': 'Mạng',
      'Utilities': 'Tiện ích'
    };
    return categoryMap[categoryId] || categoryId;
  };

  return (
    <section id="tools" className="container space-y-6 py-8 md:py-12 lg:py-24">
      <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
        <h2 className="font-heading text-3xl leading-[1.1] sm:text-3xl md:text-6xl">
          Available Tools
        </h2>
        <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
          Chọn công cụ phù hợp với nhu cầu của bạn
        </p>
      </div>
      
      <div className="mx-auto grid justify-center gap-4 sm:grid-cols-2 md:max-w-[64rem] md:grid-cols-3">
        {toolsRegistry.map((tool) => {
          const IconComponent = tool.icon;
          return (
            <Link key={tool.id} href={tool.path}>
              <Card className="h-full transition-colors hover:bg-muted/50">
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <IconComponent className="h-8 w-8" />
                    <CardTitle className="text-xl">{tool.name}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <CardDescription className="text-sm">
                    {tool.description}
                  </CardDescription>
                  <Badge variant="secondary" className="text-xs">
                    {getCategoryName(tool.category)}
                  </Badge>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
      
      {toolsRegistry.length === 0 && (
        <div className="mx-auto max-w-[58rem] text-center">
          <p className="text-muted-foreground">
            Chưa có tools nào được thêm vào. Hãy quay lại sau!
          </p>
        </div>
      )}
    </section>
  );
}