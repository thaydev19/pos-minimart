use serde::Serialize;
use std::io::Write;
use std::net::{SocketAddr, TcpStream};
use std::time::Duration;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WindowsPrinterInfo {
    pub name: String,
    pub is_default: bool,
}

/// Sends raw ESC/POS bytes to a thermal printer over TCP/IP (Raw Socket 9100).
pub fn send_via_lan(ip: &str, port: u16, data: &[u8]) -> Result<(), String> {
    let addr_str = format!("{}:{}", ip.trim(), port);
    let addr: SocketAddr = addr_str
        .parse()
        .map_err(|e| format!("Invalid printer IP/Port '{}': {}", addr_str, e))?;

    let mut stream = TcpStream::connect_timeout(&addr, Duration::from_secs(3))
        .map_err(|e| format!("Cannot connect to printer at {}: {}", addr_str, e))?;

    let _ = stream.set_write_timeout(Some(Duration::from_secs(5)));
    stream
        .write_all(data)
        .map_err(|e| format!("Failed sending data to {}: {}", addr_str, e))?;
    stream
        .flush()
        .map_err(|e| format!("Failed flushing data to {}: {}", addr_str, e))?;

    Ok(())
}

#[cfg(target_os = "windows")]
mod win32_spooler {
    use super::WindowsPrinterInfo;
    use std::ffi::c_void;
    use std::ptr;

    const PRINTER_ENUM_LOCAL: u32 = 0x00000002;
    const PRINTER_ENUM_CONNECTIONS: u32 = 0x00000004;

    #[repr(C)]
    struct DocInfo1W {
        p_doc_name: *const u16,
        p_output_file: *const u16,
        p_datatype: *const u16,
    }

    #[repr(C)]
    struct PrinterInfo4W {
        p_printer_name: *mut u16,
        p_server_name: *mut u16,
        attributes: u32,
    }

    #[link(name = "winspool")]
    unsafe extern "system" {
        fn OpenPrinterW(
            p_printer_name: *const u16,
            ph_printer: *mut *mut c_void,
            p_default: *const c_void,
        ) -> i32;
        fn ClosePrinter(h_printer: *mut c_void) -> i32;
        fn StartDocPrinterW(
            h_printer: *mut c_void,
            level: u32,
            p_doc_info: *const DocInfo1W,
        ) -> u32;
        fn EndDocPrinter(h_printer: *mut c_void) -> i32;
        fn StartPagePrinter(h_printer: *mut c_void) -> i32;
        fn EndPagePrinter(h_printer: *mut c_void) -> i32;
        fn WritePrinter(
            h_printer: *mut c_void,
            p_buf: *const u8,
            cb_buf: u32,
            pc_written: *mut u32,
        ) -> i32;
        fn GetDefaultPrinterW(psz_buffer: *mut u16, pcch_buffer: *mut u32) -> i32;
        fn EnumPrintersW(
            flags: u32,
            name: *const u16,
            level: u32,
            p_printer_enum: *mut u8,
            cb_buf: u32,
            pcb_needed: *mut u32,
            pc_returned: *mut u32,
        ) -> i32;
    }

    fn to_wide_null(s: &str) -> Vec<u16> {
        s.encode_utf16().chain(std::iter::once(0)).collect()
    }

    unsafe fn wide_ptr_to_string(ptr_u16: *const u16) -> String {
        if ptr_u16.is_null() {
            return String::new();
        }
        let mut len = 0usize;
        while unsafe { *ptr_u16.add(len) } != 0 {
            len += 1;
        }
        let slice = unsafe { std::slice::from_raw_parts(ptr_u16, len) };
        String::from_utf16_lossy(slice)
    }

    pub fn get_default_printer_name() -> Option<String> {
        let mut needed: u32 = 0;
        unsafe {
            GetDefaultPrinterW(ptr::null_mut(), &mut needed);
        }
        if needed == 0 {
            return None;
        }
        let mut buf: Vec<u16> = vec![0; needed as usize];
        let ok = unsafe { GetDefaultPrinterW(buf.as_mut_ptr(), &mut needed) };
        if ok == 0 {
            return None;
        }
        let len = buf.iter().position(|&c| c == 0).unwrap_or(buf.len());
        let name = String::from_utf16_lossy(&buf[..len]);
        if name.trim().is_empty() {
            None
        } else {
            Some(name)
        }
    }

