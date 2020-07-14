// import fnt16 from './Lato-Regular-16.fnt';
import * as THREE from 'three';
import { createGeometry } from 'three-bmfont-text';
import * as loadFont from 'load-bmfont';

const TextLoader = () => {
  let font = null,
    texture = null;

  function loadFontAsync(path) {
    console.log('loadFont', loadFont);
    return new Promise((resolve, reject) => {
      loadFont(path, (err, loadedFont) => {
        if (err !== null) {
          reject(err);
        } else {
          font = loadedFont;
          resolve(font);
        }
      });
    });
  }

  function loadTextureAsync(path) {
    return new Promise((resolve) => {
      const textureLoader = new THREE.TextureLoader();
      textureLoader.load(path, (loadedTexture) => {
        texture = loadedTexture;
        resolve(texture);
      });
    });
  }

  const fontPromise = loadFontAsync('./font.fnt'),
    texturePromise = loadTextureAsync('./font.png');

  function load(text, geometryOptions = {}, materialOptions = {}) {
    return (
      Promise.all([fontPromise, texturePromise])
        .then(() => {
          const geometry = createGeometry({ ...geometryOptions, text }),
            material = new THREE.MeshBasicMaterial({
              color: 0xffffff, transparent: true, ...materialOptions, map: texture,
            }),
            mesh = new THREE.Mesh(geometry, material);
          return mesh;
        })
    );
  }

  return { load };
};

export { TextLoader };
