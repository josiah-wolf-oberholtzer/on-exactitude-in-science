import { createSlice } from '@reduxjs/toolkit';

const cameraSlice = createSlice({
  name: 'camera',
  initialState: {
    nonce: Date.now(),
  },
  reducers: {
    refocusCamera(state, action) {
      state.nonce = Date.now();
    },
  },
});

export const { refocusCamera } = cameraSlice.actions;

export default cameraSlice.reducer;
