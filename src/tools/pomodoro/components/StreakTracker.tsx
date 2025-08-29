'use client';

import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Flame,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import type { StatisticsProps, Statistics } from '../types';

interface DayData {
  date: string;
  completedPomodoros: number;
  hasActivity: boolean;
}

function GitHubStyleCalendar({ statistics }: { statistics: Statistics }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const monthData = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Start from Sunday of the week containing the first day
    const calendarStart = new Date(firstDay);
    calendarStart.setDate(calendarStart.getDate() - calendarStart.getDay());
    
    const days: DayData[] = [];
    const current = new Date(calendarStart);
    
    // Generate 42 days (6 weeks x 7 days) for consistent grid
    for (let i = 0; i < 42; i++) {
      const dateStr = current.toISOString().split('T')[0];
      const dayStats = statistics.dailyStats?.[dateStr];
      
      days.push({
        date: dateStr,
        completedPomodoros: dayStats?.completedPomodoros || 0,
        hasActivity: (dayStats?.completedPomodoros || 0) > 0
      });
      
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  }, [currentMonth, statistics]);
  
  const navigateMonth = (direction: number) => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + direction);
      return newDate;
    });
  };
  
  const getIntensityClass = (pomodoros: number) => {
    if (pomodoros === 0) return 'bg-gray-100 dark:bg-gray-800';
    if (pomodoros <= 2) return 'bg-green-200 dark:bg-green-900';
    if (pomodoros <= 4) return 'bg-green-400 dark:bg-green-700';
    if (pomodoros <= 6) return 'bg-green-600 dark:bg-green-500';
    return 'bg-green-800 dark:bg-green-300';
  };
  
  // Calculate streak
  const currentStreak = useMemo(() => {
    let streak = 0;
    const today = new Date();
    const checkDate = new Date(today);
    
    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0];
      const dayStats = statistics.dailyStats?.[dateStr];
      
      if (dayStats && dayStats.completedPomodoros > 0) {
        streak++;
      } else {
        break;
      }
      
      checkDate.setDate(checkDate.getDate() - 1);
    }
    
    return streak;
  }, [statistics]);
  
  // Group days into weeks
  const weeks = [];
  for (let i = 0; i < monthData.length; i += 7) {
    weeks.push(monthData.slice(i, i + 7));
  }
  
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h3 className="text-sm font-semibold">{currentMonth.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</h3>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Flame className="w-3 h-3 text-orange-500" />
            <span>{currentStreak} day streak</span>
          </div>
        </div>
        <div className="flex gap-1">
          <Button
            onClick={() => navigateMonth(-1)}
            size="sm"
            variant="outline"
            className="h-6 w-6 p-0"
          >
            <ChevronLeft className="w-3 h-3" />
          </Button>
          <Button
            onClick={() => navigateMonth(1)}
            size="sm"
            variant="outline"
            className="h-6 w-6 p-0"
            disabled={currentMonth >= new Date()}
          >
            <ChevronRight className="w-3 h-3" />
          </Button>
        </div>
      </div>
      
      <div className="space-y-1">
        {/* Day labels */}
        <div className="flex text-xs text-muted-foreground mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="flex-1 text-center">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {monthData.map((day, dayIndex) => {
            const dayDate = new Date(day.date);
            const isCurrentMonth = dayDate.getMonth() === currentMonth.getMonth();
            const isToday = day.date === new Date().toISOString().split('T')[0];
            
            return (
              <div
                key={dayIndex}
                className={`
                  aspect-square rounded-sm flex items-center justify-center text-xs
                  ${isCurrentMonth ? 'opacity-100' : 'opacity-30'}
                  ${isToday ? 'ring-2 ring-blue-500' : ''}
                  ${getIntensityClass(day.completedPomodoros)}
                  ${day.hasActivity ? 'text-white' : 'text-gray-600 dark:text-gray-400'}
                `}
                title={`${day.date}: ${day.completedPomodoros} pomodoros`}
              >
                {dayDate.getDate()}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Less</span>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-gray-100 dark:bg-gray-800 rounded-sm" />
          <div className="w-2 h-2 bg-green-200 dark:bg-green-900 rounded-sm" />
          <div className="w-2 h-2 bg-green-400 dark:bg-green-700 rounded-sm" />
          <div className="w-2 h-2 bg-green-600 dark:bg-green-500 rounded-sm" />
          <div className="w-2 h-2 bg-green-800 dark:bg-green-300 rounded-sm" />
        </div>
        <span>More</span>
      </div>
    </div>
  );
}

export default function StreakTracker({ statistics }: StatisticsProps) {
  return (
    <Card className="p-4 w-full">
      <div className="flex items-center gap-2 mb-4">
        <Flame className="w-4 h-4 text-orange-500" />
        <h2 className="text-base font-semibold text-foreground">Your Streak</h2>
      </div>

      <GitHubStyleCalendar statistics={statistics} />
    </Card>
  );
}