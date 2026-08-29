import * as THREE from "three";

const tuningDefaults = {
  player: { health: 100, combatSpeed: 12, combatAcceleration: 52, combatFriction: 34, glideAcceleration: 30, glideMaxSpeed: 45, glideSteering: 2.8, glideFriction: 4, combatMomentumRetention: 0.55 },
  camera: { distance: 8, height: 3.2, rotateSpeed: 2.0, pitchSpeed: 1.2, followSpeed: 8 },
  gun: { damage: 5, fireRate: 10, projectileSpeed: 80, closeSpread: 0.01, farSpread: 0.08, assistStrength: 0.6, assistMaxRange: 100, assistAngle: 0.65 },
  missiles: { damage: 25, cooldown: 2, volleySize: 2, speed: 35, turnRate: 2.5, closeHoming: 0.9, farHoming: 0.25, closeRange: 30, farRange: 120 },
  arena: { size: 86, mechCollisionRadius: 1.1 },
  radar: { range: 80 },
  bot: { directionChangeMin: 1.3, directionChangeMax: 3.8, steeringRate: 0.9, gunChance: 0.7, missileChance: 0.2, missileInterval: 2.5 },
  projectiles: { gunLife: 3, missileLife: 7, gunHitRadius: 1.25, missileHitRadius: 1.6 },
  respawn: { delay: 1, deathEffectDuration: 0.18 }
};
const tuning = structuredClone(tuningDefaults);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xaed5ee);
scene.fog = new THREE.Fog(0xaed5ee, 105, 210);
const camera = new THREE.PerspectiveCamera(62, innerWidth / innerHeight, 0.1, 300);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
document.querySelector("#game").append(renderer.domElement);
scene.add(new THREE.HemisphereLight(0xe9f7ff, 0x61706b, 2.5));
const sun = new THREE.DirectionalLight(0xffffff, 2.5);
sun.position.set(-35, 80, 25);
sun.castShadow = true;
scene.add(sun);

const input = { moveX: 0, moveY: 0, cameraX: 0, cameraY: 0, fireGun: false, fireMissile: false, switchMode: false };
const keys = new Set();
addEventListener("keydown", (event) => {
  keys.add(event.code);
  if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.code)) event.preventDefault();
});
addEventListener("keyup", (event) => keys.delete(event.code));
function readInput() {
  input.moveX = (keys.has("KeyD") ? 1 : 0) - (keys.has("KeyA") ? 1 : 0);
  input.moveY = (keys.has("KeyW") ? 1 : 0) - (keys.has("KeyS") ? 1 : 0);
  input.cameraX = (keys.has("ArrowRight") ? 1 : 0) - (keys.has("ArrowLeft") ? 1 : 0);
  input.cameraY = (keys.has("ArrowUp") ? 1 : 0) - (keys.has("ArrowDown") ? 1 : 0);
  input.fireGun = keys.has("KeyU");
  input.fireMissile = keys.has("KeyI");
  input.switchMode = keys.has("Space");
}

