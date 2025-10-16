use std::path::{self, Path};


pub fn find_spine_data(path_atlas: &Path) -> Vec<String> {
    let mut paths: Vec<String> = vec![];

    if path_atlas.exists() {
        let parent_dir = path_atlas.parent().unwrap();
        let file_name = path_atlas.file_name().unwrap();
        let base_name = file_name.to_str().unwrap().split(".").next().unwrap();
        
        let skel_path = parent_dir.join(format!("{}.skel", base_name));
        if skel_path.exists() {
            paths.push(skel_path.to_str().unwrap().to_string());
        }

        let json_path = parent_dir.join(format!("{}.json", base_name));
        if json_path.exists() {
            paths.push(json_path.to_str().unwrap().to_string());
        }
        
    }
    paths
}
