use std::{
    collections::HashMap,
    fs::{self, File},
    io::{ Read},
    path::PathBuf,
    sync::{
        Arc, Mutex,
    },
  
};

use tauri::{api, State};


#[derive(Debug, Default)]
pub struct SpineVersions {
    pub map: HashMap<String, String>,
    // init: bool,
}

impl SpineVersions {
    pub fn push_path(&mut self, vv: &String) {
        self.map.insert(vv[0..3].to_string(), vv.to_owned());
    }

    pub fn clear_all(&mut self) {
        self.map.clear();
    }
}

#[tauri::command]
pub async fn get_spine_version(
    state: State<'_, Arc<Mutex<SpineVersions>>>,
) -> Result<Vec<String>, String> {
    let path: PathBuf = tauri::api::path::home_dir().unwrap();
    let path = path.join("Spine/updates");

    let mut version: Vec<String> = Vec::new();
    let entries = fs::read_dir(path).unwrap();
    for entry in entries {
        if let Ok(v) = entry {
            version.push(v.path().file_name().unwrap().to_string_lossy().to_string());
        }
    }

    println!("get version: {:?}", version);
    let mut spine_version = state.lock().unwrap();
    spine_version.clear_all();

    for vv in version.iter() {
        spine_version.push_path(vv);
    }

    return Ok(version);
}

#[tauri::command]
pub async fn get_current_version() -> String {
    let path: PathBuf = tauri::api::path::home_dir().unwrap();
    let path = path.join("Spine/version.txt");
    let mut version = String::new();
    if path.exists() {
        let file_ret = File::open(path);
        if let Ok(mut file) = file_ret {
            let _ = file.read_to_string(&mut version);
            return version;
        } else {
            return String::new();
        }
    }
    return String::new();
}

#[tauri::command]
pub async fn exec_scaler() -> String {
    let cmd = tauri::api::process::Command::new_sidecar("scaler38")
        .expect("msg")
        .args(vec![
            "D:\\work\\runtime\\spine_scale\\3.8\\scaler\\avator_bingyi.atlas",
            "D:\\work\\runtime\\spine_scale\\3.8\\scaler\\avator_bingyi.skel",
        ]);

    let rt = cmd.output().unwrap();

    return rt.stdout;
}
