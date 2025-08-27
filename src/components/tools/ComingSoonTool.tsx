import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Construction, ArrowLeft, Star } from "lucide-react"
import Link from "next/link"
import { Tool } from "@/lib/tools-registry"

interface ComingSoonToolProps {
  tool: Tool
}

export default function ComingSoonTool({ tool }: ComingSoonToolProps) {
  return (
    <div className="max-w-2xl mx-auto">
      <Card className="text-center">
        <CardHeader className="pb-6">
          <div className="mx-auto mb-4 rounded-full bg-muted p-6 w-fit">
            <Construction className="h-12 w-12 text-muted-foreground" />
          </div>
          <CardTitle className="text-2xl">
            Công cụ đang được phát triển
          </CardTitle>
          <CardDescription className="text-lg">
            {tool.name} sẽ sớm có mặt trên nền tảng
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="rounded-lg bg-muted/50 p-6">
            <div className="flex items-center justify-center gap-3 mb-3">
              <tool.icon className="h-6 w-6 text-primary" />
              <h3 className="font-semibold text-lg">{tool.name}</h3>
              <Badge variant="secondary">{tool.category}</Badge>
            </div>
            <p className="text-muted-foreground">
              {tool.description}
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Star className="h-4 w-4" />
              <span>Tính năng này đang trong quá trình phát triển</span>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild variant="outline">
                <Link href="/">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Quay về trang chủ
                </Link>
              </Button>
              
              <Button asChild>
                <Link href="/#tools">
                  Khám phá công cụ khác
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}