const obstacles = [];
const materials = {
  asphalt: new THREE.MeshLambertMaterial({ color: 0x252d35 }),
  sidewalk: new THREE.MeshLambertMaterial({ color: 0xd8d7ce }),
  curb: new THREE.MeshLambertMaterial({ color: 0xb8b9b3 }),
  grass: new THREE.MeshLambertMaterial({ color: 0x79a86a }),
  concrete: new THREE.MeshLambertMaterial({ color: 0xe3e3dc }),
  glass: new THREE.MeshLambertMaterial({ color: 0x8dbdce }),
  glassDark: new THREE.MeshLambertMaterial({ color: 0x547d91 }),
  frame: new THREE.MeshLambertMaterial({ color: 0x253641 }),
  terracotta: new THREE.MeshLambertMaterial({ color: 0xa9665a }),
  brick: new THREE.MeshLambertMaterial({ color: 0x8e514a }),
  roof: new THREE.MeshLambertMaterial({ color: 0x52616a }),
  roadMark: new THREE.MeshBasicMaterial({ color: 0xf5f1dc }),
  yellowMark: new THREE.MeshBasicMaterial({ color: 0xd9b957 }),
  trunk: new THREE.MeshLambertMaterial({ color: 0x76533e }),
  canopy: new THREE.MeshLambertMaterial({ color: 0x4f935e }),
  canopyLight: new THREE.MeshLambertMaterial({ color: 0x76ad68 }),
  propDark: new THREE.MeshLambertMaterial({ color: 0x34434a }),
  car: new THREE.MeshLambertMaterial({ color: 0xc8d2d4 }),
  carAccent: new THREE.MeshLambertMaterial({ color: 0x6f9caf })
};
const decorBoxGeometry = new THREE.BoxGeometry(1, 1, 1);
function addBox(position, size, material, isObstacle = true) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  mesh.position.set(...position); mesh.castShadow = isObstacle; mesh.receiveShadow = isObstacle; scene.add(mesh);
  if (isObstacle) obstacles.push({ mesh, minX: position[0] - size[0] / 2, maxX: position[0] + size[0] / 2, minZ: position[2] - size[2] / 2, maxZ: position[2] + size[2] / 2 });
  return mesh;
}
function addDecorBox(position, size, material) {
  const mesh = new THREE.Mesh(decorBoxGeometry, material);
  mesh.position.set(...position); mesh.scale.set(...size); mesh.receiveShadow = true; scene.add(mesh);
  return mesh;
}
function addRoadMark(position, size, material = materials.roadMark) { addDecorBox(position, size, material); }
function addTree(x, z, scale = 1) {
  addDecorBox([x, 1.1 * scale, z], [0.22 * scale, 2.2 * scale, 0.22 * scale], materials.trunk);
  const canopy = new THREE.Mesh(new THREE.DodecahedronGeometry(1.25 * scale, 1), Math.random() > 0.5 ? materials.canopy : materials.canopyLight);
  canopy.position.set(x, 2.7 * scale, z); canopy.castShadow = true; scene.add(canopy);
}
function addStreetlight(x, z, rotation = 0) {
  const pole = addDecorBox([x, 2.2, z], [0.12, 4.4, 0.12], materials.propDark); pole.rotation.y = rotation;
  addDecorBox([x + Math.sin(rotation) * 0.55, 4.35, z + Math.cos(rotation) * 0.55], [1.1, 0.08, 0.08], materials.propDark);
  addDecorBox([x + Math.sin(rotation) * 1.02, 4.22, z + Math.cos(rotation) * 1.02], [0.18, 0.12, 0.18], materials.concrete);
}
function addCrosswalk(x, z, horizontal = true) {
  for (let i = -3; i <= 3; i += 1) addRoadMark(horizontal ? [x + i * 1.1, 0.035, z] : [x, 0.035, z + i * 1.1], horizontal ? [0.62, 0.025, 4.2] : [4.2, 0.025, 0.62]);
}
function addPark(x, z, width, depth) {
  addDecorBox([x, 0.02, z], [width, 0.08, depth], materials.grass);
  addDecorBox([x, 0.07, z], [Math.min(width - 1, 2), 0.03, depth], materials.sidewalk);
  addDecorBox([x, 0.08, z], [width, 0.03, Math.min(depth - 1, 2)], materials.sidewalk);
  const points = [[x - width * 0.32, z - depth * 0.28], [x + width * 0.3, z - depth * 0.22], [x - width * 0.25, z + depth * 0.3], [x + width * 0.28, z + depth * 0.28]];
  points.forEach(([treeX, treeZ], index) => addTree(treeX, treeZ, 0.8 + (index % 2) * 0.12));
  addDecorBox([x, 0.45, z], [1.2, 0.45, 0.18], materials.propDark);
}
function addFacadeGrid(x, z, width, height, depth, glassMaterial = materials.glass) {
  for (const frontZ of [z - depth / 2 - 0.012, z + depth / 2 + 0.012]) {
    for (let column = -1; column <= 1; column += 1) addDecorBox([x + column * width * 0.28, height * 0.52, frontZ], [0.08, height * 0.88, 0.05], materials.frame);
    for (let floor = 1; floor < Math.max(2, Math.floor(height / 3)); floor += 1) addDecorBox([x, floor * 3, frontZ], [width * 0.88, 0.08, 0.05], materials.frame);
    addDecorBox([x, height * 0.52, frontZ], [width * 0.94, height * 0.86, 0.03], glassMaterial);
  }
}
function addBuilding({ x, z, width, depth, height, type = "glass", landmark = false }) {
  const bodyMaterial = type === "warm" ? materials.terracotta : type === "concrete" ? materials.concrete : materials.glassDark;
  addBox([x, height / 2, z], [width, height, depth], bodyMaterial);
  if (type !== "concrete") addFacadeGrid(x, z, width, height, depth, type === "warm" ? materials.glass : materials.glass);
  if (type === "concrete") {
    for (let floor = 1; floor < Math.floor(height / 2.5); floor += 1) addDecorBox([x, floor * 2.5, z - depth / 2 - 0.02], [width * 0.76, 0.06, 0.05], materials.glassDark);
  }
  addDecorBox([x, height + 0.12, z], [width + 0.18, 0.25, depth + 0.18], materials.roof);
  if (landmark) {
    addDecorBox([x, height + 1.1, z], [width * 0.38, 1.8, depth * 0.38], materials.frame);
    addDecorBox([x, height + 2.08, z], [width * 0.2, 0.12, depth * 0.2], materials.yellowMark);
  } else {
    addDecorBox([x - width * 0.22, height + 0.5, z + depth * 0.18], [width * 0.16, 0.5, depth * 0.18], materials.concrete);
    addDecorBox([x + width * 0.2, height + 0.4, z - depth * 0.2], [width * 0.12, 0.4, depth * 0.12], materials.roof);
  }
}
function addCar(x, z, rotation = 0, color = materials.car) {
  const car = addDecorBox([x, 0.35, z], [1.4, 0.45, 2.7], color); car.rotation.y = rotation;
  const window = addDecorBox([x, 0.63, z], [0.9, 0.18, 1.1], materials.carAccent); window.rotation.y = rotation;
}

