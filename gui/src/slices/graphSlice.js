import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { replace } from 'connected-react-router';
import * as graphAPI from '../api/graphAPI';
import { union } from '../utils';

const fetchByEntity = createAsyncThunk(
  'graph/fetchByEntity',
  async (spec, { rejectWithValue }) => {
    console.log('fetch', spec);
    try {
      const response = await graphAPI.fetchLocalityByEntity(
        spec.label, spec.id, spec.filters,
      );
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
    try {
      const response = await graphAPI.fetchRandomVertex(spec.label);
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
);

const graphSlice = createSlice({
  name: 'graph',
  initialState: {
    centerRoles: [],
    edges: [],
    edgesByRole: {},
    edgesByVertex: {},
    error: null,
    loading: false,
    selected: {
      eid: null,
      label: null,
      name: null,
    },
    vertices: [],
    verticesByCountry: {},
    verticesByFormat: {},
    verticesByGenre: {},
    verticesByLabel: {},
    verticesByStyle: {},
    verticesByYear: {},
  },
  reducers: {
    deselectEntity(state) {
      state.selected.eid = null;
      state.selected.label = null;
      state.selected.name = null;
    },
    selectEntity(state, action) {
      state.selected.eid = action.payload.eid;
      state.selected.label = action.payload.label;
      state.selected.name = action.payload.name;
    },
  },
  extraReducers: {
    [fetchByEntity.pending]: (state) => {
      state.loading = true;
    },
    [fetchByEntity.fulfilled]: (state, action) => {
      // Refactor objByCategory logic into separate functions
      const { center, edges, vertices } = action.payload;
      document.title = `${center.name} | On Exactitude In Science`;
      state.centerRoles = Array.from(union(center.in_roles || [], center.out_roles || [])).sort();
      state.edges = edges;
      state.loading = false;
      state.vertices = vertices;
      state.edgesByRole = {};
      state.edgesByVertex = {};
      state.verticesByCountry = {};
      state.verticesByFormat = {};
      state.verticesByGenre = {};
      state.verticesByLabel = {};
      state.verticesByStyle = {};
      state.verticesByYear = {};
      state.centerRoles.forEach((role) => {
        state.edgesByRole[role] = [];
      });
      vertices.forEach((vertex) => {
        const items = [
          [state.verticesByLabel, [vertex.label[0].toUpperCase() + vertex.label.substring(1)]],
        ];
        if (vertex.label === 'release' || vertex.label === 'track') {
          items.push(
            [state.verticesByCountry, vertex.country !== undefined ? [vertex.country] : []],
            [state.verticesByFormat, vertex.formats || []],
            [state.verticesByGenre, vertex.genres || []],
            [state.verticesByStyle, vertex.styles || []],
            [state.verticesByYear, vertex.year !== undefined ? [vertex.year] : []],
          );
        }
        items.forEach((item) => {
          const [map, labels] = item;
          labels.forEach((label) => {
            if (map[label] === undefined) {
              map[label] = [vertex.id];
            } else {
              map[label].push(vertex.id);
            }
          });
        });
      });
      edges.forEach((edge) => {
        const items = [
          [state.edgesByVertex, edge.source],
          [state.edgesByVertex, edge.target],
          [state.edgesByRole, edge.role],
        ];
        items.forEach((item) => {
          const [map, label] = item;
          if (map[label] === undefined) {
            map[label] = [edge.id];
          } else {
            map[label].push(edge.id);
          }
        });
      });
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
