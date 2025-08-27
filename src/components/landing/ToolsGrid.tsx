'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TOOLS_REGISTRY, TOOL_CATEGORIES } from '@/tools';
import { Calculator, FileText, Wrench, Type } from 'lucide-react';

const iconMap = {
  Calculator,
  FileText,
  Wrench,
  Type
};

export default function ToolsGrid() {
  const getIcon = (iconName: string) => {
    const Icon = iconMap[iconName as keyof typeof iconMap] || Wrench;
    return <Icon className="h-8 w-8" />;
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
        {TOOLS_REGISTRY.map((tool) => (
          <Link key={tool.id} href={tool.path}>
            <Card className="h-full transition-colors hover:bg-muted/50">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  {getIcon(tool.icon)}
                  <CardTitle className="text-xl">{tool.name}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <CardDescription className="text-sm">
                  {tool.description}
                </CardDescription>
                <Badge variant="secondary" className="text-xs">
                  {TOOL_CATEGORIES.find(cat => cat.id === tool.category)?.name || tool.category}
                </Badge>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
      
      {TOOLS_REGISTRY.length === 0 && (
        <div className="mx-auto max-w-[58rem] text-center">
          <p className="text-muted-foreground">
            Chưa có tools nào được thêm vào. Hãy quay lại sau!
          </p>
        </div>
      )}
    </section>
  );
}