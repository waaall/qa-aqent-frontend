// 在 Windows Release 模式下禁止额外的控制台窗口
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use app_lib::{commands, menu};
use tauri::WindowEvent;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            commands::config::get_backend_url,
            commands::config::set_backend_url,
            commands::config::test_backend_connection,
            commands::file::select_file,
            commands::file::save_chat_history,
            commands::file::export_to_json,
            commands::system::show_in_folder,
        ])
        .setup(|app| {
            menu::setup_tray(app.handle())?;
            Ok(())
        })
        .on_window_event(|window, event| {
            if let WindowEvent::CloseRequested { api, .. } = event {
                #[cfg(not(target_os = "macos"))]
                {
                    let _ = window.hide();
                    api.prevent_close();
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
