import * as THREE from 'three';
import { STATION_DECK_H } from '../config/portfolioData.js?v=4';

export function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const paragraphs = text.split('\n');
  let curY = y;
  for (const para of paragraphs) {
    const words = para.split(' ');
    let line = '';
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      if (ctx.measureText(testLine).width > maxWidth && n > 0) {
        ctx.fillText(line.trim(), x, curY);
        line = words[n] + ' ';
        curY += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line.trim(), x, curY);
    curY += lineHeight;
  }
  return curY;
}

export function drawMainBoardTex(zone) {
  const c = document.createElement('canvas');
  c.width = 1400; c.height = 760;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, c.width, c.height);
  ctx.strokeStyle = '#111111'; ctx.lineWidth = 18; ctx.strokeRect(9, 9, c.width - 18, c.height - 18);
  ctx.fillStyle = zone.color; ctx.fillRect(18, 18, c.width - 36, 170);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 28px "Helvetica Neue", Helvetica, Arial, sans-serif'; ctx.fillText(zone.name, 52, 68);
  ctx.font = 'bold 52px "Helvetica Neue", Helvetica, Arial, sans-serif'; ctx.fillText(zone.title, 52, 126);
  ctx.font = 'normal 25px "Helvetica Neue", Helvetica, Arial, sans-serif'; ctx.fillText(zone.subtitle, 52, 166);
  ctx.fillStyle = '#222222';
  ctx.font = 'normal 33px "Helvetica Neue", Helvetica, Arial, sans-serif';
  wrapText(ctx, zone.mainBody, 52, 255, c.width - 104, 46);
  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 8;
  return tex;
}

function createPlaqueMesh(plaque, color) {
  const c = document.createElement('canvas');
  c.width = 768; c.height = 420;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, c.width, c.height);
  ctx.strokeStyle = '#111111'; ctx.lineWidth = 14; ctx.strokeRect(7, 7, c.width - 14, c.height - 14);
  ctx.fillStyle = color; ctx.fillRect(14, 14, c.width - 28, 72);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 28px "Helvetica Neue", Helvetica, Arial, sans-serif';
  ctx.fillText(plaque.label, 36, 60);
  ctx.fillStyle = '#111111';
  ctx.font = 'bold 31px "Helvetica Neue", Helvetica, Arial, sans-serif';
  wrapText(ctx, plaque.text, 36, 146, c.width - 72, 46);

  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 8;
  const g = new THREE.Group();
  const slab = new THREE.Mesh(
    new THREE.BoxGeometry(10.5, 0.45, 5.8),
    new THREE.MeshStandardMaterial({ color: 0x1d3557, roughness: 0.5 })
  );
  slab.castShadow = true;
  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(10.2, 5.5),
    new THREE.MeshStandardMaterial({ map: tex, roughness: 0.35 })
  );
  face.rotation.x = -Math.PI / 2;
  face.position.y = 0.24;
  g.add(slab, face);
  g.rotation.x = 0.45;
  g.position.set(plaque.dx, 1.4, plaque.dz);
  return g;
}

function createStationCluster(zone) {
  const cluster = new THREE.Group();
  cluster.position.set(zone.x, 38, zone.z);

  const mainTex = drawMainBoardTex(zone);
  const mainMat = new THREE.MeshStandardMaterial({ map: mainTex, roughness: 0.35 });
  const boardGroup = new THREE.Group();
  const frame = new THREE.Mesh(new THREE.BoxGeometry(18.6, 10.2, 0.7), new THREE.MeshStandardMaterial({ color: 0x1d3557, roughness: 0.45 }));
  frame.castShadow = true;
  const face = new THREE.Mesh(new THREE.PlaneGeometry(18, 9.6), mainMat);
  face.position.z = 0.37;
  boardGroup.add(frame, face);
  boardGroup.position.set(0, 5.8, -2);
  boardGroup.rotation.x = -0.78;
  cluster.add(boardGroup);

  zone.plaques.forEach(p => cluster.add(createPlaqueMesh(p, zone.color)));
  return { cluster, mainMat, currentY: 38 };
}

