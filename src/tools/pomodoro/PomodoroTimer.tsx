'use client';

// Main Pomodoro Timer Application Component
import React, { useState, useEffect, useCallback } from 'react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


// Import all components
import TimerDisplay from './components/TimerDisplay';
import ControlPanel from './components/ControlPanel';
import CycleTracker from './components/CycleTracker';

import Todo from './components/Todo';
import StreakTracker from './components/StreakTracker';
import { CombinedClockPanel } from './components/Clock';

// Import hooks and types
import { 
  useTimer, 
  useSettings, 
  useNotifications, 
  useTasks,
  useStatistics 
} from './hooks';
// Import types (SessionType not needed in this component)

// Main Pomodoro Timer Component
export default function PomodoroTimer() {
  const { settings, updateSettings } = useSettings();
  
  // Initialize timer state
  const [currentSession, setCurrentSession] = useState<'work' | 'shortBreak' | 'longBreak'>('work');
  const [cycleCount, setCycleCount] = useState(0);
  const [focusMode, setFocusMode] = useState(false);
  
  const getSessionDuration = useCallback((session: 'work' | 'shortBreak' | 'longBreak') => {
    switch (session) {
      case 'work': return settings.workDuration * 60;
      case 'shortBreak': return settings.shortBreakDuration * 60;
      case 'longBreak': return settings.longBreakDuration * 60;
    }
  }, [settings.workDuration, settings.shortBreakDuration, settings.longBreakDuration]);
  
  const {
    timeRemaining,
    isRunning,
    start: timerStart,
    pause: timerPause,
    reset: timerReset,
    setTime
  } = useTimer(getSessionDuration(currentSession));
  

  
  const start = useCallback(() => timerStart(), [timerStart]);
  const pause = useCallback(() => timerPause(), [timerPause]);
  const reset = useCallback(() => {
    timerReset();
    setCurrentSession('work');
    setCycleCount(0);
  }, [timerReset]);
  const skip = useCallback(() => {
    // Skip to next session
    if (currentSession === 'work') {
      const newCycleCount = cycleCount + 1;
      setCycleCount(newCycleCount);
      if (newCycleCount % settings.pomodorosBeforeLongBreak === 0) {
        setCurrentSession('longBreak');
      } else {
        setCurrentSession('shortBreak');
      }
    } else {
      setCurrentSession('work');
    }
  }, [currentSession, cycleCount, settings.pomodorosBeforeLongBreak]);

  const { requestPermission, showNotification } = useNotifications();
  const { tasks, currentTask, addTask, selectTask, completeTask, deleteTask, updateTaskPomodoros } = useTasks();
  const { statistics, recordCompletedPomodoro } = useStatistics();
  
  // Use currentTask as selectedTask for compatibility
  const selectedTask = currentTask;

  // Focus mode handlers
  const toggleFocusMode = useCallback(() => {
    setFocusMode(prev => !prev);
  }, []);

  // ESC key listener to exit focus mode
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && focusMode) {
        setFocusMode(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [focusMode]);

  // Handle session completion
  const handleSessionComplete = useCallback(async () => {
    const sessionType = currentSession;
    
    if (sessionType === 'work') {
      // Update statistics for completed pomodoro
      recordCompletedPomodoro();
      
      // Update selected task pomodoro count
      if (selectedTask) {
        updateTaskPomodoros(selectedTask, 1);
      }
      
      // Show notification
      showNotification(
        'Work Session Complete! 🍅',
        'Time for a well-deserved break. Great job!'
      );
    } else {
      // Show notification
      showNotification(
        'Break Complete!',
        'Ready to get back to work?'
      );
    }
    
    // Auto-start next session if enabled
    if (settings.autoStartBreaks && sessionType === 'work') {
      setTimeout(() => start(), 1000);
    } else if (settings.autoStartPomodoros && sessionType !== 'work') {
      setTimeout(() => start(), 1000);
    }
  }, [currentSession, selectedTask, settings, showNotification, updateTaskPomodoros, start, recordCompletedPomodoro]);

  // Handle timer completion
  useEffect(() => {
    if (timeRemaining === 0 && isRunning) {
      pause();
      handleSessionComplete();
    }
  }, [timeRemaining, isRunning, pause, handleSessionComplete]);

  // Update timer when session changes
  useEffect(() => {
    setTime(getSessionDuration(currentSession));
  }, [currentSession, settings, setTime, getSessionDuration]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Only handle shortcuts when not typing in input fields
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (event.key.toLowerCase()) {
        case ' ':
          event.preventDefault();
          if (isRunning) {
            pause();
          } else {
            start();
          }
          break;
        case 'r':
          event.preventDefault();
          reset();
          break;
        case 's':
          event.preventDefault();
          skip();
          break;
        case 'f':
          event.preventDefault();
          toggleFocusMode();
          break;

      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isRunning, start, pause, reset, skip, toggleFocusMode]);

  // Request notification permission on mount
  useEffect(() => {
    requestPermission();
  }, [requestPermission]);

  // Handle settings changes that affect timer
  const handleSettingsChange = (newSettings: typeof settings) => {
    updateSettings(newSettings);
    
    // Reset timer if session durations changed
    if (!isRunning) {
      setTime(getSessionDuration(currentSession));
    }
  };

  // Focus Mode UI
  if (focusMode) {
    return (
      <div className="fixed inset-0 bg-background z-50 flex flex-col items-center justify-center p-8">
        {/* Exit hint */}
        <div className="absolute top-4 right-4 text-muted-foreground text-sm">
          Press ESC to exit focus mode
        </div>
        
        {/* Centered Timer Display */}
        <div className="flex-1 flex flex-col items-center justify-center space-y-8">
          <TimerDisplay
            timeRemaining={timeRemaining}
            sessionType={currentSession}
            isRunning={isRunning}
            currentTask={selectedTask ? tasks.find(t => t.id === selectedTask)?.text : undefined}
          />
          
          {/* Clock Panel */}
          <div className="mt-8">
            <CombinedClockPanel />
          </div>
        </div>
        
        {/* Click to exit */}
        <div 
          className="absolute inset-0 cursor-pointer" 
          onClick={() => setFocusMode(false)}
          aria-label="Click to exit focus mode"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2 flex items-center justify-center gap-3">
            🍅
            Pomodoro Timer
          </h1>
          <p className="text-muted-foreground">Boost your productivity with the Pomodoro Technique</p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Timer and Controls */}
          <div className="lg:col-span-2 space-y-6">
            {/* Timer Display */}
            <TimerDisplay
              timeRemaining={timeRemaining}
              sessionType={currentSession}
              isRunning={isRunning}
              currentTask={selectedTask ? tasks.find(t => t.id === selectedTask)?.text : undefined}
            />

            {/* Combined Clock Panel */}
            <CombinedClockPanel />

            {/* Control Panel */}
            <ControlPanel
              isRunning={isRunning}
              onStart={start}
              onPause={pause}
              onReset={reset}
              onSkip={skip}
              settings={settings}
              onSettingsChange={handleSettingsChange}
              focusMode={focusMode}
              onToggleFocusMode={toggleFocusMode}
            />

          </div>

          {/* Right Column - Progress, Quick Actions and Tasks */}
          <div className="space-y-6">
            {/* Todo List */}
            <Todo
              tasks={tasks}
              currentTask={selectedTask}
              onTaskAdd={addTask}
              onTaskSelect={selectTask}
              onTaskComplete={completeTask}
              onTaskDelete={deleteTask}
            />

            {/* Cycle Tracker */}
            <CycleTracker
              completedPomodoros={cycleCount}
              totalPomodoros={settings.pomodorosBeforeLongBreak}
            />

            {/* Streak Tracker */}
            <StreakTracker statistics={statistics} />
          </div>
        </div>

        {/* Bottom Tabs for Mobile */}
        <div className="lg:hidden mt-8">
          <Tabs defaultValue="timer" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="timer">Timer</TabsTrigger>
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
              <TabsTrigger value="stats">Stats</TabsTrigger>
            </TabsList>

            <TabsContent value="timer" className="mt-6">
              <div className="space-y-6">

              </div>
            </TabsContent>

            <TabsContent value="tasks" className="mt-6">
              <Todo
                tasks={tasks}
                currentTask={selectedTask}
                onTaskAdd={addTask}
                onTaskSelect={selectTask}
                onTaskComplete={completeTask}
                onTaskDelete={deleteTask}
              />
            </TabsContent>

            <TabsContent value="stats" className="mt-6">
              <StreakTracker statistics={statistics} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer */}

      </div>
    </div>
  );
}