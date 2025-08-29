'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock as ClockIcon, Globe, Plus, X } from 'lucide-react';

interface WorldClockProps {
  timezone: string;
  label: string;
}

const WorldClock: React.FC<WorldClockProps> = ({ timezone, label }) => {
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeString = now.toLocaleTimeString('en-US', {
        timeZone: timezone,
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      setTime(timeString);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, [timezone]);

  return (
    <div className="text-center">
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className="font-mono text-lg font-bold">{time}</div>
    </div>
  );
};

const CurrentTimeClock: React.FC = () => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeString = now.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      const dateString = now.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      setCurrentTime(timeString);
      setCurrentDate(dateString);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="text-center">
      <div className="text-xs text-muted-foreground mb-1 flex items-center justify-center gap-1">
        <ClockIcon className="h-3 w-3" />
        Current Time
      </div>
      <div className="font-mono text-3xl font-bold mb-1">{currentTime}</div>
      <div className="text-xs text-muted-foreground">{currentDate}</div>
    </div>
  );
};

interface TimezoneOption {
  timezone: string;
  label: string;
}

const CombinedClockPanel: React.FC = () => {
  const defaultClocks = [
    { timezone: 'America/New_York', label: 'New York' },
    { timezone: 'Europe/London', label: 'London' },
    { timezone: 'Asia/Tokyo', label: 'Tokyo' }
  ];

  const availableTimezones: TimezoneOption[] = [
    { timezone: 'America/New_York', label: 'New York' },
    { timezone: 'America/Los_Angeles', label: 'Los Angeles' },
    { timezone: 'America/Chicago', label: 'Chicago' },
    { timezone: 'Europe/London', label: 'London' },
    { timezone: 'Europe/Paris', label: 'Paris' },
    { timezone: 'Europe/Berlin', label: 'Berlin' },
    { timezone: 'Asia/Tokyo', label: 'Tokyo' },
    { timezone: 'Asia/Shanghai', label: 'Shanghai' },
    { timezone: 'Asia/Seoul', label: 'Seoul' },
    { timezone: 'Asia/Singapore', label: 'Singapore' },
    { timezone: 'Australia/Sydney', label: 'Sydney' },
    { timezone: 'Australia/Melbourne', label: 'Melbourne' },
    { timezone: 'Pacific/Auckland', label: 'Auckland' },
    { timezone: 'Asia/Dubai', label: 'Dubai' },
    { timezone: 'Asia/Kolkata', label: 'Mumbai' }
  ];

  const [worldClocks, setWorldClocks] = useState<TimezoneOption[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pomodoro-world-clocks');
      return saved ? JSON.parse(saved) : defaultClocks;
    }
    return defaultClocks;
  });

  const [selectedTimezone, setSelectedTimezone] = useState<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('pomodoro-world-clocks', JSON.stringify(worldClocks));
    }
  }, [worldClocks]);

  const addClock = () => {
    if (selectedTimezone && !worldClocks.find(clock => clock.timezone === selectedTimezone)) {
      const timezoneOption = availableTimezones.find(tz => tz.timezone === selectedTimezone);
      if (timezoneOption) {
        setWorldClocks([...worldClocks, timezoneOption]);
        setSelectedTimezone('');
      }
    }
  };

  const removeClock = (timezone: string) => {
    setWorldClocks(worldClocks.filter(clock => clock.timezone !== timezone));
  };

  const availableOptions = availableTimezones.filter(
    tz => !worldClocks.find(clock => clock.timezone === tz.timezone)
  );

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClockIcon className="h-4 w-4" />
            World Clock
          </div>
          {availableOptions.length > 0 && (
            <div className="flex items-center gap-2">
              <Select value={selectedTimezone} onValueChange={setSelectedTimezone}>
                <SelectTrigger className="w-28 h-7 text-xs">
                  <SelectValue placeholder="Add" />
                </SelectTrigger>
                <SelectContent>
                  {availableOptions.map((tz) => (
                    <SelectItem key={tz.timezone} value={tz.timezone} className="text-xs">
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                variant="outline"
                className="h-7 w-7 p-0"
                onClick={addClock}
                disabled={!selectedTimezone}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Current Time - Left Side */}
          <div className="border-r lg:pr-6">
            <CurrentTimeClock />
          </div>
          
          {/* World Clocks - Right Side */}
          <div className="space-y-3">
            <div className="text-xs text-muted-foreground mb-3 flex items-center gap-1">
              <Globe className="h-3 w-3" />
              World Times
            </div>
            <div className="grid grid-cols-1 gap-3">
              {worldClocks.map((clock) => (
                <div key={clock.timezone} className="flex items-center justify-between p-2 rounded border bg-muted/30">
                  <WorldClock
                    timezone={clock.timezone}
                    label={clock.label}
                  />
                  {worldClocks.length > 1 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                      onClick={() => removeClock(clock.timezone)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export { CurrentTimeClock, CombinedClockPanel };