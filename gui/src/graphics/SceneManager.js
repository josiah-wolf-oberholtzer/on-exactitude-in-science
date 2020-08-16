import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { dispatch } from 'd3-dispatch';

class SceneManager {
  constructor(container) {
    // allocation
    this.container = container;
    this.renderer = new THREE.WebGLRenderer({ alpha: false, antialias: true, stencil: false });
    this.canvas = this.renderer.domElement;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 5000);
    this.controls = new OrbitControls(this.camera, this.canvas);
    this.hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x000000);
    this.dispatcher = dispatch('beforeRender');
    this.bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
    this.renderScene = new RenderPass(this.scene, this.camera);
    this.composer = new EffectComposer(this.renderer);

    // settings
    this.bloomPass.radius = 1.5;
    this.bloomPass.strength = 1.0;
    this.bloomPass.threshold = 0.0;
    this.camera.position.z = 100;
    this.controls.dampingFactory = 0.01;
    this.controls.enableDamping = true;
    this.frameId = null;
    this.hemisphereLight.position.set(0, 1000, 0);
    this.renderer.autoClear = false;
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ReinhardToneMapping;
    this.renderer.toneMappingExposure = 2.0;
    this.scene.background = new THREE.Color(0x000000);
    this.scene.fog = new THREE.Fog(0x000000, 0, 250);

    // structure
    this.container.appendChild(this.canvas);
    this.scene.add(this.hemisphereLight);
    this.composer.addPass(this.renderScene);
    this.composer.addPass(this.bloomPass);
    this.update();
    window.addEventListener('resize', this.onWindowResize.bind(this), false);
  }

  animate() {
    this.dispatcher.call('beforeRender');
    this.update();
    this.render();
    this.frameId = requestAnimationFrame(this.animate.bind(this));
  }

  on(name, _) {
    if (arguments.length > 1) {
      return this.dispatcher.on(name, _);
    }
    return this.dispatcher.on(name);
  }

  onWindowResize() { this.update(); }

  render() {
    // this.renderer.render(this.scene, this.camera);
    this.renderer.clear();
    this.composer.render();
  }

  resetCamera() {
    this.camera.position.set(0, 0, 100);
    this.camera.rotation.set(0, 0, 0);
    this.controls.target.set(0, 0, 0);
    this.controls.enableDamping = false;
    this.controls.update();
    this.controls.enableDamping = true;
  }

  start() { if (!this.frameId) { requestAnimationFrame(this.animate.bind(this)); } }

  stop() { if (this.frameId) { cancelAnimationFrame(this.frameId); } }

  update() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.composer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.composer.setSize(window.innerWidth, window.innerHeight);
    this.controls.update();
  }
}

export default SceneManager;
