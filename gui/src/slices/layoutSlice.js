import { createSlice } from '@reduxjs/toolkit';

const layoutSlice = createSlice({
  name: 'layout',
  initialState: {
    sidebarOpen: false,
  },
  reducers: {
    toggleSidebar(state) {
      state.sidebarOpen = !state.sidebarOpen;
    },
  },
});

const { toggleSidebar } = layoutSlice.actions;

export { toggleSidebar };

export default layoutSlice.reducer;
