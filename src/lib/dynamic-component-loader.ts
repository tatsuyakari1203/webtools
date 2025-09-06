import dynamic from "next/dynamic"
import React from "react"
import { toolsRegistry } from "./tools-registry"

// Cache for dynamic components to avoid recreating them
const componentCache = new Map<string, React.ComponentType<{ tool: unknown }>>()

// Static import function for Next.js compatibility
function getStaticImport(componentPath: string): () => Promise<{ default: React.ComponentType<{ tool: unknown }> }> {
  // Next.js requires static analysis of import paths
  switch (componentPath) {
    case "@/tools/calculator/Calculator":
      return () => import("@/tools/calculator/Calculator")
    case "@/components/tools/TextFormatterTool":
      return () => import("@/components/tools/TextFormatterTool")
    case "@/tools/image-name-processor/ImageNameProcessor":
      return () => import("@/tools/image-name-processor/ImageNameProcessor")
    case "@/tools/image-converter":
      return () => import("@/tools/image-converter")
    case "@/tools/google-docs-to-markdown/GoogleDocsToMarkdown":
      return () => import("@/tools/google-docs-to-markdown/GoogleDocsToMarkdown")
    case "@/tools/ocr/OCRTool":
      return () => import("@/tools/ocr/OCRTool")
    case "@/tools/codebase2json":
      return () => import("@/tools/codebase2json")
    case "@/tools/pomodoro/PomodoroTimer":
      return () => import("@/tools/pomodoro/PomodoroTimer")
    case "@/tools/nano-banana/NanoBanana":
      return () => import("@/tools/nano-banana/NanoBanana")
    case "@/tools/social-crop":
      return () => import("@/tools/social-crop")
    case "@/tools/what-is-my-ip":
      return () => import("@/tools/what-is-my-ip")
    case "@/tools/token-generator":
      return () => import("@/tools/token-generator")


    default:
      throw new Error(`Unknown component path: ${componentPath}`)
  }
}

/**
 * Dynamically loads a component from the given path
 * @param componentPath - The path to the component (e.g., "@/tools/calculator/Calculator")
 * @returns A React component that can be rendered
 */
export function loadDynamicComponent(componentPath: string): React.ComponentType<{ tool: unknown }> {
  // Check cache first
  if (componentCache.has(componentPath)) {
    return componentCache.get(componentPath)!
  }

  // Validate that the component path exists in tools registry
  const toolExists = toolsRegistry.some(tool => tool.componentPath === componentPath)
  if (!toolExists) {
    throw new Error(`Component path "${componentPath}" is not registered in tools registry`)
  }

  // Get the static import function
  const importFunction = getStaticImport(componentPath)

  // Create dynamic component
  const DynamicComponent = dynamic(
    importFunction,
    {
      loading: () => React.createElement('div', null, 'Loading...'),
    }
  ) as React.ComponentType<{ tool: unknown }>

  // Cache the component
  componentCache.set(componentPath, DynamicComponent)

  return DynamicComponent
}