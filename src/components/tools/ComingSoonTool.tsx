import { Button } from "@/components/ui/button"

import { Badge } from "@/components/ui/badge"
import { Construction, ArrowLeft, Star } from "lucide-react"
import Link from "next/link"
import { Tool } from "@/lib/tools-registry"

interface ComingSoonToolProps {
  tool: Tool
}

export default function ComingSoonTool({ tool }: ComingSoonToolProps) {
  return (
    <div className="max-w-2xl mx-auto text-center">
      <div className="space-y-6">
        <div className="pb-6">
          <div className="mx-auto mb-4 rounded-full bg-muted p-6 w-fit">
            <Construction className="h-12 w-12 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-semibold">
            Tool Under Development
          </h1>
          <p className="text-lg text-muted-foreground mt-2">
            {tool.name} will be available on the platform soon
          </p>
        </div>
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
              <span>This feature is currently under development</span>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild variant="outline">
                <Link href="/">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Home
                </Link>
              </Button>
              
              <Button asChild>
                <Link href="/#tools">
                  Explore Other Tools
                </Link>
              </Button>
            </div>
          </div>
      </div>
    </div>
  )
}