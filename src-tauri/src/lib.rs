use tauri::Runtime;
use tauri::Window;

#[cfg(windows)]
mod win {
    use std::sync::Mutex;
    use std::thread;
    use std::time::Duration;
    use tauri::{Emitter, Manager};
    use windows::Win32::Foundation::{HWND, POINT, RECT};
    use windows::Win32::UI::Input::KeyboardAndMouse::*;
    use windows::Win32::UI::WindowsAndMessaging::*;

    pub static ANCHOR_STATE: Mutex<Option<AnchorState>> = Mutex::new(None);
    pub static GLOBAL_MODE: Mutex<bool> = Mutex::new(false);
    /// true when the tracking loop itself minimized the console (not the user)
    pub static LOOP_MINIMIZED: Mutex<bool> = Mutex::new(false);

    pub struct AnchorState {
        pub target_hwnd: isize,
        pub offset_x: i32,
        pub offset_y: i32,
        pub target_title: String,
    }

    fn get_window_title(hwnd: HWND) -> String {
        unsafe {
            let len = GetWindowTextLengthW(hwnd);
            if len == 0 {
                return String::new();
            }
            let mut buf = vec![0u16; (len + 1) as usize];
            GetWindowTextW(hwnd, &mut buf);
            String::from_utf16_lossy(&buf[..len as usize])
        }
    }

    fn is_visible_toplevel(hwnd: HWND) -> bool {
        unsafe {
            if !IsWindowVisible(hwnd).as_bool() {
                return false;
            }
            let style = GetWindowLongPtrW(hwnd, GWL_EXSTYLE) as u32;
            if style & WS_EX_TOOLWINDOW.0 != 0 {
                return false;
            }
            let title = get_window_title(hwnd);
            if title.is_empty() {
                return false;
            }
            let skip = [
                "Program Manager",
                "Windows Input Experience",
                "MSCTFIME UI",
                "Default IME",
            ];
            if skip.iter().any(|s| title.contains(s)) {
                return false;
            }
            true
        }
    }

    pub fn start_picker(our_hwnd: isize) -> Option<(String, isize)> {
        // Wait for mouse release from menu click
        unsafe {
            while (GetAsyncKeyState(VK_LBUTTON.0 as i32) as u16 & 0x8000) != 0 {
                thread::sleep(Duration::from_millis(10));
            }
        }

        // Wait for next click
        loop {
            thread::sleep(Duration::from_millis(10));
            unsafe {
                if (GetAsyncKeyState(VK_LBUTTON.0 as i32) as u16 & 0x8000) != 0 {
                    let mut point = POINT::default();
                    if GetCursorPos(&mut point).is_ok() {
                        let child = WindowFromPoint(point);
                        let hwnd = {
                            let root = GetAncestor(child, GA_ROOT);
                            if root.0.is_null() {
                                child
                            } else {
                                root
                            }
                        };
                        if hwnd.0.is_null() {
                            continue;
                        }
                        if hwnd.0 as isize == our_hwnd {
                            continue;
                        }
                        if !is_visible_toplevel(hwnd) {
                            continue;
                        }
                        let title = get_window_title(hwnd);
                        // Wait for release
                        while (GetAsyncKeyState(VK_LBUTTON.0 as i32) as u16 & 0x8000) != 0 {
                            thread::sleep(Duration::from_millis(10));
                        }
                        return Some((title, hwnd.0 as isize));
                    }
                }
                // ESC to cancel
                if (GetAsyncKeyState(VK_ESCAPE.0 as i32) as u16 & 0x8000) != 0 {
                    return None;
                }
            }
        }
    }

    pub fn set_anchor<R: tauri::Runtime>(window: &tauri::Window<R>, target_hwnd: isize) {
        let position = window.outer_position().unwrap_or_default();
        unsafe {
            let hwnd = HWND(target_hwnd as *mut _);
            let mut rect = RECT::default();
            if GetWindowRect(hwnd, &mut rect).is_ok() {
                let mut state = ANCHOR_STATE.lock().unwrap();
                *state = Some(AnchorState {
                    target_hwnd,
                    offset_x: position.x - rect.left,
                    offset_y: position.y - rect.top,
                    target_title: get_window_title(hwnd),
                });
            }
        }
    }

    pub fn clear_anchor() {
        let mut state = ANCHOR_STATE.lock().unwrap();
        *state = None;
    }

