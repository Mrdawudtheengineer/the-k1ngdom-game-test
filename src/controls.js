import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

export function createControls({ camera, player, clock, onInteract }) {
  const state = {
    active: false,
    tutorial: false,
    move: { forward: false, back: false, left: false, right: false },
    direction: new THREE.Vector3(),
  };

  const pointer = { x: 0, y: 0 };

  function activate(isTutorial) {
    state.active = true;
    state.tutorial = isTutorial;
    document.body.requestPointerLock();
  }

  function update(delta) {
    if (!state.active) return;
    const speed = state.tutorial ? 4 : 5;
    state.direction.set(0, 0, 0);
    if (state.move.forward) state.direction.z -= 1;
    if (state.move.back) state.direction.z += 1;
    if (state.move.left) state.direction.x -= 1;
    if (state.move.right) state.direction.x += 1;
    state.direction.normalize();

    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(player.quaternion);
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(player.quaternion);
    const move = new THREE.Vector3();
    move.addScaledVector(forward, state.direction.z);
    move.addScaledVector(right, state.direction.x);
    move.normalize();

    player.position.addScaledVector(move, speed * delta);

    const sway = Math.sin(clock.elapsedTime * 6) * 0.02;
    player.rotation.y -= pointer.x * 0.7;
    camera.rotation.x = THREE.MathUtils.clamp(camera.rotation.x - pointer.y * 0.5, -0.4, 0.4);
    camera.position.lerp(
      new THREE.Vector3(
        player.position.x + Math.sin(player.rotation.y) * 6,
        player.position.y + 4 + sway,
        player.position.z + Math.cos(player.rotation.y) * 6,
      ),
      0.1,
    );
    camera.lookAt(player.position.x, player.position.y + 2, player.position.z);

    pointer.x = 0;
    pointer.y = 0;
  }

  window.addEventListener('mousemove', (event) => {
    if (!state.active) return;
    pointer.x = (event.movementX || 0) * 0.002;
    pointer.y = (event.movementY || 0) * 0.002;
  });

  window.addEventListener('keydown', (event) => {
    if (!state.active) return;
    switch (event.code) {
      case 'KeyW':
        state.move.forward = true;
        break;
      case 'KeyS':
        state.move.back = true;
        break;
      case 'KeyA':
        state.move.left = true;
        break;
      case 'KeyD':
        state.move.right = true;
        break;
      case 'KeyE':
        onInteract();
        break;
      default:
        break;
    }
  });

  window.addEventListener('keyup', (event) => {
    switch (event.code) {
      case 'KeyW':
        state.move.forward = false;
        break;
      case 'KeyS':
        state.move.back = false;
        break;
      case 'KeyA':
        state.move.left = false;
        break;
      case 'KeyD':
        state.move.right = false;
        break;
      default:
        break;
    }
  });

  return { activate, update, state };
}
