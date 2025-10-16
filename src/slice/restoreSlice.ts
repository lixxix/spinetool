import { RestoreDetail, RestoreUpdate } from "@/components/type";
import { PayloadAction, createSlice } from "@reduxjs/toolkit";

interface RestoreData {
    file_dir: string;
    restore_files: RestoreDetail[];
    taskid: number;
}

const restoreState: RestoreData = {
    taskid: 0,
    file_dir: '',
    restore_files: [],
}

const restoreSlice = createSlice({
    name: "restore",
    initialState: restoreState,
    reducers: {
        set_restore_dir: (state: RestoreData, action: PayloadAction<string>) => {
            state.file_dir = action.payload
        },
        set_restore_files: (state: RestoreData, action: PayloadAction<RestoreDetail[]>) => {
            state.restore_files = action.payload;
        },
        set_restore_taskid: (state: RestoreData, action: PayloadAction<number>) => {
            state.taskid = action.payload;
        },
        update_restore_files: (state: RestoreData, action: PayloadAction<RestoreUpdate>) => {
            let item = state.restore_files.find(obj => obj.id == action.payload.id);
            if (item) {
                item.desc = action.payload.desc;
                // item.splited = action.payload.splited;
            }
        }

    }
});

export default restoreSlice.reducer;

export const { update_restore_files, set_restore_taskid, set_restore_files, set_restore_dir } = restoreSlice.actions;