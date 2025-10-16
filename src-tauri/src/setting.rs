use std::{
    io::{Read, Write},
    sync::{Arc, Mutex},
};

use tauri::{api, Manager, State};

use crate::WebStatus;

#[derive(Debug, Default, serde::Deserialize, serde::Serialize)]
pub struct SpineSetting {
    pub exec_root: String,
    pub temp_root: String,
}

#[tauri::command]
pub async fn get_setting(
    app: tauri::AppHandle,
    state: State<'_, Mutex<SpineSetting>>,
    status: State<'_, Arc<Mutex<WebStatus>>>,
) -> Result<SpineSetting, String> {
    let path = api::path::app_config_dir(&app.config()).unwrap();

    if path.exists() == false {
        std::fs::create_dir(&path).unwrap();
    }

    let path = path.join("setting");
    println!("path:{:?}",path.display());
    if path.exists() {
        let mut file = std::fs::File::open(&path).unwrap();
        let mut buf = String::new();
        file.read_to_string(&mut buf).unwrap();

        let setting: SpineSetting = serde_json::from_str(&buf).unwrap();
        let mut set = state.lock().unwrap();
        set.exec_root = setting.exec_root.clone();
        set.temp_root = setting.temp_root.clone();

        let mut status = status.lock().unwrap();
        status.root = setting.temp_root.clone();
        return Ok(setting);
    } else {
        let mut file = std::fs::OpenOptions::new()
            .create(true)
            .truncate(true)
            .write(true)
            .open(&path)
            .unwrap();
        let setting = SpineSetting::default();

        let buf = serde_json::to_string(&setting).unwrap();
        file.write(buf.as_bytes()).unwrap();

        return Ok(setting);
    }
}

#[tauri::command]
pub async fn set_setting(
    app: tauri::AppHandle,
    state: State<'_, Mutex<SpineSetting>>,
    root: String,
    temp: String,
) -> Result<(), String> {
    let mut set = state.lock().unwrap();
    set.exec_root = root;
    set.temp_root = temp;

    println!("setting save:{:?}", set);
    let path = api::path::app_config_dir(&app.config()).unwrap();

    if path.exists() == false {
        std::fs::create_dir(&path).unwrap();
    }

    let path = path.join("setting");

    let mut file = std::fs::OpenOptions::new()
        .create(true)
        .truncate(true)
        .write(true)
        .open(&path)
        .unwrap();

    let buf = serde_json::to_string(&SpineSetting {
        exec_root: set.exec_root.to_string(),
        temp_root: set.temp_root.to_string(),
    })
    .unwrap();
    file.write(buf.as_bytes()).unwrap();

    Ok(())
}

use dircpy::*;
// 获取导出的类目
#[tauri::command]
pub async fn get_export_types(
    app: tauri::AppHandle,
    window: tauri::Window,
    // readdir :String,
) -> Result<Vec<String>, String> {
    let mut types = Vec::new();
    let path = api::path::app_config_dir(&app.config()).unwrap();
    println!("查询位置：{}",path.display());
    let path_export = path.join("export");
    if path_export.exists() == false {
        let resources_path = api::path::resource_dir(app.package_info(), &app.env()).unwrap();
        
        let export_path = resources_path.join("export");
        if export_path.exists() {
            CopyBuilder::new(export_path.display().to_string(), path.display().to_string()).overwrite(true).run().unwrap();
            println!("将文件转移到了目标位置")
        }
    }

    println!("export dir:{:?}", path.display());
    let loop_dirs = path.read_dir().unwrap();
    for dir in loop_dirs.filter_map(Result::ok) {
        if dir.path().is_dir() {
            types.push(
                dir.path()
                    .file_name()
                    .unwrap()
                    .to_string_lossy()
                    .to_string(),
            );
        }
    }
    Ok(types)
}
