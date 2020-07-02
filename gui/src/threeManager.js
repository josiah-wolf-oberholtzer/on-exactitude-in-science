import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { dispatch } from 'd3-dispatch';

const ThreeManager = (container) => {
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

  function init() {
    initShaders();
    camera.position.z = 1000;
    controls.enableDamping = true;
    controls.dampingFactory = 0.01;
    container.appendChild(canvas);
    pointLight.position.set(1, 1, 1);
    pointLight.castShadow = true;
    hemisphereLight.position.set(0, 1000, 0);
    renderer.autoClear = false;
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ReinhardToneMapping;
    renderer.toneMappingExposure = 1.0;
    // scene.add(pointLight);
    scene.add(hemisphereLight);
    scene.background = new THREE.Color(0x000000);
    scene.fog = new THREE.FogExp2(0x000000, 0.000333);
  }

  function initShaders() {
    bloomPass.threshold = 0.0;
    bloomPass.strength = 1.0;
    bloomPass.radius = 0.0;
    composer.addPass(renderPass);
    composer.addPass(bloomPass);
  }

  function render() {
    // renderer.render(scene, camera);
    composer.render();
  }

  function animate() {
    event.call('render', {}, {});
    controls.update();
    render();
    return requestAnimationFrame(animate);
  }

  function update() {
    const resX = 1 / (container.offsetWidth * renderer.getPixelRatio()),
      resY = 1 / (container.offsetHeight * renderer.getPixelRatio());
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
    animate,
    amera,
    canvas,
    controls,
    on(name, _) { return arguments.length > 1 ? event.on(name, _) : event.on(name); },
    scene,
  };
};

export { ThreeManager };
