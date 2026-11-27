import { configureStore } from "@reduxjs/toolkit";
import questionsReducer from "./questionsSlice";

export function makeStore() {
  return configureStore({
    reducer: {
      questions: questionsReducer,
    },
  });
}

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
