'use client';

import React from 'react';
import { loadDynamicComponent } from '@/lib/dynamic-component-loader';
import type { Tool } from '@/lib/tools-registry';

interface ClientToolLoaderProps {
  tool: Omit<Tool, 'icon'>;
}

/**
 * Client-side component loader that handles invite protection
 * This component runs on the client and can use client-side logic
 */
export function ClientToolLoader({ tool }: ClientToolLoaderProps) {
  // Load component dynamically with automatic invite protection
  const ToolComponent = loadDynamicComponent(tool.componentPath);
  
  return <ToolComponent tool={tool} />;
}