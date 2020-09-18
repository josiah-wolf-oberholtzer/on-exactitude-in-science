import { createSelector } from '@reduxjs/toolkit';
import { union } from '../utils';

const getCenter = (state) => state.graph.center;

const getEdges = (state) => state.graph.edges;

const getVertices = (state) => state.graph.vertices;

const categorizeObjects = (mapping, objects, labeler) => {
  objects.forEach((object) => {
    const labels = labeler(object);
    labels.forEach(label => {
      if (mapping[label] === undefined) {
        mapping[label] = [object.id];
      } else {
        mapping[label].push(object.id);
      }
    });
  });
  return mapping;
}

export const getEdgesByRole = createSelector(
  [getCenter, getEdges],
  (center, edges) => {
    const mapping = {
      'Alias Of': [],
      'Includes': [],
      'Member Of': [],
      'Released': [],
      'Released On': [],
      'Subsidiary Of': [],
      'Subrelease Of': [],
    };
    if (center) {
      const centerRoles = Array.from(union(center.in_roles || [], center.out_roles || [])).sort();
      centerRoles.forEach((role) => { mapping[role] = [] });
    }
    categorizeObjects(mapping, edges, edge => [edge.role]);
    return mapping;
  },
);

export const getEdgesByVertex = createSelector(
  [getEdges],
  (edges) => {
    const mapping = {};
    categorizeObjects(mapping, edges, edge => [edge.source]);
    categorizeObjects(mapping, edges, edge => [edge.target]);
    return mapping;
  },
);

export const getVerticesByCountry = createSelector(
  [getVertices],
  (vertices) => {
    const labeler = vertex => vertex.country !== undefined ? [vertex.country] : [];
    return categorizeObjects({}, vertices, labeler);
  },
);

export const getVerticesByFormat = createSelector(
  [getVertices],
  (vertices) => {
    const labeler = vertex => vertex.formats || [];
    const mapping = {
      CD: [],
      File: [],
      Vinyl: [],
    };
    return categorizeObjects(mapping, vertices, labeler);
  },
);

export const getVerticesByGenre = createSelector(
  [getVertices],
  (vertices) => {
    const labeler = vertex => vertex.genres || [];
    return categorizeObjects({}, vertices, labeler);
  },
);

export const getVerticesByLabel = createSelector(
  [getVertices],
  (vertices) => {
    const labeler = (vertex) => [vertex.label[0].toUpperCase() + vertex.label.substring(1)];
    const mapping = {
      Artist: [],
      Company: [],
      Master: [],
      Release: [],
      Track: [],
    };
    return categorizeObjects(mapping, vertices, labeler);
  },
);

export const getVerticesByStyle = createSelector(
  [getVertices],
  (vertices) => {
    const labeler = vertex => vertex.styles || [];
    return categorizeObjects({}, vertices, labeler);
  },
);

export const getVerticesByYear = createSelector(
  [getVertices],
  (vertices) => {
    const labeler = vertex => vertex.year !== undefined ? [vertex.year] : [];
    return categorizeObjects({}, vertices, labeler);
  },
);
