// src/features/rooms/roomsSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import API from "./roomsApi";

// fetch all rooms (server should include isOwner flag based on token)
export const fetchRooms = createAsyncThunk(
  "rooms/fetchRooms",
  async (_, thunkAPI) => {
    try {
      const res = await API.get("/rooms"); // GET /api/rooms
      return res.data; // expect array of rooms
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
  }
);

// create a room
export const createRoom = createAsyncThunk(
  "rooms/createRoom",
  async ({ name, password }, thunkAPI) => {
    try {
      const res = await API.post("/rooms", { name, password });
      return res.data; // server returns created room object
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
  }
);

// join a room with password
export const joinRoom = createAsyncThunk(
  "rooms/joinRoom",
  async ({ roomId, password }, thunkAPI) => {
    try {
      const res = await API.post(`/rooms/${roomId}/join`, { password });
      // server likely returns success or membership info
      // after joining, we'll fetch rooms again from UI to refresh flags
      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
  }
);

const roomsSlice = createSlice({
  name: "rooms",
  initialState: {
    list: [], // array of room objects
    status: "idle", // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null,
    creating: false,
  },
  reducers: {
    // local-only reducers if needed later
  },
  extraReducers(builder) {
    builder
      // fetchRooms
      .addCase(fetchRooms.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchRooms.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.list = action.payload; // expect payload is rooms[]
      })
      .addCase(fetchRooms.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || action.error.message;
      })

      // createRoom
      .addCase(createRoom.pending, (state) => {
        state.creating = true;
      })
      .addCase(createRoom.fulfilled, (state, action) => {
        state.creating = false;

        // find existing room if any
        const idx = state.list.findIndex((r) => r._id === action.payload._id);

        if (idx === -1) {
          // not present -> add
          const created = {
            ...action.payload,
            isOwner: !!action.payload.isOwner,
          };
          state.list.unshift(created);
        } else {
          // already present (maybe created locally before socket arrives)
          // preserve existing isOwner if it's true
          const existing = state.list[idx];
          const merged = {
            ...action.payload,
            isOwner: existing.isOwner || !!action.payload.isOwner,
          };
          state.list[idx] = merged;
        }
      })
      .addCase(createRoom.rejected, (state, action) => {
        state.creating = false;
        state.error = action.payload || action.error.message;
      })
      .addCase(joinRoom.fulfilled, (state, action) => {
        const roomId = action.meta.arg.roomId; // extract roomId from dispatched payload
        const joinedRoom = state.list.find((r) => r._id === roomId);
        if (joinedRoom) {
          joinedRoom.isOwner = true;
        }
      });

    // joinRoom handled in component by re-dispatching fetchRooms on success (keeps slice simpler)
  },
});

export default roomsSlice.reducer;

export const selectRooms = (state) => state.rooms.list;

export const selectRoomsStatus = (state) => state.rooms.status;
export const selectRoomsError = (state) => state.rooms.error;
