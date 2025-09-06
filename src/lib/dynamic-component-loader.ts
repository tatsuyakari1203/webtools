import dynamic from "next/dynamic"
import React from "react"
import { toolsRegistry } from "./tools-registry"

// Cache for dynamic components to avoid recreating them
const componentCache = new Map<string, React.ComponentType<{ tool: unknown }>>()

// Dynamically create import map from tools registry
const createComponentImportMap = () => {
  const importMap = new Map<string, () => Promise<any>>()
  
  toolsRegistry.forEach(tool => {
    if (tool.componentPath) {
      // Create dynamic import function for each component path
      importMap.set(tool.componentPath, () => import(tool.componentPath))
    }
  })
  
  return importMap
}

// Create the import map once
const componentImportMap = createComponentImportMap()

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