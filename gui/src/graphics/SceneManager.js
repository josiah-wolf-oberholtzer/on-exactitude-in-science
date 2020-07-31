import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { dispatch } from 'd3-dispatch';

const SceneManager = (container) => {
  const renderer = new THREE.WebGLRenderer({
      alpha: false,
      antialias: true,
      stencil: false,
    }),
    composer = new EffectComposer(renderer),
    canvas = renderer.domElement,
    scene = new THREE.Scene(),
    camera = new THREE.PerspectiveCamera(
      45, window.innerWidth / window.innerHeight, 1, 5000,
    ),
    // interaction = new Interaction(renderer, scene, camera, { autoPreventDefault: true }),
    renderPass = new RenderPass(scene, camera),
    bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85,
    ),
    controls = new OrbitControls(camera, canvas),
    event = dispatch('render'),
    hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x000000);

  let frameId;

  function initShaders() {
    renderer.autoClear = false;
    renderer.toneMapping = THREE.ReinhardToneMapping;
    renderer.toneMappingExposure = 1.0;
    bloomPass.threshold = 0.0;
    bloomPass.strength = 1.0;
    bloomPass.radius = 0.25;
    composer.addPass(renderPass);
    composer.addPass(bloomPass);
  }

  function initShadows() {
    // pointLight.position.set(1, 1, 1);
    // pointLight.castShadow = true;
    hemisphereLight.position.set(0, 1000, 0);
    // scene.add(pointLight);
    scene.add(hemisphereLight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  }

  function init() {
    initShaders();
    initShadows();
    camera.position.z = 100;
    controls.enableDamping = true;
    controls.dampingFactory = 0.01;
    renderer.setPixelRatio(window.devicePixelRatio);
    scene.background = new THREE.Color(0x000000);
    scene.fog = new THREE.Fog(0x000000, 50, 200);
    container.appendChild(canvas);
  }

  function render() {
    renderer.clear();
    composer.render();
  }

  function animate() {
    event.call('render', {}, {});
    // controls.update();
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
    composer.setSize(window.innerWidth * 2, window.innerHeight * 2);
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
