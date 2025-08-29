'use client';

// Control Panel Component with Timer Controls and Settings
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  Bell,
  Focus
} from 'lucide-react';
import { ControlPanelProps, PomodoroSettings } from '../types';

export default function ControlPanel({
  isRunning,
  onStart,
  onPause,
  onSkip,
  onReset,
  settings,
  onSettingsChange,
  focusMode = false,
  onToggleFocusMode
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
    <Card className="p-4">
      <div className="space-y-4">
        {/* Timer Controls Section */}
        <div>
          <h3 className="font-semibold mb-4">Timer Controls</h3>
          
          {/* Main Control Buttons */}
          <div className="flex gap-2 mb-4">
            <Button
              onClick={isRunning ? onPause : onStart}
              size="default"
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
              size="default"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
            
            <Button
              onClick={onSkip}
              variant="outline"
              size="default"
            >
              <SkipForward className="w-4 h-4" />
            </Button>
            
            {onToggleFocusMode && (
              <Button
                onClick={onToggleFocusMode}
                variant={focusMode ? "default" : "outline"}
                size="default"
                title="Focus Mode (F)"
              >
                <Focus className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Keyboard Shortcuts */}
          <div className="bg-muted/30 rounded-lg p-3 border border-dashed border-muted-foreground/30">
            <div className="flex items-center gap-2 mb-2">
              <Keyboard className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Shortcuts</span>
            </div>
            
            <div className="grid grid-cols-4 gap-2 text-xs">
              <div className="text-center">
                <kbd className="px-1.5 py-0.5 bg-background rounded border text-foreground text-xs">Space</kbd>
                <div className="text-muted-foreground mt-1">Play/Pause</div>
              </div>
              <div className="text-center">
                <kbd className="px-1.5 py-0.5 bg-background rounded border text-foreground text-xs">R</kbd>
                <div className="text-muted-foreground mt-1">Reset</div>
              </div>
              <div className="text-center">
                <kbd className="px-1.5 py-0.5 bg-background rounded border text-foreground text-xs">S</kbd>
                <div className="text-muted-foreground mt-1">Skip</div>
              </div>
              <div className="text-center">
                <kbd className="px-1.5 py-0.5 bg-background rounded border text-foreground text-xs">F</kbd>
                <div className="text-muted-foreground mt-1">Focus</div>
              </div>
            </div>
          </div>
        </div>

        {/* Settings Section */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Settings className="w-4 h-4 text-muted-foreground" />
            <h3 className="font-semibold">Settings</h3>
          </div>

          <Tabs defaultValue="timing" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="timing" className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4" />
                Timing
              </TabsTrigger>
              <TabsTrigger value="behavior" className="flex items-center gap-2 text-sm">
                <Bell className="w-4 h-4" />
                Behavior
              </TabsTrigger>
            </TabsList>

            {/* Timing Settings */}
            <TabsContent value="timing" className="space-y-3 mt-3">
              <div className="space-y-3">
                <h4 className="font-medium text-foreground">Session Durations</h4>
                
                {/* Grid Layout for Session Durations */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {/* Work Duration */}
                  <div className="space-y-1">
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
                  <div className="space-y-1">
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
                  <div className="space-y-1">
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

                {/* Cycles Before Long Break - Full Width */}
                <div className="space-y-1">
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
            <TabsContent value="behavior" className="space-y-3 mt-3">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">Auto-start Breaks</label>
                    <p className="text-xs text-muted-foreground">Automatically start break sessions</p>
                  </div>
                  <Switch
                    checked={localSettings.autoStartBreaks}
                    onCheckedChange={(checked) => handleSettingChange('autoStartBreaks', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">Auto-start Pomodoros</label>
                    <p className="text-xs text-muted-foreground">Automatically start work sessions after breaks</p>
                  </div>
                  <Switch
                    checked={localSettings.autoStartPomodoros}
                    onCheckedChange={(checked) => handleSettingChange('autoStartPomodoros', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">Browser Notifications</label>
                    <p className="text-xs text-muted-foreground">Show notifications when sessions end</p>
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
          <Button
            onClick={handleSave}
            disabled={!hasChanges}
            className="w-full mt-4"
            size="sm"
          >
            Save Changes
          </Button>

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