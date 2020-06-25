import chai from 'chai';
import data from '../src/data';
import transform from '../src/transform';

const { expect } = chai;

describe('API Data Transforms', () => {
  describe('#transform()', () => {
    const { nodeMap, linkMap } = transform(data.result.vertices, data.result.edges);
    it('should return two maps', () => {
      expect(nodeMap).to.be.an.instanceof(Map);
      expect(linkMap).to.be.an.instanceof(Map);
    });
    it('with these sizes', () => {
      expect(nodeMap.size).to.equal(49);
      expect(linkMap.size).to.equal(48);
    });
  });
});
