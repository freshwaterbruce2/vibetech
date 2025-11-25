# AGENTS.md - Desktop Applications

This file extends the root AGENTS.md with specific instructions for desktop application development. All desktop apps must be **production-ready native applications**, not web wrappers.

## Desktop Application Standards

### Technology Stack Requirements (MANDATORY)
- **Framework**: Tauri (NOT Electron) - smaller bundles, better performance, native OS integration
- **Frontend**: React 18+ with TypeScript
- **Build Tool**: Vite with Tauri integration
- **UI Framework**: Native OS components + shadcn/ui for custom elements
- **State Management**: Zustand for simple state, Redux Toolkit for complex apps
- **Database**: SQLite with proper migrations for local data
- **Security**: Tauri's secure API patterns with proper CSP

### Performance Standards (NON-NEGOTIABLE)
- **App Startup**: <2s cold start, <0.5s warm start
- **Memory Usage**: <100MB at idle, <500MB under load
- **Bundle Size**: <50MB installer, <20MB incremental updates
- **CPU Usage**: <5% at idle, responsive UI at all times
- **Battery Impact**: Minimal background processing
- **Native Integration**: Proper OS notifications, file associations, system tray

## Tauri Architecture Patterns

### Secure Frontend-Backend Communication
```rust
// src-tauri/src/commands.rs
use tauri::State;
use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
pub struct DatabaseQuery {
    table: String,
    conditions: String,
}

#[derive(Debug, Serialize)]
pub struct QueryResult {
    data: Vec<serde_json::Value>,
    total: usize,
}

#[tauri::command]
pub async fn execute_database_query(
    query: DatabaseQuery,
    db: State<'_, DatabaseConnection>,
) -> Result<QueryResult, String> {
    // Input validation
    if query.table.is_empty() || !is_valid_table_name(&query.table) {
        return Err("Invalid table name".to_string());
    }

    // Secure query execution with prepared statements
    let result = db.execute_safe_query(&query.table, &query.conditions)
        .await
        .map_err(|e| format!("Database error: {}", e))?;

    Ok(QueryResult {
        data: result.rows,
        total: result.count,
    })
}

fn is_valid_table_name(name: &str) -> bool {
    // Prevent SQL injection through table name validation
    name.chars().all(|c| c.is_alphanumeric() || c == '_') && !name.is_empty()
}
```

### Frontend-Backend Type Safety
```typescript
// src/lib/tauri-api.ts
import { invoke } from '@tauri-apps/api/tauri';

interface DatabaseQuery {
  table: string;
  conditions: string;
}

interface QueryResult {
  data: any[];
  total: number;
}

// Type-safe Tauri command wrapper
export class TauriAPI {
  static async executeDatabaseQuery(query: DatabaseQuery): Promise<QueryResult> {
    try {
      const result = await invoke<QueryResult>('execute_database_query', { query });
      return result;
    } catch (error) {
      console.error('Database query failed:', error);
      throw new Error(`Query execution failed: ${error}`);
    }
  }

  static async saveUserPreferences(preferences: UserPreferences): Promise<void> {
    return invoke('save_user_preferences', { preferences });
  }

  static async loadUserPreferences(): Promise<UserPreferences> {
    return invoke('load_user_preferences');
  }
}
```

### Database Management Pattern
```rust
// src-tauri/src/database.rs
use sqlx::{SqlitePool, Row};
use serde_json::Value;

pub struct DatabaseManager {
    pool: SqlitePool,
}

impl DatabaseManager {
    pub async fn new(database_url: &str) -> Result<Self, sqlx::Error> {
        let pool = SqlitePool::connect(database_url).await?;

        // Run migrations
        sqlx::migrate!("./migrations").run(&pool).await?;

        Ok(Self { pool })
    }

    pub async fn execute_safe_query(
        &self,
        table: &str,
        conditions: &str,
    ) -> Result<QueryResult, sqlx::Error> {
        // Use prepared statements to prevent SQL injection
        let query = format!(
            "SELECT * FROM {} WHERE {}",
            sqlx::query_scalar::<_, String>("SELECT name FROM sqlite_master WHERE type='table' AND name=?")
                .bind(table)
                .fetch_one(&self.pool)
                .await?,
            conditions
        );

        let rows = sqlx::query(&query)
            .fetch_all(&self.pool)
            .await?;

        let data: Vec<Value> = rows
            .iter()
            .map(|row| {
                let mut map = serde_json::Map::new();
                for (i, column) in row.columns().iter().enumerate() {
                    let value: Value = row.try_get::<Value, _>(i).unwrap_or(Value::Null);
                    map.insert(column.name().to_string(), value);
                }
                Value::Object(map)
            })
            .collect();

        Ok(QueryResult {
            rows: data,
            count: rows.len(),
        })
    }
}
```

