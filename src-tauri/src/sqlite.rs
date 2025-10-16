use chrono::{Datelike, Duration, Local, NaiveDate, TimeZone};
use rusqlite::{params, Connection, Result};
use serde::{Deserialize, Serialize};
use std::{
    path::Path,
    sync::{Arc, Mutex},
};
use tauri::{api, State};
extern crate chrono;

#[derive(Debug, Default)]
pub struct Database {
    conn: Option<Connection>,
    all_data: Option<AllSpineData>,
    today_data: Option<TodayData>,
}

#[derive(Debug, Clone, Default, Deserialize, Serialize)]
pub struct AllSpineData {
    last_seen: String,
    export: i64,
    split: i64,
    restore: i64,
}

// 单项数据，
#[derive(Debug, Default, Clone, Deserialize, Serialize)]
pub struct TodayData {
    export: i64,
    split: i64,
    restore: i64,
}

// 1. 保存总的操作数据 , all_data
// 2. 读取和保存上次登录的时间
// 3. 当日的数据情况
impl Database {
    pub fn create_table(&mut self) -> Result<()> {
        if let Some(con) = self.conn.as_mut() {
            con.execute(
                "CREATE TABLE IF NOT EXISTS all_spine_data (
                    id INTEGER PRIMARY KEY,
                    last_seen DATETIME NOT NULL,
                    export INTERGE NOT NULL DEFAULT 0 ,
                    split INTERGE NOT NULL DEFAULT 0 , 
                    restore INTERGE NOT NULL DEFAULT 0   
                );",
                [],
            )?;

            con.execute(
                "CREATE TABLE IF NOT EXISTS single_data (
                    id  INTEGER PRIMARY KEY,
                    date DATETIME,
                    types  STRING(32)  NOT NULL,
                    count INTEGER NOT NULL DEFAULT 0,
                    created_at DATETIME NOT NULL
                );",
                [],
            )?;

