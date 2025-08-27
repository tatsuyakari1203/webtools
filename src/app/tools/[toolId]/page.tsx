import { getToolById } from "@/lib/tools-registry"
import { notFound } from "next/navigation"
import CalculatorTool from "@/components/tools/CalculatorTool"
import TextFormatterTool from "@/components/tools/TextFormatterTool"
import ImageNameProcessor from "@/tools/image-name-processor/ImageNameProcessor"
import ImageConverter from "@/tools/image-converter"
import GoogleDocsToMarkdown from "@/tools/google-docs-to-markdown/GoogleDocsToMarkdown"
import ComingSoonTool from "@/components/tools/ComingSoonTool"

interface ToolPageProps {
  params: Promise<{ toolId: string }>
}

export default async function ToolPage({ params }: ToolPageProps) {
  const { toolId } = await params
  const tool = getToolById(toolId)
  
  if (!tool) {
    notFound()
  }

  // Render specific tool component based on toolId
  const renderTool = () => {
    switch (toolId) {
      case "calculator":
        return <CalculatorTool />
      case "text-formatter":
        return <TextFormatterTool />
      case "image-name-processor":
        return <ImageNameProcessor />
      case "image-converter":
        return <ImageConverter />
      case "google-docs-to-markdown":
        return <GoogleDocsToMarkdown />
      default:
        return <ComingSoonTool tool={tool} />
    }
  }

  return renderTool()
}

// Generate static params for known tools
export async function generateStaticParams() {
  // Import tools registry dynamically to avoid build issues
  const { toolsRegistry } = await import("@/lib/tools-registry")
  
  return toolsRegistry.map((tool) => ({
    toolId: tool.id,
  }))
}