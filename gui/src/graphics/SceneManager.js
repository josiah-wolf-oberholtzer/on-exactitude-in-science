import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { dispatch } from 'd3-dispatch';

class SceneManager { 
  constructor(container)  {
    // allocation
    this.container = container;
    this.renderer = new THREE.WebGLRenderer({alpha: false, antialias: true, stencil: false});
    this.canvas = this.renderer.domElement;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 5000);
    this.controls = new OrbitControls(this.camera, this.canvas);
    this.hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x000000);
    this.dispatcher = dispatch('beforeRender');
    // settings
    this.frameId = null;
    this.camera.position.z = 100;
    this.controls.dampingFactory = 0.01;
    this.controls.enableDamping = true;
    this.hemisphereLight.position.set(0, 1000, 0);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ReinhardToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.scene.background = new THREE.Color(0x000000);
    this.scene.fog = new THREE.Fog(0x000000, 50, 200);
    // structure
    this.container.appendChild(this.canvas);
    this.scene.add(this.hemisphereLight);
    this.update();
    window.addEventListener('resize', this.onWindowResize, false);
  }

  animate() {
    this.dispatcher.call('beforeRender');
    this.update();
    this.render();
    this.frameId = requestAnimationFrame(this.animate.bind(this));
  }

  on(name, _) { return arguments.length > 1 ? this.dispatcher.on(name, _) : this.dispatcher.on(name); }

  onWindowResize() { update(); }

  render() {
    this.renderer.render(this.scene, this.camera);
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
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.controls.update();
  }
}

export default SceneManager;
