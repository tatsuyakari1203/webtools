// Pomodoro Timer TypeScript Interfaces and Data Models

// Pomodoro Settings Interface
export interface PomodoroSettings {
  workDuration: number; // in minutes, default: 25
  shortBreakDuration: number; // in minutes, default: 5
  longBreakDuration: number; // in minutes, default: 15
  pomodorosBeforeLongBreak: number; // default: 4
  autoStartBreaks: boolean; // default: false
  autoStartPomodoros: boolean; // default: false
  tickSoundEnabled: boolean; // default: false
  notificationSoundEnabled: boolean; // default: true
  volume: number; // 0-1, default: 0.5
}

// Task Interface
export interface Task {
  id: string;
  text: string;
  completed: boolean;
  createdAt: Date;
  completedAt?: Date;
  pomodorosSpent: number;
  estimatedPomodoros: number;
  completedPomodoros: number;
}

// Session State Interface
export interface SessionState {
  type: 'work' | 'shortBreak' | 'longBreak';
  timeRemaining: number; // in seconds
  isRunning: boolean;
  currentCycle: number; // 1-4
  completedPomodoros: number;
  currentTask?: string;
}

// Statistics Interface
export interface Statistics {
  dailyPomodoros: Record<string, number>; // date -> count
  totalPomodoros: number;
  totalFocusTime: number; // in minutes
  averageSessionLength: number; // in minutes
  longestStreak: number; // consecutive days
  currentStreak: number;
}



// Component Props Interfaces
export interface TimerDisplayProps {
  timeRemaining: number;
  sessionType: 'work' | 'shortBreak' | 'longBreak';
  isRunning: boolean;
  currentTask?: string;
}

export interface ControlPanelProps {
  isRunning: boolean;
  onStart: () => void;
  onPause: () => void;
  onSkip: () => void;
  onReset: () => void;
  settings: PomodoroSettings;
  onSettingsChange: (settings: PomodoroSettings) => void;
}

export interface CycleTrackerProps {
  completedPomodoros: number;
  totalPomodoros: number;
}

export interface SettingsPanelProps {
  settings: PomodoroSettings;
  onSettingsChange: (settings: PomodoroSettings) => void;
}

export interface TodoProps {
  tasks: Task[];
  currentTask?: string;
  onTaskAdd: (task: string, estimatedPomodoros?: number) => void;
  onTaskSelect: (taskId: string) => void;
  onTaskComplete: (taskId: string) => void;
  onTaskDelete: (taskId: string) => void;
}

export interface StatisticsProps {
  statistics: Statistics;
}

// Default Settings
export const DEFAULT_SETTINGS: PomodoroSettings = {
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  pomodorosBeforeLongBreak: 4,
  autoStartBreaks: false,
  autoStartPomodoros: false,
  tickSoundEnabled: false,
  notificationSoundEnabled: true,
  volume: 0.5,
};

// LocalStorage Keys
export const STORAGE_KEYS = {
  SETTINGS: 'pomodoro_settings',
  TASKS: 'pomodoro_tasks',
  STATISTICS: 'pomodoro_statistics',
  SESSION_STATE: 'pomodoro_session_state'
} as const;

// Audio Files Configuration
export const AUDIO_FILES = {
  TICK: '/sounds/tick.mp3',
  WORK_COMPLETE: '/sounds/work-complete.mp3',
  BREAK_COMPLETE: '/sounds/break-complete.mp3'
} as const;