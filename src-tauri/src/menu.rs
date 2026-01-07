use tauri::AppHandle;

// 主窗口标识符常量
const MAIN_WINDOW_LABEL: &str = "main";

#[cfg(desktop)]
pub fn setup_tray(app: &AppHandle) -> tauri::Result<()> {
    use tauri::menu::{Menu, MenuItem, PredefinedMenuItem};
    use tauri::tray::{MouseButton, TrayIconBuilder, TrayIconEvent};
    use tauri::Manager;

    let show_item = MenuItem::with_id(app, "tray_show", "显示窗口", true, None::<&str>)?;
    let hide_item = MenuItem::with_id(app, "tray_hide", "隐藏窗口", true, None::<&str>)?;
    let quit_item = MenuItem::with_id(app, "tray_quit", "退出", true, None::<&str>)?;
    let separator = PredefinedMenuItem::separator(app)?;

    let menu = Menu::with_items(app, &[&show_item, &hide_item, &separator, &quit_item])?;

    let mut builder = TrayIconBuilder::new().menu(&menu).on_menu_event(|app, event| {
        let Some(window) = app.get_webview_window(MAIN_WINDOW_LABEL) else {
            return;
        };
        match event.id().as_ref() {
            "tray_show" => {
                let _ = window.show();
                let _ = window.set_focus();
            }
            "tray_hide" => {
                let _ = window.hide();
            }
            "tray_quit" => {
                app.exit(0);
            }
            _ => {}
        }
    });

    if let Some(icon) = app.default_window_icon().cloned() {
        builder = builder.icon(icon);
    }

    builder
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click { button, .. } = event {
                if button == MouseButton::Left {
                    if let Some(window) = tray.app_handle().get_webview_window(MAIN_WINDOW_LABEL) {
                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                }
            }
        })
        .build(app)?;

    Ok(())
}

#[cfg(not(desktop))]
pub fn setup_tray(_app: &AppHandle) -> tauri::Result<()> {
    Ok(())
}
