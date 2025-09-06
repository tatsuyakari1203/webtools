import { getToolById } from "@/lib/tools-registry"
import { notFound } from "next/navigation"
import { ToolStructuredData } from "@/components/StructuredData"
import { loadDynamicComponent } from "@/lib/dynamic-component-loader"
import type { Metadata } from "next"

interface ToolPageProps {
  params: Promise<{ toolId: string }>
}

export default async function ToolPage({ params }: ToolPageProps) {
  const { toolId } = await params
  const tool = getToolById(toolId)
  
  if (!tool) {
    notFound()
  }

  const toolUrl = `https://webtools.example.com/tools/${toolId}`

  // Load component dynamically from componentPath
  const ToolComponent = loadDynamicComponent(tool.componentPath)

  // Extract icon from tool to avoid passing non-serializable objects
  const { icon, ...toolWithoutIcon } = tool
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _unused = icon

  return (
    <>
      <ToolStructuredData tool={toolWithoutIcon} url={toolUrl} />
      <ToolComponent tool={toolWithoutIcon} />
    </>
  )
}

// Generate metadata for each tool
export async function generateMetadata({ params }: ToolPageProps): Promise<Metadata> {
  const { toolId } = await params
  const tool = getToolById(toolId)
  
  if (!tool) {
    return {
      title: 'Tool Not Found',
      description: 'The requested tool could not be found.',
    }
  }

  const toolUrl = `https://webtools.example.com/tools/${toolId}`
  
  return {
    title: `${tool.name} - WebTools Platform`,
    description: tool.description,
    keywords: [tool.name, tool.category, 'online tool', 'free tool', 'web tool'],
    openGraph: {
      title: `${tool.name} - WebTools Platform`,
      description: tool.description,
      url: toolUrl,
      type: 'website',
      siteName: 'WebTools Platform',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${tool.name} - WebTools Platform`,
      description: tool.description,
    },
    alternates: {
      canonical: toolUrl,
    },
  }
}

// Generate static params for known tools
export async function generateStaticParams() {
  // Import tools registry dynamically to avoid build issues
  const { toolsRegistry } = await import("@/lib/tools-registry")
  
  return toolsRegistry.map((tool) => ({
    toolId: tool.id,
  }))
}