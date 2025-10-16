import { AnimationInfo, VPoint } from "@/components/type";
import { PayloadAction, createSlice } from "@reduxjs/toolkit";


interface AnimationData {
    animation: string;
    position: VPoint;
    scale: number;
    info : AnimationInfo,
}

const animationState: AnimationData = {
    animation: "",
    position: { x: 0, y: 0 },
    scale: 1,
    info: {
        name : "",
        version : "",
    }
}

const animationSlice = createSlice({
    name: "animation",
    initialState: animationState,
    reducers: {
        set_animation_name: (state: AnimationData, action: PayloadAction<string>) => {
            state.animation = action.payload;
        },
        set_animation_position: (state: AnimationData, action: PayloadAction<VPoint>) => {
            state.position = action.payload;
        },
        set_animation_scale: (state: AnimationData, action: PayloadAction<number>) => {
            state.scale = action.payload;
        },
        set_animation_version : (state : AnimationData, action : PayloadAction<AnimationInfo>) =>{
            state.info = action.payload;
        }
    }
})

export default animationSlice.reducer;

export const { set_animation_version,set_animation_name, set_animation_position, set_animation_scale } = animationSlice.actions;