function createPcbGroundTex() {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 1024;
  const g = c.getContext('2d');
  g.fillStyle = '#083b21'; g.fillRect(0, 0, 1024, 1024);
  g.strokeStyle = 'rgba(255,255,255,0.04)'; g.lineWidth = 2;
  for (let i = 0; i < 1024; i += 32) {
    g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 1024); g.stroke();
    g.beginPath(); g.moveTo(0, i); g.lineTo(1024, i); g.stroke();
  }
  g.strokeStyle = '#ffd166'; g.lineWidth = 7; g.lineCap = 'round'; g.lineJoin = 'round';
  const traces = [
    [[120,512],[340,512],[400,450],[620,450],[680,512],[904,512]],
    [[180,320],[320,320],[380,380],[640,380],[700,320],[840,320]],
    [[180,704],[320,704],[380,644],[640,644],[700,704],[840,704]],
    [[512,120],[512,310],[460,360],[460,664],[512,714],[512,904]],
    [[300,180],[300,280],[410,390],[410,634],[300,744],[300,844]],
    [[724,180],[724,280],[614,390],[614,634],[724,744],[724,844]]
  ];
  traces.forEach(pts => {
    g.beginPath(); pts.forEach(([x,y], idx) => idx === 0 ? g.moveTo(x,y) : g.lineTo(x,y)); g.stroke();
    pts.forEach(([x,y]) => {
      g.fillStyle = '#ffd166'; g.beginPath(); g.arc(x, y, 11, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#083b21'; g.beginPath(); g.arc(x, y, 4.5, 0, Math.PI * 2); g.fill();
    });
  });
  g.fillStyle = 'rgba(255,255,255,0.86)'; g.font = 'bold 26px monospace';
  g.fillText('5V LDO REG', 140, 298); g.fillText('ICSP 6-PIN HEADER', 660, 735);
  g.fillText('PIC16F877A // 4-LAYER KICAD PCB', 265, 145); g.fillText('20MHz XTAL // DRC VERIFIED', 310, 895);
  const tex = new THREE.CanvasTexture(c); tex.anisotropy = 8; return tex;
}

function createCyberGroundTex() {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 1024;
  const g = c.getContext('2d');
  g.fillStyle = '#090d1a'; g.fillRect(0, 0, 1024, 1024);
  g.strokeStyle = 'rgba(0, 180, 216, 0.25)'; g.lineWidth = 2;
  for (let i = 0; i < 1024; i += 48) {
    g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 1024); g.stroke();
    g.beginPath(); g.moveTo(0, i); g.lineTo(1024, i); g.stroke();
  }
  g.strokeStyle = '#0047FF'; g.lineWidth = 18;
  g.beginPath(); g.moveTo(512, 110); g.lineTo(512, 914); g.stroke();
  g.strokeStyle = '#00f5d4'; g.lineWidth = 4;
  [170, 310, 440].forEach(rad => { g.beginPath(); g.arc(512, 512, rad, 0, Math.PI * 2); g.stroke(); });
  g.fillStyle = '#00f5d4'; g.font = 'bold 26px monospace';
  g.fillText('SAP-1 // 8-BIT W-BUS ARCHITECTURE', 260, 95);
  g.fillText('T1 -> T2 -> T3 -> T4 -> T5 -> T6', 275, 955);
  const tex = new THREE.CanvasTexture(c); tex.anisotropy = 8; return tex;
}

