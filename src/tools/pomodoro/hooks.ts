'use client';

// Custom Hooks for Pomodoro Timer
import { useState, useEffect, useCallback, useRef } from 'react';
import { PomodoroSettings, Task, Statistics } from './types';
import { StorageService } from './storage';

// Timer management hook
export function useTimer(initialTime: number) {
  const [timeRemaining, setTimeRemaining] = useState(initialTime);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const start = useCallback(() => {
    setIsRunning(true);
  }, []);

  const pause = useCallback(() => {
    setIsRunning(false);
  }, []);

  const reset = useCallback(() => {
    setIsRunning(false);
    setTimeRemaining(initialTime);
  }, [initialTime]);

  const setTime = useCallback((time: number) => {
    setTimeRemaining(time);
  }, []);

  useEffect(() => {
    if (isRunning && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeRemaining]);

  return {
    timeRemaining,
    isRunning,
    start,
    pause,
    reset,
    setTime
  };
}

// Settings persistence hook
export function useSettings() {
  const [settings, setSettings] = useState<PomodoroSettings>(() => 
    StorageService.loadSettings()
  );

  const updateSettings = useCallback((newSettings: Partial<PomodoroSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    StorageService.saveSettings(updatedSettings);
  }, [settings]);

  return {
    settings,
    updateSettings
  };
}

// Audio management hook using use-sound
export function useAudio() {
  const [volume, setVolumeState] = useState(0.5);
  const [isClient, setIsClient] = useState(false);
  const [soundsLoaded, setSoundsLoaded] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Create refs to store sound functions
  const tickSoundRef = useRef<(() => void) | null>(null);
  const workCompleteSoundRef = useRef<(() => void) | null>(null);
  const breakCompleteSoundRef = useRef<(() => void) | null>(null);
  
  useEffect(() => {
    if (isClient) {
      import('use-sound').then((module) => {
        const useSound = module.default;
        
        // Create sound instances
        const [playTick] = useSound('/sounds/tick.mp3', { volume });
        const [playWorkComplete] = useSound('/sounds/work-complete.mp3', { volume });
        const [playBreakComplete] = useSound('/sounds/break-complete.mp3', { volume });
        
        // Store in refs
        tickSoundRef.current = playTick;
        workCompleteSoundRef.current = playWorkComplete;
        breakCompleteSoundRef.current = playBreakComplete;
        
        setSoundsLoaded(true);
      }).catch((error) => {
        console.warn('Failed to load use-sound:', error);
      });
    }
  }, [isClient, volume]);

  const playTickSound = useCallback(() => {
    if (tickSoundRef.current) {
      tickSoundRef.current();
    }
  }, []);

  const playNotificationSound = useCallback((type: 'work' | 'break') => {
    if (type === 'work' && workCompleteSoundRef.current) {
      workCompleteSoundRef.current();
    } else if (type === 'break' && breakCompleteSoundRef.current) {
      breakCompleteSoundRef.current();
    }
  }, []);

  const setVolume = useCallback((newVolume: number) => {
    setVolumeState(Math.max(0, Math.min(1, newVolume)));
  }, []);

  return {
    playTickSound,
    playNotificationSound,
    setVolume,
    volume
  };
}

// Notification hook
export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof window !== 'undefined' ? Notification.permission : 'default'
  );

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }

    if (permission === 'granted') {
      return true;
    }

    const result = await Notification.requestPermission();
    setPermission(result);
    return result === 'granted';
  }, [permission]);

  const showNotification = useCallback((title: string, body: string, options?: NotificationOptions) => {
    if (permission !== 'granted') {
      console.warn('Notification permission not granted');
      return;
    }

    try {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options
      });
    } catch (error) {
      console.warn('Failed to show notification:', error);
    }
  }, [permission]);

  return {
    permission,
    requestPermission,
    showNotification
  };
}

// Tasks management hook
export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>(() => StorageService.loadTasks());
  const [currentTask, setCurrentTask] = useState<string | undefined>();

  const saveTasks = useCallback((newTasks: Task[]) => {
    setTasks(newTasks);
    StorageService.saveTasks(newTasks);
  }, []);

  const addTask = useCallback((text: string, estimatedPomodoros: number = 1) => {
    const newTask: Task = {
      id: Date.now().toString(),
      text,
      completed: false,
      createdAt: new Date(),
      pomodorosSpent: 0,
      estimatedPomodoros,
      completedPomodoros: 0
    };
    saveTasks([...tasks, newTask]);
  }, [tasks, saveTasks]);

  const selectTask = useCallback((taskId: string) => {
    setCurrentTask(taskId);
  }, []);

  const completeTask = useCallback((taskId: string) => {
    const updatedTasks = tasks.map(task => {
      if (task.id === taskId) {
        if (task.completed) {
          // Resume task: mark as incomplete and remove completedAt
          const { completedAt, ...taskWithoutCompletedAt } = task;
          return { ...taskWithoutCompletedAt, completed: false };
        } else {
          // Complete task: mark as completed and set completedAt
          return { ...task, completed: true, completedAt: new Date(), completedPomodoros: task.pomodorosSpent };
        }
      }
      return task;
    });
    saveTasks(updatedTasks);
  }, [tasks, saveTasks]);

  const deleteTask = useCallback((taskId: string) => {
    const updatedTasks = tasks.filter(task => task.id !== taskId);
    saveTasks(updatedTasks);
    if (currentTask === taskId) {
      setCurrentTask(undefined);
    }
  }, [tasks, saveTasks, currentTask]);

  const updateTaskPomodoros = useCallback((taskId: string, pomodoros: number) => {
    const updatedTasks = tasks.map(task => 
      task.id === taskId 
        ? { ...task, pomodorosSpent: task.pomodorosSpent + pomodoros }
        : task
    );
    saveTasks(updatedTasks);
  }, [tasks, saveTasks]);

  const editTask = useCallback((taskId: string, updates: Partial<Task>) => {
    const updatedTasks = tasks.map(task => 
      task.id === taskId 
        ? { ...task, ...updates }
        : task
    );
    saveTasks(updatedTasks);
  }, [tasks, saveTasks]);

  return {
    tasks,
    currentTask,
    addTask,
    selectTask,
    completeTask,
    deleteTask,
    updateTaskPomodoros,
    editTask
  };
}

// Statistics hook
export function useStatistics() {
  const [statistics, setStatistics] = useState<Statistics>(() => 
    StorageService.loadStatistics()
  );

  const updateStatistics = useCallback((newStats: Partial<Statistics>) => {
    const updatedStats = { ...statistics, ...newStats };
    setStatistics(updatedStats);
    StorageService.saveStatistics(updatedStats);
  }, [statistics]);

  const recordCompletedPomodoro = useCallback(() => {
    StorageService.updateDailyStats(1);
    setStatistics(StorageService.loadStatistics());
  }, []);

  return {
    statistics,
    updateStatistics,
    recordCompletedPomodoro
  };
}