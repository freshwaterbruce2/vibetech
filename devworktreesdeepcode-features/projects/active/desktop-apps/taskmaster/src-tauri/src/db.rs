use anyhow::Result;
use sqlx::{sqlite::SqlitePoolOptions, Pool, Sqlite};
use std::fs;

pub type DbPool = Pool<Sqlite>;

pub async fn init_db(_app_handle: &tauri::AppHandle) -> Result<DbPool> {
    // Use a fixed path for now, will improve later
    let app_dir = std::env::temp_dir().join("vibepilot").join("db");

    fs::create_dir_all(&app_dir)?;

    let db_path = app_dir.join("vibepilot.sqlite");
    let db_url = format!("sqlite:{}?mode=rwc", db_path.display());

    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect(&db_url)
        .await?;

    sqlx::migrate!("./migrations").run(&pool).await?;

    Ok(pool)
}