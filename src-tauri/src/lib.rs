mod printer;

use tauri::Manager;

#[tauri::command]
fn show_main_window(window: tauri::WebviewWindow) {
  let _ = window.set_fullscreen(true);
  let _ = window.show();
  let _ = window.set_focus();
}

#[tauri::command]
fn list_windows_printers() -> Result<Vec<printer::WindowsPrinterInfo>, String> {
  printer::list_installed_printers()
}

#[tauri::command]
fn print_raw_escpos(
  data: Vec<u8>,
  connection_type: Option<String>,
  ip: Option<String>,
  port: Option<u16>,
  printer_name: Option<String>,
) -> Result<(), String> {
  if data.is_empty() {
    return Err("Empty ESC/POS payload".to_string());
  }

  let conn = connection_type
    .unwrap_or_else(|| "usb".to_string())
    .to_lowercase();

  if conn == "lan" {
    let target_ip = ip.unwrap_or_else(|| "192.168.1.200".to_string());
    let target_port = port.unwrap_or(9100);
    printer::send_via_lan(&target_ip, target_port, &data)
  } else {
    printer::send_via_windows_spooler(printer_name.as_deref(), &data)
  }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_log::Builder::default().build())
    .plugin(tauri_plugin_process::init())
    .plugin(tauri_plugin_updater::Builder::new().build())
    .invoke_handler(tauri::generate_handler![
      show_main_window,
      list_windows_printers,
      print_raw_escpos
    ])
    .setup(|app| {
      if let Some(main_window) = app.get_webview_window("main") {
        let win = main_window.clone();
        std::thread::spawn(move || {
          // Safety fallback: reveal window after 1200ms if not revealed by frontend
          std::thread::sleep(std::time::Duration::from_millis(1200));
          let _ = win.set_fullscreen(true);
          let _ = win.show();
          let _ = win.set_focus();
        });
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while building tauri application");
}
