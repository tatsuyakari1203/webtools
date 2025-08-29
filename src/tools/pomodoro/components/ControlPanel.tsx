'use client';

// Control Panel Component with Timer Controls and Settings
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  SkipForward, 
  Keyboard,
  Settings,
  Clock,
  Bell
} from 'lucide-react';
import { ControlPanelProps, PomodoroSettings } from '../types';

export default function ControlPanel({
  isRunning,
  onStart,
  onPause,
  onSkip,
  onReset,
  settings,
  onSettingsChange
}: ControlPanelProps) {
  const [localSettings, setLocalSettings] = useState<PomodoroSettings>(settings);
  const [hasChanges, setHasChanges] = useState(false);

  // Handle settings change
  const handleSettingChange = (key: keyof PomodoroSettings, value: number | boolean) => {
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);
    setHasChanges(true);
  };

  // Save settings
  const handleSave = () => {
    onSettingsChange(localSettings);
    setHasChanges(false);
  };




  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Timer Controls Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Timer Controls</h3>
          
          {/* Main Control Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={isRunning ? onPause : onStart}
              size="lg"
              className="flex-1"
            >
              {isRunning ? (
                <>
                  <Pause className="w-4 h-4 mr-2" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Start
                </>
              )}
            </Button>
            
            <Button
              onClick={onReset}
              variant="outline"
              size="lg"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
            
            <Button
              onClick={onSkip}
              variant="outline"
              size="lg"
            >
              <SkipForward className="w-4 h-4 mr-2" />
              Skip
            </Button>
          </div>

          {/* Keyboard Shortcuts */}
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Keyboard className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Keyboard Shortcuts</span>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Start/Pause:</span>
                <kbd className="px-2 py-1 bg-background rounded border text-foreground">Space</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Reset:</span>
                <kbd className="px-2 py-1 bg-background rounded border text-foreground">R</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Skip:</span>
                <kbd className="px-2 py-1 bg-background rounded border text-foreground">S</kbd>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Settings Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Settings className="w-5 h-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold text-foreground">Settings</h3>
          </div>

          <Tabs defaultValue="timing" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="timing" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Timing
              </TabsTrigger>
              <TabsTrigger value="behavior" className="flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Behavior
              </TabsTrigger>
            </TabsList>

            {/* Timing Settings */}
            <TabsContent value="timing" className="space-y-4 mt-4">
              <div className="space-y-4">
                <h4 className="font-medium text-foreground">Session Durations</h4>
                
                {/* Grid Layout for Session Durations */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Work Duration */}
                  <div className="space-y-2">
                    <Label htmlFor="work-duration" className="text-sm font-medium">Work Session</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="work-duration"
                        type="number"
                        min="1"
                        max="60"
                        value={localSettings.workDuration}
                        onChange={(e) => handleSettingChange('workDuration', parseInt(e.target.value))}
                        className="w-16 text-center"
                      />
                      <Badge variant="outline" className="text-xs">{localSettings.workDuration}m</Badge>
                    </div>
                  </div>

                  {/* Short Break Duration */}
                  <div className="space-y-2">
                    <Label htmlFor="short-break-duration" className="text-sm font-medium">Short Break</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="short-break-duration"
                        type="number"
                        min="1"
                        max="30"
                        value={localSettings.shortBreakDuration}
                        onChange={(e) => handleSettingChange('shortBreakDuration', parseInt(e.target.value))}
                        className="w-16 text-center"
                      />
                      <Badge variant="outline" className="text-xs">{localSettings.shortBreakDuration}m</Badge>
                    </div>
                  </div>

                  {/* Long Break Duration */}
                  <div className="space-y-2">
                    <Label htmlFor="long-break-duration" className="text-sm font-medium">Long Break</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="long-break-duration"
                        type="number"
                        min="1"
                        max="60"
                        value={localSettings.longBreakDuration}
                        onChange={(e) => handleSettingChange('longBreakDuration', parseInt(e.target.value))}
                        className="w-16 text-center"
                      />
                      <Badge variant="outline" className="text-xs">{localSettings.longBreakDuration}m</Badge>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Cycles Before Long Break - Full Width */}
                <div className="space-y-2">
                  <Label htmlFor="pomodoros-before-long-break" className="text-sm font-medium">Pomodoros before long break</Label>
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


            {/* Behavior Settings */}
            <TabsContent value="behavior" className="space-y-4 mt-4">
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
                    checked={localSettings.notificationsEnabled}
                    onCheckedChange={(checked) => handleSettingChange('notificationsEnabled', checked)}
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
            <div className="text-center">
              <Badge variant="outline" className="text-destructive border-destructive">
                You have unsaved changes
              </Badge>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}