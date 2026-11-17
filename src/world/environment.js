import * as THREE from 'three';
import { getIslandRadius } from './terrain.js';

function createJaggedMountainGeo(rad, h, seed) {
  const geo = new THREE.ConeGeometry(rad, h, 24, 7);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const r = Math.hypot(x, z);
    if (r > 0.5) {
      const ang = Math.atan2(z, x);
      const heightFrac = (y + h * 0.5) / h;
      const ridge = 1.0 + Math.sin(ang * 5 + seed) * 0.14 + Math.cos(ang * 3 - seed * 0.7) * 0.11;
      const scale = 1.0 + (ridge - 1.0) * (1.0 - heightFrac * 0.4);
      pos.setX(i, x * scale);
      pos.setZ(i, z * scale);
      pos.setY(i, y + Math.sin(ang * 4 + seed) * 1.6 * (1 - heightFrac));
    }
  }
  geo.computeVertexNormals();
  return geo;
}

export function buildEnvironment(scene, terrain, redCurbMat, whiteCurbMat) {
  const { getTerrainHeight, isPointClearOfRoadsAndZones } = terrain;

  // High-poly Pine & Cypress Forest + Boulders (100% Road-Clear, Real Collision Physics)
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x7f4f24, roughness: 0.9 });
  const pineMat1 = new THREE.MeshStandardMaterial({ color: 0x2d6a4f, roughness: 0.75 });
  const pineMat2 = new THREE.MeshStandardMaterial({ color: 0x40916c, roughness: 0.75 });
  const rockMat = new THREE.MeshStandardMaterial({ color: 0x6c757d, roughness: 0.85 });

  const spawnedTrees = [];
  const treeColliders = [];
  for (let i = 0; i < 380; i++) {
    const angle = (i / 380) * Math.PI * 2 + (i % 9) * 0.19;
    const maxR = getIslandRadius(angle) * 0.88;
    const dist = 48 + ((i * 89) % Math.max(80, Math.floor(maxR - 54)));
    const tx = Math.cos(angle) * dist;
    const tz = Math.sin(angle) * dist;
    if (!isPointClearOfRoadsAndZones(tx, tz, 7.2, 13)) continue;

    const ty = getTerrainHeight(tx, tz);
    if (ty < -0.2) continue;

    const sc = 0.92 + (i % 4) * 0.25;
    const t = new THREE.Group();
    const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.58, 3.2, 12), trunkMat);
    tr.position.y = 1.4; tr.castShadow = true;
    const c1 = new THREE.Mesh(new THREE.ConeGeometry(2.5, 4.2, 14), i % 2 === 0 ? pineMat1 : pineMat2);
    c1.position.y = 3.9; c1.castShadow = true;
    const c2 = new THREE.Mesh(new THREE.ConeGeometry(1.75, 3.2, 14), pineMat2);
    c2.position.y = 5.8; c2.castShadow = true;
    const c3 = new THREE.Mesh(new THREE.ConeGeometry(1.1, 2.2, 14), pineMat1);
    c3.position.y = 7.2; c3.castShadow = true;
    t.add(tr, c1, c2, c3);

    if (i % 3 === 0) {
      const rk = new THREE.Mesh(new THREE.DodecahedronGeometry(1.1, 1), rockMat);
      rk.position.set(1.8, 0.45, 0.6); rk.scale.set(1.2, 0.7, 1.0); rk.castShadow = true;
      t.add(rk);
    }
    t.scale.setScalar(sc);
    t.position.set(tx, ty - 0.3, tz);
    scene.add(t);
    spawnedTrees.push({ x: tx, z: tz });
    treeColliders.push({ x: tx, z: tz, r: 1.05 * sc });
  }

  // High-Poly Jagged Alpine Mountains Rooted Firmly Into Terrain (Zero Sloping/Floating Bases)
  const mtnMat = new THREE.MeshStandardMaterial({ color: 0x4a5759, roughness: 0.9, flatShading: true });
  const snowMat = new THREE.MeshStandardMaterial({ color: 0xf8f9fa, roughness: 0.5, flatShading: true });
  const mountainColliders = [];

  for (let m = 0; m < 32; m++) {
    const ang = (m / 32) * Math.PI * 2 + 0.09;
    const r = getIslandRadius(ang) * (0.76 + (m % 3) * 0.05);
    const mx = Math.cos(ang) * r;
    const mz = Math.sin(ang) * r;
    if (!isPointClearOfRoadsAndZones(mx, mz, 24, 38)) continue;

    const h = 52 + (m % 4) * 14;
    const rad = 28 + (m % 3) * 8;
    // Sample lowest surrounding ground so mountain base is always buried cleanly into the hill/slope
    let minGround = getTerrainHeight(mx, mz);
    for (let s = 0; s < 8; s++) {
      const sa = (s / 8) * Math.PI * 2;
      minGround = Math.min(minGround, getTerrainHeight(mx + Math.cos(sa) * rad * 0.85, mz + Math.sin(sa) * rad * 0.85));
    }

    const mGrp = new THREE.Group();
    const base = new THREE.Mesh(createJaggedMountainGeo(rad, h, m * 1.7), mtnMat);
    base.position.y = h * 0.5 - 8.0;
    base.castShadow = true; base.receiveShadow = true;
    mGrp.add(base);

    const cap = new THREE.Mesh(createJaggedMountainGeo(rad * 0.37, h * 0.37, m * 1.7 + 0.4), snowMat);
    cap.position.y = h * 0.81 - 7.8;
    mGrp.add(cap);

    const sub = new THREE.Mesh(createJaggedMountainGeo(rad * 0.64, h * 0.62, m * 2.3), mtnMat);
    sub.position.set(rad * 0.42, h * 0.31 - 8.0, rad * 0.24);
    sub.castShadow = true;
    mGrp.add(sub);

    mGrp.position.set(mx, minGround, mz);
    mGrp.rotation.y = m * 0.7;
    scene.add(mGrp);
    mountainColliders.push({ x: mx, z: mz, r: rad * 0.78 });
  }

  // Coastal Lighthouse with Rotating Spotlight Beam (Southeast Cape)
  const lhX = 335, lhZ = 240, lhY = Math.max(0, getTerrainHeight(lhX, lhZ));
  const lighthouseGrp = new THREE.Group();
  const lhTower = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 3.6, 22, 24), whiteCurbMat);
  lhTower.position.y = 11; lhTower.castShadow = true; lighthouseGrp.add(lhTower);
  const lhBand1 = new THREE.Mesh(new THREE.CylinderGeometry(2.65, 2.95, 4.5, 24), redCurbMat);
  lhBand1.position.y = 8; lighthouseGrp.add(lhBand1);
  const lhBand2 = new THREE.Mesh(new THREE.CylinderGeometry(2.3, 2.5, 4.2, 24), redCurbMat);
  lhBand2.position.y = 16; lighthouseGrp.add(lhBand2);
  const lhLantern = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 2.0, 2.8, 20), new THREE.MeshBasicMaterial({ color: 0xfff3b0 }));
  lhLantern.position.y = 23.2; lighthouseGrp.add(lhLantern);
  const lhRoof = new THREE.Mesh(new THREE.ConeGeometry(2.5, 2.8, 20), redCurbMat);
  lhRoof.position.y = 25.8; lighthouseGrp.add(lhRoof);
  const lhBeamPivot = new THREE.Group();
  lhBeamPivot.position.y = 23.2;
  const beamCone = new THREE.Mesh(
    new THREE.ConeGeometry(7.5, 65, 24, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xfff3b0, transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false })
  );
  beamCone.rotation.x = Math.PI / 2; beamCone.position.z = 32.5;
  lhBeamPivot.add(beamCone);
  lighthouseGrp.add(lhBeamPivot);
  lighthouseGrp.position.set(lhX, lhY - 0.5, lhZ);
  scene.add(lighthouseGrp);

  // Animated Wind Turbines on the Hills
  const windRotors = [];
  [[-210, -245], [225, -230], [-305, 175], [195, 295]].forEach(([wx, wz]) => {
    if (!isPointClearOfRoadsAndZones(wx, wz, 10, 16)) return;
    const tGrp = new THREE.Group();
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.9, 20, 16), whiteCurbMat);
    mast.position.y = 10; mast.castShadow = true; tGrp.add(mast);
    const hub = new THREE.Group();
    hub.position.set(0, 20, 0.7);
    for (let b = 0; b < 3; b++) {
      const bladeGrp = new THREE.Group();
      bladeGrp.rotation.z = (b * Math.PI * 2) / 3;
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.55, 7.8, 0.15), whiteCurbMat);
      blade.position.y = 3.9; bladeGrp.add(blade);
      hub.add(bladeGrp);
    }
    tGrp.add(hub);
    tGrp.position.set(wx, getTerrainHeight(wx, wz) - 0.4, wz);
    scene.add(tGrp);
    windRotors.push(hub);
  });

  // Drifting Sky Clouds & Bobbing Ocean Sailboats
  const clouds = [];
  const cloudMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.72 });
  for (let c = 0; c < 14; c++) {
    const cGrp = new THREE.Group();
    [[0, 0, 0, 6.5], [5.0, -0.4, 1.2, 4.8], [-5.0, -0.5, -1.0, 5.0]].forEach(([cx, cy, cz, cr]) => {
      const puff = new THREE.Mesh(new THREE.DodecahedronGeometry(cr, 2), cloudMat);
      puff.scale.set(1.4, 0.55, 1.0); puff.position.set(cx, cy, cz); cGrp.add(puff);
    });
    const ang = (c / 14) * Math.PI * 2;
    const dist = 240 + (c % 3) * 115;
    cGrp.position.set(Math.cos(ang) * dist, 72 + (c % 4) * 10, Math.sin(ang) * dist);
    scene.add(cGrp);
    clouds.push({ grp: cGrp, speed: 2.4 + (c % 3) * 0.9 });
  }

  const sailboats = [];
  for (let s = 0; s < 10; s++) {
    const ang = (s / 10) * Math.PI * 2 + 0.3;
    const dist = getIslandRadius(ang) + 65 + (s % 2) * 45;
    const bGrp = new THREE.Group();
    const hull = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.2, 7.5), whiteCurbMat);
    hull.position.y = 0.4; bGrp.add(hull);
    const sail = new THREE.Mesh(new THREE.ConeGeometry(2.8, 7.5, 3), s % 2 === 0 ? redCurbMat : whiteCurbMat);
    sail.position.set(0, 4.6, 0); bGrp.add(sail);
    bGrp.position.set(Math.cos(ang) * dist, -2.2, Math.sin(ang) * dist);
    bGrp.rotation.y = ang + Math.PI / 2;
    scene.add(bGrp);
    sailboats.push({ grp: bGrp, phase: s * 1.1 });
  }

  return {
    spawnedTrees,
    treeColliders,
    mountainColliders,
    lhBeamPivot,
    windRotors,
    clouds,
    sailboats
  };
}
