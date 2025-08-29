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
// Import motivational quotes
import { getRandomQuote, shouldShowQuote } from './data/motivationalQuotes';
// Import types (SessionType not needed in this component)

// Main Pomodoro Timer Component
export default function PomodoroTimer() {
  const { settings, updateSettings } = useSettings();
  
  // Initialize timer state
  const [currentSession, setCurrentSession] = useState<'work' | 'shortBreak' | 'longBreak'>('work');
  const [cycleCount, setCycleCount] = useState(0);
  const [focusMode, setFocusMode] = useState(false);
  
  // Motivational quotes state
  const [currentQuote, setCurrentQuote] = useState<string>('');
  const [showQuote, setShowQuote] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<number>(Date.now());
  
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
        case 'g':
          // Easter egg: Trigger motivational quote immediately
          event.preventDefault();
          if (focusMode) {
            setCurrentQuote(getRandomQuote());
            setShowQuote(true);
            setTimeout(() => {
              setShowQuote(false);
            }, 10000);
          }
          break;

      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isRunning, start, pause, reset, skip, toggleFocusMode, focusMode]);

  // Request notification permission on mount
  useEffect(() => {
    requestPermission();
  }, [requestPermission]);

  // Handle motivational quotes display
  useEffect(() => {
    if (!isRunning || !focusMode) return;

    const interval = setInterval(() => {
      if (shouldShowQuote(sessionStartTime)) {
        if (!showQuote) {
          setCurrentQuote(getRandomQuote());
          setShowQuote(true);
          
          // Hide quote after 10 seconds
          setTimeout(() => {
            setShowQuote(false);
          }, 10000);
        }
      }
    }, 1000); // Check every second

    return () => clearInterval(interval);
  }, [isRunning, focusMode, sessionStartTime, showQuote]);

  // Reset session start time when timer starts
  useEffect(() => {
    if (isRunning) {
      setSessionStartTime(Date.now());
    }
  }, [isRunning]);

  // Handle settings changes that affect timer
  const handleSettingsChange = (newSettings: typeof settings) => {
    updateSettings(newSettings);
    
    // Reset timer if session durations changed
    if (!isRunning) {
      setTime(getSessionDuration(currentSession));
    }
  };

  // Focus Mode UI - True Fullscreen
  if (focusMode) {
    // Calculate progress for visual elements
    const getSessionDuration = (type: 'work' | 'shortBreak' | 'longBreak'): number => {
      switch (type) {
        case 'work': return settings.workDuration * 60;
        case 'shortBreak': return settings.shortBreakDuration * 60;
        case 'longBreak': return settings.longBreakDuration * 60;
      }
    };

    const totalDuration = getSessionDuration(currentSession);
    const progress = ((totalDuration - timeRemaining) / totalDuration) * 100;
    
    // Get colors based on session type
    const getSessionColors = (type: 'work' | 'shortBreak' | 'longBreak') => {
      switch (type) {
        case 'work': return { bg: 'from-slate-500/10 to-slate-600/5', accent: 'text-slate-400', glow: 'shadow-slate-500/20' };
        case 'shortBreak': return { bg: 'from-emerald-500/10 to-emerald-600/5', accent: 'text-emerald-400', glow: 'shadow-emerald-500/20' };
        case 'longBreak': return { bg: 'from-blue-500/10 to-blue-600/5', accent: 'text-blue-400', glow: 'shadow-blue-500/20' };
      }
    };

    const colors = getSessionColors(currentSession);
    const currentTime = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
    const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const currentTask = selectedTask ? tasks.find(t => t.id === selectedTask)?.text : undefined;

    return (
      <>
        <style jsx>{`
           @keyframes fade-in {
             0% {
               opacity: 0;
               transform: translateY(8px);
             }
             100% {
               opacity: 1;
               transform: translateY(0);
             }
           }
           .animate-fade-in {
             animation: fade-in 0.3s ease-out;
           }
         `}</style>
        <div className={`fixed inset-0 z-50 bg-gradient-to-br ${colors.bg} backdrop-blur-sm overflow-hidden`}>
        {/* Ambient background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-current rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-current rounded-full blur-3xl" />
        </div>

        {/* Exit hint and shortcuts */}
        <div className="absolute top-6 right-6 text-muted-foreground/60 text-sm font-medium tracking-wide">
          <div className="text-right space-y-1">
            <div>ESC to exit</div>
            <div className="text-xs opacity-75">SPACE play/pause • R reset • S skip • F focus</div>
          </div>
        </div>

        {/* Main content area */}
        <div className="relative h-full flex flex-col items-center justify-center px-8">
          {/* Session type indicator */}
          <div className="mb-8 flex justify-center">
              <div className="inline-flex items-center px-6 py-3 rounded-full bg-background/10 backdrop-blur-md border border-white/10 max-w-2xl">
                 <span 
                    key={showQuote ? currentQuote : currentSession}
                    className="text-lg font-medium text-foreground/90 tracking-wide text-center leading-relaxed transition-all duration-300 ease-out transform opacity-100 animate-fade-in"
                  >
                      {showQuote ? currentQuote : (currentSession === 'work' ? 'Focus Time' : currentSession === 'shortBreak' ? 'Short Break' : 'Long Break')}
                 </span>
               </div>
           </div>

          {/* Giant timer display */}
          <div className="relative mb-12">
            {/* Circular progress background */}
            <div className="relative">
              <svg className="transform -rotate-90" width="400" height="400">
                {/* Background circle */}
                <circle
                  cx="200"
                  cy="200"
                  r="180"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  className="text-white/10"
                />
                {/* Progress circle */}
                <circle
                  cx="200"
                  cy="200"
                  r="180"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  className={colors.accent}
                  strokeLinecap="round"
                  strokeDasharray={`${180 * 2 * Math.PI}`}
                  strokeDashoffset={`${180 * 2 * Math.PI - (progress / 100) * 180 * 2 * Math.PI}`}
                />
              </svg>
              
              {/* Timer text overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-8xl font-mono font-bold text-foreground mb-4 tracking-wider">
                  {Math.floor(timeRemaining / 60).toString().padStart(2, '0')}:{(timeRemaining % 60).toString().padStart(2, '0')}
                </div>
                
                {/* Status indicator */}
                 <div className="flex items-center gap-3">
                   <div className={`w-4 h-4 rounded-full ${isRunning ? colors.accent : 'bg-muted-foreground/50'}`} />
                   <span className={`text-xl font-medium tracking-wide ${isRunning ? 'text-foreground' : 'text-muted-foreground'}`}>
                     {isRunning ? 'Running' : 'Paused'}
                   </span>
                 </div>
              </div>
            </div>
          </div>

          {/* Current task display */}
          {currentTask && (
            <div className="mb-8 text-center max-w-2xl">
              <div className="text-sm text-muted-foreground/70 mb-2 tracking-wide uppercase">Current Task</div>
              <div className="text-2xl font-medium text-foreground/90 leading-relaxed">{currentTask}</div>
            </div>
          )}

          {/* Bottom section with time and progress */}
          <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 text-center">
            {/* Current time */}
            <div className="mb-4">
              <div className="text-3xl font-mono font-bold text-foreground/80 mb-1">{currentTime}</div>
              <div className="text-sm text-muted-foreground/60 tracking-wide">{currentDate}</div>
            </div>
            
            {/* Progress indicator */}
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground/60">Progress</div>
              <div className="w-32 h-1 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${colors.accent}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="text-sm text-muted-foreground/60 font-mono">{Math.round(progress)}%</div>
            </div>
          </div>
        </div>

        {/* Click to exit overlay */}
        <div 
          className="absolute inset-0 cursor-pointer" 
          onClick={() => setFocusMode(false)}
          aria-label="Click to exit focus mode"
        />
      </div>
      </>
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