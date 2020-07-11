import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { dispatch } from 'd3-dispatch';

const SceneManager = (container) => {
  const renderer = new THREE.WebGLRenderer(),
    composer = new EffectComposer(renderer),
    canvas = renderer.domElement,
    scene = new THREE.Scene(),
    camera = new THREE.PerspectiveCamera(
      45, container.offsetWidth / container.offsetHeight, 1, 5000,
    ),
    // interaction = new Interaction(renderer, scene, camera, { autoPreventDefault: true }),
    renderPass = new RenderPass(scene, camera),
    bloomPass = new UnrealBloomPass(
      new THREE.Vector2(container.innerWidth, container.innerHeight), 1.5, 0.4, 0.85,
    ),
    controls = new OrbitControls(camera, canvas),
    event = dispatch('render'),
    hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444),
    pointLight = new THREE.PointLight(0xffffff, 1, 0, 2);

  let frameId;

  function initShaders() {
    renderer.toneMapping = THREE.ReinhardToneMapping;
    renderer.toneMappingExposure = 1.0;
    bloomPass.threshold = 0.0;
    bloomPass.strength = 1.0;
    bloomPass.radius = 0.0;
    composer.addPass(renderPass);
    composer.addPass(bloomPass);
  }

  function initShadows() {
    pointLight.position.set(1, 1, 1);
    pointLight.castShadow = true;
    hemisphereLight.position.set(0, 1000, 0);
    scene.add(pointLight);
    scene.add(hemisphereLight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  }

  function init() {
    initShaders();
    initShadows();
    camera.position.z = 200;
    controls.enableDamping = true;
    controls.dampingFactory = 0.01;
    renderer.autoClear = false;
    renderer.setPixelRatio(window.devicePixelRatio);
    scene.background = new THREE.Color(0x000000);
    scene.fog = new THREE.Fog(0x000000, 100, 333);
    container.appendChild(canvas);
  }

  function render() {
    // renderer.render(scene, camera);
    composer.render();
  }

  function animateA() {
    event.call('render', {}, {});
    controls.update();
    render();
    frameId = requestAnimationFrame(animateB);
  }

  function animateB() {
    event.call('render', {}, {});
    controls.update();
    render();
    frameId = requestAnimationFrame(animateA);
  }

  function start() {
    if (!frameId) {
      requestAnimationFrame(animateA);
    }
  }

  function stop() {
    if (frameId) {
      cancelAnimationFrame(frameId);
    }
  }

  function update() {
    camera.aspect = container.offsetWidth / container.offsetHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.offsetWidth, container.offsetHeight);
    composer.setSize(container.offsetWidth, container.offsetHeight);
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