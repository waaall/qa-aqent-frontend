use std::path::PathBuf;
use std::process::Command;

#[tauri::command]
pub fn show_in_folder(path: String) -> Result<(), String> {
    let target = PathBuf::from(path);
    if !target.exists() {
        return Err("路径不存在".to_string());
    }

    #[cfg(target_os = "windows")]
    {
        Command::new("explorer")
            .arg("/select,")
            .arg(&target)
            .spawn()
            .map_err(|e| e.to_string())?;
    }

    #[cfg(target_os = "macos")]
    {
        Command::new("open")
            .arg("-R")
            .arg(&target)
            .spawn()
            .map_err(|e| e.to_string())?;
    }

    #[cfg(all(unix, not(target_os = "macos")))]
    {
        let folder = if target.is_dir() {
            target
        } else {
            target
                .parent()
                .map(PathBuf::from)
                .unwrap_or(target)
        };
        Command::new("xdg-open")
            .arg(folder)
            .spawn()
            .map_err(|e| e.to_string())?;
    }

    Ok(())
}
