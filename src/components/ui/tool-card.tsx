import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { Tool } from "@/lib/tools-registry"
import { cn } from "@/lib/utils"

interface ToolCardProps {
  tool: Tool
}

export function ToolCard({ tool }: ToolCardProps) {
  const IconComponent = tool.icon

  return (
    <Card className="group h-full transition-all duration-200 hover:shadow-md border-border/50 hover:border-border">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/20 transition-colors group-hover:bg-primary/15">
              <IconComponent className="h-6 w-6 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-lg font-semibold leading-tight tracking-tight text-foreground group-hover:text-primary transition-colors">
                {tool.name}
              </CardTitle>
              <Badge 
                variant="secondary" 
                className={cn(
                  "mt-2 text-xs font-medium",
                  "bg-secondary/80 text-secondary-foreground"
                )}
              >
                {tool.category}
              </Badge>
            </div>
          </div>
          {tool.featured && (
            <Badge className="bg-primary text-primary-foreground shadow-sm">
              Featured
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="flex flex-1 flex-col pt-0">
        <CardDescription className="mb-6 flex-1 text-sm leading-relaxed text-muted-foreground">
          {tool.description}
        </CardDescription>
        
        <Button asChild className="w-full group/button">
          <Link href={tool.path}>
            Use Tool
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/button:translate-x-0.5" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}