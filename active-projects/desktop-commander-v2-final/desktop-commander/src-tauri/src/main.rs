// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;
use std::process::Command as StdCommand;
use std::sync::{Arc, Mutex};
use std::time::{Duration, SystemTime};
use sysinfo::{System, Pid};
use tauri::{State, Manager};
use std::thread;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ServiceStatus {
    name: String,
    status: String, // "running", "stopped", "error", "unknown", "starting", "stopping"
    pid: Option<u32>,
    port: Option<u16>,
    uptime: Option<u64>,
    health: String, // "healthy", "unhealthy", "unknown"
    cpu_usage: f32,
    memory_usage: u64, // in MB
    auto_restart_enabled: bool,
    restart_count: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ResourceUsage {
    cpu_percent: f32,
    memory_mb: u64,
    timestamp: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct TradingMetrics {
    balance: f64,
    total_trades: i32,
    profit_loss: f64,
    win_rate: f64,
    last_trade_time: Option<String>,
    active_position: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct LogEntry {
    timestamp: String,
    level: String,
    message: String,
    source: String,
}

struct AppState {
    monorepo_path: PathBuf,
    services: Mutex<HashMap<String, ServiceConfig>>,
    process_tracker: Arc<Mutex<ProcessTracker>>,
}

#[derive(Debug, Clone)]
struct ServiceConfig {
    name: String,
    command: String,
    working_dir: PathBuf,
    port: Option<u16>,
    health_check_url: Option<String>,
    dependencies: Vec<String>,
    auto_restart: bool,
}

#[derive(Debug)]
struct ProcessTracker {
    processes: HashMap<String, ProcessInfo>,
}

#[derive(Debug, Clone)]
struct ProcessInfo {
    pid: u32,
    start_time: SystemTime,
    restart_count: u32,
    last_health_check: Option<SystemTime>,
    health_status: String,
}

impl AppState {
    fn new() -> Self {
        // Your monorepo root
        let monorepo_path = PathBuf::from("C:\\dev");

        let mut services = HashMap::new();

        // Main Web App (Vite + React)
        services.insert(
            "web-app".to_string(),
            ServiceConfig {
                name: "web-app".to_string(),
                command: "npm run dev".to_string(),
                working_dir: monorepo_path.clone(),
                port: Some(5173),
                health_check_url: Some("http://localhost:5173".to_string()),
                dependencies: vec!["backend".to_string()],
                auto_restart: false,
            },
        );

        // Backend Server (Node.js + Express)
        services.insert(
            "backend".to_string(),
            ServiceConfig {
                name: "backend".to_string(),
                command: "npm run dev".to_string(),
                working_dir: monorepo_path.join("backend"),
                port: Some(3000),
                health_check_url: Some("http://localhost:3000/health".to_string()),
                dependencies: vec![],
                auto_restart: false,  // Disabled to prevent startup issues
            },
        );

        // Crypto Trading Bot (Python)
        services.insert(
            "trading-bot".to_string(),
            ServiceConfig {
                name: "trading-bot".to_string(),
                command: ".venv\\Scripts\\python.exe start_live_trading.py".to_string(),
                working_dir: monorepo_path.join("projects\\crypto-enhanced"),
                port: None,
                health_check_url: None,
                dependencies: vec![],
                auto_restart: false,  // Disabled to prevent immediate startup issues
            },
        );

        // Business Booking Platform
        services.insert(
            "booking-platform".to_string(),
            ServiceConfig {
                name: "booking-platform".to_string(),
                command: "npm run dev".to_string(),
                working_dir: monorepo_path.join("projects\\active\\web-apps\\business-booking-platform"),
                port: Some(5174),
                health_check_url: Some("http://localhost:5174".to_string()),
                dependencies: vec![],
                auto_restart: false,
            },
        );

        // Digital Content Builder
        services.insert(
            "content-builder".to_string(),
            ServiceConfig {
                name: "content-builder".to_string(),
                command: "npm run dev".to_string(),
                working_dir: monorepo_path.join("projects\\active\\web-apps\\digital-content-builder"),
                port: Some(5175),
                health_check_url: Some("http://localhost:5175".to_string()),
                dependencies: vec![],
                auto_restart: false,
            },
        );
        
        Self {
            monorepo_path,
            services: Mutex::new(services),
            process_tracker: Arc::new(Mutex::new(ProcessTracker {
                processes: HashMap::new(),
            })),
        }
    }
}

impl ProcessTracker {
    fn track_process(&mut self, service_name: String, pid: u32) {
        self.processes.insert(
            service_name,
            ProcessInfo {
                pid,
                start_time: SystemTime::now(),
                restart_count: 0,
                last_health_check: None,
                health_status: "unknown".to_string(),
            },
        );
    }

    fn get_process_info(&self, service_name: &str) -> Option<&ProcessInfo> {
        self.processes.get(service_name)
    }

    fn remove_process(&mut self, service_name: &str) {
        self.processes.remove(service_name);
    }

    fn increment_restart_count(&mut self, service_name: &str) {
        if let Some(info) = self.processes.get_mut(service_name) {
            info.restart_count += 1;
        }
    }

    fn update_health(&mut self, service_name: &str, health: String) {
        if let Some(info) = self.processes.get_mut(service_name) {
            info.health_status = health;
            info.last_health_check = Some(SystemTime::now());
        }
    }
}

#[tauri::command]
fn get_service_status(service_name: String, state: State<AppState>) -> Result<ServiceStatus, String> {
    let services = state.services.lock().unwrap();
    let service = services.get(&service_name)
        .ok_or_else(|| format!("Service {} not found", service_name))?;
    
    let mut sys = System::new_all();
    sys.refresh_all();
    
    let tracker = state.process_tracker.lock().unwrap();
    let tracked_info = tracker.get_process_info(&service_name);
    
    // Check if process is running
    let mut found_pid = None;
    let mut cpu_usage = 0.0;
    let mut memory_usage = 0;
    
    if let Some(tracked) = tracked_info {
        if let Some(process) = sys.process(Pid::from_u32(tracked.pid)) {
            found_pid = Some(tracked.pid);
            cpu_usage = process.cpu_usage();
            memory_usage = process.memory() / 1024 / 1024; // Convert to MB
        }
    } else if service.port.is_some() {
        // Try to find by port
        for (pid, process) in sys.processes() {
            let cmd = process.cmd().join(" ");
            if cmd.contains(&service.name) || 
               (service.port.is_some() && cmd.contains(&service.port.unwrap().to_string())) {
                found_pid = Some(pid.as_u32());
                cpu_usage = process.cpu_usage();
                memory_usage = process.memory() / 1024 / 1024;
                break;
            }
        }
    }
    
    let is_running = found_pid.is_some();
    let uptime = if let Some(tracked) = tracked_info {
        Some(tracked.start_time.elapsed().unwrap_or_default().as_secs())
    } else {
        None
    };
    
    let health = if let Some(tracked) = tracked_info {
        tracked.health_status.clone()
    } else {
        "unknown".to_string()
    };
    
    let restart_count = tracked_info.map(|t| t.restart_count).unwrap_or(0);
    
    Ok(ServiceStatus {
        name: service_name.clone(),
        status: if is_running { "running" } else { "stopped" }.to_string(),
        pid: found_pid,
        port: service.port,
        uptime,
        health,
        cpu_usage,
        memory_usage,
        auto_restart_enabled: service.auto_restart,
        restart_count,
    })
}

#[tauri::command]
async fn check_service_health(service_name: String, state: State<'_, AppState>) -> Result<String, String> {
    let (health_url, port) = {
        let services = state.services.lock().unwrap();
        let service = services.get(&service_name)
            .ok_or_else(|| format!("Service {} not found", service_name))?;
        (service.health_check_url.clone(), service.port)
    }; // MutexGuard dropped here

    if let Some(health_url) = health_url {
        // Try HTTP health check
        match reqwest::get(&health_url).await {
            Ok(response) => {
                if response.status().is_success() {
                    let mut tracker = state.process_tracker.lock().unwrap();
                    tracker.update_health(&service_name, "healthy".to_string());
                    Ok("healthy".to_string())
                } else {
                    let mut tracker = state.process_tracker.lock().unwrap();
                    tracker.update_health(&service_name, "unhealthy".to_string());
                    Ok("unhealthy".to_string())
                }
            }
            Err(_) => {
                let mut tracker = state.process_tracker.lock().unwrap();
                tracker.update_health(&service_name, "unhealthy".to_string());
                Ok("unhealthy".to_string())
            }
        }
    } else {
        // No health check URL, just check if port is responding
        if let Some(port) = port {
            match std::net::TcpStream::connect(format!("127.0.0.1:{}", port)) {
                Ok(_) => {
                    let mut tracker = state.process_tracker.lock().unwrap();
                    tracker.update_health(&service_name, "healthy".to_string());
                    Ok("healthy".to_string())
                }
                Err(_) => {
                    let mut tracker = state.process_tracker.lock().unwrap();
                    tracker.update_health(&service_name, "unhealthy".to_string());
                    Ok("unhealthy".to_string())
                }
            }
        } else {
            Ok("unknown".to_string())
        }
    }
}

#[tauri::command]
fn get_all_services_status(state: State<AppState>) -> Result<Vec<ServiceStatus>, String> {
    let services = state.services.lock().unwrap();
    let mut statuses = Vec::new();
    
    for service_name in services.keys() {
        match get_service_status(service_name.clone(), state.clone()) {
            Ok(status) => statuses.push(status),
            Err(e) => eprintln!("Error getting status for {}: {}", service_name, e),
        }
    }
    
    Ok(statuses)
}

#[tauri::command]
async fn start_service(service_name: String, state: State<'_, AppState>) -> Result<bool, String> {
    let (dependencies, working_dir, command, port, name) = {
        let services = state.services.lock().unwrap();
        let service = services.get(&service_name)
            .ok_or_else(|| format!("Service {} not found", service_name))?;
        (
            service.dependencies.clone(),
            service.working_dir.clone(),
            service.command.clone(),
            service.port,
            service.name.clone(),
        )
    }; // MutexGuard dropped here

    // Check and start dependencies first
    for dep in &dependencies {
        let dep_status = get_service_status(dep.clone(), state.clone())?;
        if dep_status.status != "running" {
            println!("Starting dependency: {}", dep);
            // Use Box::pin for recursive async call
            Box::pin(start_service(dep.clone(), state.clone())).await?;
            // Wait a bit for dependency to start
            tokio::time::sleep(Duration::from_secs(2)).await;
        }
    }

    // Use PowerShell to start the service in a new window
    let ps_command = format!(
        "Start-Process powershell -ArgumentList '-NoExit', '-Command', 'cd \"{}\"; {}'",
        working_dir.display(),
        command
    );

    let output = StdCommand::new("powershell")
        .args(&["-Command", &ps_command])
        .output()
        .map_err(|e| format!("Failed to start service: {}", e))?;
    
    if output.status.success() {
        // Track the process (we'll need to find PID after a moment)
        tokio::time::sleep(Duration::from_millis(500)).await;
        
        // Try to find the PID
        let mut sys = System::new_all();
        sys.refresh_all();
        
        for (pid, process) in sys.processes() {
            let cmd = process.cmd().join(" ");
            if cmd.contains(&name) ||
               (port.is_some() && cmd.contains(&port.unwrap().to_string())) {
                let mut tracker = state.process_tracker.lock().unwrap();
                tracker.track_process(service_name.clone(), pid.as_u32());
                break;
            }
        }
        
        Ok(true)
    } else {
        Ok(false)
    }
}

#[tauri::command]
fn stop_service(service_name: String, state: State<AppState>) -> Result<bool, String> {
    let services = state.services.lock().unwrap();
    let service = services.get(&service_name)
        .ok_or_else(|| format!("Service {} not found", service_name))?;
    
    // Remove from tracker
    {
        let mut tracker = state.process_tracker.lock().unwrap();
        tracker.remove_process(&service_name);
    }
    
    // Kill process by port if available
    if let Some(port) = service.port {
        let ps_command = format!(
            "Get-NetTCPConnection -LocalPort {} -ErrorAction SilentlyContinue | ForEach-Object {{ Stop-Process -Id $_.OwningProcess -Force }}",
            port
        );
        
        let output = StdCommand::new("powershell")
            .args(&["-Command", &ps_command])
            .output()
            .map_err(|e| format!("Failed to stop service: {}", e))?;
        
        return Ok(output.status.success());
    }
    
    Ok(false)
}

#[tauri::command]
async fn restart_service(service_name: String, state: State<'_, AppState>) -> Result<bool, String> {
    stop_service(service_name.clone(), state.clone())?;
    tokio::time::sleep(Duration::from_secs(2)).await;
    
    // Increment restart count
    {
        let mut tracker = state.process_tracker.lock().unwrap();
        tracker.increment_restart_count(&service_name);
    }
    
    start_service(service_name, state).await
}

#[tauri::command]
async fn start_all_services(state: State<'_, AppState>) -> Result<Vec<String>, String> {
    let (service_names, dep_counts) = {
        let services = state.services.lock().unwrap();
        let names: Vec<String> = services.keys().cloned().collect();
        let counts: Vec<(String, usize)> = services.iter()
            .map(|(name, cfg)| (name.clone(), cfg.dependencies.len()))
            .collect();
        (names, counts)
    }; // MutexGuard dropped here

    // Sort by dependencies (services with no deps first)
    let mut service_names_sorted: Vec<String> = service_names;
    service_names_sorted.sort_by_key(|name| {
        dep_counts.iter()
            .find(|(n, _)| n == name)
            .map(|(_, count)| *count)
            .unwrap_or(0)
    });

    let mut results = Vec::new();

    for service_name in service_names_sorted {
        match start_service(service_name.clone(), state.clone()).await {
            Ok(_) => results.push(format!("{}: started", service_name)),
            Err(e) => results.push(format!("{}: failed - {}", service_name, e)),
        }
        tokio::time::sleep(Duration::from_millis(500)).await;
    }
    
    Ok(results)
}

#[tauri::command]
fn stop_all_services(state: State<AppState>) -> Result<Vec<String>, String> {
    let services = state.services.lock().unwrap();
    let service_names: Vec<String> = services.keys().cloned().collect();
    drop(services);
    
    let mut results = Vec::new();
    
    for service_name in service_names {
        match stop_service(service_name.clone(), state.clone()) {
            Ok(_) => results.push(format!("{}: stopped", service_name)),
            Err(e) => results.push(format!("{}: failed - {}", service_name, e)),
        }
    }
    
    Ok(results)
}

#[tauri::command]
fn toggle_auto_restart(service_name: String, enabled: bool, state: State<AppState>) -> Result<bool, String> {
    let mut services = state.services.lock().unwrap();
    let service = services.get_mut(&service_name)
        .ok_or_else(|| format!("Service {} not found", service_name))?;
    
    service.auto_restart = enabled;
    Ok(true)
}

#[tauri::command]
fn get_trading_metrics(state: State<AppState>) -> Result<TradingMetrics, String> {
    // Path to trading.db (in C:\dev root)
    let db_path = state.monorepo_path.join("trading.db");
    
    if !db_path.exists() {
        return Ok(TradingMetrics {
            balance: 0.0,
            total_trades: 0,
            profit_loss: 0.0,
            win_rate: 0.0,
            last_trade_time: None,
            active_position: false,
        });
    }
    
    // Query SQLite database
    let conn = rusqlite::Connection::open(&db_path)
        .map_err(|e| format!("Failed to open database: {}", e))?;
    
    // Get total trades
    let total_trades: i32 = conn
        .query_row("SELECT COUNT(*) FROM trades", [], |row| row.get(0))
        .unwrap_or(0);
    
    // Get P/L
    let profit_loss: f64 = conn
        .query_row(
            "SELECT COALESCE(SUM(realized_pnl), 0.0) FROM trades WHERE status = 'closed'",
            [],
            |row| row.get(0)
        )
        .unwrap_or(0.0);
    
    // Get win rate
    let winning_trades: i32 = conn
        .query_row(
            "SELECT COUNT(*) FROM trades WHERE status = 'closed' AND realized_pnl > 0",
            [],
            |row| row.get(0)
        )
        .unwrap_or(0);
    
    let closed_trades: i32 = conn
        .query_row(
            "SELECT COUNT(*) FROM trades WHERE status = 'closed'",
            [],
            |row| row.get(0)
        )
        .unwrap_or(0);
    
    let win_rate = if closed_trades > 0 {
        winning_trades as f64 / closed_trades as f64
    } else {
        0.0
    };
    
    // Get last trade time
    let last_trade_time: Option<String> = conn
        .query_row(
            "SELECT MAX(entry_time) FROM trades",
            [],
            |row| row.get(0)
        )
        .ok();
    
    // Check for active position
    let active_position: i32 = conn
        .query_row(
            "SELECT COUNT(*) FROM trades WHERE status = 'open'",
            [],
            |row| row.get(0)
        )
        .unwrap_or(0);
    
    // Note: Balance would need to be queried from a balance table
    // For now, using a placeholder
    let balance = 98.82;
    
    Ok(TradingMetrics {
        balance,
        total_trades,
        profit_loss,
        win_rate,
        last_trade_time,
        active_position: active_position > 0,
    })
}

#[tauri::command]
fn get_trading_bot_status(state: State<AppState>) -> Result<serde_json::Value, String> {
    let status = get_service_status("trading-bot".to_string(), state)?;
    
    Ok(serde_json::json!({
        "isRunning": status.status == "running",
        "lastHeartbeat": null,
        "circuitBreakerStatus": "NORMAL"
    }))
}

#[tauri::command]
fn get_tail_logs(service_name: String, lines: usize, _state: State<AppState>) -> Result<Vec<LogEntry>, String> {
    let log_path = match service_name.as_str() {
        "trading-bot" => PathBuf::from("C:\\dev\\trading_new.log"),
        "web-app" => PathBuf::from("C:\\dev\\vite-web-app.log"),
        "backend" => PathBuf::from("C:\\dev\\backend\\backend.log"),
        "booking-platform" => PathBuf::from("C:\\dev\\projects\\active\\web-apps\\business-booking-platform\\vite.log"),
        "content-builder" => PathBuf::from("C:\\dev\\projects\\active\\web-apps\\digital-content-builder\\vite.log"),
        _ => return Err(format!("Unknown service: {}", service_name)),
    };
    
    if !log_path.exists() {
        return Ok(Vec::new());
    }
    
    // Read last N lines from log file
    let contents = std::fs::read_to_string(&log_path)
        .map_err(|e| format!("Failed to read log file: {}", e))?;
    
    let mut log_entries = Vec::new();
    let log_lines: Vec<&str> = contents.lines().rev().take(lines).collect();
    
    for line in log_lines.iter().rev() {
        // Basic log parsing - adjust based on actual log format
        log_entries.push(LogEntry {
            timestamp: chrono::Utc::now().to_rfc3339(),
            level: "INFO".to_string(),
            message: line.to_string(),
            source: service_name.clone(),
        });
    }
    
    Ok(log_entries)
}

#[tauri::command]
fn clear_logs(service_name: String, _state: State<AppState>) -> Result<bool, String> {
    let log_path = match service_name.as_str() {
        "trading-bot" => PathBuf::from("C:\\dev\\trading_new.log"),
        "web-app" => PathBuf::from("C:\\dev\\vite-web-app.log"),
        "backend" => PathBuf::from("C:\\dev\\backend\\backend.log"),
        "booking-platform" => PathBuf::from("C:\\dev\\projects\\active\\web-apps\\business-booking-platform\\vite.log"),
        "content-builder" => PathBuf::from("C:\\dev\\projects\\active\\web-apps\\digital-content-builder\\vite.log"),
        _ => return Err(format!("Unknown service: {}", service_name)),
    };
    
    std::fs::write(&log_path, "")
        .map_err(|e| format!("Failed to clear log file: {}", e))?;
    
    Ok(true)
}

fn main() {
    let app_state = AppState::new();
    
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(app_state)
        .setup(|app| {
            let app_handle = app.handle().clone();
            
            // Start auto-restart monitoring thread
            thread::spawn(move || {
                monitor_auto_restart(app_handle);
            });
            
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_service_status,
            get_all_services_status,
            start_service,
            stop_service,
            restart_service,
            start_all_services,
            stop_all_services,
            check_service_health,
            toggle_auto_restart,
            get_trading_metrics,
            get_trading_bot_status,
            get_tail_logs,
            clear_logs
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

// Auto-restart monitoring
fn monitor_auto_restart(app_handle: tauri::AppHandle) {
    loop {
        thread::sleep(Duration::from_secs(10));
        
        if let Some(state) = app_handle.try_state::<AppState>() {
            let services = state.services.lock().unwrap();
            let service_names: Vec<(String, bool)> = services.iter()
                .filter(|(_, cfg)| cfg.auto_restart)
                .map(|(name, _)| (name.clone(), true))
                .collect();
            drop(services);
            
            for (service_name, _) in service_names {
                // Check if service is running
                if let Ok(status) = get_service_status(service_name.clone(), state.clone()) {
                    if status.status != "running" {
                        println!("Auto-restarting service: {}", service_name);
                        
                        // Use tokio runtime for async restart
                        let runtime = tokio::runtime::Runtime::new().unwrap();
                        let state_clone = state.clone();
                        let service_name_clone = service_name.clone();
                        
                        runtime.block_on(async {
                            let _ = restart_service(service_name_clone, state_clone).await;
                        });
                    }
                }
            }
        }
    }
}
