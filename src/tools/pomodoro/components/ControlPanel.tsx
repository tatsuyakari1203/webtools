'use client';

// Control Panel Component with Timer Controls
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Play, Pause, SkipForward, RotateCcw } from 'lucide-react';
import { ControlPanelProps } from '../types';

export default function ControlPanel({
  isRunning,
  onStart,
  onPause,
  onReset,
  onSkip
}: ControlPanelProps) {


  return (
    <Card className="p-6">
      {/* Session Info */}
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Timer Controls
        </h3>
        <p className="text-sm text-muted-foreground">
          {isRunning ? 'Timer is running' : 'Timer is paused'}
        </p>
      </div>

      {/* Main Control Buttons */}
      <div className="flex justify-center gap-4 mb-6">
        {/* Start/Pause Button */}
        {!isRunning ? (
          <Button
            onClick={onStart}
            size="lg"
            className="px-8 py-3 text-lg font-medium"
          >
            <Play className="w-5 h-5 mr-2" />
            Start
          </Button>
        ) : (
          <Button
            onClick={onPause}
            size="lg"
            variant="outline"
            className="px-8 py-3 text-lg font-medium"
          >
            <Pause className="w-5 h-5 mr-2" />
            Pause
          </Button>
        )}


      </div>

      {/* Secondary Control Buttons */}
      <div className="flex justify-center gap-3">
        {/* Reset Button */}
        <Button
          onClick={onReset}
          variant="outline"
          size="sm"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset
        </Button>

        {/* Skip Button */}
        <Button
          onClick={onSkip}
          variant="secondary"
          size="sm"
        >
          <SkipForward className="w-4 h-4 mr-2" />
          Skip
        </Button>
      </div>

      {/* Control Instructions */}
      <div className="mt-6 p-4 bg-muted rounded-lg">
        <h4 className="text-sm font-medium text-foreground mb-2">Controls:</h4>
        <div className="text-xs text-muted-foreground space-y-1">
          <div className="flex justify-between">
            <span>• Start/Pause:</span>
            <span>Begin or pause the current session</span>
          </div>

          <div className="flex justify-between">
            <span>• Reset:</span>
            <span>Reset current session to full duration</span>
          </div>
          <div className="flex justify-between">
            <span>• Skip:</span>
            <span>Move to next session type</span>
          </div>
        </div>
      </div>

      {/* Keyboard Shortcuts Info */}
      <div className="mt-4 p-3 bg-accent rounded-lg">
        <h4 className="text-xs font-medium text-accent-foreground mb-2">Keyboard Shortcuts:</h4>
        <div className="text-xs text-accent-foreground space-y-1">
          <div className="flex justify-between">
            <span>Space:</span>
            <span>Start/Pause</span>
          </div>
          <div className="flex justify-between">
            <span>R:</span>
            <span>Reset</span>
          </div>
          <div className="flex justify-between">
            <span>S:</span>
            <span>Skip</span>
          </div>
          <div className="flex justify-between">
            <span>M:</span>
            <span>Mute/Unmute</span>
          </div>
        </div>
      </div>

      {/* Status Indicator */}
      <div className="mt-4 flex items-center justify-center gap-2">
        <div 
          className={`w-2 h-2 rounded-full transition-colors duration-300 ${
            isRunning ? 'bg-primary animate-pulse' : 'bg-muted-foreground'
          }`}
        />
        <span className="text-xs text-muted-foreground">
          {isRunning ? 'Active' : 'Inactive'}
        </span>
      </div>
    </Card>
  );
}