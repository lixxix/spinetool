import { PayloadAction, createSlice } from "@reduxjs/toolkit";

interface SpineSliceData {
    current: string;
    mechine : string;
    version: string[];
}

const spineState: SpineSliceData = {
    current: "",
    mechine: "",
    version: []
}

const spineSlice = createSlice({
    name: 'spine',
    initialState: spineState,
    reducers: {
        set_current: (state: SpineSliceData, action: PayloadAction<string>) => {
            state.current = action.payload;
        },
        set_version: (state: SpineSliceData, action: PayloadAction<string[]>) => {
            state.version = action.payload
        },
        set_mechine: (state: SpineSliceData, action: PayloadAction<string>) => {
            state.mechine = action.payload
        }
    }
})

export default spineSlice.reducer;

export const { set_mechine,set_current, set_version } = spineSlice.actions;
