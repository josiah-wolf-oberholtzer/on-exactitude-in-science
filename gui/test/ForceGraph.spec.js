import chai from 'chai';
import { ForceGraph } from '../src/graphics/ForceGraph';

const { expect } = chai,
  vertices = [
    {
      id: 1,
      label: 'artist',
      name: 'Foo',
      eid: 111,
    },
    {
      id: 2,
      label: 'release',
      name: 'Bar',
      eid: 222,
    },
    {
      id: 3,
      label: 'company',
      name: 'Baz',
      eid: 333,
    },
  ],
  edges = [
    {
      id: 'aaaaa-aaa-aaa-aaaaaa',
      label: 'credited_with',
      source: 1,
      target: 2,
      role: 'Artwork By',
    },
    {
      id: 'bbbbb-bbb-bbb-bbbbbb',
      label: 'released_on',
      source: 2,
      target: 3,
    },
  ],
  filterObj = (obj, keys) => keys.reduce((newObj, key) => (
    obj[key] !== undefined ? { ...newObj, [key]: obj[key] } : newObj
  ), {}),
  filterObjects = (objects, keys) => objects.map((obj) => filterObj(obj, keys));

describe('Scene Graph', () => {
  describe('Initially', () => {
    const graph = ForceGraph();

    it('will have empty maps', () => {
      expect(graph.nodeMap().size).to.equal(0);
      expect(graph.linkMap().size).to.equal(0);
    });
  });

  describe('After one update', () => {
    const graph = ForceGraph(),
      eventMap = new Map([
        ['vertexEnter', []],
        ['vertexUpdate', []],
        ['vertexExit', []],
        ['edgeEnter', []],
        ['edgeUpdate', []],
        ['edgeExit', []],
      ]);
    graph.on('vertexEnter', (vertex) => eventMap.get('vertexEnter').push(vertex.id));
    graph.on('vertexUpdate', (vertex) => eventMap.get('vertexUpdate').push(vertex.id));
    graph.on('vertexExit', (vertex) => eventMap.get('vertexExit').push(vertex.id));
    graph.on('edgeEnter', (edge) => eventMap.get('edgeEnter').push(edge.id));
    graph.on('edgeUpdate', (edge) => eventMap.get('edgeUpdate').push(edge.id));
    graph.on('edgeExit', (edge) => eventMap.get('edgeExit').push(edge.id));
    graph.update([vertices[0], vertices[1]], [edges[0]]);

    it('will have these nodes in its node map', () => {
      const nodes = filterObjects(
        Array.from(graph.nodeMap().values()),
        ['eid', 'id', 'label', 'name', 'type', 'role'],
      );
      expect(nodes).to.deep.equal([
        {
          eid: 111,
          id: 1,
          label: 'artist',
          name: 'Foo',
          type: 'vertex',
        },
        {
          eid: 111,
          id: '1-rudder',
          label: 'artist',
          name: 'Foo',
          type: 'rudder',
        },
        {
          eid: 222,
          id: 2,
          label: 'release',
          name: 'Bar',
          type: 'vertex',
        },
        {
          eid: 222,
          id: '2-rudder',
          label: 'release',
          name: 'Bar',
          type: 'rudder',
        },
        {
          id: 'aaaaa-aaa-aaa-aaaaaa',
          label: 'credited_with',
          role: 'Artwork By',
          type: 'edge',
        },
      ]);
    });

    it('will have these links in its link map', () => {
      expect(Array.from(graph.linkMap().keys())).to.deep.equal(
        [
          '1-rudder',
          '2-rudder',
          '1-aaaaa-aaa-aaa-aaaaaa',
          'aaaaa-aaa-aaa-aaaaaa-2',
        ],
      );
    });

    it('will have dispatched mutation events', () => {
      expect(Array.from(eventMap.entries())).to.deep.equal([
        ['vertexEnter', [1, 2]],
        ['vertexUpdate', []],
        ['vertexExit', []],
        ['edgeEnter', ['aaaaa-aaa-aaa-aaaaaa']],
        ['edgeUpdate', []],
        ['edgeExit', []],
      ]);
    });
  });

  describe('After two updates', () => {
    const graph = ForceGraph(),
      eventMap = new Map([
        ['vertexEnter', []],
        ['vertexUpdate', []],
        ['vertexExit', []],
        ['edgeEnter', []],
        ['edgeUpdate', []],
        ['edgeExit', []],
      ]);
    graph.update([vertices[0], vertices[1]], [edges[0]]);
    graph.on('vertexEnter', (vertex) => eventMap.get('vertexEnter').push(vertex.id));
    graph.on('vertexUpdate', (vertex) => eventMap.get('vertexUpdate').push(vertex.id));
    graph.on('vertexExit', (vertex) => eventMap.get('vertexExit').push(vertex.id));
    graph.on('edgeEnter', (edge) => eventMap.get('edgeEnter').push(edge.id));
    graph.on('edgeUpdate', (edge) => eventMap.get('edgeUpdate').push(edge.id));
    graph.on('edgeExit', (edge) => eventMap.get('edgeExit').push(edge.id));
    graph.update([vertices[1], vertices[2]], [edges[1]]);

    it('will have these nodes', () => {
      const nodes = filterObjects(
        Array.from(graph.nodeMap().values()),
        ['eid', 'id', 'label', 'name', 'type', 'role'],
      );
      expect(nodes).to.deep.equal([
        {
          eid: 222,
          id: 2,
          label: 'release',
          name: 'Bar',
          type: 'vertex',
        },
        {
          eid: 222,
          id: '2-rudder',
          label: 'release',
          name: 'Bar',
          type: 'rudder',
        },
        {
          eid: 333,
          id: 3,
          label: 'company',
          name: 'Baz',
          type: 'vertex',
        },
        {
          eid: 333,
          id: '3-rudder',
          label: 'company',
          name: 'Baz',
          type: 'rudder',
        },
        {
          id: 'bbbbb-bbb-bbb-bbbbbb',
          label: 'released_on',
          type: 'edge',
        },
      ]);
    });

    it('will have these links', () => {
      expect(Array.from(graph.linkMap().keys())).to.deep.equal([
        '2-rudder',
        '3-rudder',
        '2-bbbbb-bbb-bbb-bbbbbb',
        'bbbbb-bbb-bbb-bbbbbb-3',
      ]);
    });

    it('will have dispatched mutation events', () => {
      expect(Array.from(eventMap.entries())).to.deep.equal([
        ['vertexEnter', [3]],
        ['vertexUpdate', [2]],
        ['vertexExit', [1]],
        ['edgeEnter', ['bbbbb-bbb-bbb-bbbbbb']],
        ['edgeUpdate', []],
        ['edgeExit', ['aaaaa-aaa-aaa-aaaaaa']],
      ]);
    });
  });

  describe('After tick', () => {
    const graph = ForceGraph(),
      eventMap = new Map([
        ['vertexEnter', []],
        ['vertexUpdate', []],
        ['vertexExit', []],
        ['edgeEnter', []],
        ['edgeUpdate', []],
        ['edgeExit', []],
      ]);
    graph.update(vertices, edges);
    graph.on('vertexEnter', (vertex) => eventMap.get('vertexEnter').push(vertex.id));
    graph.on('vertexUpdate', (vertex) => eventMap.get('vertexUpdate').push(vertex.id));
    graph.on('vertexExit', (vertex) => eventMap.get('vertexExit').push(vertex.id));
    graph.on('edgeEnter', (edge) => eventMap.get('edgeEnter').push(edge.id));
    graph.on('edgeUpdate', (edge) => eventMap.get('edgeUpdate').push(edge.id));
    graph.on('edgeExit', (edge) => eventMap.get('edgeExit').push(edge.id));
    graph.tick();

    it('will have dispatched mutation events', () => {
      expect(Array.from(eventMap.entries())).to.deep.equal([
        ['vertexEnter', []],
        ['vertexUpdate', [1, 2, 3]],
        ['vertexExit', []],
        ['edgeEnter', []],
        ['edgeUpdate', ['aaaaa-aaa-aaa-aaaaaa', 'bbbbb-bbb-bbb-bbbbbb']],
        ['edgeExit', []],
      ]);
    });
  });
});
