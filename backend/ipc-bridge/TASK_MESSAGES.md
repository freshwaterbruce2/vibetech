# IPC Bridge Message Protocol

## Overview
The IPC Bridge facilitates real-time communication between NOVA Agent and Vibe Code Studio using WebSocket messages on port 5004.

## Message Structure

All messages follow this structure:

```json
{
  "type": "message_type",
  "source": "nova" | "vibe",
  "payload": { ... },
  "timestamp": 1699999999999,
  "messageId": "unique-id"
}
```

## Message Types

### Existing Messages

#### File Operations
- `file_open_request` - Request to open a file in Vibe
- `file_saved` - Notification that file was saved
- `file_modified` - File content changed

#### Learning System
- `learning_sync` - Sync learning data (mistakes/knowledge)
- `mistake_logged` - New mistake recorded
- `knowledge_added` - New knowledge entry

#### Project Updates
- `project_update` - Project details changed
- `project_created` - New project created
- `project_deleted` - Project removed

### NEW: Task Intelligence Messages (P3.1 - 2025-11-10)

#### Task Lifecycle
```json
{
  "type": "task_started",
  "source": "nova" | "vibe",
  "payload": {
    "task_id": "string",
    "task_type": "ml_training" | "web_dev" | "trading_bot" | "generic",
    "title": "string",
    "context": { ... }
  },
  "timestamp": 1699999999999,
  "messageId": "unique-id"
}
```

```json
{
  "type": "task_stopped",
  "source": "nova" | "vibe",
  "payload": {
    "task_id": "string",
    "duration_minutes": 45,
    "status": "completed" | "paused" | "abandoned"
  },
  "timestamp": 1699999999999,
  "messageId": "unique-id"
}
```

#### Task Intelligence
```json
{
  "type": "task_insights_ready",
  "source": "nova" | "vibe",
  "payload": {
    "task_id": "string",
    "insights": {
      "completion_prediction": { ... },
      "related_mistakes": [ ... ],
      "related_knowledge": [ ... ],
      "recommendations": [ ... ]
    }
  },
  "timestamp": 1699999999999,
  "messageId": "unique-id"
}
```

```json
{
  "type": "task_activity",
  "source": "nova" | "vibe",
  "payload": {
    "task_id": "string",
    "activity_type": "code_edit" | "file_open" | "git_commit" | "test_run",
    "details": { ... }
  },
  "timestamp": 1699999999999,
  "messageId": "unique-id"
}
```

## Task Intelligence Flow

1. **User starts task in NOVA or Vibe**
   - App calls Task Intelligence API (`POST /api/tasks/start`)
   - App sends `task_started` message via IPC Bridge
   - Other app receives notification and updates UI

2. **During task work**
   - Activities logged via API (`POST /api/tasks/activity`)
   - `task_activity` messages sent for real-time sync
   - Both apps show current task context

3. **Task completion**
   - App calls API (`POST /api/tasks/stop`)
   - `task_stopped` message sent
   - Insights generated automatically
   - `task_insights_ready` message sent

## Usage Examples

### NOVA Agent (Rust/Tauri)

```rust
// Start a task
use crate::commands::task_intelligence;
use crate::commands::ipc;

// 1. Register with Task Intelligence API
task_intelligence::start_task_intelligence(
    task_id.clone(),
    "ml_training".to_string(),
    Some(context_data)
).await?;

// 2. Broadcast to Vibe via IPC Bridge
ipc::send_ipc_message(
    "task_started",
    serde_json::json!({
        "task_id": task_id,
        "task_type": "ml_training",
        "title": "Train sentiment model",
        "context": context_data
    }),
    ipc_state
).await?;
```

### Vibe Code Studio (TypeScript)

```typescript
// services/TaskIntelligenceService.ts
import { ipcClient } from './IPCClient';
import { taskIntelligenceAPI } from './TaskIntelligenceAPI';

class TaskService {
  async startTask(taskId: string, taskType: string, context: any) {
    // 1. Register with Task Intelligence API
    await taskIntelligenceAPI.startTask(taskId, taskType, 'vibe', context);

    // 2. Broadcast to NOVA via IPC Bridge
    await ipcClient.send({
      type: 'task_started',
      source: 'vibe',
      payload: { task_id: taskId, task_type: taskType, title: '...', context },
      timestamp: Date.now(),
      messageId: generateId()
    });
  }

  // Listen for task messages from NOVA
  subscribeToTaskUpdates(callback: (msg: any) => void) {
    ipcClient.on('task_started', callback);
    ipcClient.on('task_stopped', callback);
    ipcClient.on('task_insights_ready', callback);
  }
}
```

## Connection Details

- **Server**: `ws://localhost:5004`
- **Health Check**: `GET http://localhost:5004/health`
- **Status Endpoint**: `GET http://localhost:5004/status`

## Error Handling

The IPC Bridge will log errors but won't throw exceptions. Messages that fail validation are dropped and logged.

Invalid message example:
```json
{
  "error": "Invalid message structure",
  "receivedType": "task_started",
  "reason": "Missing required field: task_id"
}
```

## Testing

Test task message flow:

```powershell
# Start IPC Bridge
cd C:\dev\backend\ipc-bridge
npm start

# In another terminal, test with wscat
npm install -g wscat
wscat -c ws://localhost:5004

# Send test task_started message
> {"type":"task_started","source":"nova","payload":{"task_id":"test-123","task_type":"generic","title":"Test Task"},"timestamp":1699999999999,"messageId":"test-1"}
```

## Integration Status

- ✅ IPC Bridge Server (broadcasting all messages generically)
- ✅ Task Intelligence API (Python Flask on port 5001)
- ✅ Vibe Code Studio - TaskIntelligenceService.ts + TaskPanel.tsx
- ✅ NOVA Agent - task_intelligence.rs commands (Rust/Tauri)
- ⏳ End-to-end testing needed
- ⏳ UI integration in both apps

## Next Steps

1. Test NOVA ↔ Vibe task synchronization
2. Add task notifications to both UIs
3. Implement task context auto-switching
4. Add task analytics dashboard
