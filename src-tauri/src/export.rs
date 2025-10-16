use crate::{setting::SpineSetting, sqlite::Database};
use dircpy::*;
use rand::Rng;
use std::{
    collections::HashMap,
    fs,
    io::{BufRead, BufReader, Write},
    path::{Path, PathBuf},
    process::{Command, Stdio},
    sync::{
        atomic::{AtomicBool, Ordering},
        Arc, Mutex,
    },
    thread,
    time::Duration,
};
use tauri::{api, Manager, Runtime, State};
use walkdir::{DirEntry, WalkDir};

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct SpineFile {
    id: u32,
    file_name: String,
    file_path: String,
    ready: bool,
    desc: String,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct ExportDetail {
    //导出细节
    id: u32,
    ready: bool,
    desc: String,
}

impl SpineFile {
    pub fn new(id: u32, name: String, path: String) -> SpineFile {
        return SpineFile {
            id: id,
            file_name: name,
            file_path: path,
            ready: false,
            desc: String::new(),
        };
    }
}

#[derive(Debug, Default, serde::Deserialize, serde::Serialize)]
pub struct ExportType {
    map: HashMap<String, HashMap<String, String>>,
}

pub fn set_spine_version(path: &Path, version: &str) -> Result<(), String> {
    let mut file = fs::OpenOptions::new()
        .truncate(true)
        .write(true)
        .open(path)
        .map_err(|e| e.to_string())?;

    file.write_all(version.as_bytes())
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn get_export_type<R: Runtime>(
    app: tauri::AppHandle<R>,
    _window: tauri::Window<R>,
    version: String,
    export: String,
) -> Result<String, String> {
    let path = api::path::app_config_dir(&app.config())
        .ok_or_else(|| "无法获取应用配置目录".to_string())?
        .join("export")
        .join(&export);

    if !path.exists() {
        return Err("没有找到导出目录".to_string());
    }

    for entry in WalkDir::new(&path).into_iter().filter_map(Result::ok) {
        if entry.path().is_file() {
            if let Some(filename) = entry.path().file_name().and_then(|s| s.to_str()) {
                if filename.starts_with(&version) {
                    return Ok(entry.path().display().to_string());
                }
            }
        }
    }

    Err("没有对应配置文件".to_string())
}

#[tauri::command]
pub async fn get_export_data(
    app: tauri::AppHandle,
    _window: tauri::Window,
) -> Result<ExportType, String> {
    let config_path = api::path::app_config_dir(&app.config())
        .ok_or_else(|| "无法获取应用配置目录".to_string())?;
    let export_config_path = config_path.join("export");

    if !export_config_path.exists() {
        if let Some(resources_path) = api::path::resource_dir(app.package_info(), &app.env()) {
            let export_template_path = resources_path.join("export");
            if export_template_path.exists() {
                CopyBuilder::new(export_template_path, &export_config_path)
                    .overwrite(true)
                    .run()
                    .map_err(|e| format!("无法复制导出模板: {}", e))?;
            }
        }
    }

    let mut exports_data = ExportType::default();
    for entry in WalkDir::new(&export_config_path)
        .min_depth(1)
        .max_depth(1)
        .into_iter()
        .filter_map(Result::ok)
        .filter(|e| e.path().is_dir())
    {
        if let Some(dir_name) = entry.path().file_name().and_then(|s| s.to_str()) {
            let mut version_map = HashMap::new();
            if let Ok(read_dir) = entry.path().read_dir() {
                for file_entry in read_dir.filter_map(Result::ok) {
                    let file_path = file_entry.path();
                    if file_path.is_file() {
                        if let Some(file_name) = file_path.file_name().and_then(|s| s.to_str()) {
                            if file_name.len() >= 3 {
                                let version = &file_name[0..3];
                                version_map
                                    .insert(version.to_string(), file_path.display().to_string());
                            }
                        }
                    }
                }
            }
            exports_data.map.insert(dir_name.to_string(), version_map);
        }
    }
    Ok(exports_data)
}

fn is_spine_file(entry: &DirEntry) -> bool {
    entry.file_type().is_file() && entry.path().extension().map_or(false, |ext| ext == "spine")
}

#[tauri::command]
pub async fn get_spine_files(root: String) -> Result<Vec<SpineFile>, String> {
    let path = PathBuf::from(&root);
    if !path.exists() {
        return Err(format!("不存在的目录 {}", root));
    }

    let files = WalkDir::new(path)
        .into_iter()
        .filter_map(Result::ok)
        .filter(|e| is_spine_file(e))
        .enumerate()
        .map(|(i, entry)| {
            let file_name = entry.file_name().to_string_lossy().to_string();
            let parent_path = entry
                .path()
                .parent()
                .map_or_else(|| "".to_string(), |p| p.display().to_string());
            SpineFile::new((i + 1) as u32, file_name, parent_path)
        })
        .collect();

    Ok(files)
}

#[tauri::command]
pub async fn stop_exporting_spine(
    state: State<'_, Arc<Mutex<HashMap<u32, Arc<AtomicBool>>>>>,
    taskid: u32,
) -> Result<(), String> {
    let map = state.lock().unwrap();
    if let Some(running) = map.get(&taskid) {
        running.store(false, Ordering::SeqCst);
        Ok(())
    } else {
        Err(format!("没有找到任务ID: {}", taskid))
    }
}

#[tauri::command]
pub async fn start_exporting_spine(
    window: tauri::Window,
    state: State<'_, Arc<Mutex<HashMap<u32, Arc<AtomicBool>>>>>,
    state1: State<'_, Mutex<SpineSetting>>,
    arc_db: State<'_, Arc<Mutex<Database>>>,
    spines: Vec<SpineFile>,
    version: String,
) -> Result<u32, String> {
    let exec_root = {
        let settings = state1.lock().unwrap();
        settings.exec_root.clone()
    };

    if exec_root.is_empty() {
        return Err("尚未配置Spine目录".to_string());
    }

    if let Some(home_dir) = tauri::api::path::home_dir() {
        let spine_path = home_dir.join("Spine/version.txt");
        if spine_path.exists() {
            if let Err(e) = set_spine_version(&spine_path, &version) {
                // Log or handle error, maybe not critical to stop the whole process
                println!("无法设置Spine版本: {}", e);
            }
        }
    }

    let id: u32 = rand::thread_rng().gen();
    let running: Arc<AtomicBool> = Arc::new(AtomicBool::new(true));
    let r = running.clone();
    let state_clone = state.inner().clone();
    let spine_executable = PathBuf::from(exec_root).join("Spine");
    let db_clone = arc_db.inner().clone();

    thread::spawn(move || {
        let mut processed_count = 0;
        let total = spines.len();

        for (index, spine) in spines.iter().enumerate() {
            if !r.load(Ordering::SeqCst) {
                break; // Stop if cancellation is requested
            }

            if spine.ready {
                continue;
            }

            let export_path = PathBuf::from(&spine.file_path).join(format!(
                "{}.export",
                PathBuf::from(&spine.file_name)
                    .file_stem()
                    .unwrap_or_default()
                    .to_string_lossy()
            ));

            let spawn_result = Command::new(&spine_executable)
                .arg("-e")
                .arg(export_path)
                .stdout(Stdio::piped())
                .stderr(Stdio::piped())
                .spawn();

            let mut cmd = match spawn_result {
                Ok(cmd) => cmd,
                Err(e) => {
                    let _ = window.emit(
                        "export_detail",
                        Some(&ExportDetail {
                            id: spine.id,
                            ready: false,
                            desc: format!("无法启动Spine: {}", e),
                        }),
                    );
                    continue; // Skip to next spine file
                }
            };

            if let Some(stdout) = cmd.stdout.take() {
                let reader = BufReader::new(stdout);
                for line in reader.lines().filter_map(Result::ok) {
                    if line.starts_with("Lis") {
                        continue;
                    }
                    let ready = line.starts_with("Complete");
                    if ready {
                        processed_count += 1;
                    }
                    let _ = window.emit(
                        "export_detail",
                        Some(&ExportDetail {
                            id: spine.id,
                            ready,
                            desc: line,
                        }),
                    );
                }
            }

            let _ = window.emit("progress", Some((index + 1) * 100 / total));
        }

        // Cleanup and finalization
        state_clone.lock().unwrap().remove(&id);
        db_clone
            .lock()
            .unwrap()
            .add_all_data("export".to_string(), processed_count)
            .unwrap_or_else(|e| println!("数据库更新失败: {}", e));

        thread::sleep(Duration::from_millis(100));
        let _ = window.emit("export_finish", Some(id));
    });

    let mut map = state.lock().unwrap();
    map.insert(id, running);
    Ok(id)
}

#[tauri::command]
pub fn open_dir(_window: tauri::Window, dir: String) -> Result<(), String> {
    // 使用 open crate 来打开文件夹
    if let Err(e) = open::that(dir) {
        return Err(e.to_string());
    }
    Ok(())
}

#[tauri::command]
pub fn delete_dir(_window: tauri::Window, dir: String) -> Result<(), String> {
    if let Err(e) = std::fs::remove_dir_all(&dir) {
        return Err(format!("无法删除对应的目录: {}", e));
    }
    Ok(())
}
