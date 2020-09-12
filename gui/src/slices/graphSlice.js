import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { replace } from 'connected-react-router';
import * as graphAPI from '../api/graphAPI';
import { union } from '../utils';

const fetchByEntity = createAsyncThunk(
  'graph/fetchByEntity',
  async (spec, { rejectWithValue }) => {
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
    const { search } = spec.location;
    try {
      const response = await graphAPI.fetchRandomVertex(spec.label);
      const { label, eid } = response.data.result;
      const url = `/${label}/${eid}${search.length > 0 ? search : ''}`;
      dispatch(replace(url));
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
    edgesByRole: {
      'Alias Of': [],
      Includes: [],
      'Member Of': [],
      Released: [],
      'Released On': [],
      'Subsidiary Of': [],
      'Subrelease Of': [],
    },
    edgesByVertex: {},
    error: null,
    loading: false,
    pageCount: 1,
    selected: null,
    vertices: [],
    verticesByCountry: {},
    verticesByFormat: {
      CD: [],
      File: [],
      Vinyl: [],
    },
    verticesByGenre: {},
    verticesByLabel: {
      Artist: [],
      Company: [],
      Master: [],
      Release: [],
      Track: [],
    },
    verticesByStyle: {},
    verticesByYear: {},
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
      // Refactor objByCategory logic into separate functions
      const { center, edges, vertices } = action.payload;
      document.title = `${center.name} | On Exactitude In Science`;
      state.centerRoles = Array.from(union(center.in_roles || [], center.out_roles || [])).sort();
      state.edges = edges;
      state.edgesByRole = {
        'Alias Of': [],
        Includes: [],
        'Member Of': [],
        Released: [],
        'Released On': [],
        'Subsidiary Of': [],
        'Subrelease Of': [],
      };
      state.edgesByVertex = {};
      state.loading = false;
      state.pageCount = Math.ceil((center.pageable_edge_count || 0) / 50) || 1;
      state.selected = {
        kind: "vertex",
        label: center.label,
        eid: center.eid,
        name: center.name,
      };
      state.vertices = vertices;
      state.verticesByCountry = {};
      state.verticesByFormat = {
        CD: [],
        File: [],
        Vinyl: [],
      };
      state.verticesByGenre = {};
      state.verticesByLabel = {
        Artist: [],
        Company: [],
        Master: [],
        Release: [],
        Track: [],
      };
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