addDecorBox([0, -0.35, 0], [tuning.arena.size, 0.5, tuning.arena.size], materials.asphalt);
for (const axis of [-27, 0, 27]) {
  addDecorBox([0, 0.005, axis], [tuning.arena.size, 0.03, axis === 0 ? 14 : 10], materials.asphalt);
  addDecorBox([axis, 0.006, 0], [axis === 0 ? 14 : 10, 0.03, tuning.arena.size], materials.asphalt);
}
for (const coordinate of [-36, -18, 18, 36]) {
  addDecorBox([coordinate, 0.04, -13], [10, 0.12, 4], materials.sidewalk);
  addDecorBox([coordinate, 0.04, 13], [10, 0.12, 4], materials.sidewalk);
  addDecorBox([-13, 0.04, coordinate], [4, 0.12, 10], materials.sidewalk);
  addDecorBox([13, 0.04, coordinate], [4, 0.12, 10], materials.sidewalk);
}
for (let x = -40; x <= 40; x += 4) { addRoadMark([x, 0.04, 0], [2.1, 0.025, 0.12], materials.yellowMark); addRoadMark([x, 0.04, 27], [2.1, 0.025, 0.12], materials.roadMark); }
for (let z = -40; z <= 40; z += 4) addRoadMark([0, 0.04, z], [0.12, 0.025, 2.1], materials.roadMark);
[-27, 0, 27].forEach((coordinate) => { addCrosswalk(coordinate, -7, true); addCrosswalk(coordinate, 7, true); addCrosswalk(-7, coordinate, false); addCrosswalk(7, coordinate, false); });
[-36, -18, 18, 36].forEach((coordinate) => { addStreetlight(coordinate, -8, 0); addStreetlight(-8, coordinate, Math.PI / 2); addTree(coordinate, -11, 0.72); addTree(11, coordinate, 0.72); });
addPark(-22, 22, 13, 11); addPark(23, -22, 12, 12);
addBuilding({ x: -22, z: -22, width: 9, depth: 9, height: 22, type: "glass" });
addBuilding({ x: 22, z: -22, width: 10, depth: 8, height: 34, type: "glass", landmark: true });
addBuilding({ x: -22, z: 22, width: 10, depth: 10, height: 13, type: "warm" });
addBuilding({ x: 22, z: 22, width: 11, depth: 9, height: 18, type: "concrete" });
addBuilding({ x: -34, z: -22, width: 6, depth: 8, height: 10, type: "warm" });
addBuilding({ x: 34, z: -22, width: 7, depth: 8, height: 15, type: "glass" });
addBuilding({ x: -34, z: 22, width: 7, depth: 8, height: 9, type: "concrete" });
addBuilding({ x: 34, z: 22, width: 7, depth: 8, height: 12, type: "warm" });
addBuilding({ x: -22, z: -36, width: 9, depth: 6, height: 11, type: "concrete" });
addBuilding({ x: 22, z: -36, width: 9, depth: 6, height: 16, type: "glass" });
addBuilding({ x: -22, z: 36, width: 9, depth: 6, height: 9, type: "warm" });
addBuilding({ x: 22, z: 36, width: 10, depth: 6, height: 20, type: "glass" });
addCar(-10, -4, 0); addCar(10, 4, Math.PI); addCar(-4, 10, Math.PI / 2, materials.terracotta); addCar(4, -10, -Math.PI / 2, materials.car);
const grid = new THREE.GridHelper(tuning.arena.size, 16, 0xa7b6b4, 0xc2ceca); grid.position.y = 0.015; grid.material.opacity = 0.18; grid.material.transparent = true; scene.add(grid);
const obstacleMeshes = obstacles.map((obstacle) => obstacle.mesh);