function buildBlockLetterMesh(ch, hexColor) {
  const grp = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: hexColor, roughness: 0.3, metalness: 0.2 });
  const addSeg = (w, h, d, x, y) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, 0); m.castShadow = true; m.receiveShadow = true; grp.add(m);
  };
  const D = 1.2;
  if (ch === 'M') {
    addSeg(0.75, 3.8, D, -1.25, 0); addSeg(0.75, 3.8, D, 1.25, 0);
    addSeg(0.7, 1.9, D, -0.55, 0.75); addSeg(0.7, 1.9, D, 0.55, 0.75);
    addSeg(0.75, 1.1, D, 0, 0.15);
  } else if (ch === 'I') {
    addSeg(0.85, 3.8, D, 0, 0); addSeg(2.3, 0.7, D, 0, 1.55); addSeg(2.3, 0.7, D, 0, -1.55);
  } else if (ch === 'G') {
    addSeg(0.75, 3.8, D, -1.05, 0); addSeg(2.7, 0.75, D, 0, 1.52); addSeg(2.7, 0.75, D, 0, -1.52);
    addSeg(0.75, 1.6, D, 1.05, -0.75); addSeg(1.3, 0.7, D, 0.65, -0.1);
  } else if (ch === 'U') {
    addSeg(0.75, 3.8, D, -1.0, 0); addSeg(0.75, 3.8, D, 1.0, 0); addSeg(2.75, 0.75, D, 0, -1.52);
  } else if (ch === 'E') {
    addSeg(0.75, 3.8, D, -1.0, 0); addSeg(2.6, 0.72, D, 0.05, 1.54);
    addSeg(2.1, 0.68, D, -0.15, 0); addSeg(2.6, 0.72, D, 0.05, -1.54);
  } else if (ch === 'L') {
    addSeg(0.75, 3.8, D, -0.95, 0); addSeg(2.5, 0.75, D, 0.0, -1.52);
  }
  return grp;
}

