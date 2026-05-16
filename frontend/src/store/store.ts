import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import gradesReducer from './gradesSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    grades: gradesReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
