import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { getToolById } from "@/lib/tools-registry"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Home } from "lucide-react"
import ToolsSidebar from "@/components/layout/ToolsSidebar"
import SidebarToggle from "@/components/layout/SidebarToggle"
import { SidebarProvider } from "@/components/layout/SidebarContext"

interface ToolLayoutProps {
  children: React.ReactNode
  params: Promise<{ toolId: string }>
}

export default async function ToolLayout({ children, params }: ToolLayoutProps) {
  const { toolId } = await params
  const tool = getToolById(toolId)
  
  if (!tool) {
    notFound()
  }

  const IconComponent = tool.icon

  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <ToolsSidebar className="hidden lg:flex" />
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          <div className="container mx-auto px-4 py-8">
            {/* Header with toggles */}
            <div className="flex items-center gap-2 mb-6">
              <div className="hidden lg:block">
                <SidebarToggle />
              </div>
            </div>
          
          {/* Breadcrumb Navigation */}
          <div className="mb-8">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href="/" className="flex items-center gap-2">
                      <Home className="h-4 w-4" />
                      Home
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href="/#tools">Tools</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{tool.name}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          {/* Tool Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="rounded-lg bg-primary/10 p-3">
                <IconComponent className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">{tool.name}</h1>
                <p className="text-lg text-muted-foreground mt-1">{tool.description}</p>
              </div>
            </div>
          </div>

          {/* Tool Content */}
          <div className="bg-white/10 dark:bg-black/10 backdrop-blur-md rounded-lg border border-white/20 dark:border-white/10 p-6">
            {children}
          </div>
          </div>
        </div>
      </div>
    </SidebarProvider>
  )
}