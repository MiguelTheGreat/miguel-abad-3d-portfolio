import * as THREE from 'three';
import { STATION_DECK_H } from '../config/portfolioData.js?v=3';

export const TERRAIN_SPAN = 1220;
export const TERRAIN_RES = 260;
export const WATER_LEVEL = -2.4;

export function getIslandRadius(ang) {
  return 445
    + Math.sin(ang * 2 + 0.5) * 52
    + Math.cos(ang * 3 - 0.8) * 38
    + Math.sin(ang * 5 + 1.2) * 20
    + Math.cos(ang * 7) * 11;
}

const smoothstep = (e0, e1, v) => {
  const t = Math.max(0, Math.min(1, (v - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

export function createTerrainSystem(scene, zones, roadSamples) {
  const heightGrid = new Float32Array((TERRAIN_RES + 1) * (TERRAIN_RES + 1));

  for (let gz = 0; gz <= TERRAIN_RES; gz++) {
    for (let gx = 0; gx <= TERRAIN_RES; gx++) {
      const wx = -TERRAIN_SPAN * 0.5 + (gx / TERRAIN_RES) * TERRAIN_SPAN;
      const wz = -TERRAIN_SPAN * 0.5 + (gz / TERRAIN_RES) * TERRAIN_SPAN;
      const ang = Math.atan2(wz, wx);
      const r = Math.hypot(wx, wz);
      const islandR = getIslandRadius(ang);

      // Strictly positive inland hills (0.05m base up to +14.5m peaks) -> zero inland underwater pits or floating roads
      const w1 = (Math.sin(wx * 0.016) * Math.cos(wz * 0.015) + 1) * 0.5;
      const w2 = (Math.sin((wx + wz) * 0.025) + 1) * 0.5;
      const w3 = (Math.cos((wx - wz) * 0.038) + 1) * 0.5;
      let h = 0.05 + Math.pow(w1, 1.4) * 9.6 + Math.pow(w2, 1.2) * 3.2 + w3 * 1.4;

      let flatFactor = 1.0;
      for (let i = 0; i < zones.length; i++) {
        const zd = Math.hypot(wx - zones[i].x, wz - zones[i].z);
        flatFactor = Math.min(flatFactor, smoothstep(zones[i].radius + 6, zones[i].radius + 28, zd));
      }
      flatFactor = Math.min(flatFactor, smoothstep(22, 42, Math.hypot(wx, wz - 10)));
      for (let i = 0; i < roadSamples.length; i++) {
        const rp = roadSamples[i];
        const rd = Math.hypot(wx - rp.x, wz - rp.z);
        if (rd < rp.halfWidth + 26) {
          flatFactor = Math.min(flatFactor, smoothstep(rp.halfWidth + 4.5, rp.halfWidth + 26, rd));
        }
      }
      // Keep terrain at 0.05m under flat zones/roads so asphalt at 0.08m sits flush with zero floating
      h = h * flatFactor + 0.05 * (1 - flatFactor);

      // Smooth sandy beach slope from 0.82 to 0.90 (above water), then seabed drop outside 0.90
      const shoreRatio = r / islandR;
      if (shoreRatio > 0.80) {
        const beachDrop = smoothstep(0.80, 0.90, shoreRatio);
        const beachH = 0.45 * (1 - beachDrop) + (-1.15) * beachDrop;
        h = h * (1 - beachDrop) + beachH * beachDrop;
      }
      if (shoreRatio > 0.89) {
        const seaDrop = smoothstep(0.89, 1.04, shoreRatio);
        h = h * (1 - seaDrop) + (-5.2) * seaDrop;
      }
      heightGrid[gz * (TERRAIN_RES + 1) + gx] = h;
    }
  }

  // Exact Triangle Barycentric Interpolation matching THREE.PlaneGeometry diagonal split
  function getTerrainHeight(x, z) {
    const fx = ((x + TERRAIN_SPAN * 0.5) / TERRAIN_SPAN) * TERRAIN_RES;
    const fz = ((z + TERRAIN_SPAN * 0.5) / TERRAIN_SPAN) * TERRAIN_RES;
    const ix = Math.max(0, Math.min(TERRAIN_RES - 1, Math.floor(fx)));
    const iz = Math.max(0, Math.min(TERRAIN_RES - 1, Math.floor(fz)));
    const tx = Math.max(0, Math.min(1, fx - ix));
    const tz = Math.max(0, Math.min(1, fz - iz));
    const stride = TERRAIN_RES + 1;
    const h00 = heightGrid[iz * stride + ix];
    const h10 = heightGrid[iz * stride + ix + 1];
    const h01 = heightGrid[(iz + 1) * stride + ix];
    const h11 = heightGrid[(iz + 1) * stride + ix + 1];
    if (tx + tz <= 1) {
      return h00 + tx * (h10 - h00) + tz * (h01 - h00);
    }
    return h11 + (1 - tx) * (h01 - h11) + (1 - tz) * (h10 - h11);
  }

  function getStationDeckHeight(x, z) {
    let maxH = 0;
    for (let i = 0; i < zones.length; i++) {
      const zObj = zones[i];
      const d = Math.hypot(x - zObj.x, z - zObj.z);
      if (d <= zObj.radius + 3.6) {
        if (d <= zObj.radius - 1.5) maxH = Math.max(maxH, STATION_DECK_H);
        else {
          const rampFrac = 1 - (d - (zObj.radius - 1.5)) / 5.1;
          maxH = Math.max(maxH, STATION_DECK_H * Math.max(0, Math.min(1, rampFrac)));
        }
      }
    }
    return maxH;
  }

  function isOnRoad(x, z) {
    for (let i = 0; i < roadSamples.length; i++) {
      const rp = roadSamples[i];
      if (Math.hypot(x - rp.x, z - rp.z) <= rp.halfWidth + 0.8) return true;
    }
    return false;
  }

  function getSurfaceHeight(x, z) {
    const deckH = getStationDeckHeight(x, z);
    if (deckH > 0.08) return deckH;
    if (isOnRoad(x, z)) return 0.08;
    return Math.max(deckH, getTerrainHeight(x, z));
  }

  function isPointClearOfRoadsAndZones(x, z, roadMargin = 6.5, zoneMargin = 12) {
    const ang = Math.atan2(z, x);
    if (Math.hypot(x, z) > getIslandRadius(ang) * 0.85) return false;
    if (Math.hypot(x, z - 12) < 30) return false;
    for (let i = 0; i < zones.length; i++) {
      if (Math.hypot(x - zones[i].x, z - zones[i].z) < zones[i].radius + zoneMargin) return false;
    }
    for (let i = 0; i < roadSamples.length; i++) {
      const rp = roadSamples[i];
      if (Math.hypot(x - rp.x, z - rp.z) < rp.halfWidth + roadMargin) return false;
    }
    return true;
  }

  // Ocean & High-Polygon Vertex-Colored Uneven Island Mesh (260 x 260 = ~135,200 triangles)
  const oceanMat = new THREE.MeshStandardMaterial({ color: 0x0096c7, roughness: 0.22, metalness: 0.18 });
  const ocean = new THREE.Mesh(new THREE.PlaneGeometry(3600, 3600, 32, 32), oceanMat);
  ocean.rotation.x = -Math.PI / 2;
  ocean.position.y = WATER_LEVEL;
  scene.add(ocean);

  const terrainGeo = new THREE.PlaneGeometry(TERRAIN_SPAN, TERRAIN_SPAN, TERRAIN_RES, TERRAIN_RES);
  terrainGeo.rotateX(-Math.PI / 2);
  const tPos = terrainGeo.attributes.position;
  const tColors = new Float32Array(tPos.count * 3);
  for (let i = 0; i < tPos.count; i++) {
    const vx = tPos.getX(i);
    const vz = tPos.getZ(i);
    const stride = TERRAIN_RES + 1;
    const gx = i % stride;
    const gz = Math.floor(i / stride);
    const vy = heightGrid[gz * stride + gx];
    tPos.setY(i, vy);
    const shoreRatio = Math.hypot(vx, vz) / getIslandRadius(Math.atan2(vz, vx));
    let r = 0.32, g = 0.72, b = 0.53;
    if (shoreRatio > 0.81 || vy < 0.02) { r = 0.95; g = 0.84; b = 0.56; }
    else if (vy < 0.65) { r = 0.42; g = 0.76; b = 0.54; }
    else if (vy > 6.5) { r = 0.22; g = 0.54; b = 0.38; }
    tColors[i * 3] = r;
    tColors[i * 3 + 1] = g;
    tColors[i * 3 + 2] = b;
  }
  terrainGeo.setAttribute('color', new THREE.BufferAttribute(tColors, 3));
  terrainGeo.computeVertexNormals();
  const grassMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.88, flatShading: false });
  const terrainMesh = new THREE.Mesh(terrainGeo, grassMat);
  terrainMesh.receiveShadow = true;
  scene.add(terrainMesh);

  return {
    oceanMat,
    grassMat,
    getTerrainHeight,
    getStationDeckHeight,
    getSurfaceHeight,
    isPointClearOfRoadsAndZones
  };
}