## Native OS Integration Requirements

### File System Access
```rust
// src-tauri/src/file_operations.rs
use tauri::api::dialog;
use tauri::api::path;
use std::fs;

#[tauri::command]
pub async fn select_and_read_file() -> Result<String, String> {
    // Use native file dialog
    let file_path = dialog::blocking::FileDialogBuilder::new()
        .add_filter("Text files", &["txt", "md"])
        .add_filter("All files", &["*"])
        .pick_file()
        .ok_or("No file selected")?;

    // Validate file path is within allowed directories
    let app_data_dir = path::app_data_dir(&tauri::Config::default())
        .ok_or("Cannot access app data directory")?;

    if !file_path.starts_with(&app_data_dir) {
        return Err("File access denied: outside allowed directory".to_string());
    }

    // Read file securely
    let content = fs::read_to_string(file_path)
        .map_err(|e| format!("Failed to read file: {}", e))?;

    Ok(content)
}
```

### System Notifications
```typescript
// src/lib/notifications.ts
import { isPermissionGranted, requestPermission, sendNotification } from '@tauri-apps/api/notification';

export class NotificationManager {
  private static async ensurePermission(): Promise<boolean> {
    let permissionGranted = await isPermissionGranted();

    if (!permissionGranted) {
      const permission = await requestPermission();
      permissionGranted = permission === 'granted';
    }

    return permissionGranted;
  }

  static async showNotification(title: string, body: string, urgent = false): Promise<void> {
    const hasPermission = await this.ensurePermission();

    if (!hasPermission) {
      console.warn('Notification permission denied');
      return;
    }

    await sendNotification({
      title,
      body,
      sound: urgent ? 'Default' : undefined,
    });
  }

  static async showTaskComplete(taskName: string): Promise<void> {
    await this.showNotification(
      'Task Completed',
      `${taskName} has finished successfully`,
      false
    );
  }
}
```

### Window Management
```typescript
// src/lib/window-manager.ts
import { appWindow, LogicalSize, PhysicalPosition } from '@tauri-apps/api/window';

export class WindowManager {
  static async setOptimalSize(): Promise<void> {
    // Set optimal window size based on content and screen
    const monitor = await appWindow.currentMonitor();
    if (!monitor) return;

    const optimalWidth = Math.min(1200, monitor.size.width * 0.8);
    const optimalHeight = Math.min(800, monitor.size.height * 0.8);

    await appWindow.setSize(new LogicalSize(optimalWidth, optimalHeight));
  }

  static async centerWindow(): Promise<void> {
    const monitor = await appWindow.currentMonitor();
    const windowSize = await appWindow.innerSize();

    if (!monitor) return;

    const x = (monitor.size.width - windowSize.width) / 2;
    const y = (monitor.size.height - windowSize.height) / 2;

    await appWindow.setPosition(new PhysicalPosition(x, y));
  }

  static async enableAutoHide(): Promise<void> {
    // Hide to system tray instead of closing
    await appWindow.onCloseRequested(async (event) => {
      event.preventDefault();
      await appWindow.hide();
    });
  }
}
```

## Build & Distribution Patterns

