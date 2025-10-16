use crate::{
    comm::{self, spine::get_atlas_images},
    export::set_spine_version,
    setting::SpineSetting,
    spine::SpineVersions,
    sqlite::Database,
    support::AtlasFile,
    WebStatus,
};

use rand::Rng;
use reqwest::multipart::Part;
use comm::spine_lib::compare_versions;
use std::{
    collections::HashMap,
    fs::{self, File},
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
use tauri::{api::process::CommandEvent, State};
use walkdir::DirEntry;
use winreg::{enums::*, RegKey};

#[derive(Debug, Default, Clone, serde::Deserialize, serde::Serialize)]
pub struct RestoreSpine {
    id: u32,
    atlas: String,
    data: String,
    scale: String,
    version: String,
    can_restore: bool,
    images: Vec<String>, // 图片数据
    desc: String,
    tidy_dir: bool,
}

#[derive(Debug, Default, serde::Deserialize, serde::Serialize)]
pub struct RestoreDetail {
    id: u32,
    desc: String,
    ready: bool,
}

fn is_atlas_file(entry: &DirEntry) -> bool {
    let path = entry.path();
    if !path.is_file() {
        return false;
    }
    match path.extension().and_then(|s| s.to_str()) {
        Some("atlas") => true,
        Some("txt") => path
            .file_stem()
            .and_then(|s| s.to_str())
            .map_or(false, |s| s.ends_with(".atlas")),
        _ => false,
    }
}

async fn exec_spine_scale(version: &str, atlas: &str, data: &str) -> Result<String, String> {
    if version.is_empty() {
        return Err("对应文件缺失".to_string());
    }

    let parts: Vec<u32> = version
        .split('.')
        .take(2)
        .map(|s| s.parse().unwrap_or(0))
        .collect();

    let exec = if parts.len() >= 2 {
        let test_value = parts[0] * 10 + parts[1];
        if (21..=41).contains(&test_value) {
            format!("scaler{}{}", parts[0], parts[1])
        } else if test_value >= 42 {
            return Ok("1.0".to_string());
        } else {
            return Err("不支持的版本".to_string());
        }
    } else {
        return Ok("1.0".to_string());
    };

    match tauri::api::process::Command::new_sidecar(&exec)
        .map_err(|e| format!("无法找到sidecar: {}", e))?
        .args([atlas, data])
        .spawn()
    {
        Ok((mut rx, _child)) => {
            if let Some(CommandEvent::Stdout(line)) = rx.recv().await {
                if line.trim().parse::<f32>().is_ok() {
                    return Ok(line);
                }
            }
        }
        Err(e) => return Err(format!("无法启动sidecar: {}", e)),
    }
    Ok("1.0".to_string())
}

#[tauri::command]
pub async fn tidy_files(
    _window: tauri::Window,
    files: Vec<RestoreSpine>,
) -> Result<String, String> {
    for file in files {
        let data_path = Path::new(&file.data);
        if !data_path.exists() {
            return Err("主要文件缺失无法整理".to_string());
        }

        let parent = data_path.parent().ok_or("无法获取父目录")?;
        let dir_name = data_path
            .file_stem()
            .and_then(|s| s.to_str())
            .ok_or("无法获取文件名")?;
        let target_dir = parent.join(dir_name);

        if !target_dir.exists() {
            fs::create_dir_all(&target_dir)
                .map_err(|e| format!("无法创建目录: {}", e))?;
        }

        let move_file = |file_path_str: &str| -> Result<(), String> {
            let file_path = Path::new(file_path_str);
            if file_path.exists() {
                let file_name = file_path.file_name().ok_or("无法获取文件名")?;
                fs::rename(file_path, target_dir.join(file_name))
                    .map_err(|e| format!("无法移动文件: {}", e))?;
            }
            Ok(())
        };

        move_file(&file.data)?;
        move_file(&file.atlas)?;
        for image in &file.images {
            move_file(image)?;
        }
    }
    Ok("整理完成".to_string())
}

#[tauri::command]
pub async fn get_restore_files(
    window: tauri::Window,
    dir: String,
) -> Result<Vec<RestoreSpine>, String> {
    let path = PathBuf::from(&dir);
    if !path.exists() {
        return Err(format!("路径:{}不存在!", path.display()));
    }

    let mut vec_restore_files: Vec<RestoreSpine> = walkdir::WalkDir::new(&path)
        .into_iter()
        .filter_map(Result::ok)
        .filter(|e| is_atlas_file(e))
        .enumerate()
        .map(|(id, entry)| {
            let mut data_spine = RestoreSpine::default();
            let parent = entry.path().parent().unwrap();
            let file_name = entry.path().file_name().unwrap().to_string_lossy();
            let base = file_name.split(".atlas").next().unwrap_or("");

            data_spine.id = (id + 1) as u32;
            data_spine.atlas = entry.path().display().to_string();
            data_spine.images = get_atlas_images(entry.path());
            data_spine.desc = "就绪".to_string();

            if data_spine.images.is_empty() {
                data_spine.desc = "未找到图片".to_string();
            } else if !data_spine
                .images
                .iter()
                .all(|img| parent.join(img).exists())
            {
                data_spine.desc = "图片缺失".to_string();
            }

            if parent.file_name().unwrap_or_default() != base {
                data_spine.tidy_dir = true;
            }

            let skel_path = parent.join(format!("{}.skel", base));
            let json_path = parent.join(format!("{}.json", base));

            if skel_path.exists() {
                data_spine.data = skel_path.display().to_string();
                data_spine.version = comm::spine::get_spine_version(&skel_path);
            } else if json_path.exists() {
                data_spine.data = json_path.display().to_string();
                data_spine.version = comm::spine::get_spine_version(&json_path);
            } else {
                data_spine.can_restore = false;
                data_spine.desc = "数据文件缺失".to_string();
                return data_spine;
            }

            if data_spine.version.is_empty() {
                data_spine.can_restore = false;
                data_spine.desc = "解析版本失败".to_string();
            } else if compare_versions(&data_spine.version, "3.7") == std::cmp::Ordering::Less {
                data_spine.desc = "还原版本太低".to_string();
                data_spine.can_restore = false;
            } else {
                data_spine.can_restore = true;
            }

            data_spine
        })
        .collect();

    let total_len = vec_restore_files.len();
    for (i, data_spine) in vec_restore_files.iter_mut().enumerate() {
        if data_spine.can_restore {
            data_spine.scale = "解析中".to_string();
            let rt_result =
                exec_spine_scale(&data_spine.version, &data_spine.atlas, &data_spine.data).await;
            data_spine.scale = rt_result.unwrap_or_else(|e| e);
        }
        let _ = window.emit("progress", Some((i + 1) * 100 / total_len));
    }

    Ok(vec_restore_files)
}

#[tauri::command]
pub async fn stop_restore_spine(
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

fn copy_file(from: &Path, to: &Path) -> std::io::Result<()> {
    if let Some(filename) = from.file_name() {
        let destination = to.join(filename);
        fs::copy(from, &destination)?;
    }
    Ok(())
}

#[tauri::command]
pub async fn copy_tmp_file(
    status: State<'_, Arc<Mutex<WebStatus>>>,
    details: RestoreSpine,
) -> Result<String, String> {
    let web_status = status.lock().unwrap();
    if !web_status.running {
        return Err("服务器尚未启动".to_string());
    }

    let tmp_path = PathBuf::from(&web_status.root);
    let atlas_path = PathBuf::from(&details.atlas);
    let data_path = PathBuf::from(&details.data);

    let atlas_file = AtlasFile::new(atlas_path.clone());

    if atlas_path.exists() && data_path.exists() && atlas_file.is_image_exists() {
        for img in atlas_file.get_images() {
            copy_file(&img, &tmp_path).map_err(|e| e.to_string())?;
        }
        copy_file(&atlas_path, &tmp_path).map_err(|e| e.to_string())?;
        copy_file(&data_path, &tmp_path).map_err(|e| e.to_string())?;
    }

    let file_name = data_path
        .file_name()
        .map_or("", |s| s.to_str().unwrap_or(""))
        .to_string();

    Ok(format!("http://127.0.0.1:3030/{}", file_name))
}


async fn download_file(url: &str, save_path: &str) -> Result<(), Box<dyn std::error::Error>> {
    let response = reqwest::get(url).await?;
    if response.status().is_success() {
        let mut file = File::create(save_path)?;
        let bytes = response.bytes().await?;
        file.write_all(&bytes)?;
    }
    Ok(())
}

#[tauri::command]
pub async fn down_file(url: String, save: String) -> Result<(), String> {
    download_file(&url, &save)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn start_restore_spine(
    window: tauri::Window,
    state: State<'_, Arc<Mutex<HashMap<u32, Arc<AtomicBool>>>>>,
    state1: State<'_, Mutex<SpineSetting>>,
    spines: Vec<RestoreSpine>,
    arc_db: State<'_, Arc<Mutex<Database>>>,
    versions: State<'_, Arc<Mutex<SpineVersions>>>,
) -> Result<u32, String> {
    let id: u32 = rand::thread_rng().gen();
    let running = Arc::new(AtomicBool::new(true));
    let state_clone = state.inner().clone();
    state_clone.lock().unwrap().insert(id, running.clone());

    let exec_root = state1.lock().unwrap().exec_root.clone();
    let spine_executable = PathBuf::from(exec_root).join("Spine");
    let version_map = versions.lock().unwrap().map.clone();
    let db_clone = arc_db.inner().clone();
    let spines_clone = spines.clone();
    let running_clone = running.clone();

    thread::spawn(move || {
        let mut processed_count = 0;
        let total = spines.len();

        for (index, restore) in spines.iter().enumerate() {
            if !running_clone.load(Ordering::SeqCst) {
                break;
            }
            if !restore.can_restore {
                let _ = window.emit("progress", Some((index + 1) * 100 / total));
                continue;
            }

            if let Some(home_dir) = tauri::api::path::home_dir() {
                let spine_version_path = home_dir.join("Spine/version.txt");
                if let Some(version_str) = version_map.get(&restore.version[0..3]) {
                    if set_spine_version(&spine_version_path, version_str).is_err() {
                        // Log or handle error
                    }
                } else {
                    let _ = window.emit(
                        "restore_detail",
                        Some(&RestoreDetail {
                            id: restore.id,
                            ready: false,
                            desc: "缺少Spine版本配置".to_string(),
                        }),
                    );
                    continue;
                }
            }

            let input_file = &restore.data;
            let temp_path = PathBuf::from(input_file);
            let parent = temp_path.parent().unwrap();
            let base = temp_path.file_stem().unwrap().to_string_lossy();
            let output_file = parent.join(format!("{}.spine", base));

            let spawn_result = Command::new(&spine_executable)
                .arg("-i")
                .arg(input_file)
                .arg("-o")
                .arg(output_file)
                .arg("-s")
                .arg(&restore.scale)
                .arg("-r")
                .arg(base.as_ref())
                .stdout(Stdio::piped())
                .spawn();

            if let Ok(mut cmd) = spawn_result {
                if let Some(stdout) = cmd.stdout.take() {
                    let reader = BufReader::new(stdout);
                    for line in reader.lines().filter_map(Result::ok) {
                        let ready = line.starts_with("Complete");
                        if ready {
                            processed_count += 1;
                        }
                        let _ = window.emit(
                            "restore_detail",
                            Some(&RestoreDetail {
                                id: restore.id,
                                ready,
                                desc: if ready { "完成".to_string() } else { line },
                            }),
                        );
                    }
                }
            }
            let _ = window.emit("progress", Some((index + 1) * 100 / total));
        }

        state_clone.lock().unwrap().remove(&id);
        db_clone
            .lock()
            .unwrap()
            .add_all_data("restore".to_string(), processed_count)
            .unwrap_or_else(|e| println!("数据库更新失败: {}", e));

        thread::sleep(Duration::from_millis(100));
        let _ = window.emit("restore_finish", Some(id));
    });
    Ok(id)
}