function createMech(color) {
  const root = new THREE.Group();
  const standingGroup = new THREE.Group();
  const gerwalkGroup = new THREE.Group();
  let buildTarget = standingGroup;
  const base = new THREE.MeshLambertMaterial({ color });
  const blue = new THREE.MeshLambertMaterial({ color: color === 0x1988e8 ? 0x1766c1 : 0xb42331 });
  const light = new THREE.MeshLambertMaterial({ color: color === 0x1988e8 ? 0x9dc8f0 : 0xff9da4 });
  const dark = new THREE.MeshLambertMaterial({ color: color === 0x1988e8 ? 0x202b36 : 0x431d22 });
  const canopy = new THREE.MeshLambertMaterial({ color: color === 0x1988e8 ? 0x1652a1 : 0x7c1f2d });
  const edge = new THREE.MeshLambertMaterial({ color: color === 0x1988e8 ? 0xd9eaff : 0xffd2d5 });
  const gun = new THREE.MeshLambertMaterial({ color: 0x242b32 });
  function add(geometry, position, material = base, rotation = null) {
    const mesh = new THREE.Mesh(geometry, material); mesh.position.set(...position);
    if (rotation) mesh.rotation.set(...rotation); mesh.castShadow = true; mesh.receiveShadow = true; buildTarget.add(mesh); return mesh;
  }
  function box(position, size, material = base, rotation = null) { const segments = buildTarget === standingGroup ? 2 : 1; return add(new THREE.BoxGeometry(size[0], size[1], size[2], segments, 1, 1), position, material, rotation); }
  function mirrored(x, y, z, size, material = base, rotation = null) {
    box([x, y, z], size, material, rotation);
    box([-x, y, z], size, material, rotation ? [-rotation[0], rotation[1], -rotation[2]] : null);
  }

  // Standing combat/default configuration.
  box([0, 2.95, 0], [1.75, 1.55, 1.05], base);
  box([0, 3.45, 0.18], [1.45, 0.62, 0.8], light, [-0.1, 0, 0]);
  box([0, 2.72, 0.58], [1.2, 0.7, 0.32], blue, [-0.08, 0, 0]);
  box([0, 2.92, 0.78], [0.55, 0.28, 0.08], dark);
  mirrored(0.52, 3.18, 0.62, [0.3, 0.34, 0.12], edge, [0.12, 0, -0.08]);
  mirrored(0.76, 2.82, 0.2, [0.3, 0.66, 0.78], light, [0.05, 0, -0.08]);
  box([0, 4.08, 0.04], [0.95, 0.75, 0.88], light, [-0.05, 0, 0]);
  box([0, 3.92, 0.48], [0.62, 0.28, 0.12], canopy);
  box([0, 4.22, -0.38], [0.72, 0.25, 0.5], blue);
  box([0, 4.38, -0.05], [0.42, 0.18, 0.24], dark);
  mirrored(0.68, 4.22, -0.12, [0.22, 0.62, 0.28], blue);
  mirrored(0.66, 4.55, -0.08, [0.14, 0.55, 0.16], light);
  box([0, 4.73, -0.03], [0.12, 0.42, 0.12], edge, [0, 0, -0.12]);
  mirrored(1.17, 3.43, 0, [0.72, 0.76, 0.9], light, [0, 0, -0.08]);
  mirrored(1.38, 3.18, 0.05, [0.28, 0.48, 0.62], blue, [0.08, 0, -0.08]);
  mirrored(1.25, 2.72, 0, [0.42, 0.86, 0.5], base, [0.05, 0, -0.05]);
  mirrored(1.22, 2.2, 0.1, [0.5, 0.56, 0.58], light, [0.12, 0, -0.06]);
  mirrored(1.2, 1.82, 0.15, [0.38, 0.3, 0.38], dark);
  mirrored(1.2, 1.62, 0.2, [0.34, 0.25, 0.34], blue);
  mirrored(0.86, 3.9, -0.5, [0.3, 1.5, 0.36], dark, [0.08, 0, -0.04]);
  mirrored(0.86, 4.48, -0.5, [0.22, 1.25, 0.3], blue, [0.02, 0, -0.04]);
  for (const x of [-0.48, 0.48]) {
    add(new THREE.CylinderGeometry(0.28, 0.34, 0.08, 10), [x, 4.02, -0.62], dark, [Math.PI / 2, 0, 0]);
    add(new THREE.CylinderGeometry(0.22, 0.25, 0.06, 10), [x, 4.08, -0.66], edge, [Math.PI / 2, 0, 0]);
  }
  box([0, 2.0, 0], [1.45, 0.4, 0.85], dark);
  mirrored(0.62, 2.05, 0.28, [0.5, 0.55, 0.55], light, [0.05, 0, -0.06]);
  mirrored(0.9, 1.92, 0.28, [0.3, 0.48, 0.42], blue, [0.05, 0, -0.08]);
  mirrored(0.58, 1.32, 0, [0.62, 1.0, 0.72], base);
  mirrored(0.58, 1.16, 0.38, [0.5, 0.18, 0.48], edge);
  mirrored(0.58, 0.66, 0.02, [0.66, 0.78, 0.78], light);
  mirrored(0.58, 0.36, 0.38, [0.52, 0.24, 0.5], blue);
  mirrored(0.58, 0.1, 0.52, [0.72, 0.2, 1.0], edge);
  mirrored(0.58, 0.08, 1.05, [0.76, 0.18, 0.42], blue);
  mirrored(0.58, 0.82, -0.34, [0.22, 0.54, 0.32], blue);
  mirrored(0.58, 0.42, -0.34, [0.24, 0.48, 0.34], dark);
  mirrored(1.45, 2.42, 0.08, [0.16, 1.35, 0.48], light, [0.04, 0, -0.08]);
  box([1.64, 2.38, 0.38], [0.14, 1.1, 0.18], blue);
  // One continuous beveled rifle silhouette; the receiver, stock and barrel share one mesh.
  const rifleProfile = new THREE.Shape();
  rifleProfile.moveTo(-0.28, -1.92); rifleProfile.lineTo(0.24, -1.92); rifleProfile.lineTo(0.24, -0.55);
  rifleProfile.lineTo(0.38, -0.28); rifleProfile.lineTo(0.22, 0.02); rifleProfile.lineTo(0.24, 1.22);
  rifleProfile.lineTo(0.13, 1.62); rifleProfile.lineTo(-0.14, 1.62); rifleProfile.lineTo(-0.22, 0.45);
  rifleProfile.lineTo(-0.38, 0.18); rifleProfile.lineTo(-0.24, -0.18); rifleProfile.closePath();
  add(new THREE.ExtrudeGeometry(rifleProfile, { depth: 0.34, steps: 1, bevelEnabled: true, bevelSegments: 2, bevelSize: 0.045, bevelThickness: 0.045 }), [-1.52, 1.92, 0.25], gun);

  // Separate Gerwalk/sliding configuration, based on the earlier transformed jet-mech silhouette.
  buildTarget = gerwalkGroup;
  box([0, 2.45, -0.25], [1.8, 1.1, 2.6], base, [0.14, 0, 0]);
  const nose = add(new THREE.ConeGeometry(0.5, 1, 5), [0, 2.65, 1.3], light, [Math.PI / 2, 0, 0]); nose.scale.set(1.65, 1.35, 2.4);
  box([0, 3.2, 0.25], [1.05, 0.72, 1.35], canopy, [0.16, 0, 0]);
  box([0, 3.02, 1.15], [0.7, 0.36, 0.62], blue, [0.25, 0, 0]);
  box([0, 2.05, 1.62], [0.5, 0.45, 1.0], blue, [0.34, 0, 0]);
  box([0, 2.7, -1.72], [1.45, 1.05, 0.7], dark);
  mirrored(1.02, 2.55, -0.15, [0.35, 0.95, 1.9], light, [0.08, 0.12, -0.12]);
  mirrored(1.4, 2.65, 0.65, [0.22, 0.48, 1.25], blue, [0.08, 0.18, -0.2]);
  mirrored(2.0, 2.6, -0.15, [2.35, 0.16, 0.72], light, [0.12, 0.16, -0.08]);
  mirrored(2.55, 2.52, 0.45, [1.8, 0.13, 0.42], blue, [0.18, 0.3, -0.16]);
  mirrored(1.0, 3.65, -0.92, [0.28, 1.9, 0.65], light, [-0.18, 0, -0.1]);
  mirrored(0.58, 3.74, -1.18, [0.18, 1.1, 0.4], blue, [-0.3, 0, -0.08]);
  mirrored(0.72, 1.45, -0.35, [0.62, 1.3, 0.72], dark, [0.18, 0, -0.18]);
  mirrored(0.98, 0.9, 0.25, [0.72, 1.18, 0.9], light, [-0.18, 0, -0.18]);
  mirrored(1.05, 0.34, 1.05, [0.72, 0.5, 1.15], blue, [0.08, 0, -0.1]);
  mirrored(1.0, 0.18, 1.75, [0.95, 0.3, 1.2], edge, [0.02, 0, -0.1]);
  mirrored(1.0, 0.1, 2.18, [1.0, 0.22, 0.45], blue, [0, 0, -0.08]);
  for (const x of [-0.55, 0.55]) {
    add(new THREE.CylinderGeometry(0.42, 0.5, 0.72, 10), [x, 2.6, -2.0], dark, [Math.PI / 2, 0, 0]);
    add(new THREE.CylinderGeometry(0.24, 0.32, 0.04, 10), [x, 2.6, -2.38], blue, [Math.PI / 2, 0, 0]);
  }
  box([0, 2.72, -2.05], [1.55, 0.95, 0.42], dark);
  mirrored(0.48, 3.45, -1.7, [0.22, 1.18, 0.45], edge, [0.1, 0, -0.08]);
  box([1.95, 2.3, 1.65], [0.38, 0.4, 1.85], gun, [0.06, 0, 0]);
  box([1.95, 2.25, 2.72], [0.28, 0.28, 0.75], gun);
  box([1.95, 2.48, 1.55], [0.6, 0.22, 0.38], dark);

  root.add(standingGroup, gerwalkGroup);
  root.userData.standingGroup = standingGroup;
  root.userData.gerwalkGroup = gerwalkGroup;
  root.userData.pose = "standing";
  gerwalkGroup.visible = false;
  scene.add(root); return root;
}function createMechState(color, position, mode, yaw = 0) {
  return { object3D: createMech(color), position: position.clone(), velocity: new THREE.Vector3(), mode, health: tuning.player.health, gunCooldown: 0, missileCooldown: 0, dead: 0, deathEffect: 0, yaw, aiTimer: 0, aiDirection: new THREE.Vector3(1, 0, 0), botMissileTimer: 0 };
}
const player = createMechState(0x1988e8, new THREE.Vector3(0, 0, 27), "combat");
const bot = createMechState(0xe23d49, new THREE.Vector3(0, 0, -27), "combat", Math.PI);
player.object3D.position.copy(player.position); bot.object3D.position.copy(bot.position); bot.object3D.rotation.y = bot.yaw;