### Tauri Configuration
```json
// src-tauri/tauri.conf.json
{
  "build": {
    "beforeDevCommand": "npm run dev",
    "beforeBuildCommand": "npm run build",
    "devPath": "http://localhost:5173",
    "distDir": "../dist",
    "withGlobalTauri": false
  },
  "package": {
    "productName": "Your App Name",
    "version": "1.0.0"
  },
  "tauri": {
    "allowlist": {
      "all": false,
      "shell": {
        "all": false,
        "open": true
      },
      "dialog": {
        "all": false,
        "open": true,
        "save": true
      },
      "notification": {
        "all": true
      },
      "fs": {
        "all": false,
        "readFile": true,
        "writeFile": true,
        "scope": ["$APPDATA/*", "$DOCUMENT/*"]
      }
    },
    "bundle": {
      "active": true,
      "targets": ["msi", "nsis"],
      "identifier": "com.yourcompany.yourapp",
      "icon": [
        "icons/32x32.png",
        "icons/128x128.png",
        "icons/128x128@2x.png",
        "icons/icon.icns",
        "icons/icon.ico"
      ],
      "resources": [],
      "externalBin": [],
      "copyright": "",
      "category": "DeveloperTool",
      "shortDescription": "",
      "longDescription": "",
      "deb": {
        "depends": []
      },
      "macOS": {
        "frameworks": [],
        "minimumSystemVersion": "10.13",
        "exceptionDomain": "",
        "signingIdentity": null,
        "providerShortName": null,
        "entitlements": null
      },
      "windows": {
        "certificateThumbprint": null,
        "digestAlgorithm": "sha256",
        "timestampUrl": ""
      }
    },
    "security": {
      "csp": "default-src 'self'; img-src 'self' asset: https://asset.localhost; style-src 'self' 'unsafe-inline'"
    },
    "windows": [
      {
        "fullscreen": false,
        "resizable": true,
        "title": "Your App Name",
        "width": 1000,
        "height": 700,
        "minWidth": 600,
        "minHeight": 400
      }
    ]
  }
}
```

### Cross-Platform Build Script
```rust
// src-tauri/build.rs
fn main() {
    // Platform-specific optimizations
    #[cfg(target_os = "windows")]
    {
        // Windows-specific build settings
        println!("cargo:rustc-link-arg=/SUBSYSTEM:WINDOWS");
    }

    #[cfg(target_os = "macos")]
    {
        // macOS-specific build settings
        println!("cargo:rustc-env=MACOSX_DEPLOYMENT_TARGET=10.13");
    }

    #[cfg(target_os = "linux")]
    {
        // Linux-specific build settings
        println!("cargo:rustc-link-lib=gtk-3");
    }

    tauri_build::build()
}
```

## Testing Requirements

### Tauri Integration Testing
```rust
// src-tauri/src/tests/integration_tests.rs
#[cfg(test)]
mod tests {
    use super::*;
    use tauri::test::{MockRuntime, mock_app};

    #[tokio::test]
    async fn test_database_command() {
        let app = mock_app();
        let window = tauri::WindowBuilder::new(&app, "test", tauri::WindowUrl::default())
            .build()
            .unwrap();

        let query = DatabaseQuery {
            table: "users".to_string(),
            conditions: "id = 1".to_string(),
        };

        let result = execute_database_query(query, app.state()).await;
        assert!(result.is_ok());
    }

    #[test]
    fn test_table_name_validation() {
        assert!(is_valid_table_name("users"));
        assert!(is_valid_table_name("user_profiles"));
        assert!(!is_valid_table_name("users; DROP TABLE users;"));
        assert!(!is_valid_table_name(""));
    }
}
```

### E2E Testing with WebDriver
```typescript
// tests/e2e/desktop-app.spec.ts
import { test, expect } from '@playwright/test';
import { _electron as electron } from 'playwright';

test.describe('Desktop App E2E', () => {
  let electronApp: any;

  test.beforeAll(async () => {
    electronApp = await electron.launch({
      args: ['src-tauri/target/debug/your-app']
    });
  });

  test.afterAll(async () => {
    await electronApp.close();
  });

  test('should open main window', async () => {
    const window = await electronApp.firstWindow();

    await expect(window).toHaveTitle('Your App Name');
    await expect(window.locator('[data-testid="main-content"]')).toBeVisible();
  });

  test('should handle file operations', async () => {
    const window = await electronApp.firstWindow();

    // Test file selection and processing
    await window.click('[data-testid="select-file-button"]');
    // Note: File dialog testing requires platform-specific approaches
  });
});
```

## Performance Optimization

