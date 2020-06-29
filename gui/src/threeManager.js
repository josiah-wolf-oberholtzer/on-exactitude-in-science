import * as THREE from 'three';
import { dispatch } from 'd3-dispatch';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader';

const threeManager = (container) => {
  const renderer = new THREE.WebGLRenderer(),
    composer = new EffectComposer(renderer),
    canvas = renderer.domElement,
    scene = new THREE.Scene(),
    camera = new THREE.PerspectiveCamera(
      45, container.offsetWidth / container.offsetHeight, 1, 5000,
    ),
    renderPass = new RenderPass(scene, camera),
    fxaaPass = new ShaderPass(FXAAShader),
    controls = new OrbitControls(camera, canvas),
    event = dispatch('render'),
    hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444),
    dirLight = new THREE.DirectionalLight(0xffffff, 0.8);

  function init() {
    fxaaPass.material.uniforms.resolution.value.x = 1 / (
      container.offsetWidth * renderer.getPixelRatio());
    fxaaPass.material.uniforms.resolution.value.y = 1 / (
      container.offsetHeight * renderer.getPixelRatio());
    camera.position.z = 1000;
    composer.addPass(fxaaPass);
    composer.addPass(renderPass);
    controls.enableDamping = true;
    controls.dampingFactory = 0.01;
    container.appendChild(canvas);
    dirLight.position.set(-3000, 1000, -1000);
    hemiLight.position.set(0, 1000, 0);
    renderer.autoClear = false;
    renderer.setPixelRatio(window.devicePixelRatio);
    scene.add(dirLight);
    scene.add(hemiLight);
    scene.background = new THREE.Color(0xffffff);
    scene.fog = new THREE.FogExp2(0xffffff, 0.0005);
  }

  function render() {
    // renderer.render(scene, camera);
    composer.render();
  }

  function animate() {
    requestAnimationFrame(animate);
    event.call('render', {}, {});
    controls.update();
    render();
  }

  function update() {
    camera.aspect = container.offsetWidth / container.offsetHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.offsetWidth, container.offsetHeight);
    composer.setSize(container.offsetWidth, container.offsetHeight);
    fxaaPass.material.uniforms.resolution.value.x = 1 / (
      container.offsetWidth * renderer.getPixelRatio());
    fxaaPass.material.uniforms.resolution.value.y = 1 / (
      container.offsetHeight * renderer.getPixelRatio());
    controls.update();
  }

  window.addEventListener('resize', update, false);

  init();
  update();

  return {
    animate,
    camera,
    canvas,
    controls,
    on(name, _) { return arguments.length > 1 ? event.on(name, _) : event.on(name); },
    scene,
  };
};

export { threeManager };
