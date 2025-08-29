'use client';

// Timer Display Component with Circular Progress
import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TimerDisplayProps } from '../types';

// Utility function to format time
function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Circular Progress Component
interface CircularProgressProps {
  progress: number; // 0-100
  size: number;
  strokeWidth: number;
  color: string;
}

function CircularProgress({ progress, size, strokeWidth, color }: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        className="transform -rotate-90"
        width={size}
        height={size}
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-muted-foreground/30"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-in-out"
        />
      </svg>
    </div>
  );
}

// Session Type Badge Component
interface SessionBadgeProps {
  sessionType: 'work' | 'shortBreak' | 'longBreak';
}

function SessionBadge({ sessionType }: SessionBadgeProps) {
  const getSessionConfig = (type: 'work' | 'shortBreak' | 'longBreak') => {
    switch (type) {
      case 'work':
        return {
          label: 'Work Session',
          variant: 'destructive' as const,
          className: 'bg-red-500 hover:bg-red-600'
        };
      case 'shortBreak':
        return {
          label: 'Short Break',
          variant: 'secondary' as const,
          className: 'bg-green-500 hover:bg-green-600 text-white'
        };
      case 'longBreak':
        return {
          label: 'Long Break',
          variant: 'secondary' as const,
          className: 'bg-blue-500 hover:bg-blue-600 text-white'
        };
    }
  };

  const config = getSessionConfig(sessionType);

  return (
    <Badge variant={config.variant} className={config.className}>
      {config.label}
    </Badge>
  );
}

// Main Timer Display Component
export default function TimerDisplay({ 
  timeRemaining, 
  sessionType, 
  isRunning, 
  currentTask 
}: TimerDisplayProps) {
  // Calculate progress based on session type
  const getSessionDuration = (type: 'work' | 'shortBreak' | 'longBreak'): number => {
    switch (type) {
      case 'work': return 25 * 60; // 25 minutes
      case 'shortBreak': return 5 * 60; // 5 minutes
      case 'longBreak': return 15 * 60; // 15 minutes
    }
  };

  const totalDuration = getSessionDuration(sessionType);
  const progress = ((totalDuration - timeRemaining) / totalDuration) * 100;

  // Get color based on session type
  const getProgressColor = (type: 'work' | 'shortBreak' | 'longBreak'): string => {
    switch (type) {
      case 'work': return 'hsl(var(--destructive))'; // red-500
      case 'shortBreak': return 'hsl(var(--primary))'; // green-500
      case 'longBreak': return 'hsl(var(--secondary))'; // blue-500
    }
  };

  const progressColor = getProgressColor(sessionType);

  return (
    <Card className="p-8 text-center shadow-lg rounded-xl">
      {/* Session Type Badge */}
      <div className="mb-6">
        <SessionBadge sessionType={sessionType} />
      </div>

      {/* Circular Timer */}
      <div className="relative flex items-center justify-center mb-6">
        <CircularProgress
          progress={progress}
          size={280}
          strokeWidth={8}
          color={progressColor}
        />
        
        {/* Timer Text Overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-6xl font-mono font-bold text-foreground mb-2">
            {formatTime(timeRemaining)}
          </div>
          
          {/* Running Status Indicator */}
          <div className="flex items-center gap-2">
            <div 
              className={`w-3 h-3 rounded-full transition-colors duration-300 ${
                isRunning ? 'bg-green-500 animate-pulse' : 'bg-muted-foreground/50'
              }`}
            />
            <Badge 
              variant={isRunning ? "default" : "secondary"}
              className="text-sm font-medium"
            >
              {isRunning ? 'Running' : 'Paused'}
            </Badge>
          </div>
        </div>
      </div>

      {/* Current Task Display */}
      {currentTask && (
        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground mb-1">Current Task</p>
          <p className="text-lg font-medium text-foreground">{currentTask}</p>
        </div>
      )}

      {/* Session Progress Bar (Alternative/Additional Visual) */}
      <div className="mt-6">
        <div className="flex justify-between text-sm text-muted-foreground mb-2">
          <span>Progress</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress 
          value={progress} 
          className="h-2"
          style={{
            '--progress-background': progressColor
          } as React.CSSProperties}
        />
      </div>

      {/* Time Information */}
      <div className="mt-4 text-sm text-muted-foreground">
        <p>
          {Math.floor(timeRemaining / 60)} minutes {timeRemaining % 60} seconds remaining
        </p>
      </div>
    </Card>
  );
}