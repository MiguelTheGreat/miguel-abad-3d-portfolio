import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export const ZONES = [
  {
    id: 'central',
    name: 'Central Plaza',
    subtitle: 'Self-Introduction, LinkedIn & Live Sky-Guestbook',
    x: 0,
    z: 0,
    radius: 13,
    color: '#E63946'
  },
  {
    id: 'north',
    name: 'North Pavilion',
    subtitle: 'Resume, Education & Technical Skills',
    x: 0,
    z: -48,
    radius: 13,
    color: '#0047FF'
  },
  {
    id: 'east',
    name: 'East Hardware & AI Sky-Lab',
    subtitle: 'Academic Work Samples & Engineering Artifacts',
    x: 52,
    z: 0,
    radius: 17,
    color: '#0047FF'
  },
  {
    id: 'west',
    name: 'West Student Hub',
    subtitle: 'Leadership & Service — ACCESS DLSU',
    x: -52,
    z: 0,
    radius: 13,
    color: '#111111'
  },
  {
    id: 'south',
    name: 'South Lounge',
    subtitle: 'References & Direct Recruiter Contact',
    x: 0,
    z: 48,
    radius: 13,
    color: '#E63946'
  }
];

function createTextPlane(lines, { width = 10, height = 3, bg = '#FFFFFF', border = '#111111', accent = '#0047FF', align = 'center' } = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = Math.round(1024 * (height / width));
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = border;
  ctx.lineWidth = 10;
  ctx.strokeRect(6, 6, canvas.width - 12, canvas.height - 12);

  // Top accent bar
  ctx.fillStyle = accent;
  ctx.fillRect(6, 6, canvas.width - 12, 14);

  let y = 80;
  lines.forEach((line) => {
    ctx.fillStyle = line.color || '#111111';
    ctx.font = `${line.weight || 'bold'} ${line.size || 42}px "Helvetica Neue", Helvetica, Arial, sans-serif`;
    ctx.textAlign = align;
    const xPos = align === 'center' ? canvas.width / 2 : 48;
    ctx.fillText(line.text, xPos, y, canvas.width - 96);
    y += (line.size || 42) + (line.gap || 18);
  });

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 4;
  const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.45, metalness: 0.05 });
  return new THREE.Mesh(new THREE.PlaneGeometry(width, height), mat);
}

export class PortfolioWorld {
  constructor(scene, physicsWorld) {
    this.scene = scene;
    this.world = physicsWorld;
    this.animatedObjects = [];
    this.zoneRings = new Map();
    this.guestbookGroup = new THREE.Group();
    this.eastLabGroup = new THREE.Group();

    this._buildEnvironment();
    this._buildCentralPlaza();
    this._buildNorthPavilion();
    this._buildEastLabBase();
    this._buildWestHub();
    this._buildSouthLounge();
  }

