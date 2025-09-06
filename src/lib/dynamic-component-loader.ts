import dynamic from "next/dynamic"
import React from "react"
import { toolsRegistry } from "./tools-registry"

// Cache for dynamic components to avoid recreating them
const componentCache = new Map<string, React.ComponentType<{ tool: unknown }>>()

// Create a map of component paths to their import functions
const componentImportMap = new Map<string, () => Promise<any>>([
  ["@/tools/calculator/Calculator", () => import("@/tools/calculator/Calculator")],
  ["@/components/tools/TextFormatterTool", () => import("@/components/tools/TextFormatterTool")],
  ["@/tools/image-name-processor/ImageNameProcessor", () => import("@/tools/image-name-processor/ImageNameProcessor")],
  ["@/tools/image-converter", () => import("@/tools/image-converter")],
  ["@/tools/google-docs-to-markdown/GoogleDocsToMarkdown", () => import("@/tools/google-docs-to-markdown/GoogleDocsToMarkdown")],
  ["@/tools/ocr/OCRTool", () => import("@/tools/ocr/OCRTool")],
  ["@/tools/codebase2json", () => import("@/tools/codebase2json")],
  ["@/tools/pomodoro/PomodoroTimer", () => import("@/tools/pomodoro/PomodoroTimer")],
  ["@/tools/nano-banana/NanoBanana", () => import("@/tools/nano-banana/NanoBanana")],
  ["@/tools/social-crop", () => import("@/tools/social-crop")],
  ["@/tools/what-is-my-ip", () => import("@/tools/what-is-my-ip")],
  ["@/tools/token-generator", () => import("@/tools/token-generator")],
])

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

  // Get the import function for this component path
  const importFunction = componentImportMap.get(componentPath)
  if (!importFunction) {
    throw new Error(`No import function found for component path: ${componentPath}`)
  }

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