export function buildStations(scene, zones) {
  const stationClusters = new Map();
  const deckRimMat = new THREE.MeshStandardMaterial({ color: 0x2b2d42, roughness: 0.65 });

  zones.forEach((z) => {
    let padMat;
    if (z.id === 'east') padMat = new THREE.MeshStandardMaterial({ map: createPcbGroundTex(), roughness: 0.45, metalness: 0.2 });
    else if (z.id === 'west') padMat = new THREE.MeshStandardMaterial({ map: createCyberGroundTex(), roughness: 0.3, metalness: 0.4 });
    else padMat = new THREE.MeshStandardMaterial({ color: 0xf8f9fa, roughness: 0.55 });

    const rampSkirt = new THREE.Mesh(new THREE.CylinderGeometry(z.radius - 1.5, z.radius + 3.6, STATION_DECK_H, 72), deckRimMat);
    rampSkirt.position.set(z.x, STATION_DECK_H * 0.5, z.z); rampSkirt.receiveShadow = true; rampSkirt.castShadow = true; scene.add(rampSkirt);
    const topDeck = new THREE.Mesh(new THREE.CylinderGeometry(z.radius - 1.6, z.radius - 1.6, 0.14, 72), padMat);
    topDeck.position.set(z.x, STATION_DECK_H - 0.02, z.z); topDeck.receiveShadow = true; scene.add(topDeck);
    const r = new THREE.Mesh(new THREE.RingGeometry(z.radius - 2.3, z.radius - 1.5, 72), new THREE.MeshBasicMaterial({ color: z.color, side: THREE.DoubleSide, transparent: true, opacity: 0.88 }));
    r.rotation.x = -Math.PI / 2; r.position.set(z.x, STATION_DECK_H + 0.06, z.z); scene.add(r);
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 1.5, 130, 20, 1, true), new THREE.MeshBasicMaterial({ color: z.color, transparent: true, opacity: 0.14, side: THREE.DoubleSide }));
    beam.position.set(z.x, 65, z.z); scene.add(beam);

    const st = createStationCluster(z);
    scene.add(st.cluster);
    stationClusters.set(z.id, st);
  });

  // Station 1: Knockable MIGUEL 3D Block Letters
  const miguelLetters = [];
  [
    { ch: 'M', x: -12.5, z: 10.5, c: 0xe63946 },
    { ch: 'I', x: -7.5,  z: 10.5, c: 0x0077ff },
    { ch: 'G', x: -2.5,  z: 10.5, c: 0xffb703 },
    { ch: 'U', x: 2.5,   z: 10.5, c: 0x00b4d8 },
    { ch: 'E', x: 7.5,   z: 10.5, c: 0xfb5607 },
    { ch: 'L', x: 12.5,  z: 10.5, c: 0x1d3557 }
  ].forEach(ls => {
    const mesh = buildBlockLetterMesh(ls.ch, ls.c);
    mesh.position.set(ls.x, STATION_DECK_H + 1.9, ls.z);
    scene.add(mesh);
    miguelLetters.push({ mesh, homeX: ls.x, homeZ: ls.z, x: ls.x, y: STATION_DECK_H + 1.9, z: ls.z, vx: 0, vy: 0, vz: 0, rx: 0, rz: 0, vrx: 0, vrz: 0 });
  });

  // Station 2: 3 Angled Project Billboards + Parking Trigger Zones
  const st2 = zones[1];
  const flagshipBillboards = [];
  [
    {
      dx: -17, dz: 4, rotY: 0.35, color: '#E63946',
      tag: 'FIG 01 // MULTI-MODAL EMBEDDED AI',
      title: 'Real-Time FSL Sign Recognition',
      subtitle: 'ESP32 6-DOF IMU + RGB Camera · PyTorch CNN-LSTM · Android SDK',
      desc: 'Native Android application fusing wearable ESP32 6-DOF IMU sensor telemetry with live camera feeds (OpenCV/MediaPipe) via a hybrid CNN-LSTM network and gloss-to-text pipeline.',
      tags: ['Python', 'PyTorch', 'Android SDK', 'OpenCV', 'MediaPipe', 'ESP32', '6-DOF IMU', 'CNN-LSTM']
    },
    {
      dx: 0, dz: -8, rotY: 0, color: '#0077FF',
      tag: 'FIG 02 // HARDWARE & 4-LAYER PCB',
      title: 'PIC16F877A Development Board',
      subtitle: 'KiCad 4-Layer PCB · 5V LDO · 20MHz XTAL · ICSP 6-Pin · DRC Verified',
      desc: 'Custom 4-layer printed circuit board breakout platform featuring integrated 5V voltage regulation, external 20MHz crystal oscillator circuitry, dedicated internal power/ground planes, and ICSP header.',
      tags: ['KiCad', 'Schematic Capture', '4-Layer PCB Layout', 'PIC16F877A', 'Hardware Prototyping', 'DRC']
    },
    {
      dx: 17, dz: 4, rotY: -0.35, color: '#00B4D8',
      tag: 'FIG 03 // FULL-STACK WEB & RDBMS',
      title: 'Web-Based PDF Reader & Catalog',
      subtitle: 'In-Browser PDF Viewport · MangaDex & Google Books REST APIs · SQL CRUD',
      desc: 'Responsive in-browser document reader with custom upload pipelines, chapter/zoom controls, asynchronous MangaDex & Google Books REST API metadata retrieval, and relational SQL persistence.',
      tags: ['JavaScript', 'SQL RDBMS', 'RESTful APIs', 'HTML5 / CSS3', 'CRUD']
    }
  ].forEach(spec => {
    const nx = st2.x + spec.dx, nz = st2.z + spec.dz;
    const c = document.createElement('canvas'); c.width = 920; c.height = 520;
    const g = c.getContext('2d');
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, 920, 520);
    g.strokeStyle = '#111111'; g.lineWidth = 14; g.strokeRect(7, 7, 906, 506);
    g.fillStyle = spec.color; g.fillRect(14, 14, 892, 112);
    g.fillStyle = '#ffffff'; g.font = 'bold 23px monospace'; g.fillText(spec.tag, 36, 54);
    g.font = 'bold 40px sans-serif'; g.fillText(spec.title, 36, 102);
    g.fillStyle = '#0047FF'; g.font = 'bold 22px sans-serif'; g.fillText(spec.subtitle, 36, 174);
    g.fillStyle = '#222222'; g.font = 'normal 25px sans-serif'; wrapText(g, spec.desc, 36, 232, 848, 36);
    g.fillStyle = '#111111'; g.font = 'bold 22px monospace'; g.fillText('▼ PARK IN GLOWING BAY BELOW TO INSPECT CASE STUDY ▼', 36, 476);

    const bbGroup = new THREE.Group();
    const frame = new THREE.Mesh(new THREE.BoxGeometry(11.8, 6.8, 0.55), new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.4 }));
    frame.castShadow = true;
    const face = new THREE.Mesh(new THREE.PlaneGeometry(11.4, 6.4), new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(c), roughness: 0.3 }));
    face.position.z = 0.29;
    bbGroup.add(frame, face);
    bbGroup.position.set(nx, STATION_DECK_H + 4.3, nz);
    bbGroup.rotation.y = spec.rotY;
    bbGroup.rotation.x = -0.68;
    scene.add(bbGroup);

    const px = nx + Math.sin(spec.rotY) * 8.0;
    const pz = nz + Math.cos(spec.rotY) * 8.0;
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x0077ff, side: THREE.DoubleSide, transparent: true, opacity: 0.7 });
    const pRing = new THREE.Mesh(new THREE.RingGeometry(3.5, 4.3, 48), ringMat);
    pRing.rotation.x = -Math.PI / 2; pRing.position.set(px, STATION_DECK_H + 0.09, pz); scene.add(pRing);
    const bayFill = new THREE.Mesh(new THREE.CircleGeometry(3.5, 40), new THREE.MeshBasicMaterial({ color: 0x00b4d8, transparent: true, opacity: 0.18 }));
    bayFill.rotation.x = -Math.PI / 2; bayFill.position.set(px, STATION_DECK_H + 0.08, pz); scene.add(bayFill);
    flagshipBillboards.push({ spec, px, pz, ringMat, bbGroup });
  });

  // Station 3: IC Chips + Proximity PCB LEDs
  const st3 = zones[2];
  const icBodyMat = new THREE.MeshStandardMaterial({ color: 0x16181d, roughness: 0.38, metalness: 0.25 });
  const pinMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.25, metalness: 0.85 });
  [
    { dx: -9.5, dz: 4.5, w: 5.2, d: 3.6, label: 'PIC16F877A', sub: '40-DIP MCU' },
    { dx: 9.5,  dz: 4.5, w: 4.6, d: 4.6, label: 'ESP32 MCU', sub: 'BLE / Wi-Fi' },
    { dx: -9.5, dz: -5.5, w: 4.2, d: 3.6, label: '6-DOF IMU', sub: 'Accel / Gyro' },
    { dx: 9.5,  dz: -5.5, w: 4.4, d: 3.4, label: '5V LDO + XTAL', sub: '20MHz Clock' }
  ].forEach(ic => {
    const grp = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(ic.w, 0.95, ic.d), icBodyMat);
    body.position.y = 0.55; body.castShadow = true; grp.add(body);
    const lc = document.createElement('canvas'); lc.width = 256; lc.height = 160;
    const lctx = lc.getContext('2d');
    lctx.fillStyle = '#16181d'; lctx.fillRect(0, 0, 256, 160);
    lctx.strokeStyle = '#ffd166'; lctx.lineWidth = 4; lctx.strokeRect(6, 6, 244, 148);
    lctx.fillStyle = '#ffffff'; lctx.font = 'bold 28px monospace'; lctx.textAlign = 'center';
    lctx.fillText(ic.label, 128, 72);
    lctx.fillStyle = '#10b981'; lctx.font = 'bold 20px monospace';
    lctx.fillText(ic.sub, 128, 115);
    const topDecal = new THREE.Mesh(new THREE.PlaneGeometry(ic.w * 0.9, ic.d * 0.85), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(lc) }));
    topDecal.rotation.x = -Math.PI / 2; topDecal.position.y = 1.04; grp.add(topDecal);

    for (let p = 0; p < 6; p++) {
      const pz = -ic.d * 0.38 + (p / 5) * (ic.d * 0.76);
      [-ic.w / 2 - 0.35, ic.w / 2 + 0.35].forEach(px => {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.16, 0.26), pinMat);
        leg.position.set(px, 0.32, pz); grp.add(leg);
      });
    }
    grp.position.set(st3.x + ic.dx, STATION_DECK_H, st3.z + ic.dz);
    scene.add(grp);
  });

  const pcbLeds = [];
  const ledColors = [0x00ff88, 0x00e5ff, 0xffb703, 0xff2a55];
  for (let i = 0; i < 16; i++) {
    const ang = (i / 16) * Math.PI * 2;
    const rad = 14 + (i % 2) * 8.5;
    const lx = st3.x + Math.cos(ang) * rad;
    const lz = st3.z + Math.sin(ang) * rad;
    const col = ledColors[i % ledColors.length];
    const ledMat = new THREE.MeshStandardMaterial({ color: 0x22332a, emissive: col, emissiveIntensity: 0.1, roughness: 0.2 });
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.58, 16, 14), ledMat);
    dome.position.set(lx, STATION_DECK_H + 0.58, lz); scene.add(dome);
    const haloMat = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.0 });
    const halo = new THREE.Mesh(new THREE.CircleGeometry(2.3, 24), haloMat);
    halo.rotation.x = -Math.PI / 2; halo.position.set(lx, STATION_DECK_H + 0.08, lz); scene.add(halo);
    pcbLeds.push({ x: lx, z: lz, ledMat, haloMat, lit: false, col });
  }

  // Station 4: SAP-1 8-Bit W-Bus & Holographic Arena
  const st4 = zones[3];
  const holoCore = new THREE.Mesh(
    new THREE.IcosahedronGeometry(2.6, 2),
    new THREE.MeshBasicMaterial({ color: 0x00f5d4, wireframe: true, transparent: true, opacity: 0.85 })
  );
  holoCore.position.set(st4.x, STATION_DECK_H + 4.4, st4.z); scene.add(holoCore);
  const holoInner = new THREE.Mesh(
    new THREE.OctahedronGeometry(1.4, 1),
    new THREE.MeshStandardMaterial({ color: 0x0077ff, emissive: 0x00b4d8, emissiveIntensity: 0.9, roughness: 0.1 })
  );
  holoInner.position.set(st4.x, STATION_DECK_H + 4.4, st4.z); scene.add(holoInner);

  [
    { dx: -8, dz: -6 }, { dx: -8, dz: 1 }, { dx: -8, dz: 8 },
    { dx: 8,  dz: -6 }, { dx: 8,  dz: 1 }, { dx: 8,  dz: 8 }
  ].forEach(reg => {
    const rBox = new THREE.Mesh(
      new THREE.BoxGeometry(4.2, 0.55, 2.2),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, emissive: 0x0047ff, emissiveIntensity: 0.35, roughness: 0.3 })
    );
    rBox.position.set(st4.x + reg.dx, STATION_DECK_H + 0.32, st4.z + reg.dz);
    scene.add(rBox);
  });

  const holoMonoliths = [];
  const holoDataPulses = [];
  [
    {
      dx: -17, dz: 8,
      title: 'WEB-BASED PDF READER & CATALOG',
      sub: 'FIG 03 // JavaScript · SQL RDBMS · RESTful APIs · CRUD',
      body: 'Responsive in-browser PDF viewport with zoom/chapter navigation, async MangaDex & Google Books REST API metadata retrieval, and relational SQL persistence.'
    },
    {
      dx: 17, dz: 8,
      title: 'BIT BY BIT — SAP-1 SIMULATOR',
      sub: 'FIG 04 // 8-Bit W-Bus · 6 T-States · 12-Bit CON · ALU',
      body: 'Cycle-accurate Simple-As-Possible (SAP-1) microprocessor visualizer showing real-time W-Bus transfers across PC, MAR, 16x8 RAM, IR, Reg A, and Adder/Subtractor ALU.'
    },
    {
      dx: 0, dz: 18,
      title: 'FSL WEARABLE-VISION AI & ACCESS DLSU',
      sub: 'PyTorch CNN-LSTM + OpenCV/MediaPipe · AVP for Academics',
      body: 'Hybrid CNN-LSTM gloss-to-text software pipeline on Android SDK + ACCESS DLSU Centralized Learning Repository, Peer Tutorials & Reviewer Publications.'
    }
  ].forEach((sw, idx) => {
    const mx = st4.x + sw.dx, mz = st4.z + sw.dz;
    const c = document.createElement('canvas'); c.width = 720; c.height = 400;
    const g = c.getContext('2d');
    g.fillStyle = 'rgba(6, 20, 42, 0.94)'; g.fillRect(0, 0, 720, 400);
    g.strokeStyle = '#00f5d4'; g.lineWidth = 10; g.strokeRect(5, 5, 710, 390);
    g.fillStyle = '#00f5d4'; g.font = 'bold 28px monospace'; g.fillText(sw.title, 30, 62);
    g.fillStyle = '#60a5fa'; g.font = 'bold 20px monospace'; g.fillText(sw.sub, 30, 106);
    g.fillStyle = '#e2e8f0'; g.font = 'normal 24px sans-serif'; wrapText(g, sw.body, 30, 166, 660, 36);

    const mGrp = new THREE.Group();
    const holoScreen = new THREE.Mesh(
      new THREE.PlaneGeometry(10.4, 5.8),
      new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, opacity: 0.93, side: THREE.DoubleSide })
    );
    holoScreen.rotation.x = -0.72;
    const cubeOrbit = new THREE.Mesh(
      new THREE.BoxGeometry(1.1, 1.1, 1.1),
      new THREE.MeshBasicMaterial({ color: 0x00f5d4, wireframe: true })
    );
    cubeOrbit.position.set(0, 3.8, 0);
    mGrp.add(holoScreen, cubeOrbit);
    mGrp.position.set(mx, STATION_DECK_H + 4.1, mz);
    scene.add(mGrp);
    holoMonoliths.push({ grp: mGrp, cube: cubeOrbit, baseY: STATION_DECK_H + 4.1, phase: idx * 2.1, mx, mz });

    const curve = new THREE.LineCurve3(new THREE.Vector3(st4.x, STATION_DECK_H + 0.35, st4.z), new THREE.Vector3(mx, STATION_DECK_H + 0.35, mz));
    const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 16, 0.14, 8, false), new THREE.MeshBasicMaterial({ color: 0x0077ff, transparent: true, opacity: 0.55 }));
    scene.add(tube);
    const pulse = new THREE.Mesh(new THREE.SphereGeometry(0.45, 12, 12), new THREE.MeshBasicMaterial({ color: 0x00f5d4 }));
    scene.add(pulse);
    holoDataPulses.push({ mesh: pulse, startX: st4.x, startZ: st4.z, endX: mx, endZ: mz, phase: idx * 0.33 });
  });

  // Station 5: Sky-Guestbook Terminal Kiosk
  const st5 = zones[4];
  const kiosk = new THREE.Group();
  const kBase = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 2.2, 3.2, 24), new THREE.MeshStandardMaterial({ color: 0x1d3557, roughness: 0.35 }));
  kBase.position.y = 1.6; kBase.castShadow = true;
  const kBeacon = new THREE.Mesh(new THREE.OctahedronGeometry(1.25, 0), new THREE.MeshStandardMaterial({ color: 0xfb5607, emissive: 0xffb703, emissiveIntensity: 0.6 }));
  kBeacon.position.y = 4.6;
  kiosk.add(kBase, kBeacon);
  kiosk.position.set(st5.x, STATION_DECK_H, st5.z + 6);
  scene.add(kiosk);

  return {
    stationClusters,
    miguelLetters,
    flagshipBillboards,
    pcbLeds,
    holoCore,
    holoInner,
    holoMonoliths,
    holoDataPulses,
    kBeacon
  };
}
