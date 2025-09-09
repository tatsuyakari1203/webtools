'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Lock, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InviteFormProps {
  toolId: string;
  toolName: string;
  onSuccess: (userData: { name: string; token: string }) => void;
  className?: string;
}

interface ApiResponse {
  success: boolean;
  name?: string;
  token?: string;
  error?: string;
}

export function InviteForm({ toolId, toolName, onSuccess, className }: InviteFormProps) {
  const [inviteKey, setInviteKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    checkExistingSession();
  }, [toolId]);

  const checkExistingSession = async () => {
    try {
      const response = await fetch('/api/auth/verify-invite', {
        method: 'GET',
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.authenticated && (data.toolId === toolId || !data.toolId)) {
          onSuccess({ name: data.name, token: data.token || 'existing' });
          return;
        }
      }
    } catch (error) {
      console.error('Error checking session:', error);
    } finally {
      setIsCheckingSession(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inviteKey.trim()) {
      setError('Please enter your invite key');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/verify-invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          key: inviteKey,
          toolId
        })
      });

      const data: ApiResponse = await response.json();

      if (data.success && data.name && data.token) {
        onSuccess({ name: data.name, token: data.token });
      } else {
        setError(data.error || 'Invalid invite key');
      }
    } catch (error) {
      console.error('Error verifying invite:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInviteKey(e.target.value);
    if (error) setError(''); // Clear error when user starts typing
  };

  if (isCheckingSession) {
    return (
      <Card className={cn('w-full max-w-md mx-auto', className)}>
        <CardContent className="flex items-center justify-center py-8">
          <div className="flex items-center space-x-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Checking authentication...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('w-full max-w-md mx-auto', className)}>
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Lock className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-xl font-semibold">Access Required</CardTitle>
        <CardDescription>
          This tool <strong>{toolName}</strong> requires an invite key to access.
          Please enter your invite key below.
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="invite-key">Invite Key</Label>
            <div className="relative">
              <Input
                id="invite-key"
                type={showKey ? 'text' : 'password'}
                placeholder="Enter your invite key"
                value={inviteKey}
                onChange={handleKeyChange}
                disabled={isLoading}
                className={cn(
                  'pr-10',
                  error && 'border-destructive focus-visible:ring-destructive'
                )}
                autoComplete="off"
                autoFocus
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowKey(!showKey)}
                disabled={isLoading}
              >
                {showKey ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="sr-only">
                  {showKey ? 'Hide' : 'Show'} invite key
                </span>
              </Button>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading || !inviteKey.trim()}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Verify Access
              </>
            )}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Don't have an invite key?{' '}
            <a 
              href="mailto:admin@webtools.com?subject=Invite Key Request&body=I would like to request access to the tool: ${toolName}"
              className="font-medium text-primary hover:underline"
            >
              Request access
            </a>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// Success component to show after authentication
interface InviteSuccessProps {
  userName: string;
  toolName: string;
  onContinue: () => void;
  className?: string;
}

export function InviteSuccess({ userName, toolName, onContinue, className }: InviteSuccessProps) {
  return (
    <Card className={cn('w-full max-w-md mx-auto', className)}>
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
          <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
        </div>
        <CardTitle className="text-xl font-semibold text-green-900 dark:text-green-100">
          Access Granted
        </CardTitle>
        <CardDescription>
          Welcome, <strong>{userName}</strong>! You now have access to <strong>{toolName}</strong>.
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Button onClick={onContinue} className="w-full">
          Continue to Tool
        </Button>
      </CardContent>
    </Card>
  );
}

// Hook for managing invite state
export function useInviteAuth(toolId: string) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthentication();
  }, [toolId]);

  const checkAuthentication = async () => {
    try {
      const response = await fetch('/api/auth/verify-invite', {
        method: 'GET',
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.authenticated) {
          setIsAuthenticated(true);
          setUserName(data.name);
        }
      }
    } catch (error) {
      console.error('Error checking authentication:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthSuccess = (userData: { name: string; token: string }) => {
    setIsAuthenticated(true);
    setUserName(userData.name);
  };

  const logout = async () => {
    try {
      // Clear the cookie by setting it to expire
      document.cookie = 'invite-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      setIsAuthenticated(false);
      setUserName('');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return {
    isAuthenticated,
    userName,
    isLoading,
    handleAuthSuccess,
    logout,
    checkAuthentication
  };
}