  _buildEnvironment() {
    // Ground plane (physics + visual)
    const groundBody = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Plane()
    });
    groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    this.world.addBody(groundBody);

    const groundMat = new THREE.MeshStandardMaterial({
      color: 0xf4f4f1,
      roughness: 0.9,
      metalness: 0.02
    });
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(320, 320), groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Architectural Swiss Grid
    const grid = new THREE.GridHelper(220, 55, 0xc8c8c4, 0xe2e2de);
    grid.position.y = 0.02;
    this.scene.add(grid);

    // Axis Pathways connecting Central Plaza to N/S/E/W
    const pathMat = new THREE.MeshStandardMaterial({ color: 0xe6e6e2, roughness: 0.85 });
    const nsPath = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.05, 96), pathMat);
    nsPath.position.set(0, 0.025, 0);
    nsPath.receiveShadow = true;
    const ewPath = new THREE.Mesh(new THREE.BoxGeometry(104, 0.05, 3.2), pathMat);
    ewPath.position.set(0, 0.025, 0);
    ewPath.receiveShadow = true;
    this.scene.add(nsPath, ewPath);

    // Low-poly Swiss clouds
    const cloudMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95 });
    const cloudPositions = [
      [-32, 26, -28], [28, 30, -34], [42, 27, 26], [-38, 29, 32],
      [0, 33, -72], [75, 28, -10], [-72, 31, 12], [12, 27, 74]
    ];
    cloudPositions.forEach(([cx, cy, cz], idx) => {
      const cGroup = new THREE.Group();
      for (let i = 0; i < 3; i++) {
        const block = new THREE.Mesh(
          new THREE.BoxGeometry(4.5 - i * 0.8, 1.4, 2.8 - i * 0.4),
          cloudMat
        );
        block.position.set((i - 1) * 2.2, (i % 2) * 0.5, 0);
        cGroup.add(block);
      }
      cGroup.position.set(cx, cy, cz);
      this.scene.add(cGroup);
      this.animatedObjects.push({
        type: 'cloud',
        mesh: cGroup,
        baseX: cx,
        phase: idx * 0.9
      });
    });

    // Zone landing rings
    ZONES.forEach((zone) => {
      const ringGeo = new THREE.RingGeometry(zone.radius - 0.6, zone.radius, 48);
      const ringMat = new THREE.MeshBasicMaterial({
        color: zone.color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.45
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(zone.x, 0.05, zone.z);
      this.scene.add(ring);
      this.zoneRings.set(zone.id, ring);
    });
  }

  _buildCentralPlaza() {
    const group = new THREE.Group();

    // Circular Swiss Plinth
    const plinth = new THREE.Mesh(
      new THREE.CylinderGeometry(8.5, 9.2, 0.5, 36),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 })
    );
    plinth.position.y = 0.25;
    plinth.receiveShadow = true;
    group.add(plinth);

    // Monumental Name Monolith
    const monolith = new THREE.Mesh(
      new THREE.BoxGeometry(11.5, 3.6, 1.2),
      new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.45 })
    );
    monolith.position.set(0, 2.3, -4.5);
    monolith.castShadow = true;
    group.add(monolith);

    const titleSign = createTextPlane([
      { text: 'MIGUEL ANDREI B. ABAD', size: 68, weight: 'bold', color: '#111111', gap: 22 },
      { text: 'BS COMPUTER ENGINEERING · DE LA SALLE UNIVERSITY', size: 32, weight: 'bold', color: '#0047FF', gap: 16 },
      { text: '01 // CENTRAL PLAZA · PRESS [ENTER] TO INSPECT & SIGN GUESTBOOK', size: 24, weight: 'normal', color: '#595959' }
    ], { width: 11.2, height: 3.3, accent: '#E63946' });
    titleSign.position.set(0, 2.3, -3.88);
    group.add(titleSign);

    // Sky-Guestbook Board group (populated dynamically from /api/guestbook)
    this.guestbookGroup.position.set(6.5, 4.2, -1.5);
    this.guestbookGroup.rotation.y = -0.35;
    group.add(this.guestbookGroup);

    this.scene.add(group);
  }

  _buildNorthPavilion() {
    const group = new THREE.Group();
    group.position.set(0, 0, -48);

    const base = new THREE.Mesh(
      new THREE.BoxGeometry(14, 0.6, 14),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 })
    );
    base.position.y = 0.3;
    base.receiveShadow = true;
    group.add(base);

    // 4 Architectural Pillars
    const pillarGeo = new THREE.BoxGeometry(0.9, 7.5, 0.9);
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.5 });
    [[-5.5, -5.5], [5.5, -5.5], [-5.5, 5.5], [5.5, 5.5]].forEach(([px, pz]) => {
      const p = new THREE.Mesh(pillarGeo, pillarMat);
      p.position.set(px, 4.05, pz);
      p.castShadow = true;
      group.add(p);
    });

    // Floating Crown Roof
    const roof = new THREE.Mesh(
      new THREE.BoxGeometry(13.2, 0.65, 13.2),
      new THREE.MeshStandardMaterial({ color: 0x0047ff, roughness: 0.4 })
    );
    roof.position.y = 8.1;
    roof.castShadow = true;
    group.add(roof);

    const sign = createTextPlane([
      { text: '02 // NORTH PAVILION', size: 34, weight: 'bold', color: '#0047FF', gap: 18 },
      { text: 'RESUME & TECHNICAL MATRIX', size: 54, weight: 'bold', color: '#111111', gap: 20 },
      { text: "DLSU Manila · Consistent Dean's Lister (2023–Present)", size: 30, weight: 'normal', color: '#595959' }
    ], { width: 10, height: 3.4, accent: '#0047FF' });
    sign.position.set(0, 4.4, 5.2);
    group.add(sign);

    this.scene.add(group);
  }

  _buildEastLabBase() {
    this.eastLabGroup.position.set(52, 0, 0);

    const deck = new THREE.Mesh(
      new THREE.BoxGeometry(26, 0.6, 30),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.65 })
    );
    deck.position.y = 0.3;
    deck.receiveShadow = true;
    this.eastLabGroup.add(deck);

    const banner = createTextPlane([
      { text: '03 // EAST HARDWARE & AI SKY-LAB', size: 32, weight: 'bold', color: '#0047FF', gap: 16 },
      { text: 'ACADEMIC WORK SAMPLES', size: 54, weight: 'bold', color: '#111111', gap: 14 },
      { text: 'FSL Fusion · PIC16F877A PCB · PDF Catalog · SAP-1', size: 28, weight: 'normal', color: '#595959' }
    ], { width: 11, height: 3.4, accent: '#0047FF' });
    banner.position.set(-10, 5.2, 0);
    banner.rotation.y = -Math.PI / 2;
    this.eastLabGroup.add(banner);

    this.scene.add(this.eastLabGroup);
  }

  _buildWestHub() {
    const group = new THREE.Group();
    group.position.set(-52, 0, 0);

    // Stepped Amphitheater tiers
    [0, 1, 2].forEach((tier) => {
      const r = 10 - tier * 2.2;
      const step = new THREE.Mesh(
        new THREE.CylinderGeometry(r, r + 0.3, 0.55, 32),
        new THREE.MeshStandardMaterial({ color: tier % 2 === 0 ? 0xffffff : 0x111111, roughness: 0.6 })
      );
      step.position.y = 0.28 + tier * 0.55;
      step.receiveShadow = true;
      group.add(step);
    });

    const sign = createTextPlane([
      { text: '04 // WEST STUDENT HUB', size: 32, weight: 'bold', color: '#E63946', gap: 16 },
      { text: 'ACCESS DLSU LEADERSHIP', size: 54, weight: 'bold', color: '#111111', gap: 18 },
      { text: 'AVP for Academics (2026–Present) · Junior Officer (2025–2026)', size: 27, weight: 'normal', color: '#595959' }
    ], { width: 10.5, height: 3.4, accent: '#111111' });
    sign.position.set(6.5, 4.6, 0);
    sign.rotation.y = Math.PI / 2;
    group.add(sign);

    this.scene.add(group);
  }

  _buildSouthLounge() {
    const group = new THREE.Group();
    group.position.set(0, 0, 48);

    const terrace = new THREE.Mesh(
      new THREE.BoxGeometry(16, 0.6, 12),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 })
    );
    terrace.position.y = 0.3;
    terrace.receiveShadow = true;
    group.add(terrace);

    // 2 Reference Pedestals
    [-4.5, 4.5].forEach((px) => {
      const ped = new THREE.Mesh(
        new THREE.BoxGeometry(2.2, 2.4, 2.2),
        new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.5 })
      );
      ped.position.set(px, 1.5, 2.5);
      ped.castShadow = true;
      group.add(ped);

      const orb = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.55, 0),
        new THREE.MeshStandardMaterial({ color: 0x0047ff, emissive: 0x002288, roughness: 0.2 })
      );
      orb.position.set(px, 3.4, 2.5);
      group.add(orb);
      this.animatedObjects.push({ type: 'spin', mesh: orb, speed: 1.2 });
    });

    const sign = createTextPlane([
      { text: '05 // SOUTH LOUNGE', size: 34, weight: 'bold', color: '#E63946', gap: 16 },
      { text: 'REFERENCES & RECRUITER CONTACT', size: 48, weight: 'bold', color: '#111111', gap: 18 },
      { text: 'Send Direct Message or Leave a Sky-Guestbook Note', size: 28, weight: 'normal', color: '#595959' }
    ], { width: 11, height: 3.4, accent: '#E63946' });
    sign.position.set(0, 4.4, -3.5);
    sign.rotation.y = Math.PI;
    group.add(sign);

    this.scene.add(group);
  }

  // Populate East Lab 3D centerpieces dynamically from GET /api/portfolio
  hydrateProjects(projects) {
    // Clear previous dynamic centerpieces except deck & banner
    while (this.eastLabGroup.children.length > 2) {
      this.eastLabGroup.remove(this.eastLabGroup.children[2]);
    }

    const slots = [
      { x: -4.5, y: 2.8, z: -8.5 },
      { x: 5.5, y: 4.0, z: -5.5 },
      { x: 5.5, y: 4.0, z: 6.5 },
      { x: -4.5, y: 2.8, z: 9.0 }
    ];

    projects.forEach((proj, idx) => {
      const slot = slots[idx % slots.length];
      const station = new THREE.Group();
      station.position.set(slot.x, slot.y, slot.z);

      // Floating platform pad
      const pad = new THREE.Mesh(
        new THREE.CylinderGeometry(3.2, 3.5, 0.35, 24),
        new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.45 })
      );
      station.add(pad);

      // Custom 3D Centerpiece per project diagram_type
      if (proj.diagram_type === 'fsl-fusion') {
        // Wearable 6-DOF IMU glove + dual camera rig + CNN-LSTM data blocks
        const glove = new THREE.Mesh(
          new THREE.BoxGeometry(1.1, 0.45, 1.6),
          new THREE.MeshStandardMaterial({ color: 0xe63946, roughness: 0.4 })
        );
        glove.position.set(-1.1, 0.9, 0);
        station.add(glove);

        const cnnBlock = new THREE.Mesh(
          new THREE.BoxGeometry(1.2, 1.2, 1.2),
          new THREE.MeshStandardMaterial({ color: 0x0047ff, roughness: 0.3 })
        );
        cnnBlock.position.set(1.0, 1.2, 0);
        station.add(cnnBlock);
        this.animatedObjects.push({ type: 'spin', mesh: cnnBlock, speed: 0.9 });
      } else if (proj.diagram_type === 'pcb-4layer') {
        // Giant 3D 4-layer PCB with 40-pin DIP MCU, 5V regulator, crystal, ICSP
        const pcb = new THREE.Mesh(
          new THREE.BoxGeometry(4.4, 0.2, 2.8),
          new THREE.MeshStandardMaterial({ color: 0x0a5c36, roughness: 0.5 })
        );
        pcb.position.y = 0.45;
        station.add(pcb);

        const mcu = new THREE.Mesh(
          new THREE.BoxGeometry(1.6, 0.25, 0.7),
          new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.4 })
        );
        mcu.position.set(0, 0.68, 0);
        station.add(mcu);

        const xtal = new THREE.Mesh(
          new THREE.CylinderGeometry(0.18, 0.18, 0.4, 12),
          new THREE.MeshStandardMaterial({ color: 0xc0c0c0, metalness: 0.85, roughness: 0.2 })
        );
        xtal.position.set(1.4, 0.75, -0.5);
        station.add(xtal);
      } else if (proj.diagram_type === 'pdf-catalog') {
        // Floating 3D book monolith with orbiting API nodes
        const book = new THREE.Mesh(
          new THREE.BoxGeometry(1.6, 2.2, 0.4),
          new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 })
        );
        book.position.y = 1.6;
        station.add(book);

        const orbitGroup = new THREE.Group();
        orbitGroup.position.y = 1.6;
        [0x0047ff, 0xe63946].forEach((c, i) => {
          const node = new THREE.Mesh(
            new THREE.SphereGeometry(0.32, 12, 12),
            new THREE.MeshStandardMaterial({ color: c, roughness: 0.3 })
          );
          node.position.set(i === 0 ? 1.7 : -1.7, 0, 0);
          orbitGroup.add(node);
        });
        station.add(orbitGroup);
        this.animatedObjects.push({ type: 'spin', mesh: orbitGroup, speed: 1.5 });
      } else {
        // SAP-1 8-Bit Computer Simulator: Modular W-Bus, ALU, Accumulator, RAM blocks
        const wBus = new THREE.Mesh(
          new THREE.BoxGeometry(0.22, 2.4, 0.22),
          new THREE.MeshStandardMaterial({ color: 0x0047ff, emissive: 0x001a66 })
        );
        wBus.position.y = 1.5;
        station.add(wBus);

        [-0.9, 0.9].forEach((bx, i) => {
          [0.9, 1.8].forEach((by) => {
            const reg = new THREE.Mesh(
              new THREE.BoxGeometry(1.0, 0.45, 0.6),
              new THREE.MeshStandardMaterial({ color: i === 0 ? 0x111111 : 0xe63946, roughness: 0.45 })
            );
            reg.position.set(bx, by, 0);
            station.add(reg);
          });
        });
      }

      this.eastLabGroup.add(station);
    });
  }

  // Populate Floating Sky-Guestbook Board in Central Plaza
  hydrateGuestbook(notes) {
    while (this.guestbookGroup.children.length > 0) {
      this.guestbookGroup.remove(this.guestbookGroup.children[0]);
    }
    const topNotes = (notes || []).slice(0, 3);
    const lines = [
      { text: 'LIVE SKY-GUESTBOOK', size: 36, weight: 'bold', color: '#E63946', gap: 18 }
    ];
    if (topNotes.length === 0) {
      lines.push({ text: 'Fly to South Lounge to leave the first note!', size: 26, weight: 'normal', color: '#595959' });
    } else {
      topNotes.forEach((n) => {
        lines.push({
          text: `${n.sender_name}: "${n.message.slice(0, 44)}${n.message.length > 44 ? '…' : ''}"`,
          size: 24,
          weight: 'normal',
          color: '#111111',
          gap: 14
        });
      });
    }

    const board = createTextPlane(lines, { width: 7.4, height: 3.4, accent: '#E63946', align: 'left' });
    this.guestbookGroup.add(board);
  }

  getNearestZone(pos) {
    let closest = null;
    let minDist = Infinity;
    for (const z of ZONES) {
      const dx = pos.x - z.x;
      const dz = pos.z - z.z;
      const d = Math.hypot(dx, dz);
      if (d <= z.radius && d < minDist) {
        minDist = d;
        closest = z;
      }
    }
    return closest;
  }

  update(elapsedTime, activeZoneId) {
    for (const item of this.animatedObjects) {
      if (item.type === 'cloud') {
        item.mesh.position.x = item.baseX + Math.sin(elapsedTime * 0.15 + item.phase) * 3.5;
      } else if (item.type === 'spin') {
        item.mesh.rotation.y = elapsedTime * item.speed;
      }
    }

    this.zoneRings.forEach((ring, id) => {
      const isActive = id === activeZoneId;
      ring.material.opacity = isActive ? 0.75 + Math.sin(elapsedTime * 5) * 0.2 : 0.35;
    });
  }
}
