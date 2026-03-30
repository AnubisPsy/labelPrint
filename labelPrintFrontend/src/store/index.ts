import { configureStore } from '@reduxjs/toolkit';
import searchReducer from './slices/searchSlice';
import printerReducer from './slices/printerSlice';

export const store = configureStore({
  reducer: {
    search: searchReducer,
    printers: printerReducer,
  },
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
