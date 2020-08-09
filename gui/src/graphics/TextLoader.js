import * as THREE from 'three';

const TextLoader = () => {
  const mainCanvas = new OffscreenCanvas(1, 1);
  const mainContext = mainCanvas.getContext('2d');
  const font = '128px sans-serif';
  const fillStyle = '#fff';
  const borderWidth = 8;

  function init() {
    mainContext.font = font;
  }

  function loadCanvas(text) {
    const textMetrics = mainContext.measureText(text);
    const { width } = textMetrics;
    // TODO: Canvas height calculation needs to be different from text height calculation
    //       for centering purposes.
    const height = textMetrics.actualBoundingBoxAscent + textMetrics.actualBoundingBoxDescent;
    const canvas = new OffscreenCanvas(width + borderWidth * 2, height + borderWidth * 2);
    const context = canvas.getContext('2d');
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
    const canvas = loadCanvas(text);
    const scale = 1 / 128;
    const width = canvas.width * scale;
    const height = canvas.height * scale;
    const texture = loadTexture(canvas);
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
    });
    const geometry = new THREE.PlaneBufferGeometry(width, height);
    const mesh = new THREE.Mesh(geometry, material);
    return mesh;
  }

  init();

  return { loadMesh };
};

export { TextLoader };
