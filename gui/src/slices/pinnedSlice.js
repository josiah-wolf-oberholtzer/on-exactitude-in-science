import { createSlice } from '@reduxjs/toolkit';

const pinnedSlice = createSlice({
  name: "pinned",
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
    pin(state, action) {
      const { category, name } = action.payload;
      const names = state[category];
      if (names !== undefined) {
        const index = names.indexOf(name);
        if (index === -1) {
          names.push(name);
        }
      } else {
        throw `Bad category ${category}`
      }
    },
    unpin(state, action) {
      const { category, name } = action.payload;
      const names = state[category];
      if (names !== undefined) {
        const index = names.indexOf(name);
        if (index !== -1) {
          names.splice(index, 1);
        }
      } else {
        throw `Bad category ${category}`
      }
    },
  },
});

const { pin, unpin } = pinnedSlice.actions;

export { pin, unpin };

export default pinnedSlice.reducer;
