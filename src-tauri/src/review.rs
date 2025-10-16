use std::{
    path::{Path, PathBuf},
    str::FromStr,
};

use tauri::Runtime;

// mod crate utils;
use crate::comm;

#[derive(Debug, Default, Clone, serde::Deserialize, serde::Serialize)]
pub struct ReviewSpine {
    atlas: String,
    data: String,
    version: String,
}

#[tauri::command]
pub async fn show_view<R: Runtime>(
    _app: tauri::AppHandle<R>,
    _window: tauri::Window<R>,
    version: String,
    filepath: String,
) -> Result<(), String> {
    //   Ok(())
    let path = Path::new(filepath.as_str());
    if path.exists() == false {
        return Err("文件路径不存在".to_string());
    }

    let vv: Vec<u32> = version.as_str()[..3]
        .split(".")
        .map(|s| {
            let paser_result = s.to_string().parse::<u32>();
            if let Ok(result) = paser_result {
                return result;
            } else {
                return 0;
            }
        })
        .collect();

    let ver = format!("{}.{}", vv[0], vv[1]);

    let mut exec = String::from("view");
    exec.push_str(&ver);

    tauri::api::process::Command::new_sidecar(&exec)
        .unwrap()
        .args([filepath.as_str()])
        .spawn()
        .expect(format!("没有找到对应的执行文件{}!", &exec).as_str());

    Ok(())
}

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
// 将root目录下的所有spine文件解析出来
#[tauri::command]
pub async fn loop_review<R: Runtime>(
    app: tauri::AppHandle<R>,
    window: tauri::Window<R>,
    root: String,
) -> Result<Vec<ReviewSpine>, String> {
    let mut files: Vec<ReviewSpine> = Vec::new();

    let path = PathBuf::from_str(&root).unwrap();
    if path.exists() {
        let loopfiles = walkdir::WalkDir::new(&path).into_iter();
        for entry in loopfiles
            .filter_map(Result::ok)
            .filter(|e| is_atlas_file(e))
        {
            let data_paths = comm::search::find_spine_data(entry.path());
            for pp in data_paths.iter() {
                let mut file_data = ReviewSpine::default();
                file_data.atlas = entry.path().display().to_string();
                file_data.data = pp.to_owned().clone();
                // 获取版本号
                if pp.ends_with(".skel") {
                    file_data.version = comm::spine::get_spine_version(Path::new(pp.as_str()));
                }

                if pp.ends_with(".json") {
                    file_data.version = comm::spine::get_spine_version(Path::new(&pp));
                }
                files.push(file_data);
            }
        }
    }

    Ok(files)
}