### Bundle Size Optimization
```toml
# src-tauri/Cargo.toml
[profile.release]
panic = "abort"
codegen-units = 1
lto = true
strip = true
opt-level = 3

[dependencies]
tauri = { version = "1.0", features = ["api-all"] }
serde = { version = "1.0", features = ["derive"] }
sqlx = { version = "0.7", features = ["runtime-tokio-rustls", "sqlite"] }
tokio = { version = "1.0", features = ["full"] }
```

### Memory Management
```rust
// src-tauri/src/memory_manager.rs
use std::sync::Arc;
use tokio::sync::RwLock;

pub struct MemoryManager {
    cache: Arc<RwLock<lru::LruCache<String, serde_json::Value>>>,
    max_memory_mb: usize,
}

impl MemoryManager {
    pub fn new(max_memory_mb: usize) -> Self {
        let cache_size = (max_memory_mb * 1024 * 1024) / 1000; // Rough estimate

        Self {
            cache: Arc::new(RwLock::new(lru::LruCache::new(cache_size))),
            max_memory_mb,
        }
    }

    pub async fn get_memory_usage(&self) -> usize {
        // Platform-specific memory usage calculation
        #[cfg(target_os = "windows")]
        {
            self.get_windows_memory_usage()
        }
        #[cfg(target_os = "macos")]
        {
            self.get_macos_memory_usage()
        }
        #[cfg(target_os = "linux")]
        {
            self.get_linux_memory_usage()
        }
    }

    pub async fn cleanup_if_needed(&self) {
        let current_usage = self.get_memory_usage().await;
        let threshold = (self.max_memory_mb * 80) / 100; // 80% threshold

        if current_usage > threshold {
            let mut cache = self.cache.write().await;

            // Remove least recently used items
            let items_to_remove = cache.len() / 4; // Remove 25%
            for _ in 0..items_to_remove {
                cache.pop_lru();
            }
        }
    }
}
```

## Security Requirements

### Secure API Design
```rust
// src-tauri/src/security.rs
use tauri::{Manager, State};
use std::collections::HashMap;
use std::sync::Mutex;

pub struct SecurityManager {
    api_rate_limits: Mutex<HashMap<String, Vec<u64>>>,
}

impl SecurityManager {
    pub fn new() -> Self {
        Self {
            api_rate_limits: Mutex::new(HashMap::new()),
        }
    }

    pub fn check_rate_limit(&self, command: &str, max_calls: usize, window_secs: u64) -> bool {
        let mut limits = self.api_rate_limits.lock().unwrap();
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs();

        let call_times = limits.entry(command.to_string()).or_insert_with(Vec::new);

        // Remove old calls outside the window
        call_times.retain(|&time| now - time < window_secs);

        if call_times.len() >= max_calls {
            return false; // Rate limit exceeded
        }

        call_times.push(now);
        true
    }
}

// Rate-limited command wrapper
#[tauri::command]
pub async fn secure_command(
    security: State<'_, SecurityManager>,
    // ... other parameters
) -> Result<String, String> {
    if !security.check_rate_limit("secure_command", 10, 60) {
        return Err("Rate limit exceeded".to_string());
    }

    // Execute actual command logic
    Ok("Success".to_string())
}
```

## Production Deployment Checklist

### Pre-Release Validation
- [ ] All Tauri commands properly secured and rate-limited
- [ ] Database migrations tested on clean installs
- [ ] File system access properly sandboxed
- [ ] Memory usage stays under limits during extended use
- [ ] Cross-platform compatibility verified (Windows, macOS, Linux)
- [ ] Auto-updater configured and tested
- [ ] Code signing certificates configured
- [ ] Installation packages tested on clean systems
- [ ] Uninstallation process clean (no leftover files)

### Platform-Specific Requirements

#### Windows
- Code signing with EV certificate for Windows Defender compatibility
- MSI installer with proper registry entries
- Windows security features compatibility

#### macOS
- App notarization for Gatekeeper compatibility
- Proper entitlements for required system access
- DMG distribution package

#### Linux
- AppImage for universal compatibility
- Debian package for Ubuntu/Debian systems
- Flatpak package for sandboxed distribution

Remember: Desktop applications represent your brand on users' personal devices. They must be **rock-solid, performant, and respect system resources**. No shortcuts or web-wrapper approaches in production.