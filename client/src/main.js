import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { BalloonRig } from './world/BalloonRig.js';
import { PortfolioWorld, ZONES } from './world/PortfolioWorld.js';
import { SoundEngine } from './audio/SoundEngine.js';
import { renderZoneContent } from './ui/ZoneModals.js';
import { renderClassicView } from './ui/ClassicView.js';

const sessionId = localStorage.getItem('portfolio_session_id') || (() => {
  const id = 'sess_' + Math.random().toString(36).slice(2, 11);
  localStorage.setItem('portfolio_session_id', id);
  return id;
})();

const state = {
  portfolio: null,
  guestbook: [],
  activeZone: null,
  zoneEnteredAt: 0,
  isClassicMode: false,
  isDrawerOpen: false,
  keys: new Set(),
  touchInput: { x: 0, z: 0, burn: false, vent: false }
};

const sound = new SoundEngine();

// DOM References
const canvasContainer = document.getElementById('canvasContainer');
const classicContainer = document.getElementById('classicViewContainer');
const hudOverlay = document.getElementById('hudOverlay');
const soundBtn = document.getElementById('soundToggleBtn');
const viewToggleBtn = document.getElementById('viewToggleBtn');
const contactQuickBtn = document.getElementById('contactQuickBtn');
const altValueEl = document.getElementById('altValue');
const vsValueEl = document.getElementById('vsValue');
const altBarFill = document.getElementById('altBarFill');
const zonePromptBtn = document.getElementById('zonePromptBtn');
const zonePromptName = document.getElementById('zonePromptName');
const zoneDrawer = document.getElementById('zoneDrawer');
const zoneDrawerBody = document.getElementById('zoneDrawerBody');
const closeDrawerBtn = document.getElementById('closeDrawerBtn');
const radarCanvas = document.getElementById('radarCanvas');
const radarCtx = radarCanvas.getContext('2d');
const toastEl = document.getElementById('toastBanner');

function showToast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.remove('hidden');
  clearTimeout(toastEl._timer);
  toastEl._timer = setTimeout(() => toastEl.classList.add('hidden'), 2400);
}

function copyText(text, msg) {
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).then(() => showToast(msg)).catch(() => fallbackCopy(text, msg));
  } else {
    fallbackCopy(text, msg);
  }
}

function fallbackCopy(text, msg) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand('copy');
    showToast(msg);
  } catch {
    showToast('Copy failed');
  }
  document.body.removeChild(ta);
}

// =========================================================================
// 1. THREE.JS & CANNON-ES SETUP
// =========================================================================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xeef2f6);
scene.fog = new THREE.Fog(0xeef2f6, 55, 165);

const camera = new THREE.PerspectiveCamera(54, window.innerWidth / window.innerHeight, 0.2, 260);
camera.position.set(0, 12, 30);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
canvasContainer.appendChild(renderer.domElement);

// Lighting
const hemiLight = new THREE.HemisphereLight(0xffffff, 0xd8dce2, 0.85);
scene.add(hemiLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 1.1);
dirLight.position.set(42, 68, 36);
dirLight.castShadow = true;
dirLight.shadow.mapSize.set(2048, 2048);
dirLight.shadow.camera.near = 10;
dirLight.shadow.camera.far = 190;
const d = 80;
dirLight.shadow.camera.left = -d;
dirLight.shadow.camera.right = d;
dirLight.shadow.camera.top = d;
dirLight.shadow.camera.bottom = -d;
scene.add(dirLight);

// Physics World
const physicsWorld = new CANNON.World({
  gravity: new CANNON.Vec3(0, -9.82, 0)
});

const world3D = new PortfolioWorld(scene, physicsWorld);
const balloon = new BalloonRig(scene, physicsWorld);

// =========================================================================
// 2. DATA HYDRATION & TELEMETRY
// =========================================================================
async function loadData() {
  try {
    const [portRes, gbRes] = await Promise.all([
      fetch('/api/portfolio'),
      fetch('/api/guestbook')
    ]);
    state.portfolio = await portRes.json();
    const gbData = await gbRes.json();
    state.guestbook = gbData.notes || [];

    world3D.hydrateProjects(state.portfolio.projects || []);
    world3D.hydrateGuestbook(state.guestbook);

    if (state.isClassicMode) {
      mountClassicView();
    }
  } catch (err) {
    console.error('Failed to load portfolio API:', err);
    showToast('Could not connect to portfolio API');
  }
}

async function refreshGuestbook() {
  try {
    const res = await fetch('/api/guestbook');
    const data = await res.json();
    state.guestbook = data.notes || [];
    world3D.hydrateGuestbook(state.guestbook);
  } catch { /* ignore */ }
}

