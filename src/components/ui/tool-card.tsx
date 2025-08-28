import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { Tool } from "@/lib/tools-registry"

interface ToolCardProps {
  tool: Tool
}

export function ToolCard({ tool }: ToolCardProps) {
  const IconComponent = tool.icon

  return (
    <Card className="group relative overflow-hidden transition-all duration-200 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1 h-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="rounded-lg bg-primary/10 p-2 group-hover:bg-primary/20 transition-colors">
              <IconComponent className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold group-hover:text-primary transition-colors">
                {tool.name}
              </CardTitle>
              <Badge variant="secondary" className="mt-1 text-xs">
                {tool.category}
              </Badge>
            </div>
          </div>
          {tool.featured && (
            <Badge className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
              Featured
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 flex flex-col flex-1">
        <CardDescription className="text-sm text-muted-foreground mb-4 line-clamp-2 mt-auto">
          {tool.description}
        </CardDescription>
        
        <Button asChild className="w-full group/button">
          <Link href={tool.path}>
            Use Tool
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/button:translate-x-1" />
          </Link>
        </Button>
      </CardContent>
      
      {/* Hover effect overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
    </Card>
  )
}