function isBlocked(position, radius = tuning.arena.mechCollisionRadius) {
  const edge = tuning.arena.size / 2 - radius;
  if (position.x < -edge || position.x > edge || position.z < -edge || position.z > edge) return true;
  return obstacles.some((obstacle) => position.x > obstacle.minX - radius && position.x < obstacle.maxX + radius && position.z > obstacle.minZ - radius && position.z < obstacle.maxZ + radius);
}
function moveWithCollision(mech, delta) {
  const nextX = mech.position.clone(); nextX.x += delta.x; if (!isBlocked(nextX)) mech.position.x = nextX.x; else mech.velocity.x = 0;
  const nextZ = mech.position.clone(); nextZ.z += delta.z; if (!isBlocked(nextZ)) mech.position.z = nextZ.z; else mech.velocity.z = 0;
}
function setMode(mech, mode) { if (mech.mode === mode) return; mech.mode = mode; if (mode === "combat") mech.velocity.multiplyScalar(tuning.player.combatMomentumRetention); }
function getCombatDirection(intentions, referenceYaw) { return new THREE.Vector3(intentions.moveX, 0, -intentions.moveY).applyAxisAngle(new THREE.Vector3(0, 1, 0), referenceYaw); }
function updateDeathState(mech, delta) {
  mech.dead -= delta; mech.deathEffect -= delta;
  if (mech.deathEffect > 0) { mech.object3D.visible = true; mech.object3D.scale.setScalar(Math.max(0.15, mech.deathEffect / tuning.respawn.deathEffectDuration)); }
  else mech.object3D.visible = false;
  if (mech.dead <= 0) respawn(mech);
}
function updateMech(mech, intentions, delta, combatDirection = null) {
  if (mech.dead > 0) { updateDeathState(mech, delta); return; }
  const moving = Math.abs(intentions.moveX) + Math.abs(intentions.moveY) > 0;
  if (mech.mode === "combat") {
    const direction = combatDirection ? combatDirection.clone() : getCombatDirection(intentions, mech.yaw);
    if (direction.lengthSq() > 1) direction.normalize();
    const targetVelocity = direction.multiplyScalar(tuning.player.combatSpeed);
    const blend = Math.min(1, tuning.player.combatAcceleration * delta / Math.max(tuning.player.combatSpeed, 1));
    mech.velocity.lerp(targetVelocity, blend);
    if (!moving) mech.velocity.multiplyScalar(Math.max(0, 1 - tuning.player.combatFriction * delta / Math.max(mech.velocity.length(), 1)));
    if (mech.velocity.lengthSq() > 0.1) mech.yaw = Math.atan2(mech.velocity.x, mech.velocity.z);
  } else {
    const forward = new THREE.Vector3(Math.sin(mech.yaw), 0, Math.cos(mech.yaw));
    mech.yaw += intentions.moveX * tuning.player.glideSteering * delta;
    if (intentions.moveY > 0) mech.velocity.add(forward.multiplyScalar(tuning.player.glideAcceleration * delta));
    if (intentions.moveY < 0) mech.velocity.multiplyScalar(Math.max(0, 1 - tuning.player.glideFriction * delta));
    if (mech.velocity.length() > tuning.player.glideMaxSpeed) mech.velocity.setLength(tuning.player.glideMaxSpeed);
  }
  moveWithCollision(mech, mech.velocity.clone().multiplyScalar(delta)); mech.object3D.position.copy(mech.position);
  const gerwalk = mech.mode === "glide";
  mech.object3D.position.y = gerwalk ? -0.08 : 0; mech.object3D.rotation.y = mech.yaw;
  mech.object3D.rotation.x = gerwalk ? 0.12 : 0;
  mech.object3D.rotation.z = gerwalk ? -THREE.MathUtils.clamp(mech.velocity.length() / tuning.player.glideMaxSpeed, 0, 0.18) : 0;
  mech.object3D.scale.set(1, 1, 1);
  mech.object3D.userData.standingGroup.visible = !gerwalk;
  mech.object3D.userData.gerwalkGroup.visible = gerwalk;
  mech.object3D.userData.pose = gerwalk ? "gerwalk" : "standing";
}
const spawnPoints = [new THREE.Vector3(0, 0, 27), new THREE.Vector3(0, 0, -27), new THREE.Vector3(27, 0, 0), new THREE.Vector3(-27, 0, 0)];
function respawn(mech) {
  const spawn = spawnPoints[Math.floor(Math.random() * spawnPoints.length)]; mech.position.copy(spawn); mech.velocity.set(0, 0, 0); mech.health = tuning.player.health; mech.dead = 0; mech.deathEffect = 0;
  mech.object3D.visible = true; mech.object3D.scale.setScalar(1);
}
function damage(mech, amount) {
  if (mech.dead > 0) return; mech.health = Math.max(0, mech.health - amount);
  if (mech.health === 0) { mech.dead = tuning.respawn.delay; mech.deathEffect = tuning.respawn.deathEffectDuration; mech.velocity.set(0, 0, 0); showMessage("MECH DESTROYED"); }
}

