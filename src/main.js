import * as THREE from "three";

const tuningDefaults = {
  player: { health: 100, combatSpeed: 12, combatAcceleration: 52, combatFriction: 34, glideAcceleration: 30, glideMaxSpeed: 45, glideSteering: 2.8, glideFriction: 4, combatMomentumRetention: 0.55 },
  camera: { distance: 8, height: 3.2, rotateSpeed: 2.0, pitchSpeed: 1.2, followSpeed: 8 },
  gun: { damage: 5, fireRate: 10, projectileSpeed: 80, closeSpread: 0.01, farSpread: 0.08, assistStrength: 0.6, assistMaxRange: 100, assistAngle: 0.65 },
  missiles: { damage: 25, cooldown: 2, volleySize: 2, speed: 35, turnRate: 2.5, closeHoming: 0.9, farHoming: 0.25, closeRange: 30, farRange: 120 },
  arena: { size: 86, mechCollisionRadius: 1.1 },
  bot: { directionChangeMin: 1.3, directionChangeMax: 3.8, steeringRate: 0.9, gunChance: 0.7, missileChance: 0.2, missileInterval: 2.5 },
  projectiles: { gunLife: 3, missileLife: 7, gunHitRadius: 1.25, missileHitRadius: 1.6 },
  respawn: { delay: 1, deathEffectDuration: 0.18 }
};
const tuning = structuredClone(tuningDefaults);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9aabb4);
scene.fog = new THREE.Fog(0x9aabb4, 85, 180);
const camera = new THREE.PerspectiveCamera(62, innerWidth / innerHeight, 0.1, 300);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
document.querySelector("#game").append(renderer.domElement);
scene.add(new THREE.HemisphereLight(0xdcecff, 0x45515b, 2.2));
const sun = new THREE.DirectionalLight(0xffffff, 2.5);
sun.position.set(35, 70, 20);
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
const neutralMaterial = new THREE.MeshLambertMaterial({ color: 0x66727a });
const roadMaterial = new THREE.MeshLambertMaterial({ color: 0x303b42 });
const buildingSpecs = [
  [-30, -30, 14, 18, 12], [-8, -30, 13, 30, 16], [17, -30, 16, 20, 12], [34, -30, 10, 38, 14],
  [-30, -7, 18, 24, 13], [29, -7, 18, 32, 15], [-30, 17, 13, 34, 14], [-8, 18, 13, 18, 17],
  [14, 17, 20, 28, 13], [34, 18, 10, 24, 12], [-30, 35, 15, 30, 12], [-8, 35, 14, 20, 14],
  [16, 35, 17, 36, 12], [35, 35, 9, 28, 15]
];
function addBox(position, size, material, isObstacle = true) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  mesh.position.set(...position); mesh.castShadow = true; mesh.receiveShadow = true; scene.add(mesh);
  if (isObstacle) obstacles.push({ mesh, minX: position[0] - size[0] / 2, maxX: position[0] + size[0] / 2, minZ: position[2] - size[2] / 2, maxZ: position[2] + size[2] / 2 });
  return mesh;
}
addBox([0, -0.35, 0], [tuning.arena.size, 0.5, tuning.arena.size], roadMaterial, false);
for (const [x, z, width, height, depth] of buildingSpecs) addBox([x, height / 2, z], [width, height, depth], neutralMaterial);
const grid = new THREE.GridHelper(tuning.arena.size, 16, 0x71818a, 0x4a575f); grid.position.y = 0.01; scene.add(grid);
const obstacleMeshes = obstacles.map((obstacle) => obstacle.mesh);

function createMech(color) {
  const root = new THREE.Group(); const material = new THREE.MeshLambertMaterial({ color });
  function addPart(geometry, position) { const mesh = new THREE.Mesh(geometry, material); mesh.position.set(...position); mesh.castShadow = true; root.add(mesh); }
  addPart(new THREE.BoxGeometry(1.4, 1.7, 0.9), [0, 2.5, 0]); addPart(new THREE.BoxGeometry(0.75, 0.65, 0.7), [0, 3.75, 0]);
  addPart(new THREE.BoxGeometry(0.42, 1.7, 0.5), [-1.05, 2.4, 0]); addPart(new THREE.BoxGeometry(0.42, 1.7, 0.5), [1.05, 2.4, 0]);
  addPart(new THREE.BoxGeometry(0.55, 1.7, 0.62), [-0.45, 0.85, 0]); addPart(new THREE.BoxGeometry(0.55, 1.7, 0.62), [0.45, 0.85, 0]);
  addPart(new THREE.BoxGeometry(1.9, 0.7, 0.5), [0, 2.9, -0.5]); scene.add(root); return root;
}
function createMechState(color, position, mode, yaw = 0) {
  return { object3D: createMech(color), position: position.clone(), velocity: new THREE.Vector3(), mode, health: tuning.player.health, gunCooldown: 0, missileCooldown: 0, dead: 0, deathEffect: 0, yaw, aiTimer: 0, aiDirection: new THREE.Vector3(1, 0, 0), botMissileTimer: 0 };
}
const player = createMechState(0x1988e8, new THREE.Vector3(-20, 0, 28), "combat");
const bot = createMechState(0xe23d49, new THREE.Vector3(25, 0, -18), "glide", Math.PI);
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
  mech.object3D.position.y = mech.mode === "glide" ? -0.25 : 0; mech.object3D.rotation.y = mech.yaw;
  mech.object3D.rotation.z = mech.mode === "glide" ? -THREE.MathUtils.clamp(mech.velocity.length() / tuning.player.glideMaxSpeed, 0, 0.18) : 0;
}
const spawnPoints = [new THREE.Vector3(-20, 0, 28), new THREE.Vector3(25, 0, -18), new THREE.Vector3(26, 0, 28), new THREE.Vector3(-20, 0, -18)];
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
