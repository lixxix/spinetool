import { ReviewDetail } from "@/components/type";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface ReviewSpineData {
    root: string;
    review_files: ReviewDetail[];
}

const reviewSpineState: ReviewSpineData = {
    root: "",
    review_files: []
}

const ReviewSpineSlice = createSlice({
    name: "reviewSpine",
    initialState: reviewSpineState,
    reducers: {
        set_review_root(state: ReviewSpineData, action: PayloadAction<string>) {
            state.root = action.payload;
        },
        set_review_files(state: ReviewSpineData, action: PayloadAction<ReviewDetail[]>) {
            state.review_files = action.payload;
        }
    }
})

export default ReviewSpineSlice.reducer;

export const { set_review_root, set_review_files } = ReviewSpineSlice.actions;