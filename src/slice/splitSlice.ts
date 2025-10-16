import { SplitDetail, SplitUpdate } from "@/components/type";
import { PayloadAction, createSlice } from "@reduxjs/toolkit";

interface SplitData {
    dir: string;
    taskid: number;
    split_out_root : string;
    atlas: SplitDetail[];
}

const splitState: SplitData = {
    dir: "",
    atlas: [],
    split_out_root: "",
    taskid: 0,
}

const splitSlice = createSlice({
    name: "split",
    initialState: splitState,
    reducers: {
        set_split_files: (state: SplitData, action: PayloadAction<SplitDetail[]>) => {
            state.atlas = action.payload;
        },
        set_split_dir: (state: SplitData, action: PayloadAction<string>) => {
            state.dir = action.payload;
        },
        set_split_task: (state: SplitData, action: PayloadAction<number>) => {
            state.taskid = action.payload;
        },
        set_split_output: (state: SplitData, action: PayloadAction<string>) => {
            state.split_out_root = action.payload;
        },
        update_split_file : (state: SplitData, action: PayloadAction<SplitUpdate>) => {
            let item = state.atlas.find(obj => obj.id == action.payload.id);
            if (item) {
                item.desc = action.payload.desc;
                item.splited = action.payload.splited;
            }
        },
    }
});

export default splitSlice.reducer;

export const {set_split_output,update_split_file, set_split_task, set_split_files, set_split_dir } = splitSlice.actions;
