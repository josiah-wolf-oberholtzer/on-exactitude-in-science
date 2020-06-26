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
  ];

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
      expect(Array.from(graph.nodeMap().entries())).to.deep.equal([
        [
          1,
          {
            eid: 111,
            id: 1,
            label: 'artist',
            name: 'Foo',
            type: 'vertex',
          },
        ],
        [
          2,
          {
            eid: 222,
            id: 2,
            label: 'release',
            name: 'Bar',
            type: 'vertex',
          },
        ],
        [
          'aaaaa-aaa-aaa-aaaaaa',
          {
            id: 'aaaaa-aaa-aaa-aaaaaa',
            label: 'credited_with',
            role: 'Artwork By',
            source: 1,
            target: 2,
            type: 'edge',
          },
        ],
      ]);
    });
    it('will have two links in its link map', () => {
      expect(Array.from(graph.linkMap().entries())).to.deep.equal(
        [
          [
            '1-aaaaa-aaa-aaa-aaaaaa',
            {
              id: '1-aaaaa-aaa-aaa-aaaaaa',
              source: 1,
              target: 'aaaaa-aaa-aaa-aaaaaa',
            },
          ],
          [
            'aaaaa-aaa-aaa-aaaaaa-2',
            {
              id: 'aaaaa-aaa-aaa-aaaaaa-2',
              source: 'aaaaa-aaa-aaa-aaaaaa',
              target: 2,
            },
          ],
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
      expect(Array.from(graph.nodeMap().entries())).to.deep.equal([
        [
          2,
          {
            eid: 222,
            id: 2,
            label: 'release',
            name: 'Bar',
            type: 'vertex',
          },
        ],
        [
          3,
          {
            eid: 333,
            id: 3,
            label: 'company',
            name: 'Baz',
            type: 'vertex',
          },
        ],
        [
          'bbbbb-bbb-bbb-bbbbbb',
          {
            id: 'bbbbb-bbb-bbb-bbbbbb',
            label: 'released_on',
            source: 2,
            target: 3,
            type: 'edge',
          },
        ],
      ]);
    });
    it('will have two new links', () => {
      expect(Array.from(graph.linkMap().entries())).to.deep.equal([
        [
          '2-bbbbb-bbb-bbb-bbbbbb',
          {
            id: '2-bbbbb-bbb-bbb-bbbbbb',
            source: 2,
            target: 'bbbbb-bbb-bbb-bbbbbb',
          },
        ],
        [
          'bbbbb-bbb-bbb-bbbbbb-3',
          {
            id: 'bbbbb-bbb-bbb-bbbbbb-3',
            source: 'bbbbb-bbb-bbb-bbbbbb',
            target: 3,
          },
        ],
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
