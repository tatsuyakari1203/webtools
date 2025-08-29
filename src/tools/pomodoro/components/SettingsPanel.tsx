'use client';

// Settings Panel Component with Time and Audio Customization
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Settings, 
  Clock, 
  Volume2, 
  VolumeX, 
  Bell, 
  Play 
} from 'lucide-react';
import { PomodoroSettings, SettingsPanelProps } from '../types';
import { useAudio } from '../hooks';

export default function SettingsPanel({
  settings,
  onSettingsChange
}: SettingsPanelProps) {
  const [localSettings, setLocalSettings] = useState<PomodoroSettings>(settings);
  const [hasChanges, setHasChanges] = useState(false);
  const { playNotificationSound, setVolume } = useAudio();

  // Handle settings change
  const handleSettingChange = (key: keyof PomodoroSettings, value: number | boolean) => {
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);
    setHasChanges(true);
    
    // Update volume in real-time
    if (key === 'volume') {
      setVolume(value as number);
    }
  };

  // Save settings
  const handleSave = () => {
    onSettingsChange(localSettings);
    setHasChanges(false);
  };

  // Test sound function
  const testSound = async () => {
    if (localSettings.notificationSoundEnabled) {
      try {
        await playNotificationSound('work');
      } catch (error) {
        console.error('Error playing test sound:', error);
      }
    }
  };

  return (
    <Card className="p-6 max-w-2xl mx-auto">
      {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Settings className="w-5 h-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold text-foreground">Settings</h3>
        </div>

      <Tabs defaultValue="timing" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="timing" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Timing
          </TabsTrigger>
          <TabsTrigger value="audio" className="flex items-center gap-2">
            <Volume2 className="w-4 h-4" />
            Audio
          </TabsTrigger>
          <TabsTrigger value="behavior" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Behavior
          </TabsTrigger>
        </TabsList>

        {/* Timing Settings */}
        <TabsContent value="timing" className="space-y-6">
          <div className="space-y-4">
            <h4 className="font-medium text-foreground">Session Durations</h4>
            
            {/* Work Duration */}
            <div className="space-y-2">
              <Label htmlFor="work-duration">Work Session (minutes)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="work-duration"
                  type="number"
                  min="1"
                  max="60"
                  value={localSettings.workDuration}
                  onChange={(e) => handleSettingChange('workDuration', parseInt(e.target.value))}
                  className="w-20"
                />
                <Badge variant="outline">{localSettings.workDuration} min</Badge>
              </div>
            </div>

            {/* Short Break Duration */}
            <div className="space-y-2">
              <Label htmlFor="short-break-duration">Short Break (minutes)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="short-break-duration"
                  type="number"
                  min="1"
                  max="30"
                  value={localSettings.shortBreakDuration}
                  onChange={(e) => handleSettingChange('shortBreakDuration', parseInt(e.target.value))}
                  className="w-20"
                />
                <Badge variant="outline">{localSettings.shortBreakDuration} min</Badge>
              </div>
            </div>

            {/* Long Break Duration */}
            <div className="space-y-2">
              <Label htmlFor="long-break-duration">Long Break (minutes)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="long-break-duration"
                  type="number"
                  min="1"
                  max="60"
                  value={localSettings.longBreakDuration}
                  onChange={(e) => handleSettingChange('longBreakDuration', parseInt(e.target.value))}
                  className="w-20"
                />
                <Badge variant="outline">{localSettings.longBreakDuration} min</Badge>
              </div>
            </div>

            <Separator />

            {/* Cycles Before Long Break */}
            <div className="space-y-2">
              <Label htmlFor="pomodoros-before-long-break">Pomodoros before long break</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="pomodoros-before-long-break"
                  type="number"
                  min="2"
                  max="10"
                  value={localSettings.pomodorosBeforeLongBreak}
                  onChange={(e) => handleSettingChange('pomodorosBeforeLongBreak', parseInt(e.target.value))}
                  className="w-20"
                />
                <Badge variant="outline">{localSettings.pomodorosBeforeLongBreak} cycles</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                After {localSettings.pomodorosBeforeLongBreak} work sessions, you&apos;ll get a long break
              </p>
            </div>
          </div>
        </TabsContent>

        {/* Audio Settings */}
        <TabsContent value="audio" className="space-y-6">
          <div className="space-y-4">
            <h4 className="font-medium text-foreground">Sound Settings</h4>
            
            {/* Sound Enabled */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Enable Sounds</Label>
                <p className="text-sm text-muted-foreground">Play sounds when sessions start/end</p>
              </div>
              <Switch
                checked={localSettings.notificationSoundEnabled}
                onCheckedChange={(checked) => handleSettingChange('notificationSoundEnabled', checked)}
              />
            </div>

            {/* Tick Sound */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Tick Sound</Label>
                <p className="text-sm text-muted-foreground">Play ticking sound during work sessions</p>
              </div>
              <Switch
                checked={localSettings.tickSoundEnabled}
                onCheckedChange={(checked) => handleSettingChange('tickSoundEnabled', checked)}
                disabled={!localSettings.notificationSoundEnabled}
              />
            </div>

            {/* Volume Control */}
            <div className="space-y-2">
              <Label htmlFor="volume">Volume</Label>
              <div className="flex items-center gap-3">
                <VolumeX className="w-4 h-4 text-muted-foreground" />
                <Input
                  id="volume"
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={localSettings.volume}
                  onChange={(e) => handleSettingChange('volume', parseFloat(e.target.value))}
                  className="flex-1"
                  disabled={!localSettings.notificationSoundEnabled}
                />
                <Volume2 className="w-4 h-4 text-muted-foreground" />
                <Badge variant="outline" className="w-12 text-center">
                  {Math.round(localSettings.volume * 100)}%
                </Badge>
              </div>
            </div>

            {/* Test Sound Button */}
            <Button
              onClick={testSound}
              variant="outline"
              size="sm"
              disabled={!localSettings.notificationSoundEnabled}
              className="w-full"
            >
              <Play className="w-4 h-4 mr-2" />
              Test Sound
            </Button>
          </div>
        </TabsContent>

        {/* Behavior Settings */}
        <TabsContent value="behavior" className="space-y-6">
          <div className="space-y-4">
            <h4 className="font-medium text-foreground">Auto-Start Settings</h4>
            
            {/* Auto Start Breaks */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Auto-start Breaks</Label>
                <p className="text-sm text-muted-foreground">Automatically start break sessions</p>
              </div>
              <Switch
                checked={localSettings.autoStartBreaks}
                onCheckedChange={(checked) => handleSettingChange('autoStartBreaks', checked)}
              />
            </div>

            {/* Auto Start Pomodoros */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Auto-start Pomodoros</Label>
                <p className="text-sm text-muted-foreground">Automatically start work sessions after breaks</p>
              </div>
              <Switch
                checked={localSettings.autoStartPomodoros}
                onCheckedChange={(checked) => handleSettingChange('autoStartPomodoros', checked)}
              />
            </div>

            <Separator />

            <h4 className="font-medium text-foreground">Notifications</h4>
            
            {/* Notifications Enabled */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Browser Notifications</Label>
                <p className="text-sm text-muted-foreground">Show notifications when sessions end</p>
              </div>
              <Switch
                checked={localSettings.notificationSoundEnabled}
                onCheckedChange={(checked) => handleSettingChange('notificationSoundEnabled', checked)}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <div className="flex justify-end pt-4 border-t">
        <Button
          onClick={handleSave}
          disabled={!hasChanges}
          className="px-6"
        >
          Save Changes
        </Button>
      </div>

      {/* Changes Indicator */}
      {hasChanges && (
        <div className="mt-2 text-center">
          <Badge variant="outline" className="text-destructive border-destructive">
            You have unsaved changes
          </Badge>
        </div>
      )}
    </Card>
  );
}