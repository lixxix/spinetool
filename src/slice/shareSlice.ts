import { PayloadAction, createSlice } from "@reduxjs/toolkit";

interface ShareSliceData {
    url: string;
    down_url: string;
    scale: number;
    name: string;
    y_delta: number;
}

const shareState: ShareSliceData = {
    url: "",
    down_url: "",
    scale: 1,
    name: "展示",
    y_delta: 0,
}

const shareSlice = createSlice({
    name: "share",
    initialState: shareState,
    reducers: {
        set_share: (state, action: PayloadAction<ShareSliceData>) => {
            // state.share = action.payload
            state.url = action.payload.url
            state.scale = action.payload.scale
            state.down_url = action.payload.down_url
            state.name = action.payload.name;
            state.y_delta = action.payload.y_delta;
        }
    }
})

export default shareSlice.reducer;

export const { set_share } = shareSlice.actions;