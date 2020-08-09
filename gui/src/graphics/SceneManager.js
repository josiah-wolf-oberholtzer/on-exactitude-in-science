import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { dispatch } from 'd3-dispatch';

const SceneManager = (container) => {
  const renderer = new THREE.WebGLRenderer({
    alpha: false,
    antialias: true,
    stencil: false,
  });
  const canvas = renderer.domElement;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    45, window.innerWidth / window.innerHeight, 1, 5000,
  );
    // interaction = new Interaction(renderer, scene, camera, { autoPreventDefault: true }),
  const controls = new OrbitControls(camera, canvas);
  const event = dispatch('render');
  const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x000000);

  let frameId;

  function init() {
    camera.position.z = 100;
    container.appendChild(canvas);
    controls.dampingFactory = 0.01;
    controls.enableDamping = true;
    hemisphereLight.position.set(0, 1000, 0);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ReinhardToneMapping;
    renderer.toneMappingExposure = 1.0;
    scene.add(hemisphereLight);
    scene.background = new THREE.Color(0x000000);
    scene.fog = new THREE.Fog(0x000000, 50, 200);
  }

  function render() {
    renderer.render(scene, camera);
    // console.log(renderer.info);
  }

  function animate() {
    event.call('render', {}, {});
    update();
    render();
    frameId = requestAnimationFrame(animate);
  }

  function start() {
    if (!frameId) {
      requestAnimationFrame(animate);
    }
  }

  function stop() {
    if (frameId) {
      cancelAnimationFrame(frameId);
    }
  }

  function update() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    controls.update();
  }

  function onWindowResize() {
    update();
  }

  window.addEventListener('resize', onWindowResize, false);

  init();
  update();

  return {
    camera,
    canvas,
    controls,
    on(name, _) { return arguments.length > 1 ? event.on(name, _) : event.on(name); },
    scene,
    start,
    stop,
  };
};

export { SceneManager };
