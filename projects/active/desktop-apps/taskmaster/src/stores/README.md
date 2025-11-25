# VibePilot Zustand Stores

This directory contains the Zustand state management stores for the VibePilot Taskmaster application.

## Stores Overview

### 1. `useTaskStore` - Task Management
Manages all task-related state and operations.

**Key Features:**
- CRUD operations for tasks
- Filtering and sorting
- Search functionality
- Integration with Tauri backend

**Usage Example:**
```typescript
import { useTaskStore } from '@/stores';

function TaskList() {
  const {
    filteredTasks,
    loadTasks,
    addTask,
    setFilter,
    toggleTaskDone
  } = useTaskStore();

  // Load tasks on component mount
  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // Filter active tasks
  const handleShowActive = () => setFilter('active');

  // Create new task
  const handleCreateTask = async () => {
    await addTask({
      title: 'New Task',
      description: 'Task description'
    });
  };

  return (
    <div>
      {filteredTasks.map(task => (
        <div key={task.id}>
          <span>{task.title}</span>
          <button onClick={() => toggleTaskDone(task.id)}>
            {task.done ? 'Mark Incomplete' : 'Mark Complete'}
          </button>
        </div>
      ))}
    </div>
  );
}
```

### 2. `useSessionStore` - Session & Timer Management
Manages work sessions, timer functionality, and Pomodoro-style workflows.

**Key Features:**
- Session CRUD operations
- Built-in timer with auto-update
- Progress tracking
- Session history

**Usage Example:**
```typescript
import { useSessionStore } from '@/stores';

function PomodoroTimer() {
  const {
    currentSession,
    timer,
    timeRemaining,
    progressPercentage,
    startNewSession,
    stopCurrentSession,
    pauseTimer,
    resumeTimer
  } = useSessionStore();

  const handleStartSession = async () => {
    await startNewSession(
      'task-id-123',
      'Working on important feature',
      25 * 60 // 25 minutes
    );
  };

  const handleStopSession = async () => {
    await stopCurrentSession(
      'Completed the task successfully',
      4 // Quality rating 1-5
    );
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div>
      <div>Time Remaining: {formatTime(timeRemaining)}</div>
      <div>Progress: {progressPercentage.toFixed(1)}%</div>

      {currentSession ? (
        <div>
          <button onClick={pauseTimer}>
            {timer.isRunning ? 'Pause' : 'Resume'}
          </button>
          <button onClick={handleStopSession}>Stop Session</button>
        </div>
      ) : (
        <button onClick={handleStartSession}>Start Session</button>
      )}
    </div>
  );
}
```

### 3. `useSettingsStore` - Application Settings
Manages app configuration, user preferences, and API keys.

**Key Features:**
- Theme and UI preferences
- Pomodoro timer settings
- API key management
- Auto-save functionality
- Persistence to both localStorage and Tauri backend

**Usage Example:**
```typescript
import { useSettingsStore } from '@/stores';

function SettingsPanel() {
  const {
    settings,
    apiKeys,
    updateSettings,
    updateApiKeys,
    resetSettings
  } = useSettingsStore();

  const handleThemeChange = (theme: 'light' | 'dark' | 'system') => {
    updateSettings({ theme });
  };

  const handleWorkDurationChange = (duration: number) => {
    updateSettings({ workSessionDuration: duration });
  };

  const handleApiKeyUpdate = (key: string) => {
    updateApiKeys({ deepseekApiKey: key });
  };

  return (
    <div>
      <h2>Theme Settings</h2>
      <select
        value={settings.theme}
        onChange={(e) => handleThemeChange(e.target.value as any)}
      >
        <option value="light">Light</option>
        <option value="dark">Dark</option>
        <option value="system">System</option>
      </select>

      <h2>Timer Settings</h2>
      <label>
        Work Session Duration (minutes):
        <input
          type="number"
          value={settings.workSessionDuration}
          onChange={(e) => handleWorkDurationChange(Number(e.target.value))}
        />
      </label>

      <h2>API Keys</h2>
      <label>
        DeepSeek API Key:
        <input
          type="password"
          value={apiKeys.deepseekApiKey || ''}
          onChange={(e) => handleApiKeyUpdate(e.target.value)}
        />
      </label>

      <button onClick={resetSettings}>Reset to Defaults</button>
    </div>
  );
}
```

## Store Architecture

### Data Flow
1. **UI Components** → Call store actions
2. **Store Actions** → Update local state + call API functions
3. **API Functions** → Communicate with Tauri backend
4. **Tauri Backend** → Handle database operations
5. **Database Changes** → Reflected in UI via store updates

### State Management Patterns
- **Optimistic Updates**: UI updates immediately, reverts on API error
- **Error Handling**: All API operations include proper error catching and user feedback
- **Loading States**: Track loading state for better UX
- **Computed Values**: Efficient derived state using getters
- **Persistence**: Settings auto-save to both localStorage and backend

### Integration with Tauri
All stores integrate seamlessly with the Tauri backend:
- Task operations use the existing `tasks.ts` API
- Session operations use the new `sessions.ts` API
- Settings operations use the new `settings.ts` API

### DevTools Integration
All stores include Zustand DevTools integration for debugging:
- View state changes in real-time
- Time-travel debugging
- Action tracking

## Best Practices

1. **Use Destructuring**: Only extract the state/actions you need
2. **Handle Loading States**: Always show loading indicators for async operations
3. **Error Boundaries**: Wrap components using stores in error boundaries
4. **Selective Updates**: Use specific actions rather than direct state mutations
5. **Type Safety**: All stores are fully typed with TypeScript

## Performance Considerations

- Stores use shallow comparison by default
- Computed values are memoized
- Timer updates are optimized with subscription middleware
- API calls are deduplicated where appropriate