'use client';

import React from 'react';
import { ToolWrapper } from '@/components/tool-wrapper';
import { getToolById } from './tools-registry';

interface AutoInviteWrapperProps {
  toolId: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Automatically wraps tool components with invite protection based on tools-registry configuration
 * This eliminates the need to manually wrap each protected tool
 */
export function AutoInviteWrapper({ toolId, children, className }: AutoInviteWrapperProps) {
  const tool = getToolById(toolId);
  
  // If tool requires invite, wrap with ToolWrapper
  if (tool?.requiresInvite) {
    return (
      <ToolWrapper toolId={toolId} className={className}>
        {children}
      </ToolWrapper>
    );
  }
  
  // Otherwise, render children directly
  return <div className={className}>{children}</div>;
}

/**
 * HOC version for wrapping tool components automatically
 */
export function withAutoInviteProtection<P extends object = object>(
  WrappedComponent: React.ComponentType<P>,
  toolId: string
): React.ComponentType<P> {
  const ComponentWithInviteProtection = (props: P) => {
    return (
      <AutoInviteWrapper toolId={toolId}>
        <WrappedComponent {...props} />
      </AutoInviteWrapper>
    );
  };
  
  ComponentWithInviteProtection.displayName = `withAutoInviteProtection(${WrappedComponent.displayName || WrappedComponent.name})`;
  
  return ComponentWithInviteProtection;
}

/**
 * Enhanced dynamic component loader that automatically applies invite protection
 */
export function createProtectedComponent<T extends object = object>(
  Component: React.ComponentType<T>,
  toolId: string
): React.ComponentType<T> {
  const tool = getToolById(toolId);
  
  if (tool?.requiresInvite) {
    return withAutoInviteProtection<T>(Component, toolId);
  }
  
  return Component;
}