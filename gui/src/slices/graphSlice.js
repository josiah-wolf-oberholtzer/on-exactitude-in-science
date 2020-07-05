import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import * as graphAPI from '../api/graphAPI';

export const fetchByEntity = createAsyncThunk(
  'graph/fetchByEntity',
  async (spec, { getState, rejectWithValue, requestId }) => {
    console.log("PAYLOAD");
    const { currentRequestId, loading } = getState().graph;
    if (loading !== true || requestId !== currentRequestId) {
      return;
    }
    try {
      const response = await graphAPI.fetchGraphByEntity(spec.label, spec.id);
      return response.data.result;
    } catch (err) {
      if (!error.response) {
        throw err;
      }
      return rejectWithValue(error.response.message);
    }
  },
);

const graphSlice = createSlice({
  name: 'graph',
  initialState: {
    edges: [],
    vertices: [],
    loading: false,
    currentRequestId: undefined,
    error: null,
  },
  reducers: {},
  extraReducers: {
    [fetchByEntity.pending]: (state, action) => {
      console.log("PENDING", state, action);
      if (state.loading === 'idle') {
        state.loading = true;
        state.currentRequestId = action.meta.requestId;
      }
    },
    [fetchByEntity.fulfilled]: (state, action) => {
      console.log("FULFILLED", state, action);
      const { requestId } = action.meta;
      if (state.loading === true && state.currentRequestId === requestId) {
        state.currentRequestId = undefined;
        state.vertices = [action.payload.vertices];
        state.edges = [action.payload.edges];
        state.loading = false;
      }
    },
    [fetchByEntity.rejected]: (state, action) => {
      console.log("REJECTED", state, action);
      const { requestId } = action.meta;
      if (state.loading === 'pending' && state.currentRequestId === requestId) {
        state.currentRequestId = undefined;
        state.error = action.error;
        state.loading = false;
      }
    },
  },
});

export default graphSlice.reducer;
