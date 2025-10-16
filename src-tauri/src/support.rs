// 用于支持类型
use std::{fs, io::{BufRead, BufReader}, path::PathBuf};

#[derive(Debug)]
pub struct AtlasFile {
    file_path: PathBuf,
    exists: bool,
    images: Vec<PathBuf>,
}

impl AtlasFile {
    pub fn new(root: PathBuf) -> AtlasFile {
        let mut file = AtlasFile {
            file_path: root,
            exists: false,
            images: Vec::new(),
        };
        file.init();
        file
    }

    fn init(&mut self) {
        self.exists = self.file_path.exists();
        if self.exists {
            let file = fs::File::open(&self.file_path).unwrap();

            let reader = BufReader::new(file);
            let parent = self.file_path.parent().unwrap();
            for line in reader.lines().filter_map(Result::ok) {
                let line = line.trim();
                if line.ends_with(".png") {
                    self.images.push(parent.join(line.trim()));        
                }
            }
        }
    }
    
    pub fn is_image_exists(&self) -> bool {
        let rt =  if self.images.len() == 0 {
            false
        } else {
            for image in self.images.iter() {
                if !image.exists() {
                    return false;
                }
            }
            true
        };
        rt
    }

    pub fn get_images(&self) -> Vec<PathBuf> {
        self.images.clone()
    }
}
