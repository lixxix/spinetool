import { PayloadAction, createSlice } from "@reduxjs/toolkit";


interface SubSpineData {
    scale: number;
}

const subSpineState: SubSpineData = {
    scale: 1,
}

const subSpineSlice = createSlice({
    name: 'subSpine',
    initialState: subSpineState,
    reducers: {
        set_spine_scale: (state: SubSpineData, action: PayloadAction<number>) => {
            state.scale = action.payload;
        }
    },
})

export default subSpineSlice.reducer;

export const { set_spine_scale } = subSpineSlice.actions;