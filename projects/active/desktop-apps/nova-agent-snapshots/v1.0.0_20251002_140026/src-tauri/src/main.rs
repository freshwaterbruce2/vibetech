#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::State;
use serde::{Deserialize, Serialize};
use tokio::sync::Mutex as AsyncMutex;
use tracing::{info, error, debug};
use std::sync::Arc;
use std::env;

#[derive(Debug, Serialize, Deserialize)]
struct DeepSeekMessage {
    role: String,
    content: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct DeepSeekRequest {
    model: String,
    messages: Vec<DeepSeekMessage>,
    temperature: f32,
    max_tokens: i32,
}

#[derive(Debug, Serialize, Deserialize)]
struct DeepSeekChoice {
    message: DeepSeekMessage,
}

#[derive(Debug, Serialize, Deserialize)]
struct DeepSeekResponse {
    choices: Vec<DeepSeekChoice>,
}

#[derive(Debug, Clone)]
struct Config {
    deepseek_api_key: String,
    deepseek_base_url: String,
    deepseek_model: String,
}

impl Config {
    fn from_env() -> Self {
        dotenv::dotenv().ok();
        
        Self {
            deepseek_api_key: env::var("DEEPSEEK_API_KEY")
                .unwrap_or_else(|_| "".to_string()),
            deepseek_base_url: env::var("DEEPSEEK_BASE_URL")
                .unwrap_or_else(|_| "https://api.deepseek.com/v1".to_string()),
            deepseek_model: env::var("DEEPSEEK_MODEL")
                .unwrap_or_else(|_| "deepseek-chat".to_string()),
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct AgentState {
    active_conversations: Vec<String>,
    memory_count: usize,
    capabilities: Vec<String>,
    current_project: Option<String>,
}

impl Default for AgentState {
    fn default() -> Self {
        Self {
            active_conversations: vec![],
            memory_count: 0,
            capabilities: vec![
                "memory".to_string(),
                "filesystem".to_string(),
                "code_execution".to_string(),
                "web_search".to_string(),
                "learning".to_string(),
            ],
            current_project: None,
        }
    }
}

type AppState = Arc<AsyncMutex<AgentState>>;

async fn call_deepseek(config: &Config, user_message: &str) -> Result<String, String> {
    if config.deepseek_api_key.is_empty() {
        return Err("DeepSeek API key not configured. Please add DEEPSEEK_API_KEY to .env file.".to_string());
    }

    let client = reqwest::Client::new();
    
    let system_prompt = "You are NOVA (Neural Omnipresent Virtual Assistant), a helpful AI assistant with capabilities for memory management, file operations, code execution, web search, and continuous learning. Provide clear, concise, and helpful responses.";
    
    let request = DeepSeekRequest {
        model: config.deepseek_model.clone(),
        messages: vec![
            DeepSeekMessage {
                role: "system".to_string(),
                content: system_prompt.to_string(),
            },
            DeepSeekMessage {
                role: "user".to_string(),
                content: user_message.to_string(),
            },
        ],
        temperature: 0.7,
        max_tokens: 4096,
    };

    let url = format!("{}/chat/completions", config.deepseek_base_url);
    
    match client
        .post(&url)
        .header("Authorization", format!("Bearer {}", config.deepseek_api_key))
        .header("Content-Type", "application/json")
        .json(&request)
        .send()
        .await
    {
        Ok(response) => {
            if !response.status().is_success() {
                let status = response.status();
                let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
                return Err(format!("DeepSeek API error {}: {}", status, error_text));
            }
            
            match response.json::<DeepSeekResponse>().await {
                Ok(data) => {
                    if let Some(choice) = data.choices.first() {
                        Ok(choice.message.content.clone())
                    } else {
                        Err("No response from DeepSeek".to_string())
                    }
                }
                Err(e) => Err(format!("Failed to parse response: {}", e))
            }
        }
        Err(e) => Err(format!("Request failed: {}", e))
    }
}

#[tauri::command]
async fn chat_with_agent(
    message: String,
    _project_id: Option<String>,
    state: State<'_, AppState>,
    config: State<'_, Config>,
) -> Result<String, String> {
    debug!("Received chat message: {}", message);

    let mut agent_state = state.lock().await;

    match call_deepseek(&config, &message).await {
        Ok(response) => {
            agent_state.active_conversations.push(message);
            info!("Generated response for user message");
            Ok(response)
        }
        Err(e) => {
            error!("DeepSeek call failed: {}", e);
            Err(e)
        }
    }
}

#[tauri::command]
async fn get_agent_status(state: State<'_, AppState>) -> Result<AgentState, String> {
    let agent_state = state.lock().await;
    Ok(agent_state.clone())
}

#[tauri::command]
async fn update_capabilities(
    capabilities: Vec<String>,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let mut agent_state = state.lock().await;
    agent_state.capabilities = capabilities;
    info!("Updated agent capabilities");
    Ok(())
}

#[tauri::command]
async fn read_file(path: String) -> Result<String, String> {
    debug!("Reading file: {}", path);

    if path.contains("..") || path.starts_with("/") {
        return Err("Invalid file path".to_string());
    }

    match tokio::fs::read_to_string(&path).await {
        Ok(contents) => {
            info!("Successfully read file: {}", path);
            Ok(contents)
        }
        Err(e) => {
            error!("Failed to read file {}: {}", path, e);
            Err(format!("Failed to read file: {}", e))
        }
    }
}

#[tauri::command]
async fn write_file(path: String, contents: String) -> Result<(), String> {
    debug!("Writing to file: {}", path);

    if path.contains("..") || path.starts_with("/") {
        return Err("Invalid file path".to_string());
    }

    match tokio::fs::write(&path, contents).await {
        Ok(_) => {
            info!("Successfully wrote to file: {}", path);
            Ok(())
        }
        Err(e) => {
            error!("Failed to write to file {}: {}", path, e);
            Err(format!("Failed to write file: {}", e))
        }
    }
}

#[tauri::command]
async fn execute_code(language: String, code: String) -> Result<String, String> {
    debug!("Executing {} code", language);
    Err("Code execution not implemented in standalone mode".to_string())
}

#[tauri::command]
async fn search_memories(query: String, state: State<'_, AppState>) -> Result<Vec<String>, String> {
    debug!("Searching memories for: {}", query);

    let agent_state = state.lock().await;

    let results: Vec<String> = agent_state
        .active_conversations
        .iter()
        .filter(|conv| conv.to_lowercase().contains(&query.to_lowercase()))
        .cloned()
        .collect();

    info!("Found {} memory results for query: {}", results.len(), query);
    Ok(results)
}

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt()
        .with_env_filter("info,nova_agent=debug")
        .init();

    info!("Starting NOVA Agent Desktop Application");

    let config = Config::from_env();
    let app_state: AppState = Arc::new(AsyncMutex::new(AgentState::default()));

    tauri::Builder::default()
        .manage(config)
        .manage(app_state)
        .setup(|_app| {
            info!("NOVA Agent setup completed successfully");
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            chat_with_agent,
            get_agent_status,
            update_capabilities,
            read_file,
            write_file,
            execute_code,
            search_memories
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
