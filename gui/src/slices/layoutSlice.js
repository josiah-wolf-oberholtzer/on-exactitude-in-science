import { createSlice } from '@reduxjs/toolkit';

const layoutSlice = createSlice({
  name: 'layout',
  initialState: {
    sidebar: {
      countriesOpen: false,
      entitiesOpen: false,
      formatsOpen: false,
      genresOpen: false,
      open: false,
      rolesOpen: false,
      stylesOpen: false,
      yearsOpen: false,
    },
  },
  reducers: {
    toggleSidebar(state) {
      state.sidebar.open = !state.sidebar.open;
    },
    toggleSidebarSection(state, action) {
      state.sidebar[`${action.payload}Open`] = !state.sidebar[`${action.payload}Open`];
    },
  },
});

const { toggleSidebar, toggleSidebarSection } = layoutSlice.actions;

export { toggleSidebar, toggleSidebarSection };

export default layoutSlice.reducer;
