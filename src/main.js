import * as THREE from 'three';
import { STATION_DECK_H, loadGuestbookNotes, getZones } from './config/portfolioData.js?v=3';
import { SoundEngine } from './audio/SoundEngine.js?v=3';
import { buildRoadNetwork } from './world/roads.js?v=3';
import { createTerrainSystem } from './world/terrain.js?v=3';
import { buildEnvironment } from './world/environment.js?v=3';
import { buildStations, drawMainBoardTex } from './world/stations.js?v=3';
import { createSupercar } from './world/supercar.js?v=3';
import { createCarPhysics } from './physics/carPhysics.js?v=3';
import { setupUIAndModals } from './ui/hudAndModals.js?v=3';

const guestbookNotes = loadGuestbookNotes();
let ZONES = getZones(guestbookNotes);

const container = document.getElementById('canvasContainer');
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x90e0ef, 0.00145);

const camera = new THREE.PerspectiveCamera(44, window.innerWidth / window.innerHeight, 0.5, 1900);
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
container.appendChild(renderer.domElement);

// Sky Dome
const skyCanvas = document.createElement('canvas');
skyCanvas.width = 16; skyCanvas.height = 512;
const sctx = skyCanvas.getContext('2d');
const skyTex = new THREE.CanvasTexture(skyCanvas);
const skyDome = new THREE.Mesh(
  new THREE.SphereGeometry(1400, 32, 20),
  new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide, fog: false })
);
scene.add(skyDome);

const hemiLight = new THREE.HemisphereLight(0xffffff, 0x40916c, 0.95);
scene.add(hemiLight);
const dl = new THREE.DirectionalLight(0xfff4d2, 1.25);
dl.position.set(190, 290, 140);
dl.castShadow = true;
dl.shadow.mapSize.set(2048, 2048);
dl.shadow.camera.near = 20; dl.shadow.camera.far = 920;
const d = 440;
dl.shadow.camera.left = -d; dl.shadow.camera.right = d;
dl.shadow.camera.top = d; dl.shadow.camera.bottom = -d;
scene.add(dl);

// World Modules
const roads = buildRoadNetwork(scene, ZONES);
const terrain = createTerrainSystem(scene, ZONES, roads.ALL_ROAD_SAMPLES);
const env = buildEnvironment(scene, terrain, roads.redCurbMat, roads.whiteCurbMat);
const stations = buildStations(scene, ZONES);
const supercar = createSupercar(scene, STATION_DECK_H);

const car = { x: 0, y: STATION_DECK_H, z: 24, heading: 0, speed: 0, vx: 0, vz: 0, vy: 0 };

// Shortest-angle radian interpolation helper
function lerpAngle(a, b, t) {
  let diff = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI;
  if (diff < -Math.PI) diff += Math.PI * 2;
  return a + diff * t;
}

const DEFAULT_CAM_PITCH = 0.88; // Signature Chinatown Wars overhead angled view
const DEFAULT_CAM_DIST = 40;

const camState = {
  followYaw: 0,
  yawOffset: 0,
  pitch: DEFAULT_CAM_PITCH,
  distance: DEFAULT_CAM_DIST,
  isCustom: false,
  dragging: false,
  lastX: 0,
  lastY: 0
};

const resetCameraBtn = document.getElementById('resetCameraBtn');
function updateResetCamBtnStyle() {
  if (!resetCameraBtn) return;
  if (camState.isCustom) {
    resetCameraBtn.classList.remove('bg-white/90', 'text-[#111111]');
    resetCameraBtn.classList.add('bg-[#0047FF]', 'text-white');
  } else {
    resetCameraBtn.classList.add('bg-white/90', 'text-[#111111]');
    resetCameraBtn.classList.remove('bg-[#0047FF]', 'text-white');
  }
}

renderer.domElement.addEventListener('pointerdown', (e) => {
  camState.dragging = true;
  camState.lastX = e.clientX;
  camState.lastY = e.clientY;
});
window.addEventListener('pointermove', (e) => {
  if (!camState.dragging) return;
  const dx = e.clientX - camState.lastX;
  const dy = e.clientY - camState.lastY;
  if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
    camState.isCustom = true;
    updateResetCamBtnStyle();
  }
  camState.yawOffset -= dx * 0.0055;
  camState.pitch = THREE.MathUtils.clamp(camState.pitch + dy * 0.005, 0.26, 1.34);
  camState.lastX = e.clientX;
  camState.lastY = e.clientY;
});
window.addEventListener('pointerup', () => { camState.dragging = false; });
renderer.domElement.addEventListener('wheel', (e) => {
  camState.distance = THREE.MathUtils.clamp(camState.distance + e.deltaY * 0.025, 20, 78);
  camState.isCustom = true;
  updateResetCamBtnStyle();
}, { passive: true });

