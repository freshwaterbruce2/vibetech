import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Settings,
  Moon,
  Sun,
  Clock,
  Key,
  Download,
  Upload,
  Bell,
  Monitor,
  Save,
  RefreshCw,
} from 'lucide-react';

interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  deepseekApiKey: string;
  workHours: {
    start: string;
    end: string;
  };
  pomodoroSettings: {
    workDuration: number;
    shortBreakDuration: number;
    longBreakDuration: number;
    sessionsUntilLongBreak: number;
  };
  notifications: {
    sessionComplete: boolean;
    taskReminders: boolean;
    breakReminders: boolean;
  };
  general: {
    autoStartBreaks: boolean;
    minimizeToTray: boolean;
    startOnBoot: boolean;
    soundEnabled: boolean;
  };
}

const defaultSettings: AppSettings = {
  theme: 'system',
  deepseekApiKey: '',
  workHours: {
    start: '09:00',
    end: '17:00',
  },
  pomodoroSettings: {
    workDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    sessionsUntilLongBreak: 4,
  },
  notifications: {
    sessionComplete: true,
    taskReminders: true,
    breakReminders: true,
  },
  general: {
    autoStartBreaks: false,
    minimizeToTray: true,
    startOnBoot: false,
    soundEnabled: true,
  },
};