function sendTelemetry(zoneId, durationMs) {
  fetch('/api/telemetry', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      zone_visited: zoneId,
      session_id: sessionId,
      duration_ms: Math.round(durationMs)
    })
  }).catch(() => {});
}

// =========================================================================
// 3. ZONE DRAWER & CONTACT FORM
// =========================================================================
function openZoneDrawer(zoneId) {
  if (!state.portfolio) return;
  sound.playClick();
  state.isDrawerOpen = true;
  zoneDrawerBody.innerHTML = renderZoneContent(zoneId, state.portfolio, state.guestbook);
  zoneDrawer.classList.remove('hidden');
  zoneDrawer.classList.add('flex');

  // Wire copy buttons inside drawer
  zoneDrawerBody.querySelectorAll('[data-copy]').forEach((btn) => {
    btn.addEventListener('click', () => copyText(btn.dataset.copy, btn.dataset.copyMsg));
  });

  // Wire zone-switch links inside drawer
  zoneDrawerBody.querySelectorAll('[data-open-zone]').forEach((btn) => {
    btn.addEventListener('click', () => openZoneDrawer(btn.dataset.openZone));
  });

  // Wire Contact / Guestbook form if present
  const form = zoneDrawerBody.querySelector('#contactForm');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const payload = {
        sender_name: fd.get('sender_name'),
        sender_email: fd.get('sender_email'),
        company: fd.get('company'),
        subject: fd.get('subject'),
        message: fd.get('message'),
        is_public_guestbook: Boolean(fd.get('is_public_guestbook'))
      };
      const fb = form.querySelector('#contactFeedback');
      try {
        const res = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok) {
          fb.textContent = data.error || 'Submission failed';
          fb.className = 'text-xs text-[#E63946] font-semibold';
          fb.classList.remove('hidden');
          return;
        }
        fb.textContent = data.confirmation;
        fb.className = 'text-xs text-[#0047FF] font-semibold';
        fb.classList.remove('hidden');
        form.reset();
        if (data.is_public_guestbook) {
          await refreshGuestbook();
        }
      } catch {
        fb.textContent = 'Network error sending message.';
        fb.className = 'text-xs text-[#E63946] font-semibold';
        fb.classList.remove('hidden');
      }
    });
  }
}

function closeDrawer() {
  state.isDrawerOpen = false;
  zoneDrawer.classList.add('hidden');
  zoneDrawer.classList.remove('flex');
}

closeDrawerBtn.addEventListener('click', () => {
  sound.playClick();
  closeDrawer();
});
zoneDrawer.addEventListener('click', (e) => {
  if (e.target === zoneDrawer) closeDrawer();
});

// =========================================================================
// 4. DUAL-MODE 2D CLASSIC VIEW TOGGLE
// =========================================================================
function mountClassicView() {
  if (!state.portfolio) return;
  renderClassicView(classicContainer, state.portfolio, state.guestbook, {
    onSwitchTo3D: () => toggleViewMode(false),
    onCopy: copyText,
    onOpenContact: () => openZoneDrawer('south')
  });
}

function toggleViewMode(toClassic) {
  sound.playClick();
  state.isClassicMode = typeof toClassic === 'boolean' ? toClassic : !state.isClassicMode;
  if (state.isClassicMode) {
    closeDrawer();
    mountClassicView();
    classicContainer.classList.remove('hidden');
    hudOverlay.classList.add('hidden');
    canvasContainer.classList.add('hidden');
  } else {
    classicContainer.classList.add('hidden');
    hudOverlay.classList.remove('hidden');
    canvasContainer.classList.remove('hidden');
  }
}

viewToggleBtn.addEventListener('click', () => toggleViewMode());
contactQuickBtn.addEventListener('click', () => openZoneDrawer('south'));

soundBtn.addEventListener('click', () => {
  const unmuted = sound.toggleMute();
  soundBtn.textContent = unmuted ? '🔊 Sound On' : '🔇 Sound Off';
  sound.playClick();
});

zonePromptBtn.addEventListener('click', () => {
  if (state.activeZone) openZoneDrawer(state.activeZone.id);
});

// =========================================================================
// 5. INPUT HANDLING (DESKTOP + MOBILE THUMBSTICK)
// =========================================================================
window.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

  if (e.code === 'Escape' && state.isDrawerOpen) {
    closeDrawer();
    return;
  }

  if (e.code === 'Enter' && state.activeZone && !state.isDrawerOpen && !state.isClassicMode) {
    e.preventDefault();
    openZoneDrawer(state.activeZone.id);
    return;
  }

  if (e.code === 'KeyR' && !state.isDrawerOpen && !state.isClassicMode) {
    balloon.resetPosition();
    showToast('Balloon position reset');
    return;
  }

  state.keys.add(e.code);
});

