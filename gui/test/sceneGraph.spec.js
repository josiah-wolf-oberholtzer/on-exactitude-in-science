import chai from 'chai';
import dedent from 'dedent';
import pretty from 'pretty';
import { sceneGraph } from '../src';

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
    const graph = sceneGraph(),
      scene = graph.dom().window.document.getElementsByTagName('scene')[0];
    it('will have empty maps', () => {
      expect(graph.nodeMap().size).to.equal(0);
      expect(graph.linkMap().size).to.equal(0);
    });
    it('will have an empty scene', () => {
      expect(pretty(scene.outerHTML)).to.equal(dedent(`
        <scene></scene>
      `));
    });
  });
  describe('After one update', () => {
    const graph = sceneGraph(),
      scene = graph.dom().window.document.getElementsByTagName('scene')[0];
    graph.update([vertices[0], vertices[1]], [edges[0]]);
    it('will have three nodes in its node map', () => {
      const nodes = filterObjects(
        Array.from(graph.nodeMap().values()),
        ['eid', 'id', 'label', 'name', 'type', 'source', 'target', 'role'],
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
          eid: 222,
          id: 2,
          label: 'release',
          name: 'Bar',
          type: 'vertex',
        },
        {
          id: 'aaaaa-aaa-aaa-aaaaaa',
          label: 'credited_with',
          role: 'Artwork By',
          source: 1,
          target: 2,
          type: 'edge',
        },
      ]);
    });
    it('will have two links in its link map', () => {
      expect(Array.from(graph.linkMap().keys())).to.deep.equal(
        [
          '1-aaaaa-aaa-aaa-aaaaaa',
          'aaaaa-aaa-aaa-aaaaaa-2',
        ],
      );
    });
    it('will have a scene with two vertices and one edge', () => {
      expect(pretty(scene.outerHTML)).to.equal(dedent(`
        <scene>
          <vertex id="1"></vertex>
          <vertex id="2"></vertex>
          <edge id="aaaaa-aaa-aaa-aaaaaa"></edge>
        </scene>
      `));
    });
  });
  describe('After two updates', () => {
    const graph = sceneGraph(),
      scene = graph.dom().window.document.getElementsByTagName('scene')[0];
    graph.update([vertices[0], vertices[1]], [edges[0]]);
    graph.update([vertices[1], vertices[2]], [edges[1]]);
    it('will have one old node and one new node', () => {
      const nodes = filterObjects(
        Array.from(graph.nodeMap().values()),
        ['eid', 'id', 'label', 'name', 'type', 'source', 'target', 'role'],
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
          eid: 333,
          id: 3,
          label: 'company',
          name: 'Baz',
          type: 'vertex',
        },
        {
          id: 'bbbbb-bbb-bbb-bbbbbb',
          label: 'released_on',
          source: 2,
          target: 3,
          type: 'edge',
        },
      ]);
    });
    it('will have two new links', () => {
      expect(Array.from(graph.linkMap().keys())).to.deep.equal([
        '2-bbbbb-bbb-bbb-bbbbbb',
        'bbbbb-bbb-bbb-bbbbbb-3',
      ]);
    });
    it('will have a scene with one old vertex, one new vertex, and one new edge', () => {
      expect(pretty(scene.outerHTML)).to.equal(dedent(`
        <scene>
          <vertex id="2"></vertex>
          <vertex id="3"></vertex>
          <edge id="bbbbb-bbb-bbb-bbbbbb"></edge>
        </scene>
      `));
    });
  });
});
