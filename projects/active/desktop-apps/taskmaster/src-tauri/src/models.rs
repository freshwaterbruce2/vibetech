use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow, Clone)]
pub struct Task {
    pub id: String,
    pub title: String,
    pub description: Option<String>,
    pub done: i64,
    pub due_date: Option<String>,
    pub project: Option<String>,
    pub priority: Option<String>,
    pub starred: i64,
    pub progress: i64,
    pub attachments: i64,
    pub comments: i64,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateTaskInput {
    pub id: Option<String>,
    pub title: String,
    pub description: Option<String>,
    pub due_date: Option<String>,
    pub project: Option<String>,
    pub priority: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateTaskInput {
    pub id: String,
    pub title: Option<String>,
    pub description: Option<String>,
    pub done: Option<bool>,
    pub due_date: Option<String>,
    pub project: Option<String>,
    pub priority: Option<String>,
    pub starred: Option<bool>,
    pub progress: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Session {
    pub id: String,
    pub task_id: Option<String>,
    pub start_at: String,
    pub end_at: Option<String>,
    pub notes: Option<String>,
    pub quality_rating: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateSessionInput {
    pub task_id: Option<String>,
    pub notes: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EndSessionInput {
    pub notes: Option<String>,
    pub quality_rating: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Setting {
    pub key: String,
    pub value: String,
}

