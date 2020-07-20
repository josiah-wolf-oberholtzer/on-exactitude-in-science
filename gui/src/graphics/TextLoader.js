import * as THREE from 'three';

const TextLoader = () => {
  const mainCanvas = new OffscreenCanvas(1, 1),
    mainContext = mainCanvas.getContext('2d'),
    font = '128px sans-serif',
    fillStyle = '#fff',
    borderWidth = 8;

  function init() {
    mainContext.font = font;
  }

  function loadCanvas(text) {
    const textMetrics = mainContext.measureText(text),
      { width } = textMetrics,
      // TODO: Canvas height calculation needs to be different from text height calculation
      //       for centering purposes.
      height = textMetrics.actualBoundingBoxAscent + textMetrics.actualBoundingBoxDescent,
      canvas = new OffscreenCanvas(width + borderWidth * 2, height + borderWidth * 2),
      context = canvas.getContext('2d');
    context.lineWidth = borderWidth;
    context.font = font;
    context.fillStyle = fillStyle;
    context.fillText(text, 0, textMetrics.actualBoundingBoxAscent);
    return canvas;
  }

  function loadTexture(canvas) {
    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    return texture;
  }

  function loadMesh(text) {
    const canvas = loadCanvas(text),
      scale = 1 / 128,
      width = canvas.width * scale,
      height = canvas.height * scale,
      texture = loadTexture(canvas),
      material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
      }),
      geometry = new THREE.PlaneBufferGeometry(width, height),
      mesh = new THREE.Mesh(geometry, material);
    return mesh;
  }

  init();

  return { loadMesh };
};

export { TextLoader };
