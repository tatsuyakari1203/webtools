'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PomodoroTimer() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Pomodoro Timer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400">
              Pomodoro Timer - Coming Soon
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}