// Touch Controls
const touchInput = { steer: 0, throttle: 0, boost: false };
const joyZone = document.getElementById('mobileJoystick');
const joyKnob = document.getElementById('joystickKnob');
const boostBtn = document.getElementById('mobileBoostBtn');
let joyActive = false, joyCenter = { x: 0, y: 0 };
joyZone?.addEventListener('touchstart', (e) => {
  e.preventDefault();
  const r = joyZone.getBoundingClientRect();
  joyCenter = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  joyActive = true;
}, { passive: false });
joyZone?.addEventListener('touchmove', (e) => {
  if (!joyActive) return;
  e.preventDefault();
  const t = e.touches[0], maxR = 36, dx = t.clientX - joyCenter.x, dy = t.clientY - joyCenter.y;
  const dist = Math.min(maxR, Math.hypot(dx, dy)), ang = Math.atan2(dy, dx);
  joyKnob.style.transform = `translate(${Math.cos(ang) * dist}px, ${Math.sin(ang) * dist}px)`;
  touchInput.steer = -((Math.cos(ang) * dist) / maxR);
  touchInput.throttle = -((Math.sin(ang) * dist) / maxR);
}, { passive: false });
const resetJoy = () => {
  joyActive = false;
  if (joyKnob) joyKnob.style.transform = 'translate(0,0)';
  touchInput.steer = 0; touchInput.throttle = 0;
};
joyZone?.addEventListener('touchend', resetJoy);
joyZone?.addEventListener('touchcancel', resetJoy);
boostBtn?.addEventListener('touchstart', (e) => { e.preventDefault(); touchInput.boost = true; }, { passive: false });
boostBtn?.addEventListener('touchend', () => { touchInput.boost = false; });

const sound = new SoundEngine();
const keys = new Set();
let activeZone = null, isClassic = false, ringsCollected = 0, lastParkedTitle = '';

const ui = setupUIAndModals({
  scene, hemiLight, dl,
  oceanMat: terrain.oceanMat,
  grassMat: terrain.grassMat,
  sctx, skyTex,
  streetLampBulbs: roads.streetLampBulbs,
  getZonesState: () => ZONES,
  setZonesState: (notes) => { ZONES = getZones(notes); return ZONES; },
  guestbookNotes,
  stationClusters: stations.stationClusters,
  drawMainBoardTex,
  ALL_ROAD_POLYLINES: roads.ALL_ROAD_POLYLINES,
  car, terrain, sound,
  miguelLetters: stations.miguelLetters,
  camState,
  onClassicChange: (val) => { isClassic = val; }
});

function resetCameraToNormal() {
  camState.pitch = DEFAULT_CAM_PITCH;
  camState.distance = DEFAULT_CAM_DIST;
  camState.yawOffset = 0;
  camState.followYaw = car.heading;
  camState.isCustom = false;
  updateResetCamBtnStyle();
  ui.showToast('🎥 Camera reset to Chinatown Wars view');
}

resetCameraBtn?.addEventListener('click', resetCameraToNormal);

const physics = createCarPhysics(terrain, env, stations, sound, ui.showToast);

window.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
  if (e.code === 'KeyC') {
    resetCameraToNormal();
  }
  if (e.code === 'KeyR') {
    car.x = 0; car.z = 24; car.y = STATION_DECK_H;
    car.vx = 0; car.vz = 0; car.vy = 0; car.speed = 0; car.heading = 0;
    resetCameraToNormal();
    stations.miguelLetters.forEach(l => {
      l.x = l.homeX; l.z = l.homeZ; l.y = STATION_DECK_H + 1.9;
      l.vx = 0; l.vy = 0; l.vz = 0; l.rx = 0; l.rz = 0; l.vrx = 0; l.vrz = 0;
      l.mesh.position.set(l.x, l.y, l.z); l.mesh.rotation.set(0, 0, 0);
    });
    ui.showToast('Car, camera & MIGUEL letters reset');
  }
  keys.add(e.code);
});
window.addEventListener('keyup', (e) => keys.delete(e.code));
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

const stationBadge = document.getElementById('stationBadge');
const introCard = document.getElementById('introCard');
const parkingCard = document.getElementById('parkingCard');
const parkingCardTag = document.getElementById('parkingCardTag');
const parkingCardTitle = document.getElementById('parkingCardTitle');
const parkingCardDesc = document.getElementById('parkingCardDesc');
const parkingCardTags = document.getElementById('parkingCardTags');

