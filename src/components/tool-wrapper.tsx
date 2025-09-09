'use client';

import React, { useState, useEffect } from 'react';
import { InviteForm, InviteSuccess, useInviteAuth } from '@/components/invite-form';
import { isToolProtected, getToolInviteInfo, getToolById } from '@/lib/tools-registry';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ToolWrapperProps {
  toolId: string;
  children: React.ReactNode;
  className?: string;
}

export function ToolWrapper({ toolId, children, className }: ToolWrapperProps) {
  const [showSuccess, setShowSuccess] = useState(false);
  const [successData, setSuccessData] = useState<{ name: string; token: string } | null>(null);
  
  const tool = getToolById(toolId);
  const inviteInfo = getToolInviteInfo(toolId);
  const { isAuthenticated, userName, isLoading, handleAuthSuccess } = useInviteAuth(toolId);

  // If tool doesn't require invite, render children directly
  if (!inviteInfo.requiresInvite) {
    return <div className={className}>{children}</div>;
  }

  // Show loading state
  if (isLoading) {
    return (
      <Card className={cn('w-full max-w-md mx-auto', className)}>
        <CardContent className="flex items-center justify-center py-8">
          <div className="flex items-center space-x-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Checking access...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show success message briefly after authentication
  if (showSuccess && successData) {
    return (
      <InviteSuccess
        userName={successData.name}
        toolName={tool?.name || toolId}
        onContinue={() => setShowSuccess(false)}
        className={className}
      />
    );
  }

  // Show invite form if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto space-y-8 px-4">
        {/* Protected tool notice */}
        {inviteInfo.requiresInvite && (
          <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <Shield className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-100 mb-2">
                    Protected Tool Access
                  </h3>
                  <p className="text-amber-700 dark:text-amber-200 leading-relaxed">
                    {inviteInfo.description}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        <div className="mt-6">
          <InviteForm
            toolId={toolId}
            toolName={tool?.name || toolId}
            onSuccess={(userData) => {
              setSuccessData(userData);
              setShowSuccess(true);
              handleAuthSuccess(userData);
              
              // Hide success message after 2 seconds
              setTimeout(() => {
                setShowSuccess(false);
              }, 2000);
            }}
          />
        </div>
      </div>
    );
  }

  // User is authenticated, render the tool
  return (
    <div className={className}>
      {/* Optional: Show authenticated user info */}
      {userName && (
        <div className="mb-4 text-sm text-muted-foreground text-center">
          Authenticated as <span className="font-medium">{userName}</span>
        </div>
      )}
      {children}
    </div>
  );
}

// Higher-order component for wrapping tool pages
export function withInviteProtection<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  toolId: string
) {
  const ProtectedComponent = (props: P) => {
    return (
      <ToolWrapper toolId={toolId}>
        <WrappedComponent {...props} />
      </ToolWrapper>
    );
  };

  ProtectedComponent.displayName = `withInviteProtection(${WrappedComponent.displayName || WrappedComponent.name})`;
  
  return ProtectedComponent;
}

// Hook for checking tool access in components
export function useToolAccess(toolId: string) {
  const [hasAccess, setHasAccess] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [userName, setUserName] = useState<string | null>(null);
  
  const inviteInfo = getToolInviteInfo(toolId);
  const { isAuthenticated, userName: authUserName, isLoading } = useInviteAuth(toolId);

  useEffect(() => {
    if (!inviteInfo.requiresInvite) {
      setHasAccess(true);
      setIsChecking(false);
      return;
    }

    if (!isLoading) {
      setHasAccess(isAuthenticated);
      setUserName(authUserName);
      setIsChecking(false);
    }
  }, [inviteInfo.requiresInvite, isAuthenticated, authUserName, isLoading]);

  return {
    hasAccess,
    isChecking,
    userName,
    requiresInvite: inviteInfo.requiresInvite,
    inviteDescription: inviteInfo.description
  };
}

// Component for displaying tool access status
interface ToolAccessStatusProps {
  toolId: string;
  className?: string;
}

export function ToolAccessStatus({ toolId, className }: ToolAccessStatusProps) {
  const { hasAccess, isChecking, userName, requiresInvite } = useToolAccess(toolId);
  const tool = getToolById(toolId);

  if (!requiresInvite) {
    return null; // Public tool, no status needed
  }

  if (isChecking) {
    return (
      <div className={cn('flex items-center space-x-2 text-sm text-muted-foreground', className)}>
        <Loader2 className="h-3 w-3 animate-spin" />
        <span>Checking access...</span>
      </div>
    );
  }

  return (
    <div className={cn('flex items-center space-x-2 text-sm', className)}>
      <Shield className={cn(
        'h-3 w-3',
        hasAccess ? 'text-green-600' : 'text-amber-600'
      )} />
      <span className={cn(
        hasAccess ? 'text-green-700 dark:text-green-400' : 'text-amber-700 dark:text-amber-400'
      )}>
        {hasAccess 
          ? `Authenticated as ${userName}` 
          : `Requires invite key`
        }
      </span>
    </div>
  );
}