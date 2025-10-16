// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use sqlite::Database;
use std::{
    collections::HashMap,
    fs,
    path::{Path, PathBuf},
    process::Command,
    str::FromStr,
    sync::{atomic::AtomicBool, Arc, Mutex},
};

use tauri::{
    api::path::app_data_dir, http::method::Method,  State
};
use tokio::sync::oneshot::{self, Sender};
use tokio::task;
use warp::Filter;

mod comm;
mod export;
mod restore;
mod review;
mod setting;
mod spine;
mod split;
mod sqlite;
mod support;


#[derive(Debug, Default)]
pub struct WebStatus {
    pub running: bool,
    pub root: String,
    sendtx: Arc<Mutex<Option<Sender<()>>>>,
}

#[tauri::command]
async fn stop_web_server(
    app: tauri::AppHandle,
    window: tauri::Window,
    state: State<'_, Arc<Mutex<WebStatus>>>,
) -> Result<(), String> {
    let mut web_status = state.lock().unwrap();

    if web_status.running {
        web_status.running = false;
        if let Some(tx) = web_status.sendtx.lock().unwrap().take() {
            tx.send(()).unwrap();
        }
    } else {
        return Err("web服务并没有启动".to_string());
    }

    Ok(())
}

#[tauri::command]
async fn start_web_server(
    app: tauri::AppHandle,
    window: tauri::Window,
    status: State<'_, Arc<Mutex<WebStatus>>>,
) -> Result<(), String> {
    let mut web_status = status.lock().unwrap();
    if web_status.running {
        return Err("web服务器已经启动了".to_string());
    }

    if web_status.root.is_empty() {
        web_status.root = app_data_dir(&app.config()).unwrap().display().to_string();
        web_status.root.push_str("\\temp");
        let path = PathBuf::from_str(&web_status.root).unwrap();
        println!("{}", path.display());
        if path.exists() == false {
            fs::create_dir(path.as_path()).unwrap();
        }
    }

    let root_path = PathBuf::from_str(&web_status.root).unwrap();

    let (tx, rx) = oneshot::channel();

    web_status.sendtx = Arc::new(Mutex::new(Some(tx)));

    task::spawn(async move {
        let cors = warp::cors()
            .allow_any_origin()
            .allow_methods(vec![Method::GET]) // 如果需要，可以添加更多方法
            .allow_headers(vec!["*"])
            .build();
        // .allow_methods(vec!["GET", "POST"]) // 允许的方法
        // ; // 允许任何来源

        let static_files_route = warp::fs::dir(root_path).with(cors);
        let (_addr, server) = warp::serve(static_files_route).bind_with_graceful_shutdown(
            ([127, 0, 0, 1], 3030),
            async {
                rx.await.ok();
            },
        );
        println!("启动了服务器:{}", _addr.to_string());
        server.await;
        println!("关闭服务器");
    });
    // 启动服务器，监听在端口 3030
    web_status.running = true;
    Ok(())
}

#[tauri::command]
async fn is_web_running(state: State<'_, Arc<Mutex<WebStatus>>>) -> Result<bool, String> {
    let status = state.lock().unwrap();
    Ok(status.running)
}

#[tauri::command]
fn open_browser(url: String) {
    if let Err(e) = open::that(url) {
        eprintln!("Failed to open browser: {}", e);
    }
}

use winreg::enums::*;
use winreg::RegKey;
// 获取机器码
#[tauri::command]
async fn get_mechine() -> Result<String, String> {
    let hklm = RegKey::predef(HKEY_LOCAL_MACHINE);
    let path = r"SOFTWARE\Microsoft\Cryptography";
    let cryptography_key = hklm.open_subkey(path).unwrap();

    // 获取MachineGuid值
    let machine_guid: String = cryptography_key.get_value("MachineGuid").unwrap();
    return Ok(machine_guid);
}

fn main() {
    let args = std::env::args().collect::<Vec<_>>();
    println!("{:?}", args);
    if args.len() > 1 {
        let exec_root = Path::new(&args[0]);
        let exec_root = exec_root.parent().unwrap();
        let path = Path::new(&args[1]);
        if path.exists() {
            let file_name = path.file_name().unwrap().to_str().unwrap();
            println!("{:?}: name:{}", path, file_name);
            if file_name.ends_with(".json") {
                let version = comm::spine::get_spine_version(path);
                if version != "" {
                    let mut exec = String::from("./view");
                    let target_v = &version[..3];
                    exec.push_str(target_v);
                    exec.push_str(".exe");

                    let exec_string = exec_root.join(exec).display().to_string();
                    Command::new(exec_string)
                        .arg(path.display().to_string().as_str())
                        .output()
                        .expect("启动失败");
                }
            } else if file_name.ends_with(".skel") {
                let version = comm::spine::get_spine_version(path);
                if version != "" {
                    let mut exec = String::from("./view");
                    let target_v = &version[..3];
                    exec.push_str(target_v);
                    exec.push_str(".exe");

                    let exec_string = exec_root.join(exec).display().to_string();
                    Command::new(exec_string)
                        .arg(path.display().to_string().as_str())
                        .output()
                        .expect("启动失败");
                }
            } else {
                return;
            }
        }
        return;
    }

    let _map_handle: HashMap<u32, Arc<AtomicBool>> = HashMap::new();
    tauri::Builder::default()
        .setup(|app| {
            match app.get_cli_matches() {
                Ok(matches) => {
                    println!("CLI args: {:?}", matches);
                    if matches.args.contains_key("file") {
                        println!("file: {:?}", matches.args.get("file").unwrap());
                    }
                }
                Err(_) => {
                    println!("CLI args: no args")
                }
            }
            Ok(())
        })
        .on_menu_event(|event| match event.menu_item_id() {
            "quit" => {
                std::process::exit(0);
            }
            "close" => {
                event.window().close().unwrap();
            }
            _ => {}
        })
        .manage(Arc::new(Mutex::new(WebStatus::default())))
        .manage(Arc::new(Mutex::new(_map_handle)))
        .manage(Mutex::new(export::ExportType::default()))
        .manage(Mutex::new(setting::SpineSetting::default()))
        .manage(Arc::new(Mutex::new(spine::SpineVersions::default())))
        .manage(Arc::new(Mutex::new(Database::default())))
        .invoke_handler(tauri::generate_handler![
            start_web_server,
            stop_web_server,
            is_web_running,
            get_mechine,
            open_browser,
            spine::get_spine_version,
            spine::get_current_version,
            spine::exec_scaler,
            export::get_spine_files,
            export::start_exporting_spine,
            export::stop_exporting_spine,
            export::get_export_data,
            export::get_export_type,
            export::open_dir,
            export::delete_dir,
            setting::get_setting,
            setting::set_setting,
            setting::get_export_types,
            restore::get_restore_files,
            restore::stop_restore_spine,
            restore::start_restore_spine,
            restore::copy_tmp_file,
            restore::down_file,
            restore::tidy_files,
            split::set_split_dir,
            split::start_split_files,
            split::stop_split_files,
            sqlite::init_database,
            sqlite::insert_log,
            sqlite::get_store_alldata,
            sqlite::add_export_info,
            sqlite::get_today_data,
            review::show_view,
            review::loop_review,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
