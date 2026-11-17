import * as THREE from 'three';
import { STATION_DECK_H } from '../config/portfolioData.js';

export const TERRAIN_SPAN = 1220;
export const TERRAIN_RES = 260;

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

      let h = Math.sin(wx * 0.017) * Math.cos(wz * 0.015) * 7.6
            + Math.sin((wx + wz) * 0.029) * 3.8
            + Math.cos((wx - wz) * 0.043) * 1.9
            + 3.4;

      let flatFactor = 1.0;
      for (let i = 0; i < zones.length; i++) {
        const zd = Math.hypot(wx - zones[i].x, wz - zones[i].z);
        flatFactor = Math.min(flatFactor, smoothstep(zones[i].radius + 5, zones[i].radius + 22, zd));
      }
      flatFactor = Math.min(flatFactor, smoothstep(20, 38, Math.hypot(wx, wz - 10)));
      for (let i = 0; i < roadSamples.length; i++) {
        const rp = roadSamples[i];
        const rd = Math.hypot(wx - rp.x, wz - rp.z);
        if (rd < rp.halfWidth + 20) {
          flatFactor = Math.min(flatFactor, smoothstep(rp.halfWidth + 2.2, rp.halfWidth + 20, rd));
        }
      }
      // Keep terrain at 0.04m under flat zones/roads so asphalt at 0.08m sits flush with zero z-fighting
      h = h * flatFactor + 0.04 * (1 - flatFactor);

      const shoreRatio = r / islandR;
      if (shoreRatio > 0.84) {
        const coastDrop = smoothstep(0.84, 1.08, shoreRatio);
        h = h * (1 - coastDrop) + (-4.6) * coastDrop;
      }
      heightGrid[gz * (TERRAIN_RES + 1) + gx] = h;
    }
  }

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
    return (h00 * (1 - tx) + h10 * tx) * (1 - tz) + (h01 * (1 - tx) + h11 * tx) * tz;
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
    for (let i = 0; i < roadSamples.length; i += 2) {
      const rp = roadSamples[i];
      if (Math.hypot(x - rp.x, z - rp.z) <= rp.halfWidth + 0.6) return true;
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
    if (Math.hypot(x, z) > getIslandRadius(ang) * 0.90) return false;
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
  ocean.position.y = -2.4;
  scene.add(ocean);

  const terrainGeo = new THREE.PlaneGeometry(TERRAIN_SPAN, TERRAIN_SPAN, TERRAIN_RES, TERRAIN_RES);
  terrainGeo.rotateX(-Math.PI / 2);
  const tPos = terrainGeo.attributes.position;
  const tColors = new Float32Array(tPos.count * 3);
  for (let i = 0; i < tPos.count; i++) {
    const vx = tPos.getX(i);
    const vz = tPos.getZ(i);
    const vy = getTerrainHeight(vx, vz);
    tPos.setY(i, vy);
    let r = 0.32, g = 0.72, b = 0.53;
    if (vy < -0.25) { r = 0.96; g = 0.84; b = 0.55; }
    else if (vy < 0.55) { r = 0.65; g = 0.79; b = 0.54; }
    else if (vy > 6.0) { r = 0.22; g = 0.54; b = 0.38; }
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
