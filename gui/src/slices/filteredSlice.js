import { createSlice } from '@reduxjs/toolkit';
import { CATEGORIES } from '../constants';

const filteredSlice = createSlice({
  name: 'filtered',
  initialState: {
    limit: 250,
    showSecondaryReleases: false,
    countries: [],
    formats: [],
    genres: [],
    labels: [],
    roles: [],
    styles: [],
    years: [],
  },
  reducers: {
    setFiltered(state, action) {
      CATEGORIES.forEach((category) => {
        const names = new Set(action.payload[category] || []);
        state[category] = Array.from(names).sort();
      });
      // Use constants
      state.limit = parseInt(action.payload.limit) || 250;
      if (state.limit < 0) {
        state.limit = 0;
      }
      if (state.limit > 500) {
        state.limit = 500;
      }
      state.showSecondaryReleases = action.payload.secondary === "true";
    },
  },
});

const { setFiltered } = filteredSlice.actions;

export { setFiltered };

export default filteredSlice.reducer;
