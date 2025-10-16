import { SpineSetting } from "@/components/type";
import { PayloadAction, createSlice } from "@reduxjs/toolkit";


export type SetMapExport = { [key: string]: { [key: string]: string } };

interface SettingData {
    exec_root: string;
    temp_root: string;
    export_types: string[];
    export_setting: SetMapExport;
}

const settingState: SettingData = {
    exec_root: "",
    temp_root: "",
    export_types: [],
    export_setting: {},
}

const settingSlice = createSlice({
    name: "setting",
    initialState: settingState,
    reducers: {
        set_export_setting: (state: SettingData, action: PayloadAction<SetMapExport>) => {
            state.export_setting = action.payload;
        },
        set_spine_root: (state: SettingData, action: PayloadAction<string>) => {
            state.exec_root = action.payload;
        },
        set_setting:(state: SettingData, action: PayloadAction<SpineSetting>) => { 
            state.temp_root = action.payload.temp_root;
            state.exec_root = action.payload.exec_root;
        },
        set_export_types: (state: SettingData, action: PayloadAction<string[]>) => {
            state.export_types = action.payload;
        }
    }
})


export default settingSlice.reducer;

export const { set_setting,set_export_types, set_export_setting, set_spine_root } = settingSlice.actions;