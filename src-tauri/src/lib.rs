use tauri::Manager;

#[tauri::command]
fn show_main_window(window: tauri::WebviewWindow) {
  let _ = window.show();
  let _ = window.set_focus();
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_log::Builder::default().build())
    .invoke_handler(tauri::generate_handler![show_main_window])
    .on_page_load(|window, payload| {
      if payload.event() == tauri::webview::PageLoadEvent::Finished {
        let _ = window.show();
        let _ = window.set_focus();
      }
    })
    .setup(|app| {
      if let Some(main_window) = app.get_webview_window("main") {
        let win = main_window.clone();
        std::thread::spawn(move || {
          // Safety fallback: reveal window after 1500ms if not triggered by on_page_load
          std::thread::sleep(std::time::Duration::from_millis(1500));
          let _ = win.show();
          let _ = win.set_focus();
        });
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while building tauri application");
}