window.addEventListener('keyup', (e) => {
  state.keys.delete(e.code);
});

// Mobile Thumbstick & Burn/Vent Touch Buttons
const joystickZone = document.getElementById('mobileJoystick');
const joystickKnob = document.getElementById('joystickKnob');
const mobileBurnBtn = document.getElementById('mobileBurnBtn');
const mobileVentBtn = document.getElementById('mobileVentBtn');

let joyActive = false;
let joyCenter = { x: 0, y: 0 };

joystickZone?.addEventListener('touchstart', (e) => {
  e.preventDefault();
  const rect = joystickZone.getBoundingClientRect();
  joyCenter = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  joyActive = true;
}, { passive: false });

joystickZone?.addEventListener('touchmove', (e) => {
  if (!joyActive) return;
  e.preventDefault();
  const t = e.touches[0];
  const maxR = 36;
  const dx = t.clientX - joyCenter.x;
  const dy = t.clientY - joyCenter.y;
  const dist = Math.min(maxR, Math.hypot(dx, dy));
  const angle = Math.atan2(dy, dx);
  const kx = Math.cos(angle) * dist;
  const ky = Math.sin(angle) * dist;
  joystickKnob.style.transform = `translate(${kx}px, ${ky}px)`;
  state.touchInput.x = kx / maxR;
  state.touchInput.z = ky / maxR;
}, { passive: false });

const resetJoy = () => {
  joyActive = false;
  joystickKnob.style.transform = 'translate(0px, 0px)';
  state.touchInput.x = 0;
  state.touchInput.z = 0;
};
joystickZone?.addEventListener('touchend', resetJoy);
joystickZone?.addEventListener('touchcancel', resetJoy);

mobileBurnBtn?.addEventListener('touchstart', (e) => { e.preventDefault(); state.touchInput.burn = true; }, { passive: false });
mobileBurnBtn?.addEventListener('touchend', () => { state.touchInput.burn = false; });
mobileVentBtn?.addEventListener('touchstart', (e) => { e.preventDefault(); state.touchInput.vent = true; }, { passive: false });
mobileVentBtn?.addEventListener('touchend', () => { state.touchInput.vent = false; });

// Orbit Camera State (Drag to look around, Scroll to zoom)
const camState = {
  yaw: 0,
  pitch: 0.28,
  distance: 22,
  dragging: false,
  lastX: 0,
  lastY: 0
};

renderer.domElement.addEventListener('pointerdown', (e) => {
  if (e.target !== renderer.domElement) return;
  camState.dragging = true;
  camState.lastX = e.clientX;
  camState.lastY = e.clientY;
});

window.addEventListener('pointermove', (e) => {
  if (!camState.dragging) return;
  const dx = e.clientX - camState.lastX;
  const dy = e.clientY - camState.lastY;
  camState.lastX = e.clientX;
  camState.lastY = e.clientY;
  camState.yaw -= dx * 0.006;
  camState.pitch = THREE.MathUtils.clamp(camState.pitch + dy * 0.005, -0.15, 1.15);
});

window.addEventListener('pointerup', () => { camState.dragging = false; });

renderer.domElement.addEventListener('wheel', (e) => {
  camState.distance = THREE.MathUtils.clamp(camState.distance + e.deltaY * 0.015, 11, 42);
}, { passive: true });

function getFlightInput() {
  if (state.isDrawerOpen || state.isClassicMode) {
    return { x: 0, z: 0, burn: false, vent: false };
  }
  let rawX = state.touchInput.x;
  let rawZ = state.touchInput.z;
  if (state.keys.has('KeyA') || state.keys.has('ArrowLeft')) rawX -= 1;
  if (state.keys.has('KeyD') || state.keys.has('ArrowRight')) rawX += 1;
  if (state.keys.has('KeyW') || state.keys.has('ArrowUp')) rawZ -= 1;
  if (state.keys.has('KeyS') || state.keys.has('ArrowDown')) rawZ += 1;

  const mag = Math.hypot(rawX, rawZ);
  if (mag > 1) { rawX /= mag; rawZ /= mag; }

  // Rotate input by camera yaw so W always flies forward relative to where you look
  const cos = Math.cos(camState.yaw);
  const sin = Math.sin(camState.yaw);
  const x = rawX * cos + rawZ * sin;
  const z = -rawX * sin + rawZ * cos;

  const burn = state.touchInput.burn || state.keys.has('Space');
  const vent = state.touchInput.vent || state.keys.has('ShiftLeft') || state.keys.has('ShiftRight') || state.keys.has('KeyC');
  return { x, z, burn, vent };
}