    /// Run the tracking loop — call from a background thread.
    /// Continuously repositions the console window to follow its anchor target.
    pub fn run_tracking_loop(app_handle: tauri::AppHandle<tauri::Wry>) {
        let mut last_x = 0i32;
        let mut last_y = 0i32;
        let mut first_run = true;

        loop {
            thread::sleep(Duration::from_millis(16)); // ~60fps

            // Read anchor state
            let anchor = {
                let state = ANCHOR_STATE.lock().unwrap();
                state.as_ref().map(|a| (a.target_hwnd, a.offset_x, a.offset_y))
            };

            let Some((target_hwnd_val, offset_x, offset_y)) = anchor else {
                // Global mode: follow main window minimize/restore
                let is_global = *GLOBAL_MODE.lock().unwrap();
                if is_global {
                    if let Some(main_win) = app_handle.get_webview_window("main") {
                        if let Some(console_win) = app_handle.get_webview_window("console") {
                            let main_minimized = main_win.is_minimized().unwrap_or(false);
                            let console_minimized = console_win.is_minimized().unwrap_or(false);

                            if main_minimized && !console_minimized {
                                *LOOP_MINIMIZED.lock().unwrap() = true;
                                let _ = console_win.minimize();
                            } else if !main_minimized && console_minimized {
                                let mut lm = LOOP_MINIMIZED.lock().unwrap();
                                if *lm {
                                    *lm = false;
                                    let _ = console_win.unminimize();
                                    let _ = console_win.show();
                                }
                                // else: user minimized it — leave it alone
                            }
                        }
                    }
                }
                first_run = true;
                continue;
            };

            let target_hwnd = HWND(target_hwnd_val as *mut _);

            // If target window closed, clear anchor and notify JS
            unsafe {
                if !IsWindow(target_hwnd).as_bool() {
                    clear_anchor();
                    if let Some(window) = app_handle.get_webview_window("console") {
                        let _ = window.set_always_on_top(false);
                        let _ = window.emit("anchor-lost", ());
                    }
                    continue;
                }
            }

            let Some(window) = app_handle.get_webview_window("console") else {
                continue;
            };

            // Follow target minimize/restore
            unsafe {
                let target_minimized = IsIconic(target_hwnd).as_bool();
                let we_minimized = window.is_minimized().unwrap_or(false);

                if target_minimized && !we_minimized {
                    *LOOP_MINIMIZED.lock().unwrap() = true;
                    let _ = window.minimize();
                    continue;
                }
                if !target_minimized && we_minimized {
                    let mut lm = LOOP_MINIMIZED.lock().unwrap();
                    if *lm {
                        *lm = false;
                        let _ = window.unminimize();
                        let _ = window.show();
                    }
                    // else: user minimized it — leave it alone
                }
                if target_minimized || we_minimized {
                    continue;
                }
            }

            let our_pos = window.outer_position().unwrap_or_default();

            // If user dragged the console, update the offset
            if !first_run && (our_pos.x != last_x || our_pos.y != last_y) {
                unsafe {
                    let mut rect = RECT::default();
                    if GetWindowRect(target_hwnd, &mut rect).is_ok() {
                        if let Ok(mut state) = ANCHOR_STATE.try_lock() {
                            if let Some(ref mut a) = *state {
                                a.offset_x = our_pos.x - rect.left;
                                a.offset_y = our_pos.y - rect.top;
                            }
                        }
                    }
                }
            }

            // Move console to follow target
            unsafe {
                let mut rect = RECT::default();
                if GetWindowRect(target_hwnd, &mut rect).is_ok() {
                    let new_x = rect.left + offset_x;
                    let new_y = rect.top + offset_y;

                    if our_pos.x != new_x || our_pos.y != new_y {
                        let _ = window.set_position(tauri::Position::Physical(
                            tauri::PhysicalPosition::new(new_x, new_y),
                        ));
                    }

                    last_x = new_x;
                    last_y = new_y;
                }
            }

            first_run = false;
        }
    }
}

#[tauri::command]
fn start_window_picker<R: Runtime>(window: Window<R>) -> Result<String, String> {
    #[cfg(windows)]
    {
        let our_hwnd = window.hwnd().map(|h| h.0 as isize).unwrap_or(0);
        let result = win::start_picker(our_hwnd);

        match result {
            Some((title, hwnd)) => {
                win::set_anchor(&window, hwnd);
                let _ = window.set_always_on_top(true);
                Ok(title)
            }
            None => Err("Cancelled".to_string()),
        }
    }
    #[cfg(not(windows))]
    {
        let _ = window;
        Err("Window picker is only supported on Windows".to_string())
    }
}

#[tauri::command]
fn set_global_mode() -> Result<(), String> {
    #[cfg(windows)]
    {
        *win::LOOP_MINIMIZED.lock().unwrap() = false;
        *win::GLOBAL_MODE.lock().unwrap() = true;
    }
    Ok(())
}

#[tauri::command]
fn clear_global_mode() -> Result<(), String> {
    #[cfg(windows)]
    {
        *win::LOOP_MINIMIZED.lock().unwrap() = false;
        *win::GLOBAL_MODE.lock().unwrap() = false;
    }
    Ok(())
}

#[tauri::command]
fn stop_anchor<R: Runtime>(window: Window<R>) -> Result<(), String> {
    #[cfg(windows)]
    {
        *win::LOOP_MINIMIZED.lock().unwrap() = false;
        win::clear_anchor();
        let _ = window.set_always_on_top(false);
    }
    #[cfg(not(windows))]
    {
        let _ = window;
    }
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![start_window_picker, stop_anchor, set_global_mode, clear_global_mode])
        .setup(|app| {
            #[cfg(windows)]
            {
                let handle = app.handle().clone();
                std::thread::spawn(move || {
                    win::run_tracking_loop(handle);
                });
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
