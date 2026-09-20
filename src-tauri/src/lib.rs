pub mod ballistics;
pub mod formats;

use ballistics::solver::{solve_interior_ballistics, NativeBallisticsInput, NativeSimulationResult};
use formats::vol_format::{parse_vol_line, VolRecord};

#[tauri::command]
fn calculate_interior_ballistics(input: NativeBallisticsInput) -> NativeSimulationResult {
    solve_interior_ballistics(&input)
}

#[tauri::command]
fn parse_vol_native(line: String) -> Option<VolRecord> {
    parse_vol_line(&line)
}

#[allow(unused_imports)]
use tauri::{Emitter, Manager};

#[derive(Clone, serde::Serialize)]
pub struct OpenedFilePayload {
    pub name: String,
    pub path: String,
    pub content: String,
}

pub struct PendingOpenFile(pub std::sync::Mutex<Option<OpenedFilePayload>>);

#[tauri::command]
fn get_pending_open_file(state: tauri::State<'_, PendingOpenFile>) -> Option<OpenedFilePayload> {
    let mut lock = state.0.lock().ok()?;
    lock.take()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let initial_file = std::env::args().nth(1).and_then(|arg| {
        let p = std::path::Path::new(&arg);
        if p.is_file() {
            let name = p.file_name().and_then(|n| n.to_str()).unwrap_or("Recipe File").to_string();
            std::fs::read_to_string(p).ok().map(|content| OpenedFilePayload {
                name,
                path: arg,
                content,
            })
        } else {
            None
        }
    });

    let pending_state = PendingOpenFile(std::sync::Mutex::new(initial_file));

    let app = tauri::Builder::default()
        .manage(pending_state)
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            calculate_interior_ballistics,
            parse_vol_native,
            get_pending_open_file
        ])
        .build(tauri::generate_context!())
        .expect("error while building LoadBench Studio");

    app.run(|_app_handle, _event| {
        #[cfg(target_os = "macos")]
        if let tauri::RunEvent::Opened { urls } = _event {
            for url in urls {
                if let Ok(file_path) = url.to_file_path() {
                    let path_str = file_path.to_string_lossy().to_string();
                    let name = file_path.file_name().and_then(|n| n.to_str()).unwrap_or("Recipe File").to_string();
                    if let Ok(content) = std::fs::read_to_string(&file_path) {
                        let payload = OpenedFilePayload {
                            name,
                            path: path_str,
                            content,
                        };
                        if let Some(state) = _app_handle.try_state::<PendingOpenFile>() {
                            if let Ok(mut lock) = state.0.lock() {
                                *lock = Some(payload.clone());
                            }
                        }
                        let _ = _app_handle.emit("loadbench://open-file", &payload);
                    }
                }
            }
        }
    });
}
