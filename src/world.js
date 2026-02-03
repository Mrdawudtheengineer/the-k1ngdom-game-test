import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

export function createWorld() {
  const root = new THREE.Group();

  const terrain = createTerrain();
  root.add(terrain);

  const pathMesh = createPath();
  root.add(pathMesh);

  const trees = createForest();
  root.add(trees);

  const structures = createStructures();
  root.add(structures);

  const props = createProps();
  root.add(props);

  const trainingYard = createTrainingYard();
  trainingYard.position.set(16, 0, -16);
  root.add(trainingYard);

  return root;
}

export function createSkyDome() {
  const geometry = new THREE.CylinderGeometry(120, 140, 120, 24, 1, true);
  geometry.translate(0, 40, 0);
  const material = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    uniforms: {
      topColor: { value: new THREE.Color('#8eb6d8') },
      bottomColor: { value: new THREE.Color('#dae6f4') },
    },
    vertexShader: `
      varying vec3 vWorldPosition;
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 topColor;
      uniform vec3 bottomColor;
      varying vec3 vWorldPosition;
      void main() {
        float h = normalize(vWorldPosition + vec3(0.0, 20.0, 0.0)).y;
        gl_FragColor = vec4(mix(bottomColor, topColor, max(h, 0.0)), 1.0);
      }
    `,
  });
  return new THREE.Mesh(geometry, material);
}

function createTerrain() {
  const geometry = new THREE.PlaneGeometry(180, 180, 140, 140);
  geometry.rotateX(-Math.PI / 2);

  const positions = geometry.attributes.position;
  for (let i = 0; i < positions.count; i += 1) {
    const x = positions.getX(i);
    const z = positions.getZ(i);
    const height = Math.sin(x * 0.05) * 2.2 + Math.cos(z * 0.04) * 1.8 + Math.sin((x + z) * 0.03) * 1.2;
    positions.setY(i, height);
  }
  geometry.computeVertexNormals();

  const texture = createGroundTexture();
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(8, 8);

  const material = new THREE.MeshStandardMaterial({ map: texture });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.receiveShadow = true;
  return mesh;
}

function createGroundTexture() {
  const canvasTex = document.createElement('canvas');
  canvasTex.width = 512;
  canvasTex.height = 512;
  const ctx = canvasTex.getContext('2d');

  ctx.fillStyle = '#3f5d2b';
  ctx.fillRect(0, 0, canvasTex.width, canvasTex.height);

  for (let i = 0; i < 1500; i += 1) {
    const x = Math.random() * canvasTex.width;
    const y = Math.random() * canvasTex.height;
    const radius = Math.random() * 6 + 2;
    ctx.fillStyle = `rgba(75, 92, 55, ${Math.random() * 0.5})`;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.strokeStyle = '#7b6a3a';
  ctx.lineWidth = 30;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(40, 460);
  ctx.quadraticCurveTo(180, 320, 260, 200);
  ctx.quadraticCurveTo(340, 80, 480, 60);
  ctx.stroke();

  return new THREE.CanvasTexture(canvasTex);
}

function createPath() {
  const shape = new THREE.Shape();
  shape.moveTo(-60, 40);
  shape.quadraticCurveTo(-20, 10, 5, -10);
  shape.quadraticCurveTo(30, -30, 60, -50);
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: 2.5, bevelEnabled: false, steps: 1 });
  geometry.rotateX(-Math.PI / 2);
  geometry.translate(0, 0.2, 0);

  const material = new THREE.MeshStandardMaterial({ color: 0x6d5a3c });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.receiveShadow = true;
  return mesh;
}

