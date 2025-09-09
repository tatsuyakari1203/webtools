import dynamic from "next/dynamic"
import React from "react"
import { toolsRegistry } from "./tools-registry"
import { createProtectedComponent } from "./auto-invite-wrapper"

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
 * Dynamically loads a component from the given path with automatic invite protection
 * @param componentPath - The path to the component (e.g., "@/tools/calculator/Calculator")
 * @returns A React component that can be rendered (with invite protection if required)
 */
export function loadDynamicComponent(componentPath: string): React.ComponentType<{ tool: unknown }> {
  // Check cache first
  if (componentCache.has(componentPath)) {
    return componentCache.get(componentPath)!
  }

  // Find the tool in registry
  const tool = toolsRegistry.find(tool => tool.componentPath === componentPath)
  if (!tool) {
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

  // Automatically apply invite protection if required
  const ProtectedComponent = createProtectedComponent(DynamicComponent, tool.id)

  // Cache the protected component
  componentCache.set(componentPath, ProtectedComponent)

  return ProtectedComponent
}