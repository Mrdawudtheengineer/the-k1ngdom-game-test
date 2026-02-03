import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { hookVoiceEvents } from './src/audio.js';
import { createControls } from './src/controls.js';
import { createPlayer, getNearestNPC, spawnNPCs } from './src/characters.js';
import { createSkyDome, createWorld } from './src/world.js';
import { initUI } from './src/ui.js';

const canvas = document.querySelector('#scene');

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xa3b0c6, 30, 160);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.1, 250);
const clock = new THREE.Clock();

const LIGHT_COLORS = {
  sun: 0xfff1d6,
  ambient: 0x5f6b7a,
};

const sun = new THREE.DirectionalLight(LIGHT_COLORS.sun, 1.1);
sun.position.set(45, 60, 30);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.camera.near = 20;
sun.shadow.camera.far = 180;
sun.shadow.camera.left = -70;
sun.shadow.camera.right = 70;
sun.shadow.camera.top = 70;
sun.shadow.camera.bottom = -70;
scene.add(sun);

const ambient = new THREE.AmbientLight(LIGHT_COLORS.ambient, 0.7);
scene.add(ambient);

const sky = createSkyDome();
scene.add(sky);

const root = createWorld();
scene.add(root);

const player = createPlayer();
root.add(player);

const npcs = [];
const mixers = [];
spawnNPCs({ scene, mixers, npcs });

hookVoiceEvents();

const ui = initUI({
  onPlay: () => enterWorld(false),
  onTutorial: () => enterWorld(true),
  onSettings: () => {
    ui.setDialogue('Settings: Adjust sound and shadows from your browser controls.', 'assistant');
  },
  onCustomize: () => {
    ui.setDialogue('Customize: Tailor your cloak color in a future update. MORE COMING SOON.', 'assistant');
  },
});

const controls = createControls({
  camera,
  player,
  clock,
  onInteract: interact,
});

function enterWorld(isTutorial) {
  controls.activate(isTutorial);
  ui.showHud();

  if (isTutorial) {
    player.position.set(0, 0, 24);
    ui.setDialogue('Trainer: Practice your footwork and talk to the guard.', 'guard');
  } else {
    player.position.set(-2, 0, 12);
    ui.setDialogue('Assistant Aria: Welcome home. Explore the courtyard and library.', 'assistant');
  }
}

function interact() {
  const nearest = getNearestNPC(npcs, player);
  if (!nearest) return;
  if (nearest.name === 'friend') {
    ui.setDialogue(
      'Jorin: The library hints that Jala is dangerous. Absolute king. No voice for citizens.',
      nearest.profile,
    );
  } else if (nearest.name === 'assistant') {
    ui.setDialogue(
      'Assistant Aria: Your house is ready. Seek the library to learn about Jala. MORE COMING SOON.',
      nearest.profile,
    );
  } else {
    ui.setDialogue(nearest.text, nearest.profile);
  }
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener('resize', onResize);

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  controls.update(delta);
  mixers.forEach((mixer) => mixer.update(delta));
  renderer.render(scene, camera);
}

animate();
