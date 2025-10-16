use std::{
    collections::HashMap,
    fs,
    io::{BufRead, BufReader},
    path::PathBuf,
    process::{Command, Stdio},
    str::FromStr,
    sync::{
        atomic::{AtomicBool, Ordering},
        Arc, Mutex,
    },
    thread,
    time::Duration,
};

use rand::Rng;
use tauri::{ 
    State,
};
use walkdir;

use crate::{export::set_spine_version, setting::SpineSetting, sqlite::Database, support::AtlasFile};

fn is_atlas_file(entry: &walkdir::DirEntry) -> bool {
    if entry.file_type().is_file() {
        if let Some(atlas) = entry.path().extension() {
            if atlas == "atlas" {
                return true;
            } else if atlas == "txt" {
                if let Some(all) = entry.path().file_stem() {
                    let all_string = String::from_str(all.to_str().unwrap()).unwrap();
                    println!("all_string:{}", all_string);
                    return all_string.ends_with(".atlas");
                }
            } else {
                println!("failed:111{}", entry.path().display());
            }
        }
    }
    return false;
}

#[derive(Debug, Default, serde::Serialize, serde::Deserialize)]
pub struct SplitDetail {
    id: u32,
    atlas: String,
    splited: bool,
    desc: String,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct SplitUpdate {
    id: u32,
    splited: bool,
    desc: String,
}

#[tauri::command]
pub async fn set_split_dir(
    app: tauri::AppHandle,
    window: tauri::Window,
    root: String,
) -> Result<Vec<SplitDetail>, String> {
    let mut splits: Vec<SplitDetail> = Vec::new();
    let mut id: u32 = 0;
    let root_path = PathBuf::from_str(&root).unwrap();
    if root_path.exists() {
        let loop_files = walkdir::WalkDir::new(PathBuf::from_str(&root).unwrap()).into_iter();
        for file in loop_files
            .filter_map(Result::ok)
            .filter(|e| is_atlas_file(e))
        {
            println!("atlas:{:?}", file.path().display());
            let atlas_file: AtlasFile = AtlasFile::new(file.path().to_owned());
            println!("atlaspath:{:?}", atlas_file.get_images());
            let mut split_data = SplitDetail::default();
            id += 1;
            split_data.id = id;
            split_data.atlas = file.path().display().to_string();
            if atlas_file.is_image_exists() {
                split_data.desc = "待裁剪".to_string();
            } else {
                split_data.desc = "缺少对应的图片文件".to_string();
            }

            splits.push(split_data);
        }
    } else {
        return Err("您提供的目录无法找到".to_string());
    }
    println!("splits : {:?}", splits);
    Ok(splits)
}

#[tauri::command]
pub async fn stop_split_files(
    state: State<'_, Arc<Mutex<HashMap<u32, Arc<AtomicBool>>>>>,
    taskid: u32,
) -> Result<(), String> {

    println!("裁剪{}", taskid);

    let map = state.lock().unwrap();
    if map.contains_key(&taskid) {
        println!("包含了这个工作task:{}", taskid);
        let runopt = map.get(&taskid);
        if let Some(running) = runopt {
            running.store(false, Ordering::SeqCst);
        } else {
            return Err("没有找到对应了任务".to_string());
        }
    } else {
        return Err("没有找到对应了任务".to_string());
    }

    Ok(())
}

#[tauri::command]
pub async fn start_split_files(
    window: tauri::Window,
    state: State<'_, Arc<Mutex<HashMap<u32, Arc<AtomicBool>>>>>,
    state_spine: State<'_, Mutex<SpineSetting>>,
    arc_db: State<'_, Arc<Mutex<Database>>>,
    atlas: Vec<SplitDetail>,
    outdir: String,
) -> Result<u32, String> {
    let path: PathBuf = tauri::api::path::home_dir().unwrap();
    let path = path.join("Spine/updates");

    let mut version: Vec<String> = Vec::new();

    let entries = fs::read_dir(path).unwrap();
    for entry in entries {
        if let Ok(v) = entry {
            version.push(v.path().file_name().unwrap().to_string_lossy().to_string());
        }
    }

    for v in version.iter() {
        if v.starts_with("4.") {
            let spine_path: PathBuf = tauri::api::path::home_dir().unwrap();
            let spine_path = spine_path.join("Spine/version.txt");
            if spine_path.exists() {
                set_spine_version(&spine_path, v).unwrap();
            }
            break;
        }
    }

    let ex = state_spine.lock().unwrap();
    let vv: String = ex.exec_root.clone();
    if vv.is_empty() {
        return Err("尚未配置Spine目录".to_string());
    }

    let mut rng = rand::thread_rng(); // 获取随机数生成器
    let num: i32 = rng.gen(); // 生成一个随机 i32 类型的整数
    let mut exec = ex.exec_root.clone();
    exec.push_str("\\Spine");

    let running = Arc::new(AtomicBool::new(true));

    let r = running.clone();
    let id = num as u32;
    println!("start taskid: {}", id);
    println!("splits_files:{:?}", atlas);
    let state_clone = state.inner().clone();
    let total = atlas.len() as i32;
    let db_clone = arc_db.inner().clone();

    thread::spawn(move || {
        let mut computed = 0;
        let mut process = 0;
        for atlas in atlas.iter() {
            println!("atlas : {:?}", atlas);
            if r.load(Ordering::SeqCst) {
                let spliting = atlas.atlas.clone();
                let atlas_path = PathBuf::from_str(&spliting).unwrap();
                let parent_dir = atlas_path.parent().unwrap();

                let dir = parent_dir.display().to_string();

                let target_dir = parent_dir.join(outdir.as_str());
                if target_dir.exists() == false {
                    fs::create_dir(&target_dir).unwrap();
                }
                let out_dir = target_dir.display().to_string();
                println!("outdir: {}", out_dir);
                let cmd_rt = Command::new(exec.as_str())
                    .arg("-i")
                    .arg(&dir)
                    .arg("-o")
                    .arg(&out_dir)
                    .arg("-c")
                    .arg(&spliting)
                    .stdout(Stdio::piped())
                    .spawn()
                    .expect("failed to start process");

                println!("dir:{}", spliting);
                println!("expec:{}", exec);

                let stdout = cmd_rt.stdout.unwrap();
                let reader = BufReader::new(stdout);
                for line in reader.lines().filter_map(Result::ok) {
                    println!("atlas :{:?}", line);

                    if line.starts_with("Complete") {
                        process += 1;
                        window
                            .emit(
                                "split_detail",
                                Some(&SplitUpdate {
                                    id: atlas.id,
                                    splited: true,
                                    desc: line,
                                }),
                            )
                            .unwrap();
                    } else {
                        window
                            .emit(
                                "split_detail",
                                Some(&SplitUpdate {
                                    id: atlas.id,
                                    splited: false,
                                    desc: line,
                                }),
                            )
                            .unwrap();
                    }
                }
                println!("OK");
            }
            computed += 1;
            window
                .emit("progress", Some(computed * 100 / total))
                .unwrap();
        }
 
        let mut map = state_clone.lock().unwrap();
        println!("{},{:?}", id, map);
        if map.contains_key(&id) {
            println!("包含了这个数据");
        }
        map.remove(&id);
        let mut sqlite = db_clone.lock().unwrap();
        sqlite.add_all_data("split".to_string(), process).unwrap();
      
        thread::sleep(Duration::from_millis(100));
        window.emit("split_finish", Some(id)).unwrap();
    });

    let mut map = state.lock().unwrap();
    map.insert(id, running);
    println!("{:?}:{}", map, id);
    Ok(id)
}
