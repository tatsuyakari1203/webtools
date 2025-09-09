'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, Users, Activity, Key } from 'lucide-react';
import { useInviteAuth } from '@/components/invite-form';

interface DemoProtectedProps {
  tool: unknown;
}

export default function DemoProtected({ tool }: DemoProtectedProps) {
  const toolData = tool as { id: string; name: string; description: string; };
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
                <Badge variant="outline">{toolData.id}</Badge>
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
              Exclusive functionality for authorized users
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">User management system</span>
              </div>
              <div className="flex items-center gap-3">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Advanced analytics</span>
              </div>
              <div className="flex items-center gap-3">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Security monitoring</span>
              </div>
              <Button className="w-full mt-4">
                Access Protected Features
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Demo Actions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Demo Actions</CardTitle>
          <CardDescription>
            Try out these protected features available only to authenticated users
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Button variant="outline" className="h-20 flex-col gap-2">
              <Shield className="h-6 w-6" />
              <span>Security Check</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <Users className="h-6 w-6" />
              <span>User Analytics</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <Activity className="h-6 w-6" />
              <span>System Status</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}