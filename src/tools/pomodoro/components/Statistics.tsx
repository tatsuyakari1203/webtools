'use client';

// Statistics Component with Daily/Weekly Progress Tracking
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  Calendar, 
  Target, 
  TrendingUp, 
  Award,
  Flame,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { StatisticsProps } from '../types';

// Daily Stats Interface
interface DailyStats {
  completedPomodoros: number;
  completedBreaks: number;
  completedTasks: number;
  focusTime: number;
  currentStreak: number;
}

// Daily Stats Card Component
interface DailyStatsCardProps {
  date: string;
  stats: DailyStats;
  isToday?: boolean;
}

function DailyStatsCard({ date, stats, isToday = false }: DailyStatsCardProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const workMinutes = stats.completedPomodoros * 25; // Assuming 25 min work sessions
  const breakMinutes = stats.completedBreaks * 5; // Assuming 5 min breaks
  const totalMinutes = workMinutes + breakMinutes;

  return (
    <Card className={`p-4 ${isToday ? 'border-primary bg-accent' : 'border-border'}`}>
      <div className="flex items-center justify-between mb-3">
        <h4 className={`font-medium ${isToday ? 'text-accent-foreground' : 'text-foreground'}`}>
          {formatDate(date)}
        </h4>
        {isToday && (
          <Badge className="bg-primary text-primary-foreground text-xs">Today</Badge>
        )}
      </div>
      
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="text-center p-2 bg-destructive/10 rounded">
          <div className="text-lg font-bold text-destructive">{stats.completedPomodoros}</div>
          <div className="text-xs text-muted-foreground">Pomodoros</div>
        </div>
        
        <div className="text-center p-2 bg-primary/10 rounded">
          <div className="text-lg font-bold text-primary">{Math.round(totalMinutes / 60 * 10) / 10}h</div>
          <div className="text-xs text-muted-foreground">Focus Time</div>
        </div>
        
        <div className="text-center p-2 bg-secondary/10 rounded">
          <div className="text-lg font-bold text-secondary-foreground">{stats.completedTasks}</div>
          <div className="text-xs text-muted-foreground">Tasks</div>
        </div>
        
        <div className="text-center p-2 bg-accent/10 rounded">
          <div className="text-lg font-bold text-accent-foreground">{stats.currentStreak}</div>
          <div className="text-xs text-muted-foreground">Streak</div>
        </div>
      </div>
    </Card>
  );
}

// Weekly Overview Component
interface WeeklyOverviewProps {
  weeklyStats: { [date: string]: DailyStats };
}

