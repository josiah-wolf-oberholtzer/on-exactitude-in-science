import { replace } from 'connected-react-router'
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import * as graphAPI from '../api/graphAPI';

export const fetchByEntity = createAsyncThunk(
  'graph/fetchByEntity',
  async (spec, { getState, rejectWithValue, requestId }) => {
    try {
      const response = await graphAPI.fetchGraphByEntity(spec.label, spec.id);
      return response.data.result;
    } catch (err) {
      if (!err.response) {
        throw err;
      }
      return rejectWithValue(err.response.message);
    }
  },
);

export const fetchRandom = createAsyncThunk(
  'graph/fetchRandom',
  async (spec, { dispatch, getState, rejectWithValue, requestId }) => {
    try {
      const response = await graphAPI.fetchRandomVertex();
      console.log("fetchRandom.payload", response);
      const { label, eid } = response.data.result;
      dispatch(replace(`/${label}/${eid}`));
      return response.data.result;
    } catch (err) {
      if (!err.response) {
        throw err;
      }
      return rejectWithValue(err.response.message);
    }
  },
)

const graphSlice = createSlice({
  name: 'graph',
  initialState: {
    edges: [],
    vertices: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: {
    [fetchByEntity.pending]: (state, action) => {
      state.loading = true;
    },
    [fetchByEntity.fulfilled]: (state, action) => {
      const { center, edges, vertices } = action.payload;
      state.vertices = vertices;
      state.edges = edges;
      state.loading = false;
      document.title = `${center.name} | On Exactitude In Science`
    },
    [fetchByEntity.rejected]: (state, action) => {
      state.error = action.error;
      state.loading = false;
    },
    [fetchRandom.pending]: (state, action) => {
      state.loading = true;
    },
    [fetchRandom.fulfilled]: (state, action) => {},
    [fetchRandom.rejected]: (state, action) => {
      state.error = action.error;
      state.loading = false;
    }
  },
});

export default graphSlice.reducer;
