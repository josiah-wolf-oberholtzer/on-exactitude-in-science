import { createSlice } from '@reduxjs/toolkit';
import {
  COUNTRIES, FORMATS, GENRES, LABELS, ROLES, STYLES, YEARS,
} from '../constants';

const categories = [COUNTRIES, FORMATS, GENRES, LABELS, ROLES, STYLES, YEARS];

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
      categories.forEach((category) => {
        const names = new Set(action.payload[category] || []);
        state[category] = Array.from(names).sort();
      });
    },
  },
});

const { setFiltered } = filteredSlice.actions;

export { setFiltered };

export default filteredSlice.reducer;
