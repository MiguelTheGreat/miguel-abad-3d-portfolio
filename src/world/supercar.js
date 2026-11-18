import * as THREE from 'three';

const smoothstep = (e0, e1, v) => {
  const t = Math.max(0, Math.min(1, (v - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

// High-Polygon 3D Lofted Supercar Monocoque Shell (~5,120 triangles with Coke-bottle waist, fender haunches & wheel wells)
function buildSculptedMonocoqueGeo() {
  const zSegs = 64;
  const uSegs = 40;
  const zMin = -2.46;
  const zMax = 2.42;

  function getHalfWidth(z) {
    // Nose taper -> flared front arches -> Coke-bottle door pinch -> wide rear haunches -> Kammback tail
    const noseTaper = smoothstep(-2.46, -1.75, z);
    const frontFlare = Math.exp(-Math.pow((z + 1.42) / 0.56, 2)) * 0.11;
    const waistPinch = Math.exp(-Math.pow((z + 0.12) / 0.62, 2)) * -0.09;
    const rearHaunch = Math.exp(-Math.pow((z - 1.42) / 0.64, 2)) * 0.15;
    const tailTaper = (1 - smoothstep(1.85, 2.42, z)) * 0.08 - 0.08;
    const baseW = 0.80 + 0.25 * noseTaper;
    return baseW + frontFlare + waistPinch + rearHaunch + tailTaper;
  }

  function getSpineHeight(z) {
    if (z < -1.25) {
      const t = smoothstep(-2.46, -1.25, z);
      return 0.30 + t * 0.45;
    }
    if (z < 1.55) {
      return 0.75 + smoothstep(-1.25, 0.8, z) * 0.11;
    }
    const t = smoothstep(1.55, 2.42, z);
    return 0.86 - t * 0.06 + Math.exp(-Math.pow((z - 2.32) / 0.14, 2)) * 0.045; // integrated ducktail flip
  }

  function getFenderCrest(z) {
    const frontCrest = Math.exp(-Math.pow((z + 1.42) / 0.62, 2)) * 0.11;
    const rearCrest = Math.exp(-Math.pow((z - 1.38) / 0.68, 2)) * 0.14;
    const noseRise = smoothstep(-2.42, -1.8, z) * 0.04;
    return frontCrest + rearCrest + noseRise;
  }

  function getBottomY(z, absSide) {
    let by = 0.22;
    // Wheel-well arch cutouts on the outer flanks (absSide > 0.68)
    if (absSide > 0.68) {
      const sideFactor = smoothstep(0.68, 0.92, absSide);
      const df = Math.abs(z + 1.42);
      const dr = Math.abs(z - 1.42);
      const rArch = 0.485;
      if (df < rArch) {
        const archLift = Math.sqrt(Math.max(0, rArch * rArch - df * df)) * 0.96;
        by = Math.max(by, (0.22 + archLift) * sideFactor + 0.22 * (1 - sideFactor));
      }
      if (dr < rArch) {
        const archLift = Math.sqrt(Math.max(0, rArch * rArch - dr * dr)) * 0.98;
        by = Math.max(by, (0.22 + archLift) * sideFactor + 0.22 * (1 - sideFactor));
      }
    }
    // Slight rear diffuser upsweep at tail
    if (z > 1.95) {
      by += smoothstep(1.95, 2.42, z) * 0.12;
    }
    return by;
  }

  const positions = [];
  const indices = [];

  for (let iz = 0; iz <= zSegs; iz++) {
    const vz = iz / zSegs;
    const z = zMin + vz * (zMax - zMin);
    const hw = getHalfWidth(z);
    const spineY = getSpineHeight(z);
    const crest = getFenderCrest(z);
    // Side intake scallop between front and rear wheels
    const sideScallop = Math.exp(-Math.pow((z - 0.08) / 0.62, 2)) * 0.12;
    // Front hood S-duct recess
    const hoodDuct = Math.exp(-Math.pow((z + 1.55) / 0.48, 2)) * 0.065;

    for (let iu = 0; iu <= uSegs; iu++) {
      // u goes from -1 (left lower sill) -> 0 (top center spine) -> +1 (right lower sill)
      const s = (iu / uSegs) * 2 - 1;
      const sign = s < 0 ? -1 : 1;
      const u = Math.abs(s);

      let xNorm, y;
      if (u <= 0.72) {
        // Upper deck & sculpted fender haunches
        const t = u / 0.72;
        xNorm = sign * Math.pow(t, 0.92) * 0.92;
        const haunchHump = Math.sin(t * Math.PI) * crest;
        const centerDip = (1 - smoothstep(0.0, 0.55, t)) * hoodDuct;
        const shoulderDrop = Math.pow(t, 2.4) * 0.07;
        y = spineY + haunchHump - centerDip - shoulderDrop;
      } else {
        // Curved side body flank curving from shoulder down to undertray sill
        const t = (u - 0.72) / 0.28; // 0 at shoulder, 1 at bottom sill
        const flankBulge = Math.sin(t * Math.PI) * 0.08;
        const intakeIndent = Math.sin(t * Math.PI) * sideScallop;
        xNorm = sign * (0.92 + flankBulge - intakeIndent - t * 0.03);
        const topShoulderY = spineY - 0.07;
        const botY = getBottomY(z, 0.95);
        y = topShoulderY * (1 - t) + botY * t;
      }

      // Close front nose tip and rear tail cleanly
      const endPinch = smoothstep(-2.46, -2.38, z) * (1 - smoothstep(2.36, 2.42, z));
      const x = xNorm * hw * (0.68 + 0.32 * endPinch);
      positions.push(x, y, z);
    }
  }

  const ringStride = uSegs + 1;
  for (let iz = 0; iz < zSegs; iz++) {
    for (let iu = 0; iu < uSegs; iu++) {
      const a = iz * ringStride + iu;
      const b = a + 1;
      const c = (iz + 1) * ringStride + iu;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

// High-Polygon 3D Teardrop Fighter-Jet Glasshouse Canopy (~1,568 triangles)
function buildTeardropCanopyGeo() {
  const zSegs = 28;
  const uSegs = 28;
  const zMin = -1.16;
  const zMax = 1.05;
  const positions = [];
  const indices = [];

  for (let iz = 0; iz <= zSegs; iz++) {
    const tZ = iz / zSegs;
    const z = zMin + tZ * (zMax - zMin);
    // Teardrop width: rounded windshield front, widest at B-pillar (tZ=0.38), tapering to rear engine deck
    const widthProfile = Math.sin(Math.pow(tZ, 0.72) * Math.PI);
    const halfW = 0.76 * Math.pow(Math.max(0.02, widthProfile), 0.62);
    // Roof arch height profile
    const roofH = Math.sin(Math.pow(tZ, 0.68) * Math.PI) * 0.48;
    const baseY = 0.79 + tZ * 0.05;

    for (let iu = 0; iu <= uSegs; iu++) {
      const s = (iu / uSegs) * 2 - 1; // -1 left base to +1 right base
      const ang = s * (Math.PI * 0.5);
      const x = Math.sin(ang) * halfW;
      const y = baseY + Math.cos(ang) * roofH;
      positions.push(x, y, z);
    }
  }

  const stride = uSegs + 1;
  for (let iz = 0; iz < zSegs; iz++) {
    for (let iu = 0; iu < uSegs; iu++) {
      const a = iz * stride + iu;
      const b = a + 1;
      const c = (iz + 1) * stride + iu;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

export function createSupercar(scene, startY) {
  const carGroup = new THREE.Group();
  const chassisGroup = new THREE.Group();
  carGroup.add(chassisGroup);
  carGroup.position.set(0, startY, 24);
  scene.add(carGroup);

  // Realistic Automotive Clearcoat Metallic Materials
  const paintMat = new THREE.MeshStandardMaterial({
    color: 0xd90429,
    roughness: 0.14,
    metalness: 0.56,
    side: THREE.DoubleSide
  });
  const whitePaintMat = new THREE.MeshStandardMaterial({ color: 0xf8f9fa, roughness: 0.18, metalness: 0.25 });
  const carbonMat = new THREE.MeshStandardMaterial({ color: 0x15171c, roughness: 0.36, metalness: 0.42, side: THREE.DoubleSide });
  const darkTrimMat = new THREE.MeshStandardMaterial({ color: 0x0b0c0e, roughness: 0.72, metalness: 0.18 });
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x0c1624,
    roughness: 0.04,
    metalness: 0.92,
    transparent: true,
    opacity: 0.82
  });
  const titaniumMat = new THREE.MeshStandardMaterial({ color: 0x9aa5b8, roughness: 0.2, metalness: 0.88 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xffb703, roughness: 0.26, metalness: 0.84 });

  // Racing Number Decal Texture (#22)
  const numCanvas = document.createElement('canvas');
  numCanvas.width = 256; numCanvas.height = 256;
  const nctx = numCanvas.getContext('2d');
  nctx.fillStyle = '#ffffff';
  nctx.beginPath(); nctx.arc(128, 128, 114, 0, Math.PI * 2); nctx.fill();
  nctx.lineWidth = 10; nctx.strokeStyle = '#111111'; nctx.stroke();
  nctx.fillStyle = '#111111';
  nctx.font = '900 120px Inter, Arial, sans-serif';
  nctx.textAlign = 'center'; nctx.textBaseline = 'middle';
  nctx.fillText('22', 128, 136);
  const numTex = new THREE.CanvasTexture(numCanvas);
  const decalMat = new THREE.MeshBasicMaterial({ map: numTex, transparent: true, polygonOffset: true, polygonOffsetFactor: -1 });

  // Ground Contact Shadow & Underglow
  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = 128; shadowCanvas.height = 256;
  const shCtx = shadowCanvas.getContext('2d');
  const sg = shCtx.createRadialGradient(64, 128, 12, 64, 128, 64);
  sg.addColorStop(0, 'rgba(0,0,0,0.68)');
  sg.addColorStop(0.7, 'rgba(0,0,0,0.28)');
  sg.addColorStop(1, 'rgba(0,0,0,0)');
  shCtx.fillStyle = sg; shCtx.fillRect(0, 0, 128, 256);
  const carShadow = new THREE.Mesh(
    new THREE.PlaneGeometry(3.2, 5.6),
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(shadowCanvas), transparent: true, depthWrite: false })
  );
  carShadow.rotation.x = -Math.PI / 2;
  carShadow.position.y = 0.025;
  chassisGroup.add(carShadow);

  const underglowMat = new THREE.MeshBasicMaterial({ color: 0x00b4d8, transparent: true, opacity: 0.18, depthWrite: false, side: THREE.DoubleSide });
  const underglow = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 4.4), underglowMat);
  underglow.rotation.x = -Math.PI / 2;
  underglow.position.y = 0.14;
  chassisGroup.add(underglow);

  // 1. High-Polygon 3D Lofted Supercar Monocoque Body Shell
  const mainBody = new THREE.Mesh(buildSculptedMonocoqueGeo(), paintMat);
  mainBody.castShadow = true;
  mainBody.receiveShadow = true;
  chassisGroup.add(mainBody);

  // 2. Sculpted Carbon Fiber Flat Undertray, Curved Front Splitter & Aero Side Skirts
  const undertray = new THREE.Mesh(new THREE.BoxGeometry(1.96, 0.08, 4.55), carbonMat);
  undertray.position.set(0, 0.21, 0.0);
  undertray.castShadow = true;
  chassisGroup.add(undertray);

  // Curved multi-element front splitter blade
  const splitterShape = new THREE.Shape();
  splitterShape.moveTo(-1.14, 0);
  splitterShape.quadraticCurveTo(0, -0.34, 1.14, 0);
  splitterShape.lineTo(1.06, 0.42);
  splitterShape.quadraticCurveTo(0, 0.18, -1.06, 0.42);
  splitterShape.closePath();
  const splitterGeo = new THREE.ExtrudeGeometry(splitterShape, { depth: 0.055, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.015, bevelSegments: 2 });
  splitterGeo.rotateX(Math.PI / 2);
  const splitter = new THREE.Mesh(splitterGeo, carbonMat);
  splitter.position.set(0, 0.23, -2.32);
  chassisGroup.add(splitter);

  // Front grille mouth & twin dive-plane canards
  const frontGrille = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.16, 0.18), darkTrimMat);
  frontGrille.position.set(0, 0.31, -2.36);
  chassisGroup.add(frontGrille);

  [-1, 1].forEach(side => {
    const canard = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.16, 0.48), carbonMat);
    canard.position.set(side * 1.04, 0.33, -2.18);
    canard.rotation.z = side * 0.28;
    canard.rotation.y = -side * 0.18;
    chassisGroup.add(canard);

    // Sculpted carbon side skirt + vertical aero bargeboard fin
    const skirt = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.06, 2.08), carbonMat);
    skirt.position.set(side * 1.03, 0.20, 0.0);
    chassisGroup.add(skirt);
    const bargeFin = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.22, 0.45), carbonMat);
    bargeFin.position.set(side * 1.08, 0.30, -0.72);
    chassisGroup.add(bargeFin);
  });

  // 3. Curved Wheel-Well Housings & Flared Carbon Arch Lips (32-segment smooth arches)
  [[-1.04, -1.42], [1.04, -1.42], [-1.08, 1.42], [1.08, 1.42]].forEach(([fx, fz], idx) => {
    const isLeft = idx % 2 === 0;
    const archLip = new THREE.Mesh(new THREE.TorusGeometry(0.465, 0.042, 14, 32, Math.PI), carbonMat);
    archLip.rotation.y = Math.PI / 2;
    archLip.position.set(fx + (isLeft ? -0.05 : 0.05), 0.43, fz);
    chassisGroup.add(archLip);

    // Inner wheel-well liner cylinder so wheel bay is completely enclosed
    const liner = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.44, 24, 1, false, 0, Math.PI), darkTrimMat);
    liner.rotation.z = Math.PI / 2;
    liner.position.set(fx * 0.88, 0.43, fz);
    chassisGroup.add(liner);
  });

  // 4. Side Intercooler Scoops & Flying Buttress Intakes
  [-1, 1].forEach(side => {
    const scoopFrame = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.34, 0.52), darkTrimMat);
    scoopFrame.position.set(side * 0.96, 0.54, 0.45);
    scoopFrame.rotation.y = side * 0.14;
    chassisGroup.add(scoopFrame);

    const splitterVane = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.03, 0.48), carbonMat);
    splitterVane.position.set(side * 0.98, 0.54, 0.45);
    chassisGroup.add(splitterVane);

    // Flying buttress C-pillar aero blade curving from roof to rear haunch
    const buttress = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.09, 1.12, 12), paintMat);
    buttress.position.set(side * 0.62, 1.02, 0.68);
    buttress.rotation.x = 1.08;
    buttress.rotation.z = side * 0.24;
    buttress.castShadow = true;
    chassisGroup.add(buttress);
  });

  // 5. Center Racing Stripes, S-Duct Hood Louvers & #22 Roundel
  const hoodStripe = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.025, 1.32), whitePaintMat);
  hoodStripe.position.set(0, 0.62, -1.68);
  hoodStripe.rotation.x = 0.34;
  chassisGroup.add(hoodStripe);

  const hoodVent = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.04, 0.44), carbonMat);
  hoodVent.position.set(0, 0.58, -1.62);
  hoodVent.rotation.x = 0.34;
  chassisGroup.add(hoodVent);

  const hoodDecal = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.62), decalMat);
  hoodDecal.rotation.x = -Math.PI / 2 + 0.34;
  hoodDecal.position.set(0, 0.66, -1.48);
  chassisGroup.add(hoodDecal);

  // 6. 3D Sculpted Teardrop Canopy, Carbon Roof Scoop & Cockpit Interior
  const canopy = new THREE.Mesh(buildTeardropCanopyGeo(), glassMat);
  canopy.castShadow = true;
  chassisGroup.add(canopy);

  // Sculpted carbon roof crown + NACA roof snorkel scoop
  const roofCrown = new THREE.Mesh(
    new THREE.SphereGeometry(0.58, 24, 16, 0, Math.PI * 2, 0, 0.52),
    carbonMat
  );
  roofCrown.scale.set(1.0, 0.45, 1.65);
  roofCrown.position.set(0, 1.05, -0.06);
  chassisGroup.add(roofCrown);

  const roofDecal = new THREE.Mesh(new THREE.PlaneGeometry(0.54, 0.54), decalMat);
  roofDecal.rotation.x = -Math.PI / 2;
  roofDecal.position.set(0, 1.315, -0.05);
  chassisGroup.add(roofDecal);

  const roofScoop = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.15, 0.68, 16), paintMat);
  roofScoop.rotation.x = Math.PI / 2;
  roofScoop.scale.set(1.2, 0.8, 1);
  roofScoop.position.set(0, 1.32, 0.32);
  chassisGroup.add(roofScoop);
  const scoopMouth = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.05, 16), darkTrimMat);
  scoopMouth.rotation.x = Math.PI / 2;
  scoopMouth.position.set(0, 1.32, -0.02);
  chassisGroup.add(scoopMouth);

  // Interior: Twin Bucket Seats, Dashboard Binnacle & Flat-Bottom GT Steering Wheel
  [-0.26, 0.26].forEach(sx => {
    const seatBack = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.52, 0.12), darkTrimMat);
    seatBack.position.set(sx, 0.92, 0.24);
    seatBack.rotation.x = -0.24;
    chassisGroup.add(seatBack);
    const headrest = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.18, 0.11), paintMat);
    headrest.position.set(sx, 1.14, 0.29);
    chassisGroup.add(headrest);
  });
  const steerWheel = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.024, 10, 20), carbonMat);
  steerWheel.position.set(-0.26, 0.94, -0.48);
  steerWheel.rotation.x = 0.38;
  chassisGroup.add(steerWheel);

  // Aerodynamic Wing Mirrors on Carbon Stalks
  [-1, 1].forEach(side => {
    const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.03, 0.26, 10), carbonMat);
    stalk.position.set(side * 0.88, 0.92, -0.58);
    stalk.rotation.z = -side * 0.95;
    chassisGroup.add(stalk);
    const mirrorHousing = new THREE.Mesh(new THREE.SphereGeometry(0.095, 16, 12), paintMat);
    mirrorHousing.scale.set(1.35, 0.65, 1.6);
    mirrorHousing.position.set(side * 1.01, 0.96, -0.58);
    chassisGroup.add(mirrorHousing);
  });

  // 7. Exposed V10 Engine Bay, Gold Intake Plenums & Slatted Carbon Louvers
  const engineBay = new THREE.Mesh(new THREE.BoxGeometry(1.06, 0.1, 1.02), darkTrimMat);
  engineBay.position.set(0, 0.84, 1.28);
  chassisGroup.add(engineBay);
  [-0.22, 0.22].forEach(ex => {
    const manifold = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.76, 16), goldMat);
    manifold.rotation.x = Math.PI / 2;
    manifold.position.set(ex, 0.89, 1.28);
    chassisGroup.add(manifold);
  });
  for (let l = 0; l < 5; l++) {
    const louvre = new THREE.Mesh(new THREE.BoxGeometry(1.02, 0.028, 0.1), carbonMat);
    louvre.position.set(0, 0.94 - l * 0.012, 0.92 + l * 0.2);
    louvre.rotation.x = 0.24;
    chassisGroup.add(louvre);
  }

  // 8. 3D Airfoil Swan-Neck GT Rear Wing
  const wingCurve = new THREE.Shape();
  wingCurve.moveTo(0, 0);
  wingCurve.quadraticCurveTo(0.22, 0.065, 0.44, 0.015);
  wingCurve.quadraticCurveTo(0.22, -0.02, 0, 0);
  const wingGeo = new THREE.ExtrudeGeometry(wingCurve, {
    depth: 2.32,
    bevelEnabled: true,
    bevelThickness: 0.015,
    bevelSize: 0.012,
    bevelSegments: 3
  });
  wingGeo.rotateY(-Math.PI / 2);
  wingGeo.translate(1.16, 0, 0);
  const wingBlade = new THREE.Mesh(wingGeo, carbonMat);
  wingBlade.position.set(0, 1.32, 1.96);
  wingBlade.rotation.x = -0.16;
  wingBlade.castShadow = true;
  chassisGroup.add(wingBlade);

  [-0.48, 0.48].forEach(px => {
    const pylon = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.07, 0.56, 14), carbonMat);
    pylon.scale.set(0.55, 1, 2.2);
    pylon.position.set(px, 1.10, 2.02);
    pylon.rotation.x = -0.26;
    chassisGroup.add(pylon);
  });
  [-1.18, 1.18].forEach(ex => {
    const endplate = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.34, 0.58), paintMat);
    endplate.position.set(ex, 1.30, 2.15);
    endplate.rotation.x = 0.08;
    chassisGroup.add(endplate);
  });

  // 9. Venturi Rear Diffuser Tunnel & Quad Titanium Exhaust Cannons
  const diffuser = new THREE.Mesh(new THREE.BoxGeometry(2.02, 0.22, 0.42), carbonMat);
  diffuser.position.set(0, 0.28, 2.26);
  chassisGroup.add(diffuser);
  [-0.82, -0.48, -0.16, 0.16, 0.48, 0.82].forEach(fx => {
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.24, 0.46), carbonMat);
    fin.position.set(fx, 0.26, 2.32);
    chassisGroup.add(fin);
  });
  [-0.56, -0.38, 0.38, 0.56].forEach(tx => {
    const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.08, 0.28, 20), titaniumMat);
    tip.rotation.x = Math.PI / 2;
    tip.position.set(tx, 0.38, 2.40);
    chassisGroup.add(tip);
    const bore = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.058, 0.29, 16), darkTrimMat);
    bore.rotation.x = Math.PI / 2;
    bore.position.set(tx, 0.38, 2.41);
    chassisGroup.add(bore);
  });

  // 10. Sculpted LED Matrix Headlights, Cyan DRL Blades & Full-Width Rear Light Bar
  const hlMat = new THREE.MeshBasicMaterial({ color: 0xf8f9ff });
  const drlMat = new THREE.MeshBasicMaterial({ color: 0x00f5d4 });
  const tlMat = new THREE.MeshBasicMaterial({ color: 0xaa0011 });
  [-1, 1].forEach(side => {
    const hlHousing = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.11, 0.28), darkTrimMat);
    hlHousing.position.set(side * 0.74, 0.49, -2.18);
    hlHousing.rotation.y = -side * 0.28;
    hlHousing.rotation.x = 0.26;
    chassisGroup.add(hlHousing);

    const hlBeam = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.055, 0.08), hlMat);
    hlBeam.position.set(side * 0.74, 0.51, -2.29);
    hlBeam.rotation.y = -side * 0.28;
    chassisGroup.add(hlBeam);

    const drl = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.025, 0.1), drlMat);
    drl.position.set(side * 0.75, 0.46, -2.30);
    drl.rotation.y = -side * 0.28;
    chassisGroup.add(drl);
  });

  const rearFascia = new THREE.Mesh(new THREE.BoxGeometry(1.98, 0.24, 0.12), darkTrimMat);
  rearFascia.position.set(0, 0.64, 2.37);
  chassisGroup.add(rearFascia);

  const rearLightBar = new THREE.Mesh(new THREE.BoxGeometry(1.94, 0.055, 0.06), tlMat);
  rearLightBar.position.set(0, 0.70, 2.42);
  chassisGroup.add(rearLightBar);
  [-0.76, 0.76].forEach(lx => {
    const tlRing = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.026, 12, 24), tlMat);
    tlRing.position.set(lx, 0.64, 2.43);
    chassisGroup.add(tlRing);
  });
  const f1RainLight = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.11, 0.06), tlMat);
  f1RainLight.position.set(0, 0.28, 2.46);
  chassisGroup.add(f1RainLight);

  // 11. High-Polygon 32-Segment Forged 10-Spoke Wheels, Cross-Drilled Rotors & Red Brembo Calipers
  const wheels = [];
  const tireGeo = new THREE.CylinderGeometry(0.43, 0.43, 0.36, 32);
  tireGeo.rotateZ(Math.PI / 2);
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x141518, roughness: 0.82, metalness: 0.08 });
  const rimOuterGeo = new THREE.CylinderGeometry(0.30, 0.30, 0.37, 28);
  rimOuterGeo.rotateZ(Math.PI / 2);
  const rimMat = new THREE.MeshStandardMaterial({ color: 0xd8dde6, roughness: 0.18, metalness: 0.88 });
  const rotorGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.05, 24);
  rotorGeo.rotateZ(Math.PI / 2);
  const rotorMat = new THREE.MeshStandardMaterial({ color: 0x777b82, roughness: 0.32, metalness: 0.82 });
  const caliperMat = new THREE.MeshStandardMaterial({ color: 0xe63946, roughness: 0.25, metalness: 0.45 });

  [[-1.12, 0.43, -1.42], [1.12, 0.43, -1.42], [-1.15, 0.43, 1.42], [1.15, 0.43, 1.42]].forEach(([wx, wy, wz], idx) => {
    const pivot = new THREE.Group();
    pivot.position.set(wx, wy, wz);
    const wheelSpin = new THREE.Group();

    const tire = new THREE.Mesh(tireGeo, tireMat);
    tire.castShadow = true;
    wheelSpin.add(tire);
    [-0.14, 0.14].forEach(sx => {
      const shoulder = new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.10, 12, 28), tireMat);
      shoulder.rotation.y = Math.PI / 2;
      shoulder.position.x = sx * 0.35;
      wheelSpin.add(shoulder);
    });

    const rimBarrel = new THREE.Mesh(rimOuterGeo, darkTrimMat);
    wheelSpin.add(rimBarrel);
    const rimLip = new THREE.Mesh(new THREE.TorusGeometry(0.295, 0.018, 10, 28), rimMat);
    rimLip.rotation.y = Math.PI / 2;
    rimLip.position.x = idx % 2 === 0 ? -0.175 : 0.175;
    wheelSpin.add(rimLip);

    // 10-Spoke Twin-Y Forged Alloy Pattern + Center-Lock Nut
    for (let s = 0; s < 10; s++) {
      const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.54, 0.032), rimMat);
      spoke.rotation.x = (s * Math.PI) / 10;
      spoke.position.x = idx % 2 === 0 ? -0.165 : 0.165;
      wheelSpin.add(spoke);
    }
    const centerNut = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.058, 0.39, 14), caliperMat);
    centerNut.rotation.z = Math.PI / 2;
    wheelSpin.add(centerNut);

    const rotor = new THREE.Mesh(rotorGeo, rotorMat);
    rotor.position.x = idx % 2 === 0 ? 0.05 : -0.05;
    wheelSpin.add(rotor);

    const caliper = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.22, 0.14), caliperMat);
    caliper.position.set(idx % 2 === 0 ? 0.05 : -0.05, 0.08, -0.17);
    pivot.add(caliper);

    pivot.add(wheelSpin);
    chassisGroup.add(pivot);
    wheels.push({ pivot, mesh: wheelSpin });
  });

  // 12. Multi-Layer Nitro Plasma Flames
  const nitroFlames = [-0.47, 0.47].map(fx => {
    const fGroup = new THREE.Group();
    const outer = new THREE.Mesh(new THREE.ConeGeometry(0.15, 1.05, 12), new THREE.MeshBasicMaterial({ color: 0x00b4d8, transparent: true, opacity: 0 }));
    outer.rotation.x = Math.PI / 2;
    const core = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.65, 10), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 }));
    core.rotation.x = Math.PI / 2;
    core.position.z = -0.12;
    fGroup.add(outer, core);
    fGroup.position.set(fx, 0.38, 2.92);
    chassisGroup.add(fGroup);
    return { group: fGroup, outer, core };
  });

  return { carGroup, chassisGroup, wheels, nitroFlames, tlMat, underglowMat };
}
