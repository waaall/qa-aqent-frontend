use serde::Serialize;
use tauri::AppHandle;
use tauri_plugin_store::StoreExt;

const STORE_PATH: &str = "config.json";
const BACKEND_URL_KEY: &str = "backend_url";
const DEFAULT_BACKEND_URL: &str = "http://192.168.50.50:5000";

#[derive(Serialize)]
pub struct BackendTestResult {
    pub ok: bool,
    pub status: Option<u16>,
    pub message: Option<String>,
}

fn normalize_backend_url(raw: &str) -> Result<String, String> {
    let trimmed = raw.trim();
    if trimmed.is_empty() {
        return Err("后端地址不能为空".to_string());
    }
    if !trimmed.starts_with("http://") && !trimmed.starts_with("https://") {
        return Err("仅支持 http:// 或 https:// 开头的地址".to_string());
    }
    Ok(trimmed.trim_end_matches('/').to_string())
}

#[tauri::command]
pub fn get_backend_url(app: AppHandle) -> Result<String, String> {
    let store = app.store(STORE_PATH).map_err(|e| e.to_string())?;
    if let Some(value) = store.get(BACKEND_URL_KEY) {
        if let Some(url) = value.as_str() {
            return Ok(url.to_string());
        }
    }
    Ok(DEFAULT_BACKEND_URL.to_string())
}

#[tauri::command]
pub fn set_backend_url(app: AppHandle, url: String) -> Result<(), String> {
    let normalized = normalize_backend_url(&url)?;
    let store = app.store(STORE_PATH).map_err(|e| e.to_string())?;
    store.set(BACKEND_URL_KEY, normalized);
    store.save().map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn test_backend_connection(url: String) -> Result<BackendTestResult, String> {
    let base_url = normalize_backend_url(&url)?;
    let health_url = format!("{}/health", base_url);

    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(5))
        .build()
        .map_err(|e| e.to_string())?;

    let response = client
        .get(&health_url)
        .send()
        .await
        .map_err(|e| format!("连接失败: {e}"))?;

    let status = response.status();
    if status.is_success() {
        Ok(BackendTestResult {
            ok: true,
            status: Some(status.as_u16()),
            message: None,
        })
    } else {
        Ok(BackendTestResult {
            ok: false,
            status: Some(status.as_u16()),
            message: Some(format!("服务返回状态码 {}", status.as_u16())),
        })
    }
}
