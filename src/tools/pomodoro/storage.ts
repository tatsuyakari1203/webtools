// Storage Service for Pomodoro Timer
import { PomodoroSettings, Task, Statistics, SessionState, STORAGE_KEYS, DEFAULT_SETTINGS } from './types';

// Storage Service Class
export class StorageService {
  static setItem(key: string, value: unknown): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Failed to set item:', error);
    }
  }
  // Settings Management
  static saveSettings(settings: PomodoroSettings): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }

  static loadSettings(): PomodoroSettings {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Merge with defaults to handle missing properties
        return { ...DEFAULT_SETTINGS, ...parsed };
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
    return DEFAULT_SETTINGS;
  }

  // Tasks Management
  static saveTasks(tasks: Task[]): void {
    try {
      const tasksToStore = tasks.map(task => ({
        ...task,
        createdAt: task.createdAt.toISOString(),
        completedAt: task.completedAt?.toISOString()
      }));
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasksToStore));
    } catch (error) {
      console.error('Failed to save tasks:', error);
    }
  }

  static loadTasks(): Task[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.TASKS);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.map((task: { id: string; title: string; estimatedPomodoros: number; completedPomodoros: number; isCompleted: boolean; createdAt: string; completedAt?: string }) => ({
          ...task,
          createdAt: new Date(task.createdAt),
          completedAt: task.completedAt ? new Date(task.completedAt) : undefined
        }));
      }
    } catch (error) {
      console.error('Failed to load tasks:', error);
    }
    return [];
  }

  // Statistics Management
  static saveStatistics(stats: Statistics): void {
    try {
      localStorage.setItem(STORAGE_KEYS.STATISTICS, JSON.stringify(stats));
    } catch (error) {
      console.error('Failed to save statistics:', error);
    }
  }

  static loadStatistics(): Statistics {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.STATISTICS);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load statistics:', error);
    }
    return {
      dailyPomodoros: {},
      totalPomodoros: 0,
      totalFocusTime: 0,
      averageSessionLength: 0,
      longestStreak: 0,
      currentStreak: 0
    };
  }

  // Session State Management
  static saveSessionState(state: SessionState): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SESSION_STATE, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save session state:', error);
    }
  }

  static loadSessionState(): SessionState | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SESSION_STATE);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load session state:', error);
    }
    return null;
  }

  // Clear all data
  static clearAllData(): void {
    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
    } catch (error) {
      console.error('Failed to clear data:', error);
    }
  }

  // Utility function to get today's date string
  static getTodayDateString(): string {
    return new Date().toISOString().split('T')[0];
  }

  // Update daily statistics
  static updateDailyStats(completedPomodoros: number): void {
    const stats = this.loadStatistics();
    const today = this.getTodayDateString();
    
    stats.dailyPomodoros[today] = (stats.dailyPomodoros[today] || 0) + completedPomodoros;
    stats.totalPomodoros += completedPomodoros;
    stats.totalFocusTime += completedPomodoros * 25; // 25 minutes per pomodoro
    
    // Calculate average session length
    if (stats.totalPomodoros > 0) {
      stats.averageSessionLength = stats.totalFocusTime / stats.totalPomodoros;
    }
    
    // Update streak
    this.updateStreak(stats);
    
    this.saveStatistics(stats);
  }

  // Update streak calculation
  private static updateStreak(stats: Statistics): void {
    const today = this.getTodayDateString();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    if (stats.dailyPomodoros[today] > 0) {
      if (stats.dailyPomodoros[yesterdayStr] > 0) {
        stats.currentStreak += 1;
      } else {
        stats.currentStreak = 1;
      }
      
      if (stats.currentStreak > stats.longestStreak) {
        stats.longestStreak = stats.currentStreak;
      }
    }
  }
}