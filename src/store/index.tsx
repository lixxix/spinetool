import animationSlice from '@/slice/animationSlice';
import exportSlice from '@/slice/exportSlice';
import restoreSlice from '@/slice/restoreSlice';
import reviewSlice from '@/slice/reviewSlice';
import settingSlice from '@/slice/settingSlice';
import spineSlice from '@/slice/spineSlice';
import splitSlice from '@/slice/splitSlice';
import storeSlice from '@/slice/storeSlice';
import subspineSlice from '@/slice/subSpineSlice';
import { configureStore } from '@reduxjs/toolkit';

export const store = configureStore({
  reducer: {
    spine: spineSlice,
    export: exportSlice,
    setting: settingSlice,
    restore: restoreSlice,
    split: splitSlice,
    animation: animationSlice,
    store: storeSlice,
    subspine: subspineSlice,
    review : reviewSlice, 
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;