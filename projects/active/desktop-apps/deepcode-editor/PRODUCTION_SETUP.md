# Production Setup for DeepCode Editor

## Current Mock/Demo Code to Remove

### 1. FileSystemService
- Remove `initializeDemoFiles()` method
- Remove hardcoded demo file structure in `listDirectory()`
- Implement real file system operations using Electron IPC

### 2. WelcomeScreen
- Replace hardcoded `/demo/project` with real folder picker
- Implement actual file/folder selection dialog

### 3. GitServiceBrowser
- Replace mock git operations with real git commands via Electron IPC
- Remove "Running in browser mode (mock data)" messages

### 4. WorkspaceService
- Remove any hardcoded demo file references
- Implement real file system traversal

### 5. DemoResponseProvider
- Remove demo AI responses
- Ensure all AI responses come from actual API

## Production Features to Implement

### 1. Real File System Integration
```typescript
// Update WelcomeScreen.tsx
const handleOpenFolder = async () => {
  if (window.electron) {
    const result = await window.electron.dialog.openDirectory()
    if (result.success && result.directoryPath) {
      onOpenFolder(result.directoryPath)
    }
  }
}
```

### 2. Environment Configuration
```env
# Production .env
VITE_DEEPSEEK_API_KEY=your-production-key
VITE_DEEPSEEK_BASE_URL=https://api.deepseek.com/v1
VITE_TELEMETRY_ENABLED=true
VITE_ERROR_REPORTING_URL=https://your-error-tracking.com
VITE_UPDATE_CHECK_URL=https://your-update-server.com
```

### 3. Error Handling & Recovery
- Implement global error boundary with crash reporting
- Add offline mode detection
- Implement auto-save and recovery

### 4. Security Enhancements
- Content Security Policy headers
- API key encryption
- Secure IPC communication

### 5. Performance Optimizations
- Code splitting for large components
- Virtual scrolling for file explorer
- Worker threads for heavy operations

### 6. Build Configuration
```json
// package.json updates
{
  "build": {
    "productName": "DeepCode Editor",
    "appId": "com.deepcode.editor",
    "directories": {
      "output": "dist"
    },
    "files": [
      "dist/**/*",
      "electron/**/*",
      "node_modules/**/*"
    ],
    "mac": {
      "category": "public.app-category.developer-tools",
      "icon": "assets/icon.icns",
      "hardenedRuntime": true,
      "gatekeeperAssess": false,
      "entitlements": "assets/entitlements.mac.plist",
      "entitlementsInherit": "assets/entitlements.mac.plist"
    },
    "win": {
      "icon": "assets/icon.ico",
      "target": [
        {
          "target": "nsis",
          "arch": ["x64", "ia32"]
        }
      ]
    },
    "linux": {
      "icon": "assets/icon.png",
      "target": ["AppImage", "deb"],
      "category": "Development"
    }
  }
}
```

### 7. Auto-Update System
```typescript
// electron/main.js
import { autoUpdater } from 'electron-updater'

autoUpdater.checkForUpdatesAndNotify()
autoUpdater.on('update-available', () => {
  // Notify user
})
```

### 8. Telemetry & Analytics
```typescript
// services/TelemetryService.ts
export class TelemetryService {
  trackEvent(event: string, properties?: Record<string, any>) {
    if (import.meta.env.VITE_TELEMETRY_ENABLED === 'true') {
      // Send to analytics service
    }
  }
  
  trackError(error: Error, context?: Record<string, any>) {
    // Send to error tracking service
  }
}
```

## Final Production Checklist

- [ ] Remove all demo/mock data
- [ ] Implement real file system operations
- [ ] Add proper error handling
- [ ] Set up telemetry and crash reporting
- [ ] Configure auto-updates
- [ ] Add code signing certificates
- [ ] Set up CI/CD pipeline
- [ ] Add license validation
- [ ] Implement user preferences persistence
- [ ] Add keyboard shortcut customization
- [ ] Implement plugin system
- [ ] Add multi-language support
- [ ] Set up documentation site
- [ ] Create installer packages
- [ ] Add EULA and privacy policy