function createForest() {
  const group = new THREE.Group();
  const trunkGeometry = createTrunkGeometry();
  const leafGeometry = createLeafGeometry();

  const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x5b3d2b, roughness: 0.8 });
  const leafMaterial = new THREE.MeshStandardMaterial({ color: 0x365a2c, roughness: 0.7 });

  const trunkInstanced = new THREE.InstancedMesh(trunkGeometry, trunkMaterial, 80);
  const leafInstanced = new THREE.InstancedMesh(leafGeometry, leafMaterial, 80);

  const dummy = new THREE.Object3D();
  for (let i = 0; i < 80; i += 1) {
    const x = (Math.random() - 0.5) * 150;
    const z = (Math.random() - 0.5) * 150;
    const scale = Math.random() * 0.5 + 0.8;
    dummy.position.set(x, 0.6, z);
    dummy.rotation.y = Math.random() * Math.PI * 2;
    dummy.scale.set(scale, scale, scale);
    dummy.updateMatrix();
    trunkInstanced.setMatrixAt(i, dummy.matrix);

    dummy.position.set(x, 2.6 * scale, z);
    dummy.updateMatrix();
    leafInstanced.setMatrixAt(i, dummy.matrix);
  }

  trunkInstanced.castShadow = true;
  leafInstanced.castShadow = true;
  group.add(trunkInstanced, leafInstanced);
  return group;
}

function createTrunkGeometry() {
  const shape = new THREE.Shape();
  shape.moveTo(-0.25, -0.2);
  shape.lineTo(0.2, -0.22);
  shape.lineTo(0.26, 0.12);
  shape.lineTo(0.12, 0.38);
  shape.lineTo(-0.18, 0.3);
  shape.lineTo(-0.3, 0.05);
  shape.closePath();

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 3.2,
    bevelEnabled: true,
    bevelSegments: 2,
    bevelSize: 0.06,
    bevelThickness: 0.08,
    steps: 2,
  });
  geometry.rotateX(Math.PI / 2);
  return geometry;
}

function createLeafGeometry() {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0.6);
  shape.quadraticCurveTo(0.6, 0.6, 0.8, 0.1);
  shape.quadraticCurveTo(0.9, -0.6, 0, -0.9);
  shape.quadraticCurveTo(-0.9, -0.6, -0.8, 0.1);
  shape.quadraticCurveTo(-0.6, 0.6, 0, 0.6);

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 1.6,
    bevelEnabled: false,
    steps: 1,
  });
  geometry.rotateX(Math.PI / 2);
  return geometry;
}

function createStructures() {
  const group = new THREE.Group();
  const stoneMaterial = new THREE.MeshStandardMaterial({ color: 0x6e6f74, roughness: 0.9 });
  const roofMaterial = new THREE.MeshStandardMaterial({ color: 0x5a3d2e, roughness: 0.8 });
  const woodMaterial = new THREE.MeshStandardMaterial({ color: 0x4a3524, roughness: 0.7 });

  const gate = buildGate(stoneMaterial, roofMaterial, woodMaterial);
  gate.position.set(24, 0, 14);
  group.add(gate);

  const courtyard = buildCourtyard(stoneMaterial, woodMaterial);
  courtyard.position.set(-12, 0, -10);
  group.add(courtyard);

  const library = buildLibrary(stoneMaterial, roofMaterial, woodMaterial);
  library.position.set(-32, 0, 22);
  group.add(library);

  const house = buildHouse(stoneMaterial, roofMaterial, woodMaterial);
  house.position.set(10, 0, -26);
  group.add(house);

  const market = buildMarketHall(stoneMaterial, roofMaterial, woodMaterial);
  market.position.set(-6, 0, 20);
  group.add(market);

  return group;
}

function buildGate(stoneMaterial, roofMaterial, woodMaterial) {
  const group = new THREE.Group();
  const archShape = new THREE.Shape();
  archShape.moveTo(-6, 0);
  archShape.lineTo(-6, 6);
  archShape.lineTo(-2, 6);
  archShape.absarc(0, 6, 2, Math.PI, 0, false);
  archShape.lineTo(6, 6);
  archShape.lineTo(6, 0);
  archShape.lineTo(-6, 0);

  const arch = new THREE.ExtrudeGeometry(archShape, { depth: 3, bevelEnabled: true, bevelSize: 0.2, bevelThickness: 0.3 });
  const archMesh = new THREE.Mesh(arch, stoneMaterial);
  archMesh.castShadow = true;
  archMesh.receiveShadow = true;

  const roof = createRoofMesh(14, 6, 3.5, roofMaterial);
  roof.position.set(0, 7.2, 1.5);

  const doors = createDoorMesh(3.2, 4.6, woodMaterial);
  doors.position.set(0, 0.2, 1.6);

  group.add(archMesh, roof, doors);
  return group;
}

