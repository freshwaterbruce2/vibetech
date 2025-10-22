import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { saveSetting, getSetting } from '../lib/api/settings';

export interface AppSettings {
  // Theme settings
  theme: 'light' | 'dark' | 'system';

  // Work settings
  workSessionDuration: number; // in minutes
  shortBreakDuration: number; // in minutes
  longBreakDuration: number; // in minutes
  longBreakInterval: number; // sessions before long break

  // Notification settings
  soundEnabled: boolean;
  desktopNotifications: boolean;
  autoStartBreaks: boolean;
  autoStartSessions: boolean;

  // Display settings
  showCompletedTasks: boolean;
  defaultTaskFilter: 'all' | 'active' | 'completed' | 'starred';
  defaultTaskSort: 'created_at' | 'updated_at' | 'title' | 'due_date' | 'priority';
  compactMode: boolean;

  // Data settings
  syncEnabled: boolean;
  autoSave: boolean;
  backupEnabled: boolean;
}

export interface ApiKeys {
  deepseekApiKey?: string;
  openaiApiKey?: string;
  claudeApiKey?: string;
}

interface SettingsState {
  // State
  settings: AppSettings;
  apiKeys: ApiKeys;
  isLoading: boolean;
  error: string | null;

  // Actions
  updateSettings: (updates: Partial<AppSettings>) => void;
  updateApiKeys: (updates: Partial<ApiKeys>) => void;
  resetSettings: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // API operations
  loadSettings: () => Promise<void>;
  saveSettings: () => Promise<boolean>;
  loadApiKeys: () => Promise<void>;
  saveApiKeys: () => Promise<boolean>;

  // Getters
  getWorkSessionMs: () => number;
  getShortBreakMs: () => number;
  getLongBreakMs: () => number;
}

const defaultSettings: AppSettings = {
  theme: 'system',
  workSessionDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  longBreakInterval: 4,
  soundEnabled: true,
  desktopNotifications: true,
  autoStartBreaks: false,
  autoStartSessions: false,
  showCompletedTasks: true,
  defaultTaskFilter: 'all',
  defaultTaskSort: 'created_at',
  compactMode: false,
  syncEnabled: false,
  autoSave: true,
  backupEnabled: true,
};

const defaultApiKeys: ApiKeys = {};

const SETTINGS_KEY = 'app_settings';
const API_KEYS_PREFIX = 'api_key_';

export const useSettingsStore = create<SettingsState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        settings: defaultSettings,
        apiKeys: defaultApiKeys,
        isLoading: false,
        error: null,

        // Actions
        updateSettings: (updates) => {
          const { settings, saveSettings } = get();
          const newSettings = { ...settings, ...updates };
          set({ settings: newSettings }, false, 'updateSettings');

          // Auto-save if enabled
          if (newSettings.autoSave) {
            saveSettings();
          }
        },

        updateApiKeys: (updates) => {
          const { apiKeys, saveApiKeys } = get();
          const newApiKeys = { ...apiKeys, ...updates };
          set({ apiKeys: newApiKeys }, false, 'updateApiKeys');
          saveApiKeys();
        },

        resetSettings: () => {
          set({
            settings: defaultSettings,
            apiKeys: defaultApiKeys
          }, false, 'resetSettings');
          get().saveSettings();
          get().saveApiKeys();
        },

        setLoading: (isLoading) =>
          set({ isLoading }, false, 'setLoading'),

        setError: (error) =>
          set({ error }, false, 'setError'),

        // API operations
        loadSettings: async () => {
          const { setLoading, setError } = get();

          try {
            setLoading(true);
            setError(null);

            const settingsJson = await getSetting(SETTINGS_KEY);
            if (settingsJson) {
              const loadedSettings = JSON.parse(settingsJson) as AppSettings;
              // Merge with defaults to handle new settings
              const mergedSettings = { ...defaultSettings, ...loadedSettings };
              set({ settings: mergedSettings }, false, 'loadSettings');
            }
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Failed to load settings';
            setError(errorMsg);
            console.error('Failed to load settings:', error);
          } finally {
            setLoading(false);
          }
        },

        saveSettings: async () => {
          const { settings, setError } = get();

          try {
            setError(null);
            const settingsJson = JSON.stringify(settings);
            await saveSetting(SETTINGS_KEY, settingsJson);
            return true;
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Failed to save settings';
            setError(errorMsg);
            console.error('Failed to save settings:', error);
            return false;
          }
        },

        loadApiKeys: async () => {
          const { setError } = get();

          try {
            setError(null);

            const apiKeys: ApiKeys = {};

            // Load each API key
            const deepseekKey = await getSetting(API_KEYS_PREFIX + 'deepseek');
            if (deepseekKey) apiKeys.deepseekApiKey = deepseekKey;

            const openaiKey = await getSetting(API_KEYS_PREFIX + 'openai');
            if (openaiKey) apiKeys.openaiApiKey = openaiKey;

            const claudeKey = await getSetting(API_KEYS_PREFIX + 'claude');
            if (claudeKey) apiKeys.claudeApiKey = claudeKey;

            set({ apiKeys }, false, 'loadApiKeys');
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Failed to load API keys';
            setError(errorMsg);
            console.error('Failed to load API keys:', error);
          }
        },

        saveApiKeys: async () => {
          const { apiKeys, setError } = get();

          try {
            setError(null);

            // Save each API key separately
            const promises: Promise<void>[] = [];

            if (apiKeys.deepseekApiKey !== undefined) {
              promises.push(saveSetting(API_KEYS_PREFIX + 'deepseek', apiKeys.deepseekApiKey || ''));
            }

            if (apiKeys.openaiApiKey !== undefined) {
              promises.push(saveSetting(API_KEYS_PREFIX + 'openai', apiKeys.openaiApiKey || ''));
            }

            if (apiKeys.claudeApiKey !== undefined) {
              promises.push(saveSetting(API_KEYS_PREFIX + 'claude', apiKeys.claudeApiKey || ''));
            }

            await Promise.all(promises);
            return true;
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Failed to save API keys';
            setError(errorMsg);
            console.error('Failed to save API keys:', error);
            return false;
          }
        },

        // Getters
        getWorkSessionMs: () => {
          const { settings } = get();
          return settings.workSessionDuration * 60 * 1000;
        },

        getShortBreakMs: () => {
          const { settings } = get();
          return settings.shortBreakDuration * 60 * 1000;
        },

        getLongBreakMs: () => {
          const { settings } = get();
          return settings.longBreakDuration * 60 * 1000;
        },
      }),
      {
        name: 'settings-store',
        // Only persist certain fields to localStorage as backup
        partialize: (state) => ({
          settings: state.settings,
          // Don't persist API keys to localStorage for security
        }),
      }
    ),
    {
      name: 'settings-store',
    }
  )
);

// Initialize settings on store creation
useSettingsStore.getState().loadSettings();
useSettingsStore.getState().loadApiKeys();