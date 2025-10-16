import { ExportDetail, SpineFile } from "@/components/type";
import { PayloadAction, createSlice } from "@reduxjs/toolkit";

interface ExportData {
    files: SpineFile[];
    spine_dir: string;
    export_dir: string;
    export_relative_dir : string;
    version: string;
    select_type :string;
    export_root_type : string;
    taskid: number;
}

const exportState: ExportData = {
    files: [],
    spine_dir: "",
    export_dir: "",
    version: "",
    select_type: "",
    taskid: 0,
    export_root_type: "绝对路径",
    export_relative_dir: ""
}

const exportSlice = createSlice({
    name: "export",
    initialState: exportState,
    reducers: {
        set_export_spine_dir: (state: ExportData, action: PayloadAction<string>) => {
            console.log("set spine_dir: " + state.spine_dir);
            state.spine_dir = action.payload;
        },
        set_export_files: (state: ExportData, action: PayloadAction<SpineFile[]>) => {
            state.files = action.payload;
        },
        set_export_dir: (state: ExportData, action: PayloadAction<string>) => {
            state.export_dir = action.payload;
        },
        set_export_version: (state: ExportData, action: PayloadAction<string>) => {
            state.version = action.payload;
        },
        set_export_taskid: (state: ExportData, action: PayloadAction<number>) => {
            state.taskid = action.payload;
        },
        set_export_type : (state: ExportData, action: PayloadAction<string>) => {
            state.select_type = action.payload;
        },
        set_export_root_type : (state: ExportData, action: PayloadAction<string>) => {
            state.export_root_type = action.payload;
            console.log("设置了导出的目录", action.payload)
        },
        set_export_relative_dir : (state: ExportData, action: PayloadAction<string>) => {
            state.export_relative_dir = action.payload;
        },
        update_export_files: (state: ExportData, action: PayloadAction<ExportDetail>) => {
            let item = state.files.find(obj => obj.id == action.payload.id);
            if (item) {
                item.desc = action.payload.desc;
                item.ready = action.payload.ready;
            }
        },
        reset_export_files: (state: ExportData) => {
            state.files.map(item => {item.ready = false;item.desc = ''})
        }
    }
})

export default exportSlice.reducer;

export const { set_export_relative_dir, set_export_root_type,set_export_type,reset_export_files,update_export_files, set_export_taskid, set_export_version, set_export_spine_dir, set_export_files, set_export_dir } = exportSlice.actions;