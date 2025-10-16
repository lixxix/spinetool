
use std::{path::Path};
use super::spine_lib::SpineBinary;

pub fn get_spine_version(data_path: &Path) -> String {
    println!("{:?},{:?}",data_path.display(), data_path.extension().unwrap());
    if data_path.extension().unwrap() == "json" {
        let data = std::fs::read_to_string(data_path).unwrap();

        let ret_json: Result<serde_json::Value, serde_json::Error> = serde_json::from_str(&data);
        if let Ok(json) = ret_json {
            if json.is_object() {
                let skel_options = json.get("skeleton");
                if let Some(skel) = skel_options {
                    if skel.is_object() {
                        let version = skel.get("spine").unwrap();
                        if version.is_string() {
                            return String::from(version.as_str().unwrap());
                        }
                    }
                } else {
                    return "".to_string();
                }
            }   
        }
        return "".to_string();
    } else if data_path.extension().unwrap() == "skel" {
        let ret_skel = SpineBinary::from_path(&data_path.to_path_buf());
        if let Some(mut skel_data) = ret_skel {
            
            let ret_version = skel_data.read_version();
            match ret_version {
                Ok(version) => return version.to_string(),
                Err(err) => {
                    return err;
                }
            }
        }
    }

    return "".to_string();
}

pub fn get_atlas_images(data_path: &Path) -> Vec<String> {
    let content = std::fs::read_to_string(data_path).expect("无法读取文件");

    let parent = data_path.parent().unwrap();
    // let lines = content.lines().map(|line| line.to_string()).collect::<Vec<String>>();
    let lines : Vec<String> = content.lines().filter(|line| line.contains(".png")).map(|line| line.to_string()).collect::<Vec<String>>();
    let lines : Vec<String> = lines.into_iter().map(|line| parent.join(line).display().to_string() ).collect::<Vec<String>>();
    return lines;
}