const clock = new THREE.Clock();
const camFocus = new THREE.Vector3(0, STATION_DECK_H + 1.2, 24);
const lookAheadOffset = new THREE.Vector3();

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;
  if (isClassic) return;

  const isTyping = document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA';
  const fwd = !isTyping && (keys.has('KeyW') || keys.has('ArrowUp') || touchInput.throttle > 0.15);
  const rev = !isTyping && (keys.has('KeyS') || keys.has('ArrowDown') || touchInput.throttle < -0.15);
  const left = !isTyping && (keys.has('KeyA') || keys.has('ArrowLeft'));
  const right = !isTyping && (keys.has('KeyD') || keys.has('ArrowRight'));
  const boost = !isTyping && (keys.has('ShiftLeft') || keys.has('ShiftRight') || keys.has('Space') || touchInput.boost);
  const steerInput = ((left ? 1 : 0) - (right ? 1 : 0)) || touchInput.steer;

  const { targetPitch, targetRoll } = physics.stepPhysics(car, { fwd, rev, steerInput, boost }, dt, t);

  supercar.carGroup.position.set(car.x, car.y, car.z);
  supercar.carGroup.rotation.y = car.heading;
  supercar.chassisGroup.rotation.z = THREE.MathUtils.lerp(supercar.chassisGroup.rotation.z, targetRoll, Math.min(1, dt * 11));
  supercar.chassisGroup.rotation.x = THREE.MathUtils.lerp(supercar.chassisGroup.rotation.x, targetPitch, Math.min(1, dt * 12));
  supercar.tlMat.color.setHex(rev ? 0xff1133 : 0xaa0011);
  supercar.underglowMat.opacity = boost && Math.abs(car.speed) > 4 ? 0.42 : 0.16;

  supercar.wheels.forEach((w, idx) => {
    w.mesh.rotation.x -= car.speed * dt * 0.9;
    if (idx < 2) w.pivot.rotation.y = THREE.MathUtils.lerp(w.pivot.rotation.y, steerInput * 0.42, Math.min(1, dt * 10));
  });

  const nitroActive = (boost && Math.abs(car.speed) > 4) || car.speed > 52;
  supercar.nitroFlames.forEach((f, idx) => {
    f.outer.material.opacity = nitroActive ? 0.85 : 0;
    f.core.material.opacity = nitroActive ? 0.95 : 0;
    if (nitroActive) f.group.scale.set(1, 1, 0.85 + Math.sin(t * 48 + idx * 2.1) * 0.28);
  });
  sound.updateEngine(Math.abs(car.speed), nitroActive);

  const kmh = Math.round(Math.hypot(car.vx, car.vz) * 3.2);
  document.getElementById('speedValue').textContent = kmh;
  document.getElementById('speedBarFill').style.height = `${Math.min(100, Math.max(4, (kmh / 245) * 100))}%`;
  document.getElementById('boostStatus').classList.toggle('hidden', !nitroActive);

  // Upgraded Chinatown Wars & Custom Back-of-Car Follow Camera
  // When driving and not actively dragging, smoothly swing yawOffset back behind the car's rear
  if (!camState.dragging && Math.abs(car.speed) > 1.0) {
    const recenterRate = camState.isCustom ? 4.8 : 6.0;
    camState.yawOffset = lerpAngle(camState.yawOffset, 0, Math.min(1, dt * recenterRate));
  }
  const desiredYaw = car.heading + camState.yawOffset;
  const yawTrackSpeed = camState.dragging ? 25.0 : (camState.isCustom ? 9.5 : 6.5);
  camState.followYaw = lerpAngle(camState.followYaw, desiredYaw, Math.min(1, dt * yawTrackSpeed));

  // Forward velocity look-ahead so the car stays framed with clear view of the road ahead
  lookAheadOffset.lerp(
    new THREE.Vector3(car.vx * 0.11, 0, car.vz * 0.11),
    Math.min(1, dt * 8)
  );
  camFocus.set(
    car.x + lookAheadOffset.x,
    THREE.MathUtils.lerp(camFocus.y, car.y + 1.25, Math.min(1, dt * 18)),
    car.z + lookAheadOffset.z
  );

  const hDist = Math.cos(camState.pitch) * camState.distance;
  const vDist = Math.sin(camState.pitch) * camState.distance;
  camera.position.set(
    camFocus.x + Math.sin(camState.followYaw) * hDist,
    camFocus.y + vDist,
    camFocus.z + Math.cos(camState.followYaw) * hDist
  );
  camera.lookAt(camFocus);

  // Animate World Props
  env.lhBeamPivot.rotation.y = t * 1.15;
  env.windRotors.forEach((hub, idx) => { hub.rotation.z = t * 1.85 + idx * 1.1; });
  env.clouds.forEach(c => { c.grp.position.x += c.speed * dt; if (c.grp.position.x > 460) c.grp.position.x = -460; });
  env.sailboats.forEach(sb => {
    sb.grp.position.y = -2.2 + Math.sin(t * 1.7 + sb.phase) * 0.22;
    sb.grp.rotation.z = Math.sin(t * 1.3 + sb.phase) * 0.055;
  });

  roads.boostPads.forEach(bp => {
    if (Math.hypot(car.x - bp.x, car.z - bp.z) < 4.4 && t - bp.cooldown > 1.5) {
      bp.cooldown = t;
      const boostVel = 68;
      car.vx = -Math.sin(car.heading) * boostVel;
      car.vz = -Math.cos(car.heading) * boostVel;
      car.speed = boostVel;
      sound.playChime();
      ui.showToast('⚡ TURBO BOOST PAD!');
    }
  });

  let parkedSpec = null;
  stations.flagshipBillboards.forEach(fb => {
    const isParked = Math.hypot(car.x - fb.px, car.z - fb.pz) < 4.8;
    fb.ringMat.color.setHex(isParked ? 0x00ff88 : 0x0077ff);
    fb.ringMat.opacity = isParked ? 0.95 : 0.6;
    fb.bbGroup.position.y = THREE.MathUtils.lerp(fb.bbGroup.position.y, isParked ? STATION_DECK_H + 5.2 : STATION_DECK_H + 4.3, Math.min(1, dt * 6));
    if (isParked) parkedSpec = fb.spec;
  });
  if (parkedSpec) {
    if (lastParkedTitle !== parkedSpec.title) {
      lastParkedTitle = parkedSpec.title;
      parkingCardTag.textContent = parkedSpec.tag;
      parkingCardTitle.textContent = parkedSpec.title;
      parkingCardDesc.textContent = parkedSpec.desc;
      if (parkingCardTags) {
        parkingCardTags.innerHTML = (parkedSpec.tags || []).map(tg => `<span class="px-2 py-0.5 rounded bg-neutral-100 border border-black/15 text-[10px] font-mono font-bold text-[#111111]">${tg}</span>`).join('');
      }
    }
    parkingCard.classList.remove('hidden');
  } else {
    lastParkedTitle = '';
    parkingCard.classList.add('hidden');
  }

  stations.pcbLeds.forEach(led => {
    if (!led.lit && Math.hypot(car.x - led.x, car.z - led.z) < 10.5) {
      led.lit = true;
      led.ledMat.emissiveIntensity = 2.4;
      led.haloMat.opacity = 0.48;
      sound.playChime();
    }
    if (led.lit) led.haloMat.opacity = 0.35 + Math.sin(t * 5 + led.x) * 0.15;
  });

  stations.holoCore.rotation.y = t * 0.9; stations.holoCore.rotation.x = t * 0.45;
  stations.holoInner.rotation.y = -t * 1.4;
  stations.holoMonoliths.forEach(m => {
    m.grp.position.y = m.baseY + Math.sin(t * 1.8 + m.phase) * 0.45;
    m.cube.rotation.y = t * 1.6 + m.phase; m.cube.rotation.x = t * 1.1;
  });
  stations.holoDataPulses.forEach(p => {
    const frac = (t * 0.55 + p.phase) % 1;
    p.mesh.position.set(THREE.MathUtils.lerp(p.startX, p.endX, frac), STATION_DECK_H + 0.45, THREE.MathUtils.lerp(p.startZ, p.endZ, frac));
  });

  stations.kBeacon.rotation.y = t * 1.3;
  stations.kBeacon.position.y = 4.6 + Math.sin(t * 2.2) * 0.28;

  roads.collectibles.forEach(c => {
    c.mesh.rotation.y = t * 1.5 + c.phase;
    if (!c.collected && Math.hypot(car.x - c.mesh.position.x, car.z - c.mesh.position.z) < 4.5) {
      c.collected = true;
      c.mesh.material.color.setHex(0x52b788); c.mesh.material.emissive.setHex(0x2d6a4f);
      ringsCollected++;
      document.getElementById('ringScoreBadge').textContent = `★ ${ringsCollected} / 10`;
      sound.playChime(); ui.showToast('★ Gate Cleared!');
    }
  });

  const nearest = ZONES.find(z => Math.hypot(car.x - z.x, car.z - z.z) <= z.radius + 14) || null;
  if (nearest?.id !== activeZone?.id) {
    activeZone = nearest;
    if (nearest) { sound.playChime(); stationBadge.textContent = nearest.name; stationBadge.classList.remove('hidden'); }
    else stationBadge.classList.add('hidden');
  }
  introCard.classList.toggle('hidden', activeZone?.id !== 'central');

  ZONES.forEach(z => {
    const st = stations.stationClusters.get(z.id);
    const isNear = Math.hypot(car.x - z.x, car.z - z.z) <= z.radius + 16;
    st.currentY = THREE.MathUtils.lerp(st.currentY, isNear ? STATION_DECK_H : 38, Math.min(1, dt * 4.5));
    st.cluster.position.y = st.currentY;
  });

  ui.updateMinimap();
  renderer.render(scene, camera);
}
animate();
