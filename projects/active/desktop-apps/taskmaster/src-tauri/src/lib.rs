mod commands;
mod db;
mod models;

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_log::Builder::new().build())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .setup(|app| {
            let handle = app.handle().clone();
            let pool = tauri::async_runtime::block_on(async move {
                db::init_db(&handle).await.expect("Failed to initialize database")
            });
            app.handle().manage(pool);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::create_task,
            commands::get_tasks,
            commands::get_task,
            commands::update_task,
            commands::delete_task,
            commands::start_session,
            commands::end_session,
            commands::get_sessions,
            commands::save_setting,
            commands::get_setting,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
