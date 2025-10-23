use tauri::State;
use crate::db::DbPool;
use crate::models::{Task, CreateTaskInput, UpdateTaskInput, Session, CreateSessionInput, EndSessionInput, Setting};
use nanoid::nanoid;

fn map_db_err(e: sqlx::Error) -> String {
    match e {
        sqlx::Error::RowNotFound => "Not found".to_string(),
        other => format!("DB error: {}", other),
    }
}

#[tauri::command]
pub async fn create_task(
    pool: State<'_, DbPool>,
    input: CreateTaskInput,
) -> Result<Task, String> {
    let id = input.id.unwrap_or_else(|| nanoid!(12));
    let done = 0_i64;
    let starred = 0_i64;
    let progress = 0_i64;
    let attachments = 0_i64;
    let comments = 0_i64;

    let query = r#"
    INSERT INTO tasks (id, title, description, done, due_date, project, priority, starred, progress, attachments, comments)
    VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)
    "#;

    sqlx::query(query)
        .bind(&id)
        .bind(&input.title)
        .bind(&input.description)
        .bind(done)
        .bind(&input.due_date)
        .bind(&input.project)
        .bind(&input.priority)
        .bind(starred)
        .bind(progress)
        .bind(attachments)
        .bind(comments)
        .execute(pool.inner())
        .await
        .map_err(map_db_err)?;

    get_task(pool, id.clone()).await
}

#[tauri::command]
pub async fn get_tasks(pool: State<'_, DbPool>) -> Result<Vec<Task>, String> {
    sqlx::query_as::<_, Task>("SELECT * FROM tasks ORDER BY created_at DESC")
        .fetch_all(pool.inner())
        .await
        .map_err(map_db_err)
}

#[tauri::command]
pub async fn get_task(pool: State<'_, DbPool>, id: String) -> Result<Task, String> {
    sqlx::query_as::<_, Task>("SELECT * FROM tasks WHERE id = ?1")
        .bind(id)
        .fetch_one(pool.inner())
        .await
        .map_err(map_db_err)
}

#[tauri::command]
pub async fn update_task(pool: State<'_, DbPool>, input: UpdateTaskInput) -> Result<Task, String> {
    let query = r#"
      UPDATE tasks
      SET
        title = COALESCE(?2, title),
        description = COALESCE(?3, description),
        done = COALESCE(?4, done),
        due_date = COALESCE(?5, due_date),
        project = COALESCE(?6, project),
        priority = COALESCE(?7, priority),
        starred = COALESCE(?8, starred),
        progress = COALESCE(?9, progress)
      WHERE id = ?1
    "#;

    sqlx::query(query)
        .bind(&input.id)
        .bind(&input.title)
        .bind(&input.description)
        .bind(input.done.map(|b| if b { 1_i64 } else { 0_i64 }))
        .bind(&input.due_date)
        .bind(&input.project)
        .bind(&input.priority)
        .bind(input.starred.map(|b| if b { 1_i64 } else { 0_i64 }))
        .bind(input.progress)
        .execute(pool.inner())
        .await
        .map_err(map_db_err)?;

    get_task(pool, input.id).await
}

#[tauri::command]
pub async fn delete_task(pool: State<'_, DbPool>, id: String) -> Result<(), String> {
    sqlx::query("DELETE FROM tasks WHERE id = ?1")
        .bind(id)
        .execute(pool.inner())
        .await
        .map_err(map_db_err)?;
    Ok(())
}

#[tauri::command]
pub async fn start_session(
    pool: State<'_, DbPool>,
    input: CreateSessionInput,
) -> Result<Session, String> {
    let id = nanoid!(12);
    let start_at = chrono::Utc::now().to_rfc3339();

    sqlx::query(
        r#"
        INSERT INTO sessions (id, task_id, start_at, notes)
        VALUES (?1, ?2, ?3, ?4)
        "#,
    )
    .bind(&id)
    .bind(&input.task_id)
    .bind(&start_at)
    .bind(&input.notes)
    .execute(pool.inner())
    .await
    .map_err(map_db_err)?;

    sqlx::query_as::<_, Session>("SELECT * FROM sessions WHERE id = ?1")
        .bind(id)
        .fetch_one(pool.inner())
        .await
        .map_err(map_db_err)
}

#[tauri::command]
pub async fn end_session(
    pool: State<'_, DbPool>,
    id: String,
    input: EndSessionInput,
) -> Result<Session, String> {
    let end_at = chrono::Utc::now().to_rfc3339();

    sqlx::query(
        r#"
        UPDATE sessions
        SET end_at = ?, notes = ?, quality_rating = ?
        WHERE id = ?
        "#,
    )
    .bind(&end_at)
    .bind(&input.notes)
    .bind(input.quality_rating)
    .bind(&id)
    .execute(pool.inner())
    .await
    .map_err(|e| e.to_string())?;

    let session = sqlx::query_as::<_, Session>("SELECT * FROM sessions WHERE id = ?")
        .bind(id)
        .fetch_one(pool.inner())
        .await
        .map_err(|e| e.to_string())?;

    Ok(session)
}

#[tauri::command]
pub async fn get_sessions(
    pool: State<'_, DbPool>,
    task_id: Option<String>,
) -> Result<Vec<Session>, String> {
    let query = if let Some(task_id) = task_id {
        sqlx::query_as::<_, Session>(
            "SELECT * FROM sessions WHERE task_id = ? ORDER BY start_at DESC",
        )
        .bind(task_id)
    } else {
        sqlx::query_as::<_, Session>("SELECT * FROM sessions ORDER BY start_at DESC")
    };

    let sessions = query
        .fetch_all(pool.inner())
        .await
        .map_err(|e| e.to_string())?;

    Ok(sessions)
}

#[tauri::command]
pub async fn save_setting(
    pool: State<'_, DbPool>,
    key: String,
    value: String,
) -> Result<(), String> {
    sqlx::query(
        r#"
        INSERT OR REPLACE INTO settings (key, value)
        VALUES (?, ?)
        "#,
    )
    .bind(&key)
    .bind(&value)
    .execute(pool.inner())
    .await
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn get_setting(pool: State<'_, DbPool>, key: String) -> Result<Option<String>, String> {
    let result = sqlx::query_as::<_, Setting>("SELECT * FROM settings WHERE key = ?")
        .bind(key)
        .fetch_optional(pool.inner())
        .await
        .map_err(|e| e.to_string())?;

    Ok(result.map(|s| s.value))
}