export function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Load settings on component mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      // This would be a backend call to load settings
      // For now, load from localStorage or use defaults
      const savedSettings = localStorage.getItem('vibepilot-settings');
      if (savedSettings) {
        setSettings({ ...defaultSettings, ...JSON.parse(savedSettings) });
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setIsSaving(true);
      // This would be a backend call to save settings
      localStorage.setItem('vibepilot-settings', JSON.stringify(settings));

      // Apply theme change immediately
      applyTheme(settings.theme);

      setHasChanges(false);
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const applyTheme = (theme: string) => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      // System theme
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  };

  const updateSettings = (path: string, value: string | number | boolean) => {
    setSettings((prev) => {
      const keys = path.split('.');
      const updated = { ...prev };
      let current: Record<string, unknown> = updated;

      for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        current[key] = { ...(current[key] as Record<string, unknown>) };
        current = current[key] as Record<string, unknown>;
      }

      current[keys[keys.length - 1]] = value;
      setHasChanges(true);
      return updated;
    });
  };

  const exportData = async () => {
    try {
      // This would export all user data (tasks, sessions, settings)
      const data = {
        settings,
        exportDate: new Date().toISOString(),
        version: '1.0.0',
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vibepilot-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export data:', error);
    }
  };

  const importData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (data.settings) {
        setSettings({ ...defaultSettings, ...data.settings });
        setHasChanges(true);
      }
    } catch (error) {
      console.error('Failed to import data:', error);
      alert('Failed to import data. Please check the file format.');
    }

    // Reset the input
    event.target.value = '';
  };

  const resetToDefaults = () => {
    if (confirm('Are you sure you want to reset all settings to defaults?')) {
      setSettings(defaultSettings);
      setHasChanges(true);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground">
            Customize your VibePilot experience
          </p>
        </div>

        {hasChanges && (
          <Card className="mb-6 border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20">
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-2">
                <Save className="h-4 w-4 text-yellow-600" />
                <span className="text-sm text-yellow-800 dark:text-yellow-200">
                  You have unsaved changes
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setSettings(defaultSettings);
                    setHasChanges(false);
                  }}
                  variant="outline"
                  size="sm"
                >
                  Discard
                </Button>
                <Button onClick={saveSettings} disabled={isSaving} size="sm">
                  {isSaving ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="general" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="pomodoro">Pomodoro</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
            <TabsTrigger value="data">Data</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  General Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-sm font-medium">Auto-start breaks</div>
                    <div className="text-sm text-muted-foreground">
                      Automatically start break timers after work sessions
                    </div>
                  </div>
                  <Switch
                    checked={settings.general.autoStartBreaks}
                    onCheckedChange={(checked) =>
                      updateSettings('general.autoStartBreaks', checked)
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-sm font-medium">Minimize to system tray</div>
                    <div className="text-sm text-muted-foreground">
                      Keep the app running in the background when closed
                    </div>
                  </div>
                  <Switch
                    checked={settings.general.minimizeToTray}
                    onCheckedChange={(checked) =>
                      updateSettings('general.minimizeToTray', checked)
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-sm font-medium">Start on boot</div>
                    <div className="text-sm text-muted-foreground">
                      Launch VibePilot when your computer starts
                    </div>
                  </div>
                  <Switch
                    checked={settings.general.startOnBoot}
                    onCheckedChange={(checked) =>
                      updateSettings('general.startOnBoot', checked)
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-sm font-medium">Sound notifications</div>
                    <div className="text-sm text-muted-foreground">
                      Play sounds for timer alerts and notifications
                    </div>
                  </div>
                  <Switch
                    checked={settings.general.soundEnabled}
                    onCheckedChange={(checked) =>
                      updateSettings('general.soundEnabled', checked)
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Work Hours
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Start Time</label>
                    <Input
                      type="time"
                      value={settings.workHours.start}
                      onChange={(e) =>
                        updateSettings('workHours.start', e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">End Time</label>
                    <Input
                      type="time"
                      value={settings.workHours.end}
                      onChange={(e) =>
                        updateSettings('workHours.end', e.target.value)
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-sm font-medium">Session complete</div>
                    <div className="text-sm text-muted-foreground">
                      Notify when focus sessions are complete
                    </div>
                  </div>
                  <Switch
                    checked={settings.notifications.sessionComplete}
                    onCheckedChange={(checked) =>
                      updateSettings('notifications.sessionComplete', checked)
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-sm font-medium">Task reminders</div>
                    <div className="text-sm text-muted-foreground">
                      Remind you about upcoming task deadlines
                    </div>
                  </div>
                  <Switch
                    checked={settings.notifications.taskReminders}
                    onCheckedChange={(checked) =>
                      updateSettings('notifications.taskReminders', checked)
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-sm font-medium">Break reminders</div>
                    <div className="text-sm text-muted-foreground">
                      Remind you to take breaks during long work sessions
                    </div>
                  </div>
                  <Switch
                    checked={settings.notifications.breakReminders}
                    onCheckedChange={(checked) =>
                      updateSettings('notifications.breakReminders', checked)
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appearance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Theme Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <label className="text-sm font-medium">Choose your theme</label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => updateSettings('theme', 'light')}
                      className={`flex items-center gap-2 p-3 rounded-lg border transition-colors ${
                        settings.theme === 'light'
                          ? 'border-primary bg-primary/10'
                          : 'border-muted hover:bg-muted/50'
                      }`}
                    >
                      <Sun className="h-4 w-4" />
                      <span className="text-sm">Light</span>
                    </button>
                    <button
                      onClick={() => updateSettings('theme', 'dark')}
                      className={`flex items-center gap-2 p-3 rounded-lg border transition-colors ${
                        settings.theme === 'dark'
                          ? 'border-primary bg-primary/10'
                          : 'border-muted hover:bg-muted/50'
                      }`}
                    >
                      <Moon className="h-4 w-4" />
                      <span className="text-sm">Dark</span>
                    </button>
                    <button
                      onClick={() => updateSettings('theme', 'system')}
                      className={`flex items-center gap-2 p-3 rounded-lg border transition-colors ${
                        settings.theme === 'system'
                          ? 'border-primary bg-primary/10'
                          : 'border-muted hover:bg-muted/50'
                      }`}
                    >
                      <Monitor className="h-4 w-4" />
                      <span className="text-sm">System</span>
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pomodoro" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Pomodoro Timer Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Work Duration (minutes)</label>
                    <Input
                      type="number"
                      min="1"
                      max="120"
                      value={settings.pomodoroSettings.workDuration}
                      onChange={(e) =>
                        updateSettings('pomodoroSettings.workDuration', parseInt(e.target.value))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Short Break (minutes)</label>
                    <Input
                      type="number"
                      min="1"
                      max="30"
                      value={settings.pomodoroSettings.shortBreakDuration}
                      onChange={(e) =>
                        updateSettings('pomodoroSettings.shortBreakDuration', parseInt(e.target.value))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Long Break (minutes)</label>
                    <Input
                      type="number"
                      min="1"
                      max="60"
                      value={settings.pomodoroSettings.longBreakDuration}
                      onChange={(e) =>
                        updateSettings('pomodoroSettings.longBreakDuration', parseInt(e.target.value))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Sessions until long break</label>
                    <Input
                      type="number"
                      min="2"
                      max="10"
                      value={settings.pomodoroSettings.sessionsUntilLongBreak}
                      onChange={(e) =>
                        updateSettings('pomodoroSettings.sessionsUntilLongBreak', parseInt(e.target.value))
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integrations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  AI Integration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">DeepSeek API Key</label>
                  <Input
                    type="password"
                    placeholder="Enter your DeepSeek API key"
                    value={settings.deepseekApiKey}
                    onChange={(e) => updateSettings('deepseekApiKey', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Used for AI-powered task suggestions and productivity insights.
                    Get your API key from{' '}
                    <a
                      href="https://deepseek.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      deepseek.com
                    </a>
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="data" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Data Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium mb-2">Export Data</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Export all your tasks, sessions, and settings as a backup file.
                    </p>
                    <Button onClick={exportData} variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Export Data
                    </Button>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-sm font-medium mb-2">Import Data</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Import data from a previously exported backup file.
                    </p>
                    <div>
                      <Input
                        type="file"
                        accept=".json"
                        onChange={importData}
                        className="hidden"
                        id="import-file"
                      />
                      <Button variant="outline" asChild>
                        <label htmlFor="import-file" className="cursor-pointer">
                          <Upload className="h-4 w-4 mr-2" />
                          Import Data
                        </label>
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-sm font-medium mb-2">Reset Settings</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Reset all settings to their default values.
                    </p>
                    <Button onClick={resetToDefaults} variant="destructive">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Reset to Defaults
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}