            return Ok(());
        }

        Ok(())
    }

    pub fn get_today_data(&mut self) -> Result<TodayData> {
        if let Some(conn) = self.conn.as_mut() {
            if let Some(today) = self.today_data.as_mut() {
                return Ok(today.clone());
            }

            // 获取当前本地时间
            let now = Local::now();

            // 获取今天的日期
            let today = now.date_naive();

            // 创建今天凌晨的DateTime对象
            let midnight_today = Local
                .from_local_datetime(
                    &NaiveDate::from_ymd_opt(today.year(), today.month(), today.day())
                        .unwrap()
                        .and_hms_opt(0, 0, 0)
                        .unwrap(),
                )
                .unwrap();

            // 创建明天凌晨的DateTime对象，通过给今天凌晨加上一天的时长来实现
            let midnight_tomorrow = midnight_today + Duration::days(1);
            println!("{}", midnight_tomorrow.to_string());

            // let today_midnight = "datetime('now', 'start of day')";
            // let tomorrow_midnight = "datetime('now', 'start of day', '+1 day')";

            let query_string = format!("SELECT SUM(count), types from single_data where created_at between '{}' and '{}' group by types;", midnight_today.to_string(), midnight_tomorrow.to_string());
            println!("query_string: {}", query_string);
            let mut stmt = conn.prepare(&query_string).unwrap();

            let mut rows = stmt.query([]).unwrap();
            #[derive(Debug)]
            struct TempData {
                count: i64,
                types: String,
            }
            let mut vec_data = Vec::<TempData>::new();

            while let Some(row) = rows.next()? {
                vec_data.push(TempData {
                    count: row.get(0)?,
                    types: row.get(1)?,
                });
            }

            println!("{:?}", vec_data);
            let mut rt_data = TodayData {
                export: 0,
                split: 0,
                restore: 0,
            };

            for row_data in vec_data.iter() {
                if row_data.types == "export" {
                    rt_data.export = row_data.count;
                } else if row_data.types == "split" {
                    rt_data.split = row_data.count;
                } else if row_data.types == "restore" {
                    rt_data.restore = row_data.count;
                } else {
                    println!("no use : {}", row_data.types);
                }
            }
            self.today_data = Some(rt_data.clone());
            return Ok(rt_data);
        }

        return Ok(TodayData {
            export: 0,
            split: 0,
            restore: 0,
        });
    }

    pub fn get_all_data(&mut self) -> Result<Option<AllSpineData>> {
        if let Some(data) = self.all_data.as_ref() {
            return Ok(Some(data.clone()));
        }

        if let Some(conn) = self.conn.as_mut() {
            let mut stmt = conn
                .prepare("SELECT last_seen, export,split,restore FROM all_spine_data;")
                .unwrap();

            let mut rows = stmt.query([]).unwrap();

            if let Some(row) = rows.next()? {
                // let rt_data = Some(AllSpineData {
                //     last_seen: row.get(0)?,
                //     export: row.get(1)?,
                //     split: row.get(2)?,
                //     restore: row.get(3)?,
                // });
                let rt_data = Some(AllSpineData {
                    last_seen: row.get(0)?,
                    export: row.get(1)?,
                    split: row.get(2)?,
                    restore: row.get(3)?,
                });
                self.all_data = rt_data.clone();
                // let now_time = chrono::Local::now().to_string().to_string();
                conn.execute(
                    "UPDATE all_spine_data set last_seen = datetime('now');",
                    // &[&now_time as &dyn rusqlite::ToSql],
                    [],
                )
                .unwrap();

                return Ok(rt_data);
            } else {
                // let now_time = chrono::Local::now().to_string().to_string();
                conn.execute(
                    "INSERT INTO all_spine_data(id, last_seen, export, split, restore)
                    values (1,datetime('now'),?1,?2,?3);
                ",
                    &[&0, &0, &0],
                )
                .unwrap();

                self.all_data = Some(AllSpineData {
                    last_seen: "初次见面，欢迎光临！".to_string(),
                    export: 0,
                    split: 0,
                    restore: 0,
                });
                return Ok(Some(AllSpineData {
                    last_seen: "初次见面，欢迎光临！".to_string(),
                    export: 0,
                    split: 0,
                    restore: 0,
                }));
            }
        }
        Ok(None)
    }

    pub fn add_all_data(&mut self, types: String, count: u32) -> Result<()> {
        if let Some(conn) = self.conn.as_mut() {
            if let Some(all_data) = self.all_data.as_mut() {
                if let Some(today) = self.today_data.as_mut() {
                    let now_local = chrono::Local::now().to_string();
                    println!("{}, {}", now_local, count);
                    conn.execute("INSERT INTO single_data(date, types, count, created_at) values(?1,?2,?3,?4);", params![&now_local,&types,count,&now_local]).unwrap();
                    if types == "export" {
                        conn.execute(
                            "UPDATE all_spine_data set export = export + ?1 where id = 1;",
                            params![&count],
                        )
                        .unwrap();
                        all_data.export = all_data.export + count as i64;
                        today.export = today.export + count as i64;
                    } else if types == "restore" {
                        conn.execute(
                            "UPDATE all_spine_data set restore = restore + ?1 where id = 1;",
                            params![&count],
                        )
                        .unwrap();
                        all_data.restore = all_data.restore + count as i64;
                        today.restore = today.restore + count as i64;
                    } else if types == "split" {
                        conn.execute(
                            "UPDATE all_spine_data set split = split + ?1 where id = 1;",
                            params![&count],
                        )
                        .unwrap();
                        all_data.split = all_data.split + count as i64;
                        today.split = today.split + count as i64;
                    } else {
                        println!("传递参数有问题。");
                    }
                }
            }
        }
        Ok(())
    }

    pub fn insert_log(&mut self, mechine: String) -> Result<()> {
        if let Some(conn) = self.conn.as_mut() {
            let now_local = chrono::Local::now();
            println!("now: {}", now_local.to_rfc3339());
            conn.execute(
                "INSERT INTO mechine(mechine_id,created_at) values (?1,?2)",
                params![&mechine, now_local.to_string()],
            )
            .unwrap();
        }
        Ok(())
    }

    pub fn init_database(&mut self, file_path: &Path) -> Result<()> {
        let cn = Connection::open(file_path);
        if let Ok(conn) = cn {
            self.conn = Some(conn);
        }
        Ok(())
    }
}

#[tauri::command]
pub async fn init_database(
    app: tauri::AppHandle,
    _window: tauri::Window,
    state: State<'_, Arc<Mutex<Database>>>,
    dbname: String,
) -> Result<(), String> {
    println!("init database");
    let mut db = state.lock().unwrap();
    let app_config_dir = api::path::app_config_dir(&app.config()).unwrap();

    let path = app_config_dir.join(dbname);
    match db.init_database(path.as_path()) {
        Ok(()) => println!("OK"),
        Err(err) => println!("{}", err),
    }

    db.create_table().unwrap();

    Ok(())
}

#[tauri::command]
pub async fn insert_log(
    state: State<'_, Arc<Mutex<Database>>>,
    mechine: String,
) -> Result<(), String> {
    println!("insert log");
    let mut db = state.lock().unwrap();

    db.insert_log(mechine).unwrap();

    Ok(())
}

#[tauri::command]
pub async fn get_store_alldata(
    state: State<'_, Arc<Mutex<Database>>>,
) -> Result<AllSpineData, String> {
    let mut db = state.lock().unwrap();

    let result = db.get_all_data().unwrap();
    if let Some(data) = result {
        println!("all data :{:?}", data);
        return Ok(data);
    }
    Err("没有数据".to_string())
}

#[tauri::command]
pub async fn add_export_info(
    state: State<'_, Arc<Mutex<Database>>>,
    types: String,
    count: u32,
) -> Result<(), String> {
    let mut db = state.lock().unwrap();
    println!("export data :{:?}", types);
    db.add_all_data(types, count).unwrap();
    Ok(())
}

#[tauri::command]
pub async fn get_today_data(state: State<'_, Arc<Mutex<Database>>>) -> Result<TodayData, String> {
    let mut db = state.lock().unwrap();

    let v = db.get_today_data().unwrap();

    Ok(v)
}
