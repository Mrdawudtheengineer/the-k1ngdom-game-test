import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/GLTFLoader.js';

const npcData = [
  {
    name: 'assistant',
    label: 'Assistant Aria',
    profile: 'assistant',
    text: 'Welcome to Kingdom Furi. Your house awaits beyond the courtyard.',
    position: new THREE.Vector3(-6, 0, 8),
    url: 'assets/models/characters/villager01.glb',
  },
  {
    name: 'friend',
    label: 'Jorin',
    profile: 'villager',
    text: 'I heard the library holds secrets about Jala. Stay alert.',
    position: new THREE.Vector3(6, 0, -6),
    url: 'assets/models/characters/merchant.glb',
  },
  {
    name: 'guard',
    label: 'Gate Guard',
    profile: 'guard',
    text: 'No weapons within the walls. Train only in the yard.',
    position: new THREE.Vector3(12, 0, 4),
    url: 'assets/models/characters/guard.glb',
  },
];

export function createPlayer() {
  const group = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x4a3c32, roughness: 0.7 });
  const clothMat = new THREE.MeshStandardMaterial({ color: 0x6b5a4a, roughness: 0.8 });

  const torso = createHumanoidSegment(0.6, 1.6, 0.4, clothMat);
  torso.position.y = 1.4;

  const head = createHumanoidSegment(0.45, 0.5, 0.4, bodyMat);
  head.position.y = 2.35;

  const legs = createHumanoidSegment(0.7, 1.4, 0.4, clothMat);
  legs.position.y = 0.4;

  const leftArm = createHumanoidSegment(0.25, 1.1, 0.25, clothMat);
  leftArm.position.set(-0.55, 1.4, 0);

  const rightArm = createHumanoidSegment(0.25, 1.1, 0.25, clothMat);
  rightArm.position.set(0.55, 1.4, 0);

  group.add(torso, head, legs, leftArm, rightArm);
  group.traverse((obj) => {
    if (obj.isMesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
    }
  });
  return group;
}

function createHumanoidSegment(width, height, depth, material) {
  const shape = new THREE.Shape();
  shape.moveTo(-width / 2, 0);
  shape.lineTo(-width / 2, height);
  shape.lineTo(width / 2, height * 0.9);
  shape.lineTo(width / 2, 0);
  shape.lineTo(-width / 2, 0);
  const geometry = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.05 });
  geometry.translate(0, 0, -depth / 2);
  return new THREE.Mesh(geometry, material);
}

export function spawnNPCs({ scene, mixers, npcs }) {
  const gltfLoader = new GLTFLoader();
  npcData.forEach((data) => {
    gltfLoader.load(
      data.url,
      (gltf) => {
        const npc = gltf.scene;
        npc.position.copy(data.position);
        npc.scale.set(1.1, 1.1, 1.1);
        npc.traverse((obj) => {
          if (obj.isMesh) {
            obj.castShadow = true;
            obj.receiveShadow = true;
          }
          if (obj.isMesh && /eye/i.test(obj.name)) {
            obj.visible = false;
          }
        });
        scene.add(npc);

        if (gltf.animations && gltf.animations.length) {
          const mixer = new THREE.AnimationMixer(npc);
          const idle = THREE.AnimationClip.findByName(gltf.animations, 'Idle') || gltf.animations[0];
          mixer.clipAction(idle).play();
          mixers.push(mixer);
        }

        npcs.push({ ...data, npc });
      },
      undefined,
      () => {
        const fallback = createFallbackNPC();
        fallback.position.copy(data.position);
        scene.add(fallback);
        npcs.push({ ...data, npc: fallback });
      },
    );
  });
}

function createFallbackNPC() {
  const group = new THREE.Group();
  const robeMaterial = new THREE.MeshStandardMaterial({ color: 0x5b4b3d, roughness: 0.8 });
  const skinMaterial = new THREE.MeshStandardMaterial({ color: 0x6b5a4a, roughness: 0.9 });

  const torso = createHumanoidSegment(0.7, 1.4, 0.45, robeMaterial);
  torso.position.y = 1.2;

  const head = createHumanoidSegment(0.45, 0.45, 0.35, skinMaterial);
  head.position.y = 2.2;

  const legs = createHumanoidSegment(0.8, 1.2, 0.45, robeMaterial);
  legs.position.y = 0.3;

  const leftArm = createHumanoidSegment(0.25, 1, 0.25, robeMaterial);
  leftArm.position.set(-0.6, 1.2, 0);

  const rightArm = createHumanoidSegment(0.25, 1, 0.25, robeMaterial);
  rightArm.position.set(0.6, 1.2, 0);

  group.add(torso, head, legs, leftArm, rightArm);
  group.traverse((obj) => {
    if (obj.isMesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
    }
  });
  return group;
}

export function getNearestNPC(npcs, player) {
  let nearest = null;
  let minDist = 3.5;
  npcs.forEach((data) => {
    if (!data.npc) return;
    const dist = data.npc.position.distanceTo(player.position);
    if (dist < minDist) {
      minDist = dist;
      nearest = data;
    }
  });
  return nearest;
}

export function getNpcData() {
  return npcData;
}