    pub fn list_printers() -> Result<Vec<WindowsPrinterInfo>, String> {
        let default_name = get_default_printer_name().unwrap_or_default();
        let flags = PRINTER_ENUM_LOCAL | PRINTER_ENUM_CONNECTIONS;
        let mut needed: u32 = 0;
        let mut returned: u32 = 0;

        unsafe {
            EnumPrintersW(
                flags,
                ptr::null(),
                4,
                ptr::null_mut(),
                0,
                &mut needed,
                &mut returned,
            );
        }

        if needed == 0 {
            return Ok(Vec::new());
        }

        let mut buffer: Vec<u8> = vec![0; needed as usize];
        let ok = unsafe {
            EnumPrintersW(
                flags,
                ptr::null(),
                4,
                buffer.as_mut_ptr(),
                needed,
                &mut needed,
                &mut returned,
            )
        };

        if ok == 0 {
            return Err("Failed to enumerate Windows printers".to_string());
        }

        let infos = unsafe {
            std::slice::from_raw_parts(
                buffer.as_ptr() as *const PrinterInfo4W,
                returned as usize,
            )
        };

        let mut result = Vec::with_capacity(infos.len());
        for info in infos {
            let name = unsafe { wide_ptr_to_string(info.p_printer_name) };
            if !name.is_empty() {
                let is_default = !default_name.is_empty()
                    && name.eq_ignore_ascii_case(&default_name);
                result.push(WindowsPrinterInfo { name, is_default });
            }
        }

        // Put default printer first
        result.sort_by(|a, b| b.is_default.cmp(&a.is_default).then(a.name.cmp(&b.name)));
        Ok(result)
    }

    pub fn send_raw_to_printer(printer_name: Option<&str>, data: &[u8]) -> Result<(), String> {
        let target_name = match printer_name {
            Some(name) if !name.trim().is_empty() => name.trim().to_string(),
            _ => get_default_printer_name().ok_or_else(|| {
                "No printer selected and no default Windows printer found".to_string()
            })?,
        };

        let wide_printer = to_wide_null(&target_name);
        let wide_doc = to_wide_null("QuickOne POS ESC/POS Job");
        let wide_raw = to_wide_null("RAW");

        let mut h_printer: *mut c_void = ptr::null_mut();
        let opened = unsafe { OpenPrinterW(wide_printer.as_ptr(), &mut h_printer, ptr::null()) };
        if opened == 0 || h_printer.is_null() {
            return Err(format!(
                "Cannot open Windows printer '{}'. Check printer name and USB connection.",
                target_name
            ));
        }

        let doc_info = DocInfo1W {
            p_doc_name: wide_doc.as_ptr(),
            p_output_file: ptr::null(),
            p_datatype: wide_raw.as_ptr(),
        };

        let job_id = unsafe { StartDocPrinterW(h_printer, 1, &doc_info) };
        if job_id == 0 {
            unsafe { ClosePrinter(h_printer) };
            return Err(format!("StartDocPrinterW failed for '{}'", target_name));
        }

        let page_ok = unsafe { StartPagePrinter(h_printer) };
        if page_ok == 0 {
            unsafe {
                EndDocPrinter(h_printer);
                ClosePrinter(h_printer);
            }
            return Err(format!("StartPagePrinter failed for '{}'", target_name));
        }

        let mut written: u32 = 0;
        let write_ok = unsafe {
            WritePrinter(
                h_printer,
                data.as_ptr(),
                data.len() as u32,
                &mut written,
            )
        };

        unsafe {
            EndPagePrinter(h_printer);
            EndDocPrinter(h_printer);
            ClosePrinter(h_printer);
        }

        if write_ok == 0 || (written as usize) < data.len() {
            return Err(format!(
                "WritePrinter incomplete for '{}' ({}/{} bytes)",
                target_name,
                written,
                data.len()
            ));
        }

        Ok(())
    }
}

#[cfg(target_os = "windows")]
pub fn send_via_windows_spooler(printer_name: Option<&str>, data: &[u8]) -> Result<(), String> {
    win32_spooler::send_raw_to_printer(printer_name, data)
}

#[cfg(not(target_os = "windows"))]
pub fn send_via_windows_spooler(_printer_name: Option<&str>, _data: &[u8]) -> Result<(), String> {
    Err("Windows spooler printing is only supported on Windows".to_string())
}

#[cfg(target_os = "windows")]
pub fn list_installed_printers() -> Result<Vec<WindowsPrinterInfo>, String> {
    win32_spooler::list_printers()
}

#[cfg(not(target_os = "windows"))]
pub fn list_installed_printers() -> Result<Vec<WindowsPrinterInfo>, String> {
    Ok(Vec::new())
}
