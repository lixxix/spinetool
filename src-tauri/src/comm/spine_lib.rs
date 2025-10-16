use std::{
    fs,
    io::{Cursor, Read},
    path::PathBuf,
};
use regex::{Regex};

pub fn compare_versions(v1: &str, v2: &str) -> std::cmp::Ordering {

    let re = Regex::new(r"[.-]").unwrap();
    let parts1:Vec<i32> = re.split(v1).map(|x| match x.parse::<i32>(){
        Ok(num) => num,
        Err(_) => 0,
    } ).collect();
    let parts2: Vec<i32> = v2.split('.').map(|x| match x.parse::<i32>() {
        Ok(num) => num,
        Err(_) => 0,
    }).collect();

    let len_size = if parts1.len() < parts2.len() { parts1.len() } else { parts2.len() };
    for i in 0..len_size {
        if parts1[i] > parts2[i] {
            return std::cmp::Ordering::Greater;
        } else if parts1[i] < parts2[i] {
            return std::cmp::Ordering::Less;
        }
    }
    return std::cmp::Ordering::Equal;
}

pub struct SpineBinary {
    cursor: Cursor<Vec<u8>>,
    pos: u64,
    length : u32,
    one_byte: [u8; 1],
}

impl SpineBinary {
    pub fn new(buf: Vec<u8>) -> SpineBinary {
        let len = buf.len();
        SpineBinary {
            cursor: Cursor::new(buf),
            pos: 0,
            length : len as u32,
            one_byte: [0],
        }
    }

    pub fn from_path(path: &PathBuf) -> Option<SpineBinary> {
        if path.exists() {
            let mut file = fs::File::open(path).unwrap();
            let mut buf = Vec::new();
            file.read_to_end(&mut buf).unwrap();
            return Some(SpineBinary::new(buf));
        }
        None
    }

    fn set_position(&mut self, pos: u64) {
        self.pos = pos;
        self.cursor.set_position(pos);
    }

    pub fn read_version(&mut self) -> Result<String, String> {
        self.set_position(0);
        if self.read_hash() {
            let _size: () = self.cursor.read_exact(&mut self.one_byte).unwrap();
            let mut str_buf = vec![0; (self.one_byte[0] - 1).into()];
            self.cursor.read_exact(&mut str_buf).unwrap();
            if let Ok(result) = String::from_utf8(str_buf.into()) {
                return Ok(result);
            } else {
                return Err("无法正确解析问题".to_string());
            }
        } else {
            return Err("文件可能不是标准的skel文件".to_string());
        }
    }

    pub fn read_hash(&mut self) -> bool {
        self.cursor.set_position(0);
        let mut buf = [0; 1];
        
        self.cursor.read_exact(&mut buf).unwrap();
     
        let position = buf[0] as u64;
        if position >= self.length as u64 {
            return false;
        }

        self.set_position(position);
        self.cursor.read_exact(&mut buf).unwrap();
        if buf[0] == 7 && position < 0x30 { 
            
            self.set_position(position);
        } else {
            self.set_position(8);
            self.cursor.read_exact(&mut buf).unwrap();

            if buf[0] != 7 {
                return false;
            }
            self.set_position(8);
        }
        return true;
    }
}

