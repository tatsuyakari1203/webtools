'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useInventory } from '@/components/providers/InventoryProvider';
import { Clipboard, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ThrowButtonProps {
  source?: string;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  showTooltip?: boolean;
}

export function ThrowButton({ 
  source, 
  variant = 'outline', 
  size = 'sm', 
  className,
  showTooltip = true 
}: ThrowButtonProps) {
  const { throwClipboard } = useInventory();
  const [isLoading, setIsLoading] = useState(false);

  const handleThrow = async () => {
    try {
      setIsLoading(true);
      
      // Check if clipboard API is available
      if (!navigator.clipboard) {
        toast.error('Clipboard access not available');
        return;
      }

      // Check clipboard permissions
      const permission = await navigator.permissions.query({ name: 'clipboard-read' as PermissionName });
      if (permission.state === 'denied') {
        toast.error('Clipboard access denied');
        return;
      }

      await throwClipboard(source);
    } catch (error) {
      console.error('Failed to throw clipboard:', error);
      
      // Handle specific error cases
      if (error instanceof Error) {
        if (error.message.includes('clipboard is empty')) {
          toast.error('Clipboard is empty');
        } else if (error.message.includes('permission')) {
          toast.error('Clipboard access denied');
        } else {
          toast.error('Failed to save clipboard content');
        }
      } else {
        toast.error('Failed to save clipboard content');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const button = (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleThrow}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Clipboard className="w-4 h-4" />
      )}
      {size !== 'icon' && (
        <span className="ml-2">
          {isLoading ? 'Throwing...' : 'Throw'}
        </span>
      )}
    </Button>
  );

  if (!showTooltip) {
    return button;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {button}
        </TooltipTrigger>
        <TooltipContent>
          <p>Throw something here bro</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Quick throw button with icon only
export function QuickThrowButton({ source, className }: { source?: string; className?: string }) {
  return (
    <ThrowButton
      source={source}
      variant="ghost"
      size="icon"
      className={className}
      showTooltip={true}
    />
  );
}

// Throw button for specific tools
export function ToolThrowButton({ toolName, className }: { toolName: string; className?: string }) {
  return (
    <ThrowButton
      source={toolName}
      variant="outline"
      size="sm"
      className={className}
      showTooltip={true}
    />
  );
}