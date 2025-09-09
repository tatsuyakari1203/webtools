'use client';

import React from 'react';
import { ToolWrapper } from '@/components/tool-wrapper';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, Users, Activity, Key } from 'lucide-react';
import { useInviteAuth } from '@/components/invite-form';

function DemoProtectedTool() {
  const { userName } = useInviteAuth('demo-protected');

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-4">Protected Tool Dashboard</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Welcome to the secure area. This tool demonstrates advanced access control features and protected functionality.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Welcome Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-600" />
              Access Granted
            </CardTitle>
            <CardDescription>
              Welcome to the protected area, {userName}!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">User:</span>
                <Badge variant="secondary">{userName}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Tool ID:</span>
                <Badge variant="outline">demo-protected</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Access Level:</span>
                <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                  Authenticated
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Features Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-blue-600" />
              Protected Features
            </CardTitle>
            <CardDescription>
              Features available to authenticated users
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">Advanced calculations</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">Premium templates</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">Export functionality</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">Priority support</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Demo Actions Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-purple-600" />
              Demo Actions
            </CardTitle>
            <CardDescription>
              Try out some protected functionality
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <Button 
                variant="outline" 
                className="h-20 flex-col gap-2"
                onClick={() => alert(`Hello ${userName}! This is a protected action.`)}
              >
                <Users className="h-6 w-6" />
                <span>User Action</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-20 flex-col gap-2"
                onClick={() => {
                  const data = {
                    user: userName,
                    timestamp: new Date().toISOString(),
                    action: 'demo_export'
                  };
                  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `demo-export-${userName}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                <Activity className="h-6 w-6" />
                <span>Export Data</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-20 flex-col gap-2"
                onClick={() => {
                  const features = [
                    'Advanced Analytics',
                    'Custom Themes',
                    'API Access',
                    'Bulk Operations',
                    'Premium Support'
                  ];
                  alert(`Premium features for ${userName}:\n\n${features.join('\n')}`);
                }}
              >
                <Shield className="h-6 w-6" />
                <span>Premium Features</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* System Info Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>System Information</CardTitle>
            <CardDescription>
              Details about your current session
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <h4 className="font-medium">Session Details</h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div>Authenticated: ✅ Yes</div>
                  <div>Session Type: Invite-based</div>
                  <div>Tool Access: demo-protected</div>
                  <div>Login Time: {new Date().toLocaleString()}</div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Security Features</h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div>🔐 Encrypted sessions</div>
                  <div>📊 Access logging</div>
                  <div>🌍 IP tracking</div>
                  <div>⏰ Auto-expiration (24h)</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 text-center">
        <p className="text-sm text-muted-foreground max-w-3xl mx-auto">
          This secure environment provides access to advanced features and protected functionality.
          All activities are logged and monitored for security purposes.
        </p>
      </div>
    </div>
  );
}

export default function DemoProtectedPage() {
  return (
    <ToolWrapper toolId="demo-protected">
      <DemoProtectedTool />
    </ToolWrapper>
  );
}