const raycaster = new THREE.Raycaster();
function hasLineOfSight(from, to) {
  const direction = to.clone().sub(from); const distance = direction.length(); if (distance === 0) return true;
  raycaster.set(from, direction.normalize()); return raycaster.intersectObjects(obstacleMeshes, false).every((hit) => hit.distance >= distance);
}
function getWeaponAim(shooter, target, origin) {
  const aim = new THREE.Vector3();
  if (shooter === player) {
    camera.getWorldDirection(aim);
    const targetPoint = target.position.clone().add(new THREE.Vector3(0, 2.2, 0)); const toTarget = targetPoint.clone().sub(origin).normalize();
    const distance = shooter.position.distanceTo(target.position); const angle = aim.angleTo(toTarget);
    if (distance <= tuning.gun.assistMaxRange && angle <= tuning.gun.assistAngle && hasLineOfSight(origin, targetPoint)) aim.lerp(toTarget, THREE.MathUtils.clamp(tuning.gun.assistStrength * (1 - distance / tuning.gun.assistMaxRange), 0, 1));
  } else aim.copy(target.position).add(new THREE.Vector3(0, 2.2, 0)).sub(origin).normalize();
  return aim.normalize();
}
const projectiles = [];
function fireGun(shooter, target) {
  if (shooter.gunCooldown > 0 || shooter.dead > 0 || target.dead > 0) return;
  const distance = shooter.position.distanceTo(target.position); const rangeRatio = THREE.MathUtils.clamp(distance / tuning.gun.assistMaxRange, 0, 1);
  const spread = THREE.MathUtils.lerp(tuning.gun.closeSpread, tuning.gun.farSpread, rangeRatio); const origin = shooter.position.clone().add(new THREE.Vector3(0, 2.5, 0));
  const aim = getWeaponAim(shooter, target, origin).add(new THREE.Vector3((Math.random() - 0.5) * spread, (Math.random() - 0.5) * spread, (Math.random() - 0.5) * spread)).normalize();
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 4), new THREE.MeshBasicMaterial({ color: shooter === player ? 0x9edcff : 0xffc1c4 })); mesh.position.copy(origin); scene.add(mesh);
  projectiles.push({ mesh, position: origin, velocity: aim.multiplyScalar(tuning.gun.projectileSpeed), target, damage: tuning.gun.damage, life: tuning.projectiles.gunLife, missile: false });
  shooter.gunCooldown = 1 / Math.max(tuning.gun.fireRate, 0.01);
}
function fireMissiles(shooter, target) {
  if (shooter.missileCooldown > 0 || shooter.dead > 0 || target.dead > 0) return;
  const origin = shooter.position.clone().add(new THREE.Vector3(0, 2.5, 0)); const volleySize = Math.max(1, Math.floor(tuning.missiles.volleySize));
  for (let index = 0; index < volleySize; index += 1) {
    const aim = target.position.clone().add(new THREE.Vector3(0, 2.1, 0)).sub(origin).normalize(); aim.x += (index - (volleySize - 1) / 2) * 0.09;
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 5), new THREE.MeshBasicMaterial({ color: 0xffbc55 })); mesh.position.copy(origin); scene.add(mesh);
    projectiles.push({ mesh, position: origin.clone(), velocity: aim.multiplyScalar(tuning.missiles.speed), target, damage: tuning.missiles.damage, life: tuning.projectiles.missileLife, missile: true });
  }
  shooter.missileCooldown = tuning.missiles.cooldown;
}
function segmentHitsTarget(start, end, target, radius) {
  const segment = end.clone().sub(start); const lengthSquared = segment.lengthSq(); const center = target.position.clone().add(new THREE.Vector3(0, 2, 0));
  const amount = lengthSquared === 0 ? 0 : THREE.MathUtils.clamp(center.clone().sub(start).dot(segment) / lengthSquared, 0, 1);
  return start.clone().addScaledVector(segment, amount).distanceTo(center) < radius;
}
function segmentHitsBuilding(start, end) {
  const direction = end.clone().sub(start); const distance = direction.length(); if (distance === 0) return false;
  raycaster.set(start, direction.normalize()); return raycaster.intersectObjects(obstacleMeshes, false).some((hit) => hit.distance <= distance);
}
function removeProjectile(index) {
  const shot = projectiles[index]; scene.remove(shot.mesh); shot.mesh.geometry.dispose(); shot.mesh.material.dispose(); projectiles.splice(index, 1);
}
function updateProjectiles(delta) {
  for (let index = projectiles.length - 1; index >= 0; index -= 1) {
    const shot = projectiles[index]; const previousPosition = shot.position.clone(); shot.life -= delta;
    if (shot.missile && shot.target.dead <= 0) {
      const desired = shot.target.position.clone().add(new THREE.Vector3(0, 2, 0)).sub(shot.position).normalize(); const currentDirection = shot.velocity.clone().normalize(); const turnAxis = currentDirection.clone().cross(desired);
      if (turnAxis.lengthSq() > 0.0001) shot.velocity.applyAxisAngle(turnAxis.normalize(), Math.min(currentDirection.angleTo(desired), tuning.missiles.turnRate * delta));
      const distance = shot.position.distanceTo(shot.target.position); const range = Math.max(tuning.missiles.farRange - tuning.missiles.closeRange, 1);
      const homing = THREE.MathUtils.lerp(tuning.missiles.closeHoming, tuning.missiles.farHoming, THREE.MathUtils.clamp((distance - tuning.missiles.closeRange) / range, 0, 1));
      shot.velocity.lerp(desired.multiplyScalar(tuning.missiles.speed), homing * delta * 3);
    }
    shot.position.addScaledVector(shot.velocity, delta); shot.mesh.position.copy(shot.position);
    const radius = shot.missile ? tuning.projectiles.missileHitRadius : tuning.projectiles.gunHitRadius;
    const hitsTarget = shot.target.dead <= 0 && segmentHitsTarget(previousPosition, shot.position, shot.target, radius);
    const hitsBuilding = segmentHitsBuilding(previousPosition, shot.position); const outsideArena = Math.abs(shot.position.x) > tuning.arena.size || Math.abs(shot.position.z) > tuning.arena.size;
    if (hitsTarget) damage(shot.target, shot.damage);
    if (hitsTarget || hitsBuilding || shot.life <= 0 || outsideArena) removeProjectile(index);
  }
}

function updateBot(delta) {
  if (bot.dead > 0) { updateMech(bot, { moveX: 0, moveY: 0 }, delta); return; }
  bot.aiTimer -= delta;
  if (bot.aiTimer <= 0) {
    bot.aiTimer = tuning.bot.directionChangeMin + Math.random() * Math.max(tuning.bot.directionChangeMax - tuning.bot.directionChangeMin, 0);
    const toPlayer = player.position.clone().sub(bot.position); const side = new THREE.Vector3(-toPlayer.z, 0, toPlayer.x).normalize().multiplyScalar(Math.random() > 0.5 ? 1 : -1);
    bot.aiDirection.copy(toPlayer.normalize().multiplyScalar(0.65).add(side.multiplyScalar(0.8))).normalize(); if (Math.random() < 0.35) setMode(bot, bot.mode === "glide" ? "combat" : "glide");
  }
  const turn = Math.atan2(bot.aiDirection.x, bot.aiDirection.z) - bot.yaw; bot.yaw += THREE.MathUtils.clamp(Math.atan2(Math.sin(turn), Math.cos(turn)), -tuning.bot.steeringRate * delta, tuning.bot.steeringRate * delta);
  const botInput = { moveX: 0, moveY: 1 }; updateMech(bot, botInput, delta, bot.aiDirection.clone()); bot.gunCooldown -= delta; bot.missileCooldown -= delta;
  if (Math.random() < delta * tuning.bot.gunChance) fireGun(bot, player); bot.botMissileTimer -= delta;
  if (bot.botMissileTimer <= 0 && Math.random() < delta * tuning.bot.missileChance) { fireMissiles(bot, player); bot.botMissileTimer = tuning.bot.missileInterval; }
}

let cameraYaw = 0.7; let cameraPitch = 0.22; let lastSpace = false; let lastMissile = false; let messageTimer = 0;
function updateCamera(delta) {
  cameraYaw += input.cameraX * tuning.camera.rotateSpeed * delta; cameraPitch = THREE.MathUtils.clamp(cameraPitch + input.cameraY * tuning.camera.pitchSpeed * delta, -0.15, 0.8);
  const focus = player.position.clone().add(new THREE.Vector3(0, 2.2, 0)); const offset = new THREE.Vector3(0, tuning.camera.height, tuning.camera.distance).applyEuler(new THREE.Euler(cameraPitch, cameraYaw, 0, "YXZ"));
  camera.position.lerp(focus.clone().add(offset), Math.min(1, delta * tuning.camera.followSpeed)); camera.lookAt(focus);
}
function showMessage(text) { const element = document.querySelector("#message"); element.textContent = text; element.style.opacity = "1"; messageTimer = 0.7; }

function updateRadar() {
  const target = document.querySelector("#radar-target"); const status = document.querySelector("#radar-status");
  const range = Math.max(tuning.radar.range, 1); const offset = bot.position.clone().sub(player.position); const distance = offset.length();
  const angle = Math.atan2(offset.x, offset.z) - player.yaw; const radius = 56; const distanceRatio = Math.min(distance / range, 1);
  target.style.transform = `translate(${Math.sin(angle) * radius * distanceRatio}px, ${-Math.cos(angle) * radius * distanceRatio}px)`;
  target.classList.toggle("radar-target-out", distance > range); target.classList.toggle("radar-target-blocked", !hasLineOfSight(player.position.clone().add(new THREE.Vector3(0, 2, 0)), bot.position.clone().add(new THREE.Vector3(0, 2, 0))));
  status.textContent = distance > range ? "OUT OF RANGE" : target.classList.contains("radar-target-blocked") ? "BLOCKED" : "TRACKING";
  document.querySelector("#radar-range-text").textContent = `${Math.round(range)}m`;
  document.querySelector("#radar-sweep").style.transform = `rotate(${performance.now() / 1600 % (Math.PI * 2)}rad)`;
}

function createTuningUI() {
  const container = document.querySelector("#tuning-controls");
  for (const [groupName, group] of Object.entries(tuning)) {
    const groupElement = document.createElement("div"); groupElement.className = "tuning-group"; groupElement.innerHTML = `<h3>${groupName.toUpperCase()}</h3>`;
    for (const [name, value] of Object.entries(group)) {
      const field = document.createElement("div"); field.className = "tuning-field"; const label = document.createElement("label"); label.textContent = name;
      const number = document.createElement("input"); number.type = "number"; number.step = "any"; number.min = name === "health" ? "1" : "0"; number.value = value;
      const range = document.createElement("input"); range.type = "range"; range.min = number.min; range.max = Math.max(value * 3, 1); range.step = "any"; range.value = value;
      number.dataset.group = range.dataset.group = groupName; number.dataset.name = range.dataset.name = name; field.append(label, number, range); groupElement.append(field);
      const update = (event) => { const next = Math.max(Number(number.min), Number(event.target.value)); if (!Number.isFinite(next)) return; tuning[groupName][name] = next; number.value = next; range.value = next; range.max = Math.max(Number(range.max), next, 1); };
      number.addEventListener("input", update); range.addEventListener("input", update);
    }
    container.append(groupElement);
  }
}
function syncTuningUI() { document.querySelectorAll("#tuning-controls input").forEach((inputElement) => { const value = tuning[inputElement.dataset.group][inputElement.dataset.name]; inputElement.value = value; if (inputElement.type === "range") inputElement.max = Math.max(Number(inputElement.max), value, 1); }); }
document.querySelector("#tuning-toggle").addEventListener("click", () => { const panel = document.querySelector("#tuning-panel"); panel.classList.toggle("collapsed"); document.querySelector("#tuning-toggle span").textContent = panel.classList.contains("collapsed") ? "+" : "−"; });
document.querySelector("#reset-tuning").addEventListener("click", () => { for (const [group, values] of Object.entries(tuningDefaults)) Object.assign(tuning[group], structuredClone(values)); player.health = tuning.player.health; bot.health = tuning.player.health; syncTuningUI(); showMessage("TUNING RESET"); });
document.querySelector("#copy-tuning").addEventListener("click", async () => { try { await navigator.clipboard.writeText(JSON.stringify(tuning, null, 2)); showMessage("TUNING COPIED"); } catch { showMessage("COPY BLOCKED"); } });
createTuningUI();

const clock = new THREE.Clock(); let frameCounter = 0; let fpsTimer = 0; let fps = 0;
function updateHUD(delta) {
  frameCounter += 1; fpsTimer += delta; if (fpsTimer >= 1) { fps = frameCounter; frameCounter = 0; fpsTimer = 0; }
  const distance = player.position.distanceTo(bot.position); const set = (id, value) => { document.querySelector(id).textContent = value; };
  set("#mode", player.mode.toUpperCase()); set("#speed", player.velocity.length().toFixed(1)); set("#distance", distance.toFixed(1)); set("#fps", fps);
  set("#gun-status", player.gunCooldown > 0 ? player.gunCooldown.toFixed(1) : "READY"); set("#missile-status", player.missileCooldown > 0 ? player.missileCooldown.toFixed(1) : "READY"); set("#player-health-text", Math.ceil(player.health)); set("#bot-health-text", Math.ceil(bot.health));
  const healthMaximum = Math.max(tuning.player.health, 1); document.querySelector("#player-health").style.width = `${Math.max(0, player.health / healthMaximum * 100)}%`; document.querySelector("#bot-health").style.width = `${Math.max(0, bot.health / healthMaximum * 100)}%`;
  document.querySelector("#reticle").style.borderColor = distance < tuning.gun.assistMaxRange * 0.35 ? "#fff" : "rgba(255,255,255,.55)";
  updateRadar();
}
function animate() {
  requestAnimationFrame(animate); const delta = Math.min(clock.getDelta(), 0.05); readInput();
  if (messageTimer > 0) { messageTimer -= delta; if (messageTimer <= 0) document.querySelector("#message").style.opacity = "0"; }
  if (input.switchMode && !lastSpace && player.dead <= 0) setMode(player, player.mode === "combat" ? "glide" : "combat"); lastSpace = input.switchMode;
  if (input.fireMissile && !lastMissile) fireMissiles(player, bot); lastMissile = input.fireMissile; player.gunCooldown -= delta; player.missileCooldown -= delta;
  const playerCombatDirection = getCombatDirection(input, cameraYaw); updateMech(player, input, delta, playerCombatDirection); if (input.fireGun) fireGun(player, bot);
  updateBot(delta); updateProjectiles(delta); updateCamera(delta); updateHUD(delta); renderer.render(scene, camera);
}
addEventListener("resize", () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });
camera.position.set(-27, 8, 35); animate();









