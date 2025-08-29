'use client';

// Cycle Tracker Component with Tomato Icons Progress
import React from 'react';
import { Card } from '@/components/ui/card';
import { CycleTrackerProps } from '../types';

// Main Cycle Tracker Component
export default function CycleTracker({

  completedPomodoros,
  totalPomodoros
}: CycleTrackerProps) {
  // Calculate progress percentage
  const progressPercentage = totalPomodoros > 0 ? (completedPomodoros / totalPomodoros) * 100 : 0;

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Pomodoro Progress</h3>
        <div className="text-sm font-medium text-destructive">
          Focus Session
        </div>
      </div>

      {/* Pomodoro Counter */}
      <div className="text-center mb-4">
        <div className="text-2xl font-bold text-foreground">
          {completedPomodoros} / {totalPomodoros}
        </div>
        <div className="text-sm text-muted-foreground">
          Completed Pomodoros
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="w-full bg-muted rounded-full h-2">
          <div 
            className="bg-destructive h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Tomato Icons Progress */}
      <div className="flex justify-center space-x-2 mb-4">
        {Array.from({ length: totalPomodoros }, (_, index) => {
          const isCompleted = index < completedPomodoros;
          
          return (
            <div
              key={index}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-lg transition-all duration-300 ${
                isCompleted
                  ? 'bg-destructive text-destructive-foreground shadow-md'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              🍅
            </div>
          );
        })}
      </div>

      {/* Progress Stats */}
      <div className="grid grid-cols-2 gap-4 text-center">
        <div className="bg-muted rounded-lg p-3">
          <div className="text-lg font-semibold text-foreground">{completedPomodoros}</div>
          <div className="text-xs text-muted-foreground">Completed</div>
        </div>
        <div className="bg-muted rounded-lg p-3">
          <div className="text-lg font-semibold text-foreground">{totalPomodoros - completedPomodoros}</div>
          <div className="text-xs text-muted-foreground">Remaining</div>
        </div>
      </div>

      {/* Motivational Message */}
      <div className="mt-4 text-center">
        {completedPomodoros === 0 && (
          <p className="text-sm text-muted-foreground">Start your first pomodoro! 🍅</p>
        )}
        {completedPomodoros > 0 && completedPomodoros < totalPomodoros && (
          <p className="text-sm text-primary">
            Great progress! Keep going! 💪
          </p>
        )}
        {completedPomodoros === totalPomodoros && (
          <p className="text-sm text-secondary">
            Congratulations! All pomodoros completed! 🎉
          </p>
        )}
      </div>
    </Card>
  );
}