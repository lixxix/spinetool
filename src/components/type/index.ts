export interface SpineFile {
  id: number;
  file_name: string;
  file_path: string;
  ready: boolean;
  desc: string;
}

export interface ExportDetail {
  id: number;
  ready: boolean;
  desc: string;
}

export interface SpineSetting {
  exec_root: string;
  temp_root: string;
}

export interface RestoreDetail {
  id: number;
  atlas: string;
  data: string;
  scale: string;
  version: string;
  can_restore: boolean;
//   previewed: boolean;
  tidy_dir : boolean;
  desc: string;
}

export interface ReviewDetail {
  atlas: string;
  data: string;
  version: string;
}

export interface RestoreUpdate {
  id: number;
  ready: boolean;
  desc: string;
}

export interface RestoreScaleUpdate {
  id: number;
  scale: string;
}

export interface SplitDetail {
  id: number;
  atlas: string;
  splited: boolean;
  desc: string;
}

export interface SplitUpdate {
  id: number;
  splited: boolean;
  desc: string;
}

export interface VPoint {
  x: number;
  y: number;
}

export interface VSize {
  width: number;
  height: number;
}

export interface TodayData {
  export: number;
  split: number;
  restore: number;
}

export interface AllData {
  last_seen: string;
  export: number;
  split: number;
  restore: number;
}

export interface AnimationInfo {
  name: string;
  version: string;
}
