import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { replace } from 'connected-react-router';
import * as graphAPI from '../api/graphAPI';
import { freezeVertex } from '../utils';

const fetchByEntity = createAsyncThunk(
  'graph/fetchByEntity',
  async (spec, { rejectWithValue }) => {
    try {
      const response = await graphAPI.fetchLocalityByEntity(
        spec.label, spec.id, spec.filters,
      );
      if (response.status >= 400) {
        return rejectWithValue(response.data);
      }
      return response.data.result;
    } catch (err) {
      if (!err.response) {
        throw err;
      }
      return rejectWithValue(err.response.message);
    }
  },
);

const fetchRandom = createAsyncThunk(
  'graph/fetchRandom',
  async (spec, { dispatch, rejectWithValue }) => {
    const { search } = spec.location;
    try {
      const response = await graphAPI.fetchRandomVertex(spec.label);
      const { label, eid } = response.data.result;
      const url = `/${label}/${eid}${search.length > 0 ? search : ''}`;
      dispatch(replace(url));
      if (response.status >= 400) {
        return rejectWithValue(response.data);
      }
      return response.data.result;
    } catch (err) {
      if (!err.response) {
        throw err;
      }
      return rejectWithValue(err.response.message);
    }
  },
);

const graphSlice = createSlice({
  name: 'graph',
  initialState: {
    center: null,
    edges: [],
    error: null,
    loading: false,
    selected: null,
    vertices: [],
  },
  reducers: {
    deselectEntity(state) {
      state.selected = null;
    },
    selectEntity(state, action) {
      state.selected = action.payload;
    },
  },
  extraReducers: {
    [fetchByEntity.pending]: (state) => {
      state.loading = true;
    },
    [fetchByEntity.fulfilled]: (state, action) => {
      const { center, edges, vertices } = action.payload;
      document.title = `${center.name} | On Exactitude In Science`;
      state.center = center;
      state.edges = edges;
      state.loading = false;
      state.selected = { kind: 'vertex', vertex: freezeVertex(center) };
      state.vertices = vertices;
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

const { deselectEntity, selectEntity } = graphSlice.actions;

export {
  deselectEntity, fetchByEntity, fetchRandom, selectEntity,
};

export default graphSlice.reducer;
