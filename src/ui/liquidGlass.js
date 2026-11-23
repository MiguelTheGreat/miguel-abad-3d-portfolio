// Interactive Liquid Glass Controller:
// 1. Pointer-tracked caustic specular highlight (--mx, --my)
// 2. Liquid refraction ripple wave on every button/key click or press
// 3. Real-time keyboard press animations synced to every Liquid Glass keycap

const KEY_CODE_TO_CAP = {
  KeyW: 'W', ArrowUp: 'W',
  KeyA: 'A', ArrowLeft: 'A',
  KeyS: 'S', ArrowDown: 'S',
  KeyD: 'D', ArrowRight: 'D',
  ShiftLeft: 'SHIFT', ShiftRight: 'SHIFT',
  Space: 'SPACE',
  KeyC: 'C',
  KeyR: 'R'
};

export function spawnLiquidRipple(el, clientX = null, clientY = null) {
  if (!el) return;
  const rect = el.getBoundingClientRect();
  const x = clientX !== null ? clientX - rect.left : rect.width * 0.5;
  const y = clientY !== null ? clientY - rect.top : rect.height * 0.5;
  const size = Math.max(rect.width, rect.height) * 0.9;

  const ripple = document.createElement('span');
  ripple.className = 'lg-ripple';
  ripple.style.width = `${size}px`;
  ripple.style.height = `${size}px`;
  ripple.style.left = `${x}px`;
  ripple.style.top = `${y}px`;
  el.appendChild(ripple);
  ripple.addEventListener('animationend', () => ripple.remove(), { once: true });
}

export function initLiquidGlass({ onKeyCapAction } = {}) {
  // Pointer-tracked liquid specular highlight on all glass elements
  document.addEventListener('pointermove', (e) => {
    const target = e.target.closest?.('.lg-surface, .lg-btn, .lg-key');
    if (!target) return;
    const rect = target.getBoundingClientRect();
    target.style.setProperty('--mx', `${e.clientX - rect.left}px`);
    target.style.setProperty('--my', `${e.clientY - rect.top}px`);
  }, { passive: true });

  // Spawn liquid refraction ripple on pointerdown for all buttons & keycaps
  document.addEventListener('pointerdown', (e) => {
    const el = e.target.closest?.('.lg-btn, .lg-key');
    if (el) spawnLiquidRipple(el, e.clientX, e.clientY);
  }, { passive: true });

  // Live Keyboard -> Liquid Glass Keycap Animation Sync
  const keyCapMap = new Map();
  document.querySelectorAll('.lg-key[data-keycap]').forEach((el) => {
    keyCapMap.set(el.dataset.keycap, el);
    el.addEventListener('click', () => {
      el.classList.add('is-pressed');
      setTimeout(() => el.classList.remove('is-pressed'), 180);
      if (onKeyCapAction) onKeyCapAction(el.dataset.keycap);
    });
  });

  window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    const capId = KEY_CODE_TO_CAP[e.code];
    if (!capId) return;
    const el = keyCapMap.get(capId);
    if (el && !el.classList.contains('is-pressed')) {
      el.classList.add('is-pressed');
      spawnLiquidRipple(el);
    }
  });

  window.addEventListener('keyup', (e) => {
    const capId = KEY_CODE_TO_CAP[e.code];
    if (!capId) return;
    const el = keyCapMap.get(capId);
    if (el) el.classList.remove('is-pressed');
  });

  window.addEventListener('blur', () => {
    keyCapMap.forEach((el) => el.classList.remove('is-pressed'));
  });

  // Also pulse DRAG / SCROLL glass keycaps when pointer dragging or zooming on canvas
  const dragCap = keyCapMap.get('DRAG');
  const scrollCap = keyCapMap.get('SCROLL');
  let scrollTimer = null;

  document.getElementById('canvasContainer')?.addEventListener('pointerdown', () => {
    if (dragCap) {
      dragCap.classList.add('is-pressed');
      spawnLiquidRipple(dragCap);
    }
  });
  window.addEventListener('pointerup', () => {
    if (dragCap) dragCap.classList.remove('is-pressed');
  });
  document.getElementById('canvasContainer')?.addEventListener('wheel', () => {
    if (!scrollCap) return;
    scrollCap.classList.add('is-pressed');
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => scrollCap.classList.remove('is-pressed'), 220);
  }, { passive: true });
}