function buildCourtyard(stoneMaterial, woodMaterial) {
  const group = new THREE.Group();
  const wallShape = new THREE.Shape();
  wallShape.moveTo(-12, 0);
  wallShape.lineTo(-12, 2.8);
  wallShape.lineTo(12, 2.8);
  wallShape.lineTo(12, 0);
  wallShape.lineTo(-12, 0);

  const wallGeometry = new THREE.ExtrudeGeometry(wallShape, { depth: 2, bevelEnabled: false });
  const wall = new THREE.Mesh(wallGeometry, stoneMaterial);
  wall.castShadow = true;
  wall.receiveShadow = true;

  const banner = createBanner(woodMaterial);
  banner.position.set(0, 2.2, 0.8);

  group.add(wall, banner);
  return group;
}

function buildLibrary(stoneMaterial, roofMaterial, woodMaterial) {
  const group = new THREE.Group();
  const body = createBuildingBody(10, 6, 8, stoneMaterial);
  const roof = createRoofMesh(12, 4.5, 9, roofMaterial);
  roof.position.y = 6.4;

  const door = createDoorMesh(2.6, 4.2, woodMaterial);
  door.position.set(0, 0.2, 4.2);

  const windowLeft = createWindowMesh(1.2, 2.1, woodMaterial);
  windowLeft.position.set(-3, 2.2, 4.1);
  const windowRight = createWindowMesh(1.2, 2.1, woodMaterial);
  windowRight.position.set(3, 2.2, 4.1);

  group.add(body, roof, door, windowLeft, windowRight);
  group.traverse((obj) => {
    if (obj.isMesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
    }
  });
  return group;
}

function buildHouse(stoneMaterial, roofMaterial, woodMaterial) {
  const group = new THREE.Group();
  const body = createBuildingBody(7, 4.5, 6, stoneMaterial);
  const roof = createRoofMesh(9, 4, 7, roofMaterial);
  roof.position.y = 4.8;

  const door = createDoorMesh(2.2, 3.6, woodMaterial);
  door.position.set(-1.2, 0.2, 3.1);

  const window = createWindowMesh(1.1, 1.6, woodMaterial);
  window.position.set(2.2, 2.0, 3.0);

  group.add(body, roof, door, window);
  group.traverse((obj) => {
    if (obj.isMesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
    }
  });
  return group;
}

function buildMarketHall(stoneMaterial, roofMaterial, woodMaterial) {
  const group = new THREE.Group();
  const base = createBuildingBody(12, 5, 10, stoneMaterial);
  const roof = createRoofMesh(14, 5, 12, roofMaterial);
  roof.position.y = 5.2;
  const awning = createAwning(6, 2.6, woodMaterial);
  awning.position.set(0, 3.5, 5.4);

  group.add(base, roof, awning);
  group.traverse((obj) => {
    if (obj.isMesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
    }
  });
  return group;
}

function createBuildingBody(width, height, depth, material) {
  const shape = new THREE.Shape();
  shape.moveTo(-width / 2, 0);
  shape.lineTo(-width / 2, height);
  shape.lineTo(width / 2, height);
  shape.lineTo(width / 2, 0);
  shape.lineTo(-width / 2, 0);
  const geometry = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: 0.2, bevelSize: 0.15 });
  geometry.translate(0, 0, -depth / 2);
  return new THREE.Mesh(geometry, material);
}

function createRoofMesh(width, height, depth, material) {
  const geometry = new THREE.BufferGeometry();
  const halfW = width / 2;
  const halfD = depth / 2;

  const vertices = new Float32Array([
    -halfW, 0, -halfD,
    0, height, -halfD,
    halfW, 0, -halfD,

    -halfW, 0, halfD,
    0, height, halfD,
    halfW, 0, halfD,
  ]);

  const indices = [
    0, 1, 2,
    3, 4, 5,
    0, 3, 4,
    0, 4, 1,
    2, 1, 4,
    2, 4, 5,
  ];

  geometry.setIndex(indices);
  geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  geometry.computeVertexNormals();
  return new THREE.Mesh(geometry, material);
}

