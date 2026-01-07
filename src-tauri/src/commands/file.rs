use serde::Deserialize;
use tauri::{AppHandle, Runtime};
use tauri_plugin_dialog::DialogExt;
use tauri_plugin_fs::FilePath;

#[derive(Deserialize)]
pub struct FileDialogFilter {
    pub name: String,
    pub extensions: Vec<String>,
}

fn apply_filters<R: Runtime>(
    mut dialog: tauri_plugin_dialog::FileDialogBuilder<R>,
    filters: Option<Vec<FileDialogFilter>>,
) -> tauri_plugin_dialog::FileDialogBuilder<R> {
    if let Some(filters) = filters {
        for filter in filters {
            let exts: Vec<&str> = filter.extensions.iter().map(String::as_str).collect();
            dialog = dialog.add_filter(filter.name, &exts);
        }
    }
    dialog
}

fn file_path_to_string(path: FilePath) -> Result<String, String> {
    path.into_path()
        .map_err(|e| format!("文件路径解析失败: {}", e))
        .map(|p| p.to_string_lossy().to_string())
}

async fn save_json_to_file(
    app: AppHandle,
    data: serde_json::Value,
    filename: Option<String>,
) -> Result<Option<String>, String> {
    let mut dialog = app.dialog().file();
    if let Some(name) = filename {
        dialog = dialog.set_file_name(name);
    }

    let path = tauri::async_runtime::spawn_blocking(move || dialog.blocking_save_file())
        .await
        .map_err(|e| format!("文件对话框异步任务失败: {}", e))?;

    let Some(path) = path else {
        return Ok(None); // 用户取消保存
    };

    let target_path = path
        .into_path()
        .map_err(|e| format!("文件路径解析失败: {}", e))?;
    let payload = serde_json::to_string_pretty(&data)
        .map_err(|e| format!("JSON 序列化失败: {}", e))?;
    std::fs::write(&target_path, payload)
        .map_err(|e| format!("文件写入失败: {}", e))?;

    Ok(Some(target_path.to_string_lossy().to_string()))
}

#[tauri::command]
pub async fn select_file(
    app: AppHandle,
    filters: Option<Vec<FileDialogFilter>>,
) -> Result<Option<String>, String> {
    let dialog = apply_filters(app.dialog().file(), filters);
    let path = tauri::async_runtime::spawn_blocking(move || dialog.blocking_pick_file())
        .await
        .map_err(|e| format!("文件选择对话框异步任务失败: {}", e))?;

    match path {
        Some(path) => Ok(Some(file_path_to_string(path)?)),
        None => Ok(None), // 用户取消选择
    }
}

#[tauri::command]
pub async fn export_to_json(
    app: AppHandle,
    data: serde_json::Value,
    filename: Option<String>,
) -> Result<Option<String>, String> {
    save_json_to_file(app, data, filename).await
}

#[tauri::command]
pub async fn save_chat_history(
    app: AppHandle,
    messages: serde_json::Value,
    filename: Option<String>,
) -> Result<Option<String>, String> {
    save_json_to_file(app, messages, filename).await
}
