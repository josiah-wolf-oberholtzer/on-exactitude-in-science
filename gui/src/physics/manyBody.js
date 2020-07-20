import { GPU } from 'gpu.js';

const manyBody = () => {
  const gpu = new GPU(),
    constant = (x) => () => x;

  let nodes = [],
    nDim = 2,
    positions = [],
    strength = constant(-30),
    strengths,
    kernel;

  function kernel3d(positionsArray, strengthsArray) {
    let vx = 0.0,
      vy = 0.0,
      vz = 0.0;
    for (let i = 0; i < this.constants.size; i++) {
      const dx = positionsArray[i][0] - positionsArray[this.thread.x][0],
        dy = positionsArray[i][1] - positionsArray[this.thread.x][1],
        dz = positionsArray[i][2] - positionsArray[this.thread.x][2],
        l = dx * dx + dy * dy + dz * dz,
        w = (strengthsArray[i] * this.constants.alpha) / l;
      if (i != this.thread.x) {
        vx += dx * w;
        vy += dy * w;
        vz += dz * w;
      }
    }
    return [vx, vy, vz];
  }

  function collectPositions() {
    const n = nodes.length;
    for (let i = 0; i < n; i++) {
      positions[nodes[i].index][0] = nodes[i].x;
      if (nDim > 1) { positions[nodes[i].index][1] = nodes[i].y }
      if (nDim > 2) { positions[nodes[i].index][2] = nodes[i].z }
    }
    return positions;
  }

  function force(_) {
    if (!nodes.length) { return; }
    const n = nodes.length,
      positions = collectPositions(),
      velocities = (
        kernel.setConstants({alpha: _, size: n}),
        kernel(positions, strengths)
      )
      //velocityArray = velocities.toArray();
      ;
    for (let i = 0; i < n; i++) {
      const node = nodes[i],
        // [vx, vy, vz] = velocityArray[i];
        [vx, vy, vz] = velocities[i];
      node.vx += vx;
      if (nDim > 1) { node.vy += vy; }
      if (nDim > 2) { node.vz += vz; }
    }
  }

  function initialize() {
    if (!nodes.length) { return; }
    const n = nodes.length,
      settings = {
        loopMaxIterations: n,
        output: [n],
        // pipeline: true,
      };
    strengths = new Array(nodes.length);
    positions = new Array(nodes.length);
    for (let i = 0; i < n; i++) {
      strengths[nodes[i].index] = +strength(nodes[i], i, nodes);
      positions[nodes[i].index] = [0.0, 0.0, 0.0]
    }
    // if (nDim === 1) { kernel = gpu.createKernel(kernel1d); }
    // if (nDim === 2) { kernel = gpu.createKernel(kernel2d); }
    if (nDim === 3) { kernel = gpu.createKernel(kernel3d, settings); }
    // console.log(kernel);
  }

  force.initialize = function (initNodes, numDimensions) {
    nodes = initNodes;
    nDim = numDimensions;
    initialize();
  };

  force.strength = function (_) {
    if (arguments.length) {
      if (typeof _ === 'function') {
        strength = _;
      } else {
        strength = constant(+_);
      }
      initialize();
      return force;
    }
    return strength;
  };

  return force;
};

export default manyBody;