function createDoorMesh(width, height, material) {
  const shape = new THREE.Shape();
  shape.moveTo(-width / 2, 0);
  shape.lineTo(-width / 2, height * 0.65);
  shape.quadraticCurveTo(0, height, width / 2, height * 0.65);
  shape.lineTo(width / 2, 0);
  shape.lineTo(-width / 2, 0);

  const geometry = new THREE.ExtrudeGeometry(shape, { depth: 0.3, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.05 });
  geometry.rotateY(Math.PI);
  return new THREE.Mesh(geometry, material);
}

function createWindowMesh(width, height, material) {
  const shape = new THREE.Shape();
  shape.moveTo(-width / 2, 0);
  shape.lineTo(-width / 2, height * 0.75);
  shape.quadraticCurveTo(0, height, width / 2, height * 0.75);
  shape.lineTo(width / 2, 0);
  shape.lineTo(-width / 2, 0);
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: 0.2, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03 });
  return new THREE.Mesh(geometry, material);
}

function createBanner(material) {
  const shape = new THREE.Shape();
  shape.moveTo(-1.5, 0);
  shape.lineTo(-1.2, 1.8);
  shape.lineTo(0, 2.4);
  shape.lineTo(1.2, 1.8);
  shape.lineTo(1.5, 0);
  shape.lineTo(0, -1.4);
  shape.lineTo(-1.5, 0);

  const geometry = new THREE.ExtrudeGeometry(shape, { depth: 0.2, bevelEnabled: false });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = Math.PI / 2;
  return mesh;
}

function createAwning(width, height, material) {
  const shape = new THREE.Shape();
  shape.moveTo(-width / 2, 0);
  shape.lineTo(width / 2, 0);
  shape.lineTo(width / 2, -height * 0.6);
  shape.quadraticCurveTo(0, -height, -width / 2, -height * 0.6);
  shape.lineTo(-width / 2, 0);
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: 0.6, bevelEnabled: false });
  geometry.rotateX(Math.PI / 2);
  return new THREE.Mesh(geometry, material);
}

function createProps() {
  const group = new THREE.Group();
  const woodMaterial = new THREE.MeshStandardMaterial({ color: 0x4b3726, roughness: 0.7 });
  const stoneMaterial = new THREE.MeshStandardMaterial({ color: 0x67686c, roughness: 0.8 });

  const well = createWell(stoneMaterial, woodMaterial);
  well.position.set(-2, 0, 6);
  group.add(well);

  const stall = createMarketStall(woodMaterial);
  stall.position.set(-14, 0, 14);
  group.add(stall);

  const crates = createCrateStack(woodMaterial);
  crates.position.set(-18, 0, 10);
  group.add(crates);

  return group;
}

function createWell(stoneMaterial, woodMaterial) {
  const group = new THREE.Group();
  const rimShape = new THREE.Shape();
  rimShape.moveTo(-2.2, 0);
  rimShape.lineTo(-2.2, 1.2);
  rimShape.lineTo(2.2, 1.2);
  rimShape.lineTo(2.2, 0);
  rimShape.lineTo(-2.2, 0);
  const rim = new THREE.Mesh(new THREE.ExtrudeGeometry(rimShape, { depth: 2, bevelEnabled: true, bevelThickness: 0.2, bevelSize: 0.2 }), stoneMaterial);
  rim.position.set(0, 0, -1);

  const canopy = createRoofMesh(5, 2.6, 3.4, woodMaterial);
  canopy.position.set(0, 2.2, 0);

  group.add(rim, canopy);
  group.traverse((obj) => {
    if (obj.isMesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
    }
  });
  return group;
}