function WeeklyOverview({ weeklyStats }: WeeklyOverviewProps) {
  const days = Object.keys(weeklyStats).sort();
  const maxPomodoros = Math.max(...Object.values(weeklyStats).map(s => s.completedPomodoros), 1);
  
  const totalPomodoros = Object.values(weeklyStats).reduce((sum, stats) => sum + stats.completedPomodoros, 0);
  const totalTasks = Object.values(weeklyStats).reduce((sum, stats) => sum + stats.completedTasks, 0);
  const totalFocusTime = totalPomodoros * 25; // minutes
  
  const getDayName = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short' });
  };

  return (
    <div className="space-y-6">
      {/* Weekly Summary */}
      <div className="flex flex-col gap-4">
        <Card className="p-4 text-center bg-destructive/10">
          <div className="text-2xl font-bold text-destructive">{totalPomodoros}</div>
          <div className="text-sm text-muted-foreground">Total Pomodoros</div>
        </Card>
        
        <Card className="p-4 text-center bg-primary/10">
          <div className="text-2xl font-bold text-primary">{Math.round(totalFocusTime / 60 * 10) / 10}h</div>
          <div className="text-sm text-muted-foreground">Focus Time</div>
        </Card>
        
        <Card className="p-4 text-center bg-secondary/10">
          <div className="text-2xl font-bold text-secondary-foreground">{totalTasks}</div>
          <div className="text-sm text-muted-foreground">Tasks Completed</div>
        </Card>
      </div>

      {/* Weekly Chart */}
      <Card className="p-4">
        <h4 className="font-medium text-foreground mb-4 flex items-center gap-2">
          <BarChart3 className="w-4 h-4" />
          Daily Pomodoros
        </h4>
        
        <div className="flex items-end justify-between gap-2 h-32">
          {days.map(date => {
            const stats = weeklyStats[date];
            const height = (stats.completedPomodoros / maxPomodoros) * 100;
            
            return (
              <div key={date} className="flex-1 flex flex-col items-center">
                <div className="flex-1 flex items-end">
                  <div 
                    className="w-full bg-destructive rounded-t transition-all duration-300 min-h-[4px]"
                    style={{ height: `${height}%` }}
                  />
                </div>
                <div className="text-xs text-muted-foreground mt-2">{getDayName(date)}</div>
                <div className="text-xs font-medium text-foreground">{stats.completedPomodoros}</div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

// Achievement Badge Component
interface AchievementProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  achieved: boolean;
  progress?: number;
}

function Achievement({ title, description, icon, achieved, progress }: AchievementProps) {
  return (
    <Card className={`p-4 ${achieved ? 'border-primary bg-accent' : 'border-border'}`}>
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-full ${achieved ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
          {icon}
        </div>
        
        <div className="flex-1">
          <h4 className={`font-medium ${achieved ? 'text-accent-foreground' : 'text-muted-foreground'}`}>
            {title}
          </h4>
          <p className="text-xs text-muted-foreground">{description}</p>
          
          {!achieved && progress !== undefined && (
            <div className="mt-2">
              <div className="w-full bg-muted rounded-full h-1">
                <div 
                  className="bg-primary h-1 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="text-xs text-muted-foreground mt-1">{Math.round(progress)}% complete</div>
            </div>
          )}
        </div>
        
        {achieved && (
          <Badge className="bg-primary text-primary-foreground">Achieved!</Badge>
        )}
      </div>
    </Card>
  );
}

// Main Statistics Component
export default function Statistics({ statistics }: StatisticsProps) {
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
  
  // Get current date and calculate week range
  const today = new Date();
  const currentWeekStart = new Date(today);
  currentWeekStart.setDate(today.getDate() - today.getDay() + (currentWeekOffset * 7));
  
  // Generate week dates
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(currentWeekStart);
    date.setDate(currentWeekStart.getDate() + i);
    return date.toISOString().split('T')[0];
  });
  
  // Get weekly stats
  const weeklyStats = weekDates.reduce((acc, date) => {
    acc[date] = {
      completedPomodoros: statistics.dailyPomodoros[date] || 0,
      completedBreaks: 0,
      completedTasks: 0,
      focusTime: (statistics.dailyPomodoros[date] || 0) * 25,
      currentStreak: statistics.currentStreak
    };
    return acc;
  }, {} as { [date: string]: DailyStats });
  
  // Calculate achievements
  const totalPomodoros = statistics.totalPomodoros;
  const maxDailyPomodoros = Math.max(...Object.values(statistics.dailyPomodoros), 0);
  const currentStreak = statistics.currentStreak;
  
  const achievements = [
    {
      title: "First Pomodoro",
      description: "Complete your first pomodoro session",
      icon: <Target className="w-4 h-4" />,
      achieved: totalPomodoros >= 1,
      progress: Math.min(totalPomodoros * 100, 100)
    },
    {
      title: "Daily Goal",
      description: "Complete 8 pomodoros in a single day",
      icon: <Calendar className="w-4 h-4" />,
      achieved: maxDailyPomodoros >= 8,
      progress: Math.min((maxDailyPomodoros / 8) * 100, 100)
    },
    {
      title: "Streak Master",
      description: "Maintain a 7-day streak",
      icon: <Flame className="w-4 h-4" />,
      achieved: currentStreak >= 7,
      progress: Math.min((currentStreak / 7) * 100, 100)
    },
    {
      title: "Century Club",
      description: "Complete 100 total pomodoros",
      icon: <Award className="w-4 h-4" />,
      achieved: totalPomodoros >= 100,
      progress: Math.min((totalPomodoros / 100) * 100, 100)
    }
  ];
  
  const formatWeekRange = () => {
    const start = weekDates[0];
    const end = weekDates[6];
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    return `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  };

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold text-foreground">Statistics</h3>
        </div>
        <Badge variant="outline">
          {totalPomodoros} total sessions
        </Badge>
      </div>

      <Tabs defaultValue="daily" className="w-full">
        <TabsList className="flex flex-col w-full gap-1">
          <TabsTrigger value="daily">Daily</TabsTrigger>
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
        </TabsList>

        {/* Daily View */}
        <TabsContent value="daily" className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-foreground">Week of {formatWeekRange()}</h4>
            <div className="flex gap-1">
              <Button
                onClick={() => setCurrentWeekOffset(currentWeekOffset - 1)}
                size="sm"
                variant="outline"
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                onClick={() => setCurrentWeekOffset(currentWeekOffset + 1)}
                size="sm"
                variant="outline"
                className="h-8 w-8 p-0"
                disabled={currentWeekOffset >= 0}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <div className="flex flex-col gap-4">
            {weekDates.map(date => {
              const isToday = date === today.toISOString().split('T')[0];
              return (
                <DailyStatsCard
                  key={date}
                  date={date}
                  stats={weeklyStats[date]}
                  isToday={isToday}
                />
              );
            })}
          </div>
        </TabsContent>

        {/* Weekly View */}
        <TabsContent value="weekly">
          <WeeklyOverview weeklyStats={weeklyStats} />
        </TabsContent>

        {/* Achievements View */}
        <TabsContent value="achievements" className="space-y-4">
          <div className="flex flex-col gap-4">
            {achievements.map((achievement, index) => (
              <Achievement
                key={index}
                title={achievement.title}
                description={achievement.description}
                icon={achievement.icon}
                achieved={achievement.achieved}
                progress={achievement.progress}
              />
            ))}
          </div>
          
          {/* Achievement Summary */}
          <Card className="p-4 bg-gradient-to-r from-accent/20 to-secondary/20">
            <div className="text-center">
              <h4 className="font-medium text-foreground mb-2">Achievement Progress</h4>
              <div className="text-3xl font-bold text-primary mb-1">
                {achievements.filter(a => a.achieved).length} / {achievements.length}
              </div>
              <div className="text-sm text-muted-foreground">Achievements Unlocked</div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </Card>
  );
}