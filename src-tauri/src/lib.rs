use enigo::{Direction, Enigo, Key, Keyboard, Settings};
use serde::{Deserialize, Serialize};
use std::{collections::HashSet, sync::Mutex, time::Duration};
use tauri::{Emitter, Manager, Runtime, State};
use tauri_plugin_clipboard_manager::ClipboardExt;
use tauri_plugin_global_shortcut::{GlobalShortcutExt, ShortcutState};

#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct TemplateShortcutRegistration {
    template_id: String,
    title: String,
    content: String,
    shortcut: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct FailedShortcut {
    shortcut: String,
    error: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct ShortcutRegistrationResult {
    success: bool,
    registered_count: usize,
    failed_shortcuts: Vec<FailedShortcut>,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct ShortcutTriggeredEvent {
    template_id: String,
    title: String,
    shortcut: String,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct ShortcutDebugEvent {
    template_id: String,
    shortcut: String,
    stage: String,
    message: Option<String>,
}

#[derive(Default)]
struct RegisteredTemplateShortcuts {
    shortcuts: Mutex<Vec<String>>,
}

fn paste_clipboard_native() -> Result<(), String> {
    let mut enigo = Enigo::new(&Settings::default()).map_err(|error| error.to_string())?;

    for modifier in [Key::Control, Key::Alt, Key::Shift, Key::Meta] {
        let _ = enigo.key(modifier, Direction::Release);
    }

    std::thread::sleep(Duration::from_millis(20));

    #[cfg(target_os = "macos")]
    let modifier = Key::Meta;
    #[cfg(not(target_os = "macos"))]
    let modifier = Key::Control;

    enigo
        .key(modifier, Direction::Press)
        .map_err(|error| error.to_string())?;
    enigo
        .key(Key::Unicode('v'), Direction::Click)
        .map_err(|error| error.to_string())?;
    enigo
        .key(modifier, Direction::Release)
        .map_err(|error| error.to_string())?;

    Ok(())
}

fn unregister_saved_shortcuts<R: Runtime>(
    app: &tauri::AppHandle<R>,
    shortcut_state: &RegisteredTemplateShortcuts,
) {
    let shortcuts = {
        let mut saved_shortcuts = shortcut_state.shortcuts.lock().unwrap();
        std::mem::take(&mut *saved_shortcuts)
    };

    for shortcut in shortcuts {
        if let Err(error) = app.global_shortcut().unregister(shortcut.as_str()) {
            eprintln!("Failed to unregister shortcut {shortcut}: {error}");
        }
    }
}

fn run_template_shortcut<R: Runtime>(
    app: &tauri::AppHandle<R>,
    registration: &TemplateShortcutRegistration,
) -> Result<(), String> {
    if let Some(main_window) = app.get_webview_window("main") {
        if main_window.is_focused().unwrap_or(false) {
            return Ok(());
        }
    }

    app.clipboard()
        .write_text(registration.content.clone())
        .map_err(|error| error.to_string())?;

    std::thread::sleep(Duration::from_millis(40));
    paste_clipboard_native()?;

    let _ = app.emit(
        "template-shortcut-triggered",
        ShortcutTriggeredEvent {
            template_id: registration.template_id.clone(),
            title: registration.title.clone(),
            shortcut: registration.shortcut.clone(),
        },
    );

    Ok(())
}

#[tauri::command]
fn paste_shortcut_clipboard() -> Result<(), String> {
    paste_clipboard_native()
}

#[tauri::command]
fn sync_template_shortcuts<R: Runtime>(
    app: tauri::AppHandle<R>,
    shortcut_state: State<'_, RegisteredTemplateShortcuts>,
    shortcuts: Vec<TemplateShortcutRegistration>,
) -> ShortcutRegistrationResult {
    unregister_saved_shortcuts(&app, shortcut_state.inner());

    let mut seen_shortcuts = HashSet::new();
    let mut saved_shortcuts = Vec::new();
    let mut failed_shortcuts = Vec::new();
    let mut registered_count = 0;

    for registration in shortcuts {
        let shortcut = registration.shortcut.trim().to_string();
        if shortcut.is_empty() || !seen_shortcuts.insert(shortcut.clone()) {
            continue;
        }

        let registration_for_handler = registration.clone();
        match app.global_shortcut().on_shortcut(shortcut.as_str(), move |app, _, event| {
            if event.state != ShortcutState::Pressed {
                return;
            }

            let _ = app.emit(
                "template-shortcut-debug",
                ShortcutDebugEvent {
                    template_id: registration_for_handler.template_id.clone(),
                    shortcut: registration_for_handler.shortcut.clone(),
                    stage: "pressed".to_string(),
                    message: None,
                },
            );

            if let Err(error) = run_template_shortcut(app, &registration_for_handler) {
                let _ = app.emit(
                    "template-shortcut-debug",
                    ShortcutDebugEvent {
                        template_id: registration_for_handler.template_id.clone(),
                        shortcut: registration_for_handler.shortcut.clone(),
                        stage: "error".to_string(),
                        message: Some(error.clone()),
                    },
                );
                eprintln!(
                    "Failed to run template shortcut {}: {}",
                    registration_for_handler.shortcut, error
                );
            }
        }) {
            Ok(()) => {
                registered_count += 1;
                saved_shortcuts.push(shortcut);
            }
            Err(error) => failed_shortcuts.push(FailedShortcut {
                shortcut,
                error: error.to_string(),
            }),
        }
    }

    *shortcut_state.shortcuts.lock().unwrap() = saved_shortcuts;

    ShortcutRegistrationResult {
        success: failed_shortcuts.is_empty(),
        registered_count,
        failed_shortcuts,
    }
}

#[tauri::command]
fn clear_template_shortcuts<R: Runtime>(
    app: tauri::AppHandle<R>,
    shortcut_state: State<'_, RegisteredTemplateShortcuts>,
) {
    unregister_saved_shortcuts(&app, shortcut_state.inner());
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(RegisteredTemplateShortcuts::default())
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.unminimize();
                let _ = window.show();
                let _ = window.set_focus();
                let _ = window.emit("app-single-instance", ());
            }
        }))
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .invoke_handler(tauri::generate_handler![
            paste_shortcut_clipboard,
            sync_template_shortcuts,
            clear_template_shortcuts
        ])
        .setup(|app| {
            #[cfg(desktop)]
            app.handle()
                .plugin(tauri_plugin_global_shortcut::Builder::new().build())?;

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