function createMarketStall(material) {
  const group = new THREE.Group();
  const postShape = new THREE.Shape();
  postShape.moveTo(-0.2, 0);
  postShape.lineTo(-0.2, 2.4);
  postShape.lineTo(0.2, 2.4);
  postShape.lineTo(0.2, 0);
  postShape.lineTo(-0.2, 0);
  const postGeo = new THREE.ExtrudeGeometry(postShape, { depth: 0.2, bevelEnabled: false });

  const post1 = new THREE.Mesh(postGeo, material);
  const post2 = new THREE.Mesh(postGeo, material);
  const post3 = new THREE.Mesh(postGeo, material);
  const post4 = new THREE.Mesh(postGeo, material);
  post1.position.set(-1.4, 0, -1.2);
  post2.position.set(1.4, 0, -1.2);
  post3.position.set(-1.4, 0, 1.2);
  post4.position.set(1.4, 0, 1.2);

  const roof = createRoofMesh(3.4, 1.4, 3, material);
  roof.position.set(0, 2.3, 0);

  group.add(post1, post2, post3, post4, roof);
  group.traverse((obj) => {
    if (obj.isMesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
    }
  });
  return group;
}

function createCrateStack(material) {
  const group = new THREE.Group();
  const crateShape = new THREE.Shape();
  crateShape.moveTo(-0.8, 0);
  crateShape.lineTo(-0.8, 0.8);
  crateShape.lineTo(0.8, 0.8);
  crateShape.lineTo(0.8, 0);
  crateShape.lineTo(-0.8, 0);
  const crateGeo = new THREE.ExtrudeGeometry(crateShape, { depth: 0.8, bevelEnabled: true, bevelSize: 0.08, bevelThickness: 0.08 });
  crateGeo.rotateY(Math.PI / 2);

  const crate1 = new THREE.Mesh(crateGeo, material);
  const crate2 = new THREE.Mesh(crateGeo, material);
  const crate3 = new THREE.Mesh(crateGeo, material);
  crate1.position.set(0, 0, 0);
  crate2.position.set(1.2, 0.1, 0.2);
  crate3.position.set(0.6, 0.9, -0.4);

  group.add(crate1, crate2, crate3);
  group.traverse((obj) => {
    if (obj.isMesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
    }
  });
  return group;
}

function createTrainingYard() {
  const group = new THREE.Group();
  const yardMaterial = new THREE.MeshStandardMaterial({ color: 0x5f4b35, roughness: 0.8 });
  const targetMaterial = new THREE.MeshStandardMaterial({ color: 0x6f2f2f, roughness: 0.7 });

  const yardShape = new THREE.Shape();
  yardShape.moveTo(-6, 0);
  yardShape.lineTo(-6, 0.6);
  yardShape.lineTo(6, 0.6);
  yardShape.lineTo(6, 0);
  yardShape.lineTo(-6, 0);
  const yardGeo = new THREE.ExtrudeGeometry(yardShape, { depth: 6, bevelEnabled: false });
  yardGeo.rotateX(-Math.PI / 2);
  const yard = new THREE.Mesh(yardGeo, yardMaterial);
  yard.receiveShadow = true;

  const target = createTrainingDummy(targetMaterial);
  target.position.set(0, 0, 0);

  group.add(yard, target);
  return group;
}

function createTrainingDummy(material) {
  const group = new THREE.Group();
  const bodyShape = new THREE.Shape();
  bodyShape.moveTo(-0.6, 0);
  bodyShape.lineTo(-0.6, 2.4);
  bodyShape.lineTo(0.6, 2.4);
  bodyShape.lineTo(0.6, 0);
  bodyShape.lineTo(-0.6, 0);
  const bodyGeo = new THREE.ExtrudeGeometry(bodyShape, { depth: 0.8, bevelEnabled: true, bevelSize: 0.08, bevelThickness: 0.08 });
  bodyGeo.rotateY(Math.PI / 2);
  const body = new THREE.Mesh(bodyGeo, material);
  body.position.set(0, 0.2, 0);

  const armsShape = new THREE.Shape();
  armsShape.moveTo(-1.6, 0.2);
  armsShape.lineTo(-1.6, 0.8);
  armsShape.lineTo(1.6, 0.8);
  armsShape.lineTo(1.6, 0.2);
  armsShape.lineTo(-1.6, 0.2);
  const armsGeo = new THREE.ExtrudeGeometry(armsShape, { depth: 0.5, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.05 });
  armsGeo.rotateY(Math.PI / 2);
  const arms = new THREE.Mesh(armsGeo, material);
  arms.position.set(0, 1.2, 0);

  group.add(body, arms);
  group.traverse((obj) => {
    if (obj.isMesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
    }
  });
  return group;
}
