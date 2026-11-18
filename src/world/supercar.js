import * as THREE from 'three';

export function createSupercar(scene, startY) {
  const carGroup = new THREE.Group();
  const chassisGroup = new THREE.Group();
  carGroup.add(chassisGroup);
  carGroup.position.set(0, startY, 24);
  scene.add(carGroup);

  // Materials
  const paintMat = new THREE.MeshStandardMaterial({ color: 0xd90429, roughness: 0.18, metalness: 0.48 });
  const whitePaintMat = new THREE.MeshStandardMaterial({ color: 0xf8f9fa, roughness: 0.22, metalness: 0.2 });
  const carbonMat = new THREE.MeshStandardMaterial({ color: 0x16181d, roughness: 0.42, metalness: 0.35 });
  const darkTrimMat = new THREE.MeshStandardMaterial({ color: 0x0d0e11, roughness: 0.65, metalness: 0.2 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x101c2e, roughness: 0.06, metalness: 0.88, transparent: true, opacity: 0.78 });
  const titaniumMat = new THREE.MeshStandardMaterial({ color: 0x8d99ae, roughness: 0.25, metalness: 0.85 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xffb703, roughness: 0.3, metalness: 0.8 });

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
  const decalMat = new THREE.MeshBasicMaterial({ map: numTex, transparent: true });

  // Ground Contact Shadow & Underglow
  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = 128; shadowCanvas.height = 256;
  const shCtx = shadowCanvas.getContext('2d');
  const sg = shCtx.createRadialGradient(64, 128, 12, 64, 128, 64);
  sg.addColorStop(0, 'rgba(0,0,0,0.65)');
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

  // 1. Sculpted Carbon Fiber Undertray, Front Splitter & Side Skirts
  const undertray = new THREE.Mesh(new THREE.BoxGeometry(2.24, 0.1, 4.72), carbonMat);
  undertray.position.set(0, 0.24, 0.02); undertray.castShadow = true; chassisGroup.add(undertray);

  const splitter = new THREE.Mesh(new THREE.BoxGeometry(2.34, 0.07, 0.72), carbonMat);
  splitter.position.set(0, 0.22, -2.28); chassisGroup.add(splitter);
  [-1.16, 1.16].forEach(sx => {
    const canard = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.2, 0.55), paintMat);
    canard.position.set(sx, 0.3, -2.22); chassisGroup.add(canard);
    const skirt = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.09, 2.55), carbonMat);
    skirt.position.set(sx * 0.99, 0.24, 0); chassisGroup.add(skirt);
  });

  // 2. Sculpted Main Lower Body & Sloped Nose (ExtrudeGeometry side profile)
  const bodyShape = new THREE.Shape();
  bodyShape.moveTo(-2.42, 0.26);
  bodyShape.lineTo(-2.46, 0.44);
  bodyShape.lineTo(-2.2, 0.62);
  bodyShape.lineTo(-1.35, 0.78);
  bodyShape.lineTo(1.75, 0.84);
  bodyShape.lineTo(2.38, 0.78);
  bodyShape.lineTo(2.42, 0.38);
  bodyShape.lineTo(2.15, 0.26);
  bodyShape.closePath();
  const bodyExtrude = new THREE.ExtrudeGeometry(bodyShape, {
    depth: 1.98, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.06, bevelSegments: 3
  });
  bodyExtrude.rotateY(Math.PI / 2);
  bodyExtrude.translate(-0.99, 0, 0);
  const mainBody = new THREE.Mesh(bodyExtrude, paintMat);
  mainBody.castShadow = true; mainBody.receiveShadow = true;
  chassisGroup.add(mainBody);

  // 3. Flared Widebody Wheel Arches / Fenders & Side Air Intakes
  [[-1.04, -1.42], [1.04, -1.42], [-1.08, 1.42], [1.08, 1.42]].forEach(([fx, fz], idx) => {
    const fender = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.44, 1.15), paintMat);
    fender.position.set(fx, 0.54, fz); fender.castShadow = true; chassisGroup.add(fender);
    const archTrim = new THREE.Mesh(new THREE.TorusGeometry(0.47, 0.045, 8, 18, Math.PI), carbonMat);
    archTrim.rotation.y = Math.PI / 2;
    archTrim.position.set(fx + (idx % 2 === 0 ? -0.14 : 0.14), 0.42, fz);
    chassisGroup.add(archTrim);
  });

  // Sidepods & Recessed Cooling Intakes
  [-1.03, 1.03].forEach(sx => {
    const pod = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.38, 1.65), paintMat);
    pod.position.set(sx, 0.5, 0.05); pod.castShadow = true; chassisGroup.add(pod);
    const intake = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.26, 0.42), darkTrimMat);
    intake.position.set(sx + (sx < 0 ? -0.06 : 0.06), 0.5, -0.52); chassisGroup.add(intake);
    const intakeFin = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.04, 0.38), carbonMat);
    intakeFin.position.set(sx + (sx < 0 ? -0.07 : 0.07), 0.5, -0.52); chassisGroup.add(intakeFin);
  });

  // 4. Racing Stripes, Vented Hood & #22 Roundel
  const hoodStripe = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.04, 4.58), whitePaintMat);
  hoodStripe.position.set(0, 0.85, -0.02); chassisGroup.add(hoodStripe);
  [-0.27, 0.27].forEach(px => {
    const pin = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.042, 4.58), whitePaintMat);
    pin.position.set(px, 0.85, -0.02); chassisGroup.add(pin);
  });
  const hoodVent = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.05, 0.52), carbonMat);
  hoodVent.position.set(0, 0.78, -1.62); hoodVent.rotation.x = 0.14; chassisGroup.add(hoodVent);
  const hoodDecal = new THREE.Mesh(new THREE.PlaneGeometry(0.68, 0.68), decalMat);
  hoodDecal.rotation.x = -Math.PI / 2 + 0.14;
  hoodDecal.position.set(0, 0.83, -1.12);
  chassisGroup.add(hoodDecal);

  // 5. Cockpit Cabin, Visible Interior & Roof Scoop
  const cabinBase = new THREE.Mesh(new THREE.BoxGeometry(1.52, 0.46, 2.02), glassMat);
  cabinBase.position.set(0, 1.03, -0.08); cabinBase.castShadow = true; chassisGroup.add(cabinBase);
  const roofPanel = new THREE.Mesh(new THREE.BoxGeometry(1.32, 0.08, 1.18), carbonMat);
  roofPanel.position.set(0, 1.27, -0.02); roofPanel.castShadow = true; chassisGroup.add(roofPanel);
  const roofDecal = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.62), decalMat);
  roofDecal.rotation.x = -Math.PI / 2;
  roofDecal.position.set(0, 1.32, -0.02);
  chassisGroup.add(roofDecal);

  const roofScoop = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.14, 0.68), paintMat);
  roofScoop.position.set(0, 1.34, 0.35); chassisGroup.add(roofScoop);
  const scoopMouth = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.09, 0.06), darkTrimMat);
  scoopMouth.position.set(0, 1.34, 0.0); chassisGroup.add(scoopMouth);

  const seatBack = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.56, 0.16), darkTrimMat);
  seatBack.position.set(0, 0.94, 0.25); seatBack.rotation.x = -0.22; chassisGroup.add(seatBack);
  const headrest = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.22, 0.14), paintMat);
  headrest.position.set(0, 1.15, 0.3); chassisGroup.add(headrest);
  const steerWheel = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.025, 8, 16), carbonMat);
  steerWheel.position.set(0, 0.94, -0.58); steerWheel.rotation.x = 0.35; chassisGroup.add(steerWheel);
  [-0.64, 0.64].forEach(rx => {
    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.58, 8), paintMat);
    pillar.position.set(rx, 1.04, -0.78); pillar.rotation.x = -0.62; chassisGroup.add(pillar);
  });

  [-0.96, 0.96].forEach(mx => {
    const stalk = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.05, 0.08), carbonMat);
    stalk.position.set(mx, 0.88, -0.68); chassisGroup.add(stalk);
    const mirrorCap = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.12, 0.16), paintMat);
    mirrorCap.position.set(mx + (mx < 0 ? -0.1 : 0.1), 0.91, -0.68); chassisGroup.add(mirrorCap);
  });

  // 6. Rear Slatted Engine Bay & Gold Intake Manifold
  const engineBay = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.12, 1.05), darkTrimMat);
  engineBay.position.set(0, 0.83, 1.25); chassisGroup.add(engineBay);
  [-0.25, 0.25].forEach(ex => {
    const manifold = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.14, 0.72), goldMat);
    manifold.position.set(ex, 0.88, 1.25); chassisGroup.add(manifold);
  });
  for (let l = 0; l < 4; l++) {
    const louvre = new THREE.Mesh(new THREE.BoxGeometry(1.16, 0.035, 0.12), carbonMat);
    louvre.position.set(0, 0.94, 0.88 + l * 0.24); louvre.rotation.x = 0.2; chassisGroup.add(louvre);
  }

  // 7. Swan-Neck GT Rear Wing
  const wingBlade = new THREE.Mesh(new THREE.BoxGeometry(2.38, 0.07, 0.46), carbonMat);
  wingBlade.position.set(0, 1.38, 2.12); wingBlade.rotation.x = 0.12; wingBlade.castShadow = true; chassisGroup.add(wingBlade);
  const wingFlap = new THREE.Mesh(new THREE.BoxGeometry(2.36, 0.05, 0.22), paintMat);
  wingFlap.position.set(0, 1.44, 2.28); wingFlap.rotation.x = 0.26; chassisGroup.add(wingFlap);
  [-0.52, 0.52].forEach(px => {
    const pylon = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.58, 0.26), carbonMat);
    pylon.position.set(px, 1.12, 2.02); pylon.rotation.x = -0.18; chassisGroup.add(pylon);
  });
  [-1.19, 1.19].forEach(ex => {
    const endplate = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.34, 0.62), paintMat);
    endplate.position.set(ex, 1.36, 2.16); chassisGroup.add(endplate);
  });

  // 8. Rear Diffuser & Quad Titanium Exhausts
  const diffuser = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.22, 0.38), carbonMat);
  diffuser.position.set(0, 0.28, 2.28); chassisGroup.add(diffuser);
  [-0.72, -0.26, 0.26, 0.72].forEach(fx => {
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.22, 0.42), carbonMat);
    fin.position.set(fx, 0.26, 2.34); chassisGroup.add(fin);
  });
  [-0.58, -0.4, 0.4, 0.58].forEach(tx => {
    const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.26, 12), titaniumMat);
    tip.rotation.x = Math.PI / 2;
    tip.position.set(tx, 0.35, 2.42); chassisGroup.add(tip);
    const bore = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.27, 10), darkTrimMat);
    bore.rotation.x = Math.PI / 2;
    bore.position.set(tx, 0.35, 2.43); chassisGroup.add(bore);
  });

  // 9. LED Headlights, Full-Width Taillight Bar & F1 Rain Light
  const hlMat = new THREE.MeshBasicMaterial({ color: 0xf8f9ff });
  const drlMat = new THREE.MeshBasicMaterial({ color: 0x00f5d4 });
  const tlMat = new THREE.MeshBasicMaterial({ color: 0xaa0011 });
  [-0.76, 0.76].forEach(lx => {
    const hlHousing = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.16, 0.14), darkTrimMat);
    hlHousing.position.set(lx, 0.54, -2.35); chassisGroup.add(hlHousing);
    const hlBeam = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.08, 0.06), hlMat);
    hlBeam.position.set(lx, 0.55, -2.41); chassisGroup.add(hlBeam);
    const drl = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.03, 0.07), drlMat);
    drl.position.set(lx, 0.48, -2.41); chassisGroup.add(drl);
  });
  const rearLightBar = new THREE.Mesh(new THREE.BoxGeometry(1.96, 0.07, 0.07), tlMat);
  rearLightBar.position.set(0, 0.68, 2.41); chassisGroup.add(rearLightBar);
  [-0.78, 0.78].forEach(lx => {
    const tlPod = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.14, 0.08), tlMat);
    tlPod.position.set(lx, 0.68, 2.41); chassisGroup.add(tlPod);
  });
  const f1RainLight = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.12, 0.06), tlMat);
  f1RainLight.position.set(0, 0.29, 2.47); chassisGroup.add(f1RainLight);

  // 10. Detailed Wheels: Rounded Rubber Tires, 5-Spoke Alloy Rims, Brake Rotors & Red Calipers
  const wheels = [];
  const tireGeo = new THREE.CylinderGeometry(0.43, 0.43, 0.36, 24); tireGeo.rotateZ(Math.PI / 2);
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x151517, roughness: 0.85, metalness: 0.05 });
  const rimOuterGeo = new THREE.CylinderGeometry(0.29, 0.29, 0.37, 20); rimOuterGeo.rotateZ(Math.PI / 2);
  const rimMat = new THREE.MeshStandardMaterial({ color: 0xcfd4da, roughness: 0.22, metalness: 0.85 });
  const rotorGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.06, 18); rotorGeo.rotateZ(Math.PI / 2);
  const rotorMat = new THREE.MeshStandardMaterial({ color: 0x777b82, roughness: 0.35, metalness: 0.8 });
  const caliperMat = new THREE.MeshStandardMaterial({ color: 0xe63946, roughness: 0.3, metalness: 0.4 });

  [[-1.12, 0.43, -1.42], [1.12, 0.43, -1.42], [-1.15, 0.43, 1.42], [1.15, 0.43, 1.42]].forEach(([wx, wy, wz], idx) => {
    const pivot = new THREE.Group();
    pivot.position.set(wx, wy, wz);
    const wheelSpin = new THREE.Group();

    const tire = new THREE.Mesh(tireGeo, tireMat); tire.castShadow = true; wheelSpin.add(tire);
    const sidewall = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.11, 8, 20), tireMat);
    sidewall.rotation.y = Math.PI / 2; wheelSpin.add(sidewall);

    const rimBarrel = new THREE.Mesh(rimOuterGeo, darkTrimMat); wheelSpin.add(rimBarrel);
    const rimFace = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.27, 0.06, 18), rimMat);
    rimFace.rotation.z = Math.PI / 2;
    rimFace.position.x = idx % 2 === 0 ? -0.15 : 0.15;
    wheelSpin.add(rimFace);

    for (let s = 0; s < 5; s++) {
      const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.5, 0.055), rimMat);
      spoke.rotation.x = (s * Math.PI) / 5;
      spoke.position.x = idx % 2 === 0 ? -0.17 : 0.17;
      wheelSpin.add(spoke);
    }
    const centerNut = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.4, 10), caliperMat);
    centerNut.rotation.z = Math.PI / 2; wheelSpin.add(centerNut);

    const rotor = new THREE.Mesh(rotorGeo, rotorMat);
    rotor.position.x = idx % 2 === 0 ? 0.06 : -0.06;
    wheelSpin.add(rotor);

    const caliper = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.2, 0.13), caliperMat);
    caliper.position.set(idx % 2 === 0 ? 0.05 : -0.05, 0.08, -0.17);
    pivot.add(caliper);

    pivot.add(wheelSpin);
    chassisGroup.add(pivot);
    wheels.push({ pivot, mesh: wheelSpin });
  });

  // 11. Multi-Layer Nitro Plasma Flames
  const nitroFlames = [-0.49, 0.49].map(fx => {
    const fGroup = new THREE.Group();
    const outer = new THREE.Mesh(new THREE.ConeGeometry(0.15, 1.05, 10), new THREE.MeshBasicMaterial({ color: 0x00b4d8, transparent: true, opacity: 0 }));
    outer.rotation.x = Math.PI / 2;
    const core = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.65, 8), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 }));
    core.rotation.x = Math.PI / 2; core.position.z = -0.12;
    fGroup.add(outer, core);
    fGroup.position.set(fx, 0.35, 2.92);
    chassisGroup.add(fGroup);
    return { group: fGroup, outer, core };
  });

  return { carGroup, chassisGroup, wheels, nitroFlames, tlMat, underglowMat };
}
