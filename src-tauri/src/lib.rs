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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            calculate_interior_ballistics,
            parse_vol_native
        ])
        .run(tauri::generate_context!())
        .expect("error while running LoadBench Studio");
}
