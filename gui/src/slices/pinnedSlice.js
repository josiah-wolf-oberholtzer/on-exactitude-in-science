import { createSlice } from '@reduxjs/toolkit';
import { COUNTRIES, FORMATS, GENRES, LABELS, ROLES, STYLES, YEARS } from '../constants';

const categories = [COUNTRIES, FORMATS, GENRES, LABELS, ROLES, STYLES, YEARS];

const pinnedSlice = createSlice({
  name: 'pinned',
  initialState: {
    countries: [],
    formats: [],
    genres: [],
    labels: [],
    roles: [],
    styles: [],
    years: [],
  },
  reducers: {
    setPinned(state, action) {
      categories.forEach(category => {
        const names = new Set(action.payload[category] || []);
        state[category] = Array.from(names).sort();
      });
    }
  },
});

const { setPinned } = pinnedSlice.actions;

export { setPinned };

export default pinnedSlice.reducer;
