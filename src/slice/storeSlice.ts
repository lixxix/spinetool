import { AllData, TodayData } from "@/components/type";
import { PayloadAction, createSlice } from "@reduxjs/toolkit";

interface StoreData {
    today: TodayData;
    all: AllData;
}

const storeData: StoreData = {

    today: { export: 0, split: 0, restore: 0 },
    all: { export: 0, split: 0, restore: 0, last_seen: "" },
}

const storeSlice = createSlice({
    name: 'store',
    initialState: storeData,
    reducers: {
      
        set_store_today: (state: StoreData, action: PayloadAction<TodayData>) => {
            state.today = action.payload;
        },
        set_store_all: (state: StoreData, action: PayloadAction<AllData>) => {
            state.all = action.payload;
        }
    }
})

export default storeSlice.reducer;

export const {  set_store_today, set_store_all } = storeSlice.actions;