import { replace } from 'connected-react-router';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import * as graphAPI from '../api/graphAPI';

const fetchByEntity = createAsyncThunk(
    'graph/fetchByEntity',
    async (spec, { rejectWithValue }) => {
      try {
        const response = await graphAPI.fetchLocalityByEntity(spec.label, spec.id);
        return response.data.result;
      } catch (err) {
        if (!err.response) {
          throw err;
        }
        return rejectWithValue(err.response.message);
      }
    },
  ),
  fetchRandom = createAsyncThunk(
    'graph/fetchRandom',
    async (spec, { dispatch, rejectWithValue }) => {
      try {
        const response = await graphAPI.fetchRandomVertex(),
          { label, eid } = response.data.result;
        dispatch(replace(`/${label}/${eid}`));
        return response.data.result;
      } catch (err) {
        if (!err.response) {
          throw err;
        }
        return rejectWithValue(err.response.message);
      }
    },
  ),
  graphSlice = createSlice({
    name: 'graph',
    initialState: {
      edges: [],
      vertices: [],
      loading: false,
      error: null,
    },
    reducers: {},
    extraReducers: {
      [fetchByEntity.pending]: (state) => {
        state.loading = true;
      },
      [fetchByEntity.fulfilled]: (state, action) => {
        const { center, edges, vertices } = action.payload;
        state.vertices = vertices;
        state.edges = edges;
        state.loading = false;
        document.title = `${center.name} | On Exactitude In Science`;
      },
      [fetchByEntity.rejected]: (state, action) => {
        state.error = action.error;
        state.loading = false;
      },
      [fetchRandom.pending]: (state) => {
        state.loading = true;
      },
      [fetchRandom.fulfilled]: () => {},
      [fetchRandom.rejected]: (state, action) => {
        state.error = action.error;
        state.loading = false;
      },
    },
  });

export { fetchByEntity, fetchRandom };

export default graphSlice.reducer;