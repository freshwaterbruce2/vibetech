# Learning Adapter (Python) Runbook

## Overview
Both apps can call Python modules via JSON stdin/stdout with timeouts.
- NOVA: Tauri command `run_python_learning_module`, TS `LearningAdapter`
- Vibe: Electron main `learning:run`, exposed to renderer via `window.electron.learning.run`

## Prereqs
- Python available on PATH (`python` or `py`)
- `D:\learning-system\` with modules:
  - `error_prevention_utils.py`
  - `performance_optimization.py`
  - `pattern_recognition.py`
  - `batch_optimization.py`
- Optional env:
  - `LEARNING_SYSTEM_DIR=D:\learning-system`

## NOVA Usage (TS)
```ts
import { LearningAdapter } from '@/services/LearningAdapter';
const res = await LearningAdapter.recognizePatterns({ scope: 'workspace' }, { timeoutMs: 4000 });
```

## Vibe Usage (Renderer)
```ts
const res = await window.electron.learning.run('pattern_recognition', { scope: 'workspace' }, { timeoutMs: 4000 });
```

## UI Hook (Vibe)
- Open Learning Panel → click “Local Hints” → runs `pattern_recognition` and shows result JSON.

## Troubleshooting
- Timeout: increase `timeoutMs` and verify Python module runs standalone.
- Invalid JSON: ensure Python prints a single valid JSON object to stdout.
- Module not found: set `LEARNING_SYSTEM_DIR` or pass `moduleOverride` with an absolute path.
