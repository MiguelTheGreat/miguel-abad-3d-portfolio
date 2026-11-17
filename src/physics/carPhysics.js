import * as THREE from 'three';
import { getIslandRadius } from '../world/terrain.js';

const WHEEL_OFFSETS = [
  [-1.12, -1.42], // FL
  [ 1.12, -1.42], // FR
  [-1.15,  1.42], // RL
  [ 1.15,  1.42]  // RR
];

export function createCarPhysics(terrain, env, stations, sound, showToast) {
  const { getSurfaceHeight } = terrain;
  const { treeColliders, mountainColliders } = env;
  const { miguelLetters } = stations;
  let lastImpactAt = -10;

  function resolveCircleCollider(car, cx, cz, minDist, restitution, onHit) {
    const dx = car.x - cx;
    const dz = car.z - cz;
    const dist = Math.hypot(dx, dz);
    if (dist < minDist && dist > 0.001) {
      const nx = dx / dist;
      const nz = dz / dist;
      car.x = cx + nx * minDist;
      car.z = cz + nz * minDist;

      // Project velocity onto collision normal; preserve tangential slide
      const vn = car.vx * nx + car.vz * nz;
      if (vn < 0) {
        car.vx -= (1 + restitution) * vn * nx;
        car.vz -= (1 + restitution) * vn * nz;
        if (Math.abs(vn) > 6 && onHit) onHit(Math.abs(vn));
      }
    }
  }

  function stepPhysics(car, input, dt, t) {
    const { fwd, rev, steerInput, boost } = input;
    const sinH = Math.sin(car.heading);
    const cosH = Math.cos(car.heading);
    const fwdX = -sinH;
    const fwdZ = -cosH;
    const rightX = cosH;
    const rightZ = -sinH;

    // Decompose current world velocity into forward & lateral components
    let vForward = car.vx * fwdX + car.vz * fwdZ;
    let vLateral = car.vx * rightX + car.vz * rightZ;

    const maxSpeed = boost ? 76 : 49;
    const accel = boost ? 78 : 45;

    if (fwd) vForward += accel * dt;
    else if (rev) vForward -= 36 * dt;
    else vForward *= Math.pow(0.24, dt);

    vForward = THREE.MathUtils.clamp(vForward, -19, maxSpeed);

    // Steering & tire lateral grip (high grip at normal speed, slight drift slip when turning hard fast)
    if (Math.abs(vForward) > 0.45) {
      const turnRate = 2.35 * (1 - Math.min(0.28, Math.abs(vForward) / 140));
      car.heading += steerInput * turnRate * dt * (vForward >= 0 ? 1 : -1);
    }
    const lateralGrip = Math.abs(vForward) > 35 && Math.abs(steerInput) > 0.5 ? 7.5 : 13.5;
    vLateral *= Math.exp(-lateralGrip * dt);

    // Reconstruct world velocity with updated heading
    const nSin = Math.sin(car.heading);
    const nCos = Math.cos(car.heading);
    const nFwdX = -nSin;
    const nFwdZ = -nCos;
    const nRightX = nCos;
    const nRightZ = -nSin;

    car.vx = nFwdX * vForward + nRightX * vLateral;
    car.vz = nFwdZ * vForward + nRightZ * vLateral;
    car.speed = vForward;

    car.x += car.vx * dt;
    car.z += car.vz * dt;

    // Organic Island Coastline Boundary
    const carAng = Math.atan2(car.z, car.x);
    const rDist = Math.hypot(car.x, car.z);
    const maxShoreR = getIslandRadius(carAng) - 8;
    if (rDist > maxShoreR) {
      const nx = -car.x / rDist;
      const nz = -car.z / rDist;
      car.x = (car.x / rDist) * maxShoreR;
      car.z = (car.z / rDist) * maxShoreR;
      const vn = car.vx * nx + car.vz * nz;
      if (vn < 0) {
        car.vx -= 1.25 * vn * nx;
        car.vz -= 1.25 * vn * nz;
      }
    }

    // Tangential Slide + Impulse Collisions: Trees & Mountains
    const carRadius = 1.65;
    for (let i = 0; i < treeColliders.length; i++) {
      const tc = treeColliders[i];
      resolveCircleCollider(car, tc.x, tc.z, carRadius + tc.r, 0.35, (impact) => {
        if (t - lastImpactAt > 0.38) {
          lastImpactAt = t;
          sound.playImpact(impact);
        }
      });
    }
    for (let i = 0; i < mountainColliders.length; i++) {
      const mc = mountainColliders[i];
      const frac = THREE.MathUtils.clamp((car.y - mc.baseBottomY) / mc.h, 0, 1);
      const effectiveR = mc.rad * (1 - frac) * 0.94;
      if (effectiveR > 1.0) {
        resolveCircleCollider(car, mc.x, mc.z, carRadius + effectiveR, 0.25, (impact) => {
          if (t - lastImpactAt > 0.45) {
            lastImpactAt = t;
            sound.playImpact(impact);
            showToast('⛰ Mountain Slope!');
          }
        });
      }
    }

    // 4-Wheel Ground Contact Sampling -> Zero road floating, zero slope clipping
    let hFL = 0, hFR = 0, hRL = 0, hRR = 0;
    for (let w = 0; w < 4; w++) {
      const [lx, lz] = WHEEL_OFFSETS[w];
      const wx = car.x + lx * nCos + lz * nSin;
      const wz = car.z - lx * nSin + lz * nCos;
      const wy = getSurfaceHeight(wx, wz);
      if (w === 0) hFL = wy;
      else if (w === 1) hFR = wy;
      else if (w === 2) hRL = wy;
      else hRR = wy;
    }
    const centerY = getSurfaceHeight(car.x, car.z);
    const avgWheelY = (hFL + hFR + hRL + hRR) * 0.25;
    const supportY = Math.max(avgWheelY, centerY);

    // Vertical gravity & ground clamping
    car.vy -= 32 * dt;
    car.y += car.vy * dt;
    if (car.y <= supportY) {
      car.y = supportY;
      if (car.vy < 0) car.vy = 0;
    }

    // Exact 4-wheel pitch & roll alignment to terrain/ramps (clamped for stability)
    const avgFrontY = (hFL + hFR) * 0.5;
    const avgRearY = (hRL + hRR) * 0.5;
    const avgLeftY = (hFL + hRL) * 0.5;
    const avgRightY = (hFR + hRR) * 0.5;

    const slopePitch = THREE.MathUtils.clamp(Math.atan2(avgFrontY - avgRearY, 2.84), -0.45, 0.45);
    const slopeRoll = THREE.MathUtils.clamp(Math.atan2(avgRightY - avgLeftY, 2.27), -0.45, 0.45);
    const dynRoll = -steerInput * 0.055 * Math.min(1, Math.abs(car.speed) / 16);
    const dynPitch = rev ? 0.03 : fwd ? (boost ? -0.032 : -0.016) : 0;

    // Knockable MIGUEL 3D Block Letters Physics
    for (let i = 0; i < miguelLetters.length; i++) {
      const l = miguelLetters[i];
      const dx = l.x - car.x;
      const dz = l.z - car.z;
      const dist = Math.hypot(dx, dz);
      if (dist < 2.8 && dist > 0.01) {
        const impact = Math.max(12, Math.hypot(car.vx, car.vz) * 1.15);
        l.vx = (dx / dist) * impact;
        l.vz = (dz / dist) * impact;
        l.vy = Math.min(11, impact * 0.35);
        l.vrx = (Math.random() - 0.5) * 8;
        l.vrz = (Math.random() - 0.5) * 8;
        sound.playChime();
      }
      const floorY = getSurfaceHeight(l.x, l.z) + 0.85;
      if (Math.abs(l.vx) > 0.05 || Math.abs(l.vz) > 0.05 || l.y > floorY) {
        l.x += l.vx * dt;
        l.z += l.vz * dt;
        l.y += l.vy * dt;
        l.vy -= 26 * dt;
        if (l.y < floorY) { l.y = floorY; l.vy *= -0.32; }
        l.vx *= Math.pow(0.18, dt);
        l.vz *= Math.pow(0.18, dt);
        l.rx += l.vrx * dt;
        l.rz += l.vrz * dt;
        l.vrx *= Math.pow(0.25, dt);
        l.vrz *= Math.pow(0.25, dt);
        l.mesh.position.set(l.x, l.y, l.z);
        l.mesh.rotation.set(l.rx, 0, l.rz);
      }
    }

    return {
      targetPitch: slopePitch + dynPitch,
      targetRoll: slopeRoll + dynRoll
    };
  }

  return { stepPhysics };
}
