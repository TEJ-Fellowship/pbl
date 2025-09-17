//app/store.js
import { configureStore } from "@reduxjs/toolkit";
import roomsReducer from "../features/rooms/roomsSlice";
export const store = configureStore({
  reducer: {
    rooms: roomsReducer,
  },
});
export default store;
