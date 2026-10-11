/**
 * Redux store — holds the RTK Query cache. One store for the whole app,
 * provided in src/app/_layout.tsx.
 *
 * Add backend calls as RTK Query endpoints (`baseApi.injectEndpoints`) rather
 * than calling fetch directly.
 */
import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';

import { baseApi } from './base-api';

export const store = configureStore({
  reducer: { [baseApi.reducerPath]: baseApi.reducer },
  middleware: (getDefault) => getDefault().concat(baseApi.middleware),
});

// Enables refetchOnFocus / refetchOnReconnect for queries that opt in.
setupListeners(store.dispatch);

export type AppStore = typeof store;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