// =========================================================================
// 6. 2D RADAR & ALTIMETER HUD
// =========================================================================
function drawRadar(pos) {
  const w = radarCanvas.width;
  const h = radarCanvas.height;
  const cx = w / 2;
  const cy = h / 2;
  const scale = w / 160;

  radarCtx.clearRect(0, 0, w, h);

  // Subtle grid crosshairs
  radarCtx.strokeStyle = 'rgba(17,17,17,0.12)';
  radarCtx.lineWidth = 1;
  radarCtx.beginPath();
  radarCtx.moveTo(cx, 0); radarCtx.lineTo(cx, h);
  radarCtx.moveTo(0, cy); radarCtx.lineTo(w, cy);
  radarCtx.stroke();

  // Draw 5 zones
  ZONES.forEach((z) => {
    const zx = cx + z.x * scale;
    const zy = cy + z.z * scale;
    radarCtx.fillStyle = z.color;
    radarCtx.beginPath();
    radarCtx.arc(zx, zy, 4.5, 0, Math.PI * 2);
    radarCtx.fill();

    radarCtx.fillStyle = '#595959';
    radarCtx.font = 'bold 8px Helvetica, Arial, sans-serif';
    radarCtx.textAlign = 'center';
    radarCtx.fillText(z.id.toUpperCase(), zx, zy - 7);
  });

  // Draw Balloon Marker
  const bx = cx + pos.x * scale;
  const by = cy + pos.z * scale;
  radarCtx.fillStyle = '#E63946';
  radarCtx.strokeStyle = '#FFFFFF';
  radarCtx.lineWidth = 2;
  radarCtx.beginPath();
  radarCtx.arc(bx, by, 5.5, 0, Math.PI * 2);
  radarCtx.fill();
  radarCtx.stroke();
}

// =========================================================================
// 7. MAIN ANIMATION LOOP
// =========================================================================
const clock = new THREE.Clock();
const camTarget = new THREE.Vector3();

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  const elapsed = clock.elapsedTime;

  if (!state.isClassicMode) {
    physicsWorld.step(1 / 60, dt, 3);
    const input = getFlightInput();
    balloon.update(dt, input, elapsed);

    const pos = balloon.getPosition();
    const speed = balloon.getSpeed();
    const vs = balloon.getVerticalSpeed();

    // Update Procedural Web Audio
    sound.updateFlightAudio({
      isBurning: balloon.isBurning,
      speed,
      altitude: pos.y
    });

    // Smooth Orbit + Chase Camera
    const horizDist = Math.cos(camState.pitch) * camState.distance;
    const vertDist = Math.sin(camState.pitch) * camState.distance;
    const desiredCamPos = new THREE.Vector3(
      pos.x + Math.sin(camState.yaw) * horizDist,
      Math.max(2.0, pos.y + 3.2 + vertDist),
      pos.z + Math.cos(camState.yaw) * horizDist
    );
    camera.position.lerp(desiredCamPos, Math.min(1, dt * 6));
    camTarget.lerp(new THREE.Vector3(pos.x, pos.y + 3.2, pos.z), Math.min(1, dt * 7));
    camera.lookAt(camTarget);

    // Collectible Sky-Rings
    world3D.checkRingCollection(pos, () => {
      sound.playZoneChime();
      showToast('★ Sky-Ring Cleared!');
    });

    // Zone Proximity & Telemetry
    const nearest = world3D.getNearestZone(pos);
    if (nearest?.id !== state.activeZone?.id) {
      if (state.activeZone) {
        sendTelemetry(state.activeZone.id, performance.now() - state.zoneEnteredAt);
      }
      state.activeZone = nearest;
      if (nearest) {
        state.zoneEnteredAt = performance.now();
        sound.playZoneChime();
        zonePromptName.textContent = nearest.name;
        zonePromptBtn.classList.remove('hidden');
      } else {
        zonePromptBtn.classList.add('hidden');
      }
    }

    world3D.update(elapsed, state.activeZone?.id || null);

    // Update Altimeter & Radar
    altValueEl.textContent = `${pos.y.toFixed(1)}m`;
    vsValueEl.textContent = `${vs >= 0 ? '+' : ''}${vs.toFixed(1)}`;
    altBarFill.style.height = `${Math.min(100, Math.max(4, (pos.y / 38) * 100))}%`;
    drawRadar(pos);

    renderer.render(scene, camera);
  }
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

loadData();
animate();
