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
    color: '#0077FF'
  },
  {
    id: 'east',
    name: 'East Hardware & AI Sky-Lab',
    subtitle: 'Academic Work Samples & Engineering Artifacts',
    x: 52,
    z: 0,
    radius: 17,
    color: '#00B4D8'
  },
  {
    id: 'west',
    name: 'West Student Hub',
    subtitle: 'Leadership & Service — ACCESS DLSU',
    x: -52,
    z: 0,
    radius: 13,
    color: '#FFB703'
  },
  {
    id: 'south',
    name: 'South Lounge',
    subtitle: 'References & Direct Recruiter Contact',
    x: 0,
    z: 48,
    radius: 13,
    color: '#FB5607'
  }
];

function createTextPlane(lines, { width = 10, height = 3, bg = '#FFFFFF', border = '#111111', accent = '#0077FF', align = 'center' } = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = Math.round(1024 * (height / width));
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = border;
  ctx.lineWidth = 10;
  ctx.strokeRect(6, 6, canvas.width - 12, canvas.height - 12);

  ctx.fillStyle = accent;
  ctx.fillRect(6, 6, canvas.width - 12, 16);

  let y = 82;
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
  const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.4, metalness: 0.05 });
  return new THREE.Mesh(new THREE.PlaneGeometry(width, height), mat);
}

export class PortfolioWorld {
  constructor(scene, physicsWorld) {
    this.scene = scene;
    this.world = physicsWorld;
    this.animatedObjects = [];
    this.zoneRings = new Map();
    this.collectibles = [];
    this.guestbookGroup = new THREE.Group();
    this.eastLabGroup = new THREE.Group();

    this._buildSkyDome();
    this._buildIslandTerrain();
    this._buildSceneryAndTrees();
    this._buildSkyRings();
    this._buildCentralPlaza();
    this._buildNorthPavilion();
    this._buildEastLabBase();
    this._buildWestHub();
    this._buildSouthLounge();
  }

  _buildSkyDome() {
    const skyGeo = new THREE.SphereGeometry(240, 32, 20);
    const skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        topColor: { value: new THREE.Color(0x219ebc) },
        midColor: { value: new THREE.Color(0x8ecae6) },
        bottomColor: { value: new THREE.Color(0xffd166) }
      },
      vertexShader: `
        varying vec3 vWorldPos;
        void main() {
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vWorldPos = wp.xyz;
          gl_Position = projectionMatrix * viewMatrix * wp;
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 midColor;
        uniform vec3 bottomColor;
        varying vec3 vWorldPos;
        void main() {
          float h = normalize(vWorldPos).y;
          vec3 col = mix(bottomColor, midColor, smoothstep(-0.05, 0.25, h));
          col = mix(col, topColor, smoothstep(0.25, 0.85, h));
          gl_FragColor = vec4(col, 1.0);
        }
      `
    });
    this.scene.add(new THREE.Mesh(skyGeo, skyMat));

    // Glowing Sun disc in the sky
    const sun = new THREE.Mesh(
      new THREE.SphereGeometry(9, 20, 20),
      new THREE.MeshBasicMaterial({ color: 0xffe599 })
    );
    sun.position.set(110, 82, -120);
    this.scene.add(sun);
  }

  _buildIslandTerrain() {
    // Physics ground plane
    const groundBody = new CANNON.Body({ mass: 0, shape: new CANNON.Plane() });
    groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    this.world.addBody(groundBody);

    // Sparkling Turquoise Ocean surrounding the island
    this.oceanMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(520, 520, 32, 32),
      new THREE.MeshStandardMaterial({
        color: 0x0096c7,
        roughness: 0.25,
        metalness: 0.15
      })
    );
    this.oceanMesh.rotation.x = -Math.PI / 2;
    this.oceanMesh.position.y = -0.75;
    this.oceanMesh.receiveShadow = true;
    this.scene.add(this.oceanMesh);

    // Sandy Golden Beach Rim
    const beach = new THREE.Mesh(
      new THREE.CylinderGeometry(86, 92, 0.9, 64),
      new THREE.MeshStandardMaterial({ color: 0xf4d58d, roughness: 0.85 })
    );
    beach.position.y = -0.42;
    beach.receiveShadow = true;
    this.scene.add(beach);

    // Lush Emerald Grass Island
    const grass = new THREE.Mesh(
      new THREE.CylinderGeometry(78, 82, 0.7, 64),
      new THREE.MeshStandardMaterial({ color: 0x52b788, roughness: 0.82 })
    );
    grass.position.y = -0.32;
    grass.receiveShadow = true;
    this.scene.add(grass);

    // Subtle game-grid overlay on grass
    const grid = new THREE.GridHelper(148, 37, 0x40916c, 0x40916c);
    grid.position.y = 0.04;
    grid.material.opacity = 0.22;
    grid.material.transparent = true;
    this.scene.add(grid);

    // Crisp Warm Stone Pathways connecting Central Plaza to N/S/E/W
    const roadMat = new THREE.MeshStandardMaterial({ color: 0xf8f9fa, roughness: 0.75 });
    const stripeMat = new THREE.MeshStandardMaterial({ color: 0xffb703, roughness: 0.5 });

    const nsRoad = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.08, 96), roadMat);
    nsRoad.position.set(0, 0.04, 0);
    nsRoad.receiveShadow = true;

    const ewRoad = new THREE.Mesh(new THREE.BoxGeometry(104, 0.08, 4.2), roadMat);
    ewRoad.position.set(0, 0.04, 0);
    ewRoad.receiveShadow = true;

    this.scene.add(nsRoad, ewRoad);

    // Dashed yellow center stripes
    for (let i = -42; i <= 42; i += 6) {
      if (Math.abs(i) < 10) continue;
      const s1 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.09, 2.5), stripeMat);
      s1.position.set(0, 0.05, i);
      const s2 = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.09, 0.3), stripeMat);
      s2.position.set(i, 0.05, 0);
      this.scene.add(s1, s2);
    }

    // Zone Glowing Landing Rings
    ZONES.forEach((zone) => {
      const ringGeo = new THREE.RingGeometry(zone.radius - 0.7, zone.radius, 48);
      const ringMat = new THREE.MeshBasicMaterial({
        color: zone.color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.65
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(zone.x, 0.08, zone.z);
      this.scene.add(ring);
      this.zoneRings.set(zone.id, ring);
    });
  }

  _buildSceneryAndTrees() {
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x7f4f24, roughness: 0.9 });
    const pineMat1 = new THREE.MeshStandardMaterial({ color: 0x2d6a4f, roughness: 0.75 });
    const pineMat2 = new THREE.MeshStandardMaterial({ color: 0x40916c, roughness: 0.75 });
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x8d99ae, roughness: 0.85 });

    const treeCoords = [
      [-18, -18], [-24, -12], [-15, -28], [18, -18], [26, -15], [16, -32],
      [-20, 18], [-28, 22], [-14, 30], [20, 18], [28, 24], [16, 32],
      [-36, -24], [36, -24], [-36, 24], [36, 24], [-64, -22], [-64, 22],
      [68, -28], [68, 28], [-22, -60], [22, -60], [-22, 60], [22, 60]
    ];

    treeCoords.forEach(([tx, tz], i) => {
      const tree = new THREE.Group();
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.45, 2.2, 8), trunkMat);
      trunk.position.y = 1.1;
      trunk.castShadow = true;
      tree.add(trunk);

      const c1 = new THREE.Mesh(new THREE.ConeGeometry(2.0, 3.2, 8), i % 2 === 0 ? pineMat1 : pineMat2);
      c1.position.y = 3.2;
      c1.castShadow = true;
      const c2 = new THREE.Mesh(new THREE.ConeGeometry(1.4, 2.5, 8), pineMat2);
      c2.position.y = 4.7;
      c2.castShadow = true;
      tree.add(c1, c2);

      const scale = 0.85 + (i % 4) * 0.18;
      tree.scale.setScalar(scale);
      tree.position.set(tx, 0, tz);
      this.scene.add(tree);
    });

    // Low-poly boulders
    [[-14, 14], [15, -14], [-32, -10], [32, 12], [-18, -42], [18, 42]].forEach(([rx, rz], i) => {
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(1.1 + (i % 3) * 0.4, 0), rockMat);
      rock.position.set(rx, 0.5, rz);
      rock.rotation.set(i, i * 0.7, 0);
      rock.castShadow = true;
      this.scene.add(rock);
    });

    // Fluffy stylized clouds
    const cloudMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95 });
    [[-34, 26, -28], [28, 30, -34], [42, 27, 26], [-38, 29, 32], [0, 33, -72], [75, 28, -10]].forEach(([cx, cy, cz], idx) => {
      const cGroup = new THREE.Group();
      for (let i = 0; i < 3; i++) {
        const block = new THREE.Mesh(new THREE.SphereGeometry(2.4 - i * 0.35, 10, 10), cloudMat);
        block.scale.set(1.4, 0.65, 1.0);
        block.position.set((i - 1) * 2.3, (i % 2) * 0.45, 0);
        cGroup.add(block);
      }
      cGroup.position.set(cx, cy, cz);
      this.scene.add(cGroup);
      this.animatedObjects.push({ type: 'cloud', mesh: cGroup, baseX: cx, phase: idx * 0.9 });
    });
  }

  _buildSkyRings() {
    // Fun floating golden sky-rings between zones to fly through!
    const ringGeo = new THREE.TorusGeometry(2.6, 0.22, 12, 32);
    const ringCoords = [
      [0, 10, -24, 0],
      [26, 11, 0, Math.PI / 2],
      [-26, 11, 0, Math.PI / 2],
      [0, 10, 24, 0],
      [28, 15, -26, Math.PI / 4],
      [-28, 15, 26, Math.PI / 4]
    ];
    ringCoords.forEach(([x, y, z, rotY], idx) => {
      const mat = new THREE.MeshStandardMaterial({
        color: 0xffb703,
        emissive: 0xfb8500,
        emissiveIntensity: 0.45,
        roughness: 0.25,
        metalness: 0.6
      });
      const ring = new THREE.Mesh(ringGeo, mat);
      ring.position.set(x, y, z);
      ring.rotation.y = rotY;
      this.scene.add(ring);
      this.collectibles.push({ mesh: ring, baseY: y, phase: idx, collected: false });
    });
  }

  _buildCentralPlaza() {
    const group = new THREE.Group();
    const plinth = new THREE.Mesh(
      new THREE.CylinderGeometry(8.8, 9.6, 0.6, 36),
      new THREE.MeshStandardMaterial({ color: 0xf8f9fa, roughness: 0.55 })
    );
    plinth.position.y = 0.3;
    plinth.receiveShadow = true;
    group.add(plinth);

    const innerRing = new THREE.Mesh(
      new THREE.CylinderGeometry(6.5, 6.5, 0.64, 36),
      new THREE.MeshStandardMaterial({ color: 0xe63946, roughness: 0.5 })
    );
    innerRing.position.y = 0.3;
    group.add(innerRing);

    const monolith = new THREE.Mesh(
      new THREE.BoxGeometry(11.6, 3.7, 1.2),
      new THREE.MeshStandardMaterial({ color: 0x1d3557, roughness: 0.4 })
    );
    monolith.position.set(0, 2.4, -4.8);
    monolith.castShadow = true;
    group.add(monolith);

    const titleSign = createTextPlane([
      { text: 'MIGUEL ANDREI B. ABAD', size: 68, weight: 'bold', color: '#111111', gap: 22 },
      { text: 'BS COMPUTER ENGINEERING · DE LA SALLE UNIVERSITY', size: 32, weight: 'bold', color: '#0077FF', gap: 16 },
      { text: '01 // CENTRAL PLAZA · PRESS [ENTER] TO INSPECT', size: 24, weight: 'normal', color: '#595959' }
    ], { width: 11.2, height: 3.3, accent: '#E63946' });
    titleSign.position.set(0, 2.4, -4.18);
    group.add(titleSign);

    this.guestbookGroup.position.set(6.8, 4.3, -1.5);
    this.guestbookGroup.rotation.y = -0.35;
    group.add(this.guestbookGroup);

    this.scene.add(group);
  }

  _buildNorthPavilion() {
    const group = new THREE.Group();
    group.position.set(0, 0, -48);

    const base = new THREE.Mesh(
      new THREE.BoxGeometry(14, 0.7, 14),
      new THREE.MeshStandardMaterial({ color: 0xf8f9fa, roughness: 0.55 })
    );
    base.position.y = 0.35;
    base.receiveShadow = true;
    group.add(base);

    const pillarGeo = new THREE.BoxGeometry(0.95, 7.5, 0.95);
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x1d3557, roughness: 0.45 });
    [[-5.5, -5.5], [5.5, -5.5], [-5.5, 5.5], [5.5, 5.5]].forEach(([px, pz]) => {
      const p = new THREE.Mesh(pillarGeo, pillarMat);
      p.position.set(px, 4.1, pz);
      p.castShadow = true;
      group.add(p);
    });

    const roof = new THREE.Mesh(
      new THREE.BoxGeometry(13.4, 0.75, 13.4),
      new THREE.MeshStandardMaterial({ color: 0x0077ff, roughness: 0.35 })
    );
    roof.position.y = 8.15;
    roof.castShadow = true;
    group.add(roof);

    const holoCube = new THREE.Mesh(
      new THREE.OctahedronGeometry(1.1, 0),
      new THREE.MeshStandardMaterial({ color: 0x48cae4, emissive: 0x0077ff, emissiveIntensity: 0.5, roughness: 0.2 })
    );
    holoCube.position.set(0, 10.2, 0);
    group.add(holoCube);
    this.animatedObjects.push({ type: 'spin', mesh: holoCube, speed: 1.1 });

    const sign = createTextPlane([
      { text: '02 // NORTH PAVILION', size: 34, weight: 'bold', color: '#0077FF', gap: 18 },
      { text: 'RESUME & TECHNICAL MATRIX', size: 54, weight: 'bold', color: '#111111', gap: 20 },
      { text: "DLSU Manila · Consistent Dean's Lister (2023–Present)", size: 30, weight: 'normal', color: '#595959' }
    ], { width: 10, height: 3.4, accent: '#0077FF' });
    sign.position.set(0, 4.5, 5.4);
    group.add(sign);

    this.scene.add(group);
  }

  _buildEastLabBase() {
    this.eastLabGroup.position.set(52, 0, 0);

    const deck = new THREE.Mesh(
      new THREE.BoxGeometry(26, 0.7, 30),
      new THREE.MeshStandardMaterial({ color: 0x2b2d42, roughness: 0.55 })
    );
    deck.position.y = 0.35;
    deck.receiveShadow = true;
    this.eastLabGroup.add(deck);

    const banner = createTextPlane([
      { text: '03 // EAST HARDWARE & AI SKY-LAB', size: 32, weight: 'bold', color: '#0077FF', gap: 16 },
      { text: 'ACADEMIC WORK SAMPLES', size: 54, weight: 'bold', color: '#111111', gap: 14 },
      { text: 'FSL Fusion · PIC16F877A PCB · PDF Catalog · SAP-1', size: 28, weight: 'normal', color: '#595959' }
    ], { width: 11, height: 3.4, accent: '#00B4D8' });
    banner.position.set(-10.5, 5.2, 0);
    banner.rotation.y = -Math.PI / 2;
    this.eastLabGroup.add(banner);

    this.scene.add(this.eastLabGroup);
  }

  _buildWestHub() {
    const group = new THREE.Group();
    group.position.set(-52, 0, 0);

    [0, 1, 2].forEach((tier) => {
      const r = 10.2 - tier * 2.2;
      const color = tier === 0 ? 0xf8f9fa : tier === 1 ? 0xffb703 : 0x1d3557;
      const step = new THREE.Mesh(
        new THREE.CylinderGeometry(r, r + 0.35, 0.6, 32),
        new THREE.MeshStandardMaterial({ color, roughness: 0.55 })
      );
      step.position.y = 0.3 + tier * 0.6;
      step.receiveShadow = true;
      group.add(step);
    });

    const sign = createTextPlane([
      { text: '04 // WEST STUDENT HUB', size: 32, weight: 'bold', color: '#E63946', gap: 16 },
      { text: 'ACCESS DLSU LEADERSHIP', size: 54, weight: 'bold', color: '#111111', gap: 18 },
      { text: 'AVP for Academics (2026–Present) · Junior Officer (2025–2026)', size: 27, weight: 'normal', color: '#595959' }
    ], { width: 10.5, height: 3.4, accent: '#FFB703' });
    sign.position.set(6.8, 4.7, 0);
    sign.rotation.y = Math.PI / 2;
    group.add(sign);

    this.scene.add(group);
  }

  _buildSouthLounge() {
    const group = new THREE.Group();
    group.position.set(0, 0, 48);

    const terrace = new THREE.Mesh(
      new THREE.BoxGeometry(16, 0.7, 12),
      new THREE.MeshStandardMaterial({ color: 0xf4d58d, roughness: 0.6 })
    );
    terrace.position.y = 0.35;
    terrace.receiveShadow = true;
    group.add(terrace);

    [-4.5, 4.5].forEach((px) => {
      const ped = new THREE.Mesh(
        new THREE.BoxGeometry(2.2, 2.4, 2.2),
        new THREE.MeshStandardMaterial({ color: 0x1d3557, roughness: 0.45 })
      );
      ped.position.set(px, 1.5, 2.5);
      ped.castShadow = true;
      group.add(ped);

      const orb = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.6, 0),
        new THREE.MeshStandardMaterial({ color: 0xfb5607, emissive: 0xe63946, emissiveIntensity: 0.45, roughness: 0.2 })
      );
      orb.position.set(px, 3.5, 2.5);
      group.add(orb);
      this.animatedObjects.push({ type: 'spin', mesh: orb, speed: 1.2 });
    });

    const sign = createTextPlane([
      { text: '05 // SOUTH LOUNGE', size: 34, weight: 'bold', color: '#FB5607', gap: 16 },
      { text: 'REFERENCES & RECRUITER CONTACT', size: 48, weight: 'bold', color: '#111111', gap: 18 },
      { text: 'Send Direct Message or Leave a Sky-Guestbook Note', size: 28, weight: 'normal', color: '#595959' }
    ], { width: 11, height: 3.4, accent: '#FB5607' });
    sign.position.set(0, 4.5, -3.5);
    sign.rotation.y = Math.PI;
    group.add(sign);

    this.scene.add(group);
  }

  hydrateProjects(projects) {
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

      const pad = new THREE.Mesh(
        new THREE.CylinderGeometry(3.2, 3.5, 0.35, 24),
        new THREE.MeshStandardMaterial({ color: 0xf8f9fa, roughness: 0.45 })
      );
      station.add(pad);

      if (proj.diagram_type === 'fsl-fusion') {
        const glove = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.45, 1.6), new THREE.MeshStandardMaterial({ color: 0xe63946, roughness: 0.4 }));
        glove.position.set(-1.1, 0.9, 0);
        station.add(glove);
        const cnnBlock = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 1.2), new THREE.MeshStandardMaterial({ color: 0x0077ff, emissive: 0x003399, emissiveIntensity: 0.35 }));
        cnnBlock.position.set(1.0, 1.2, 0);
        station.add(cnnBlock);
        this.animatedObjects.push({ type: 'spin', mesh: cnnBlock, speed: 0.9 });
      } else if (proj.diagram_type === 'pcb-4layer') {
        const pcb = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.2, 2.8), new THREE.MeshStandardMaterial({ color: 0x0a7e48, roughness: 0.45 }));
        pcb.position.y = 0.45;
        station.add(pcb);
        const mcu = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.25, 0.7), new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.4 }));
        mcu.position.set(0, 0.68, 0);
        station.add(mcu);
        const xtal = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.4, 12), new THREE.MeshStandardMaterial({ color: 0xffb703, metalness: 0.85, roughness: 0.2 }));
        xtal.position.set(1.4, 0.75, -0.5);
        station.add(xtal);
      } else if (proj.diagram_type === 'pdf-catalog') {
        const book = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.2, 0.4), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 }));
        book.position.y = 1.6;
        station.add(book);
        const orbitGroup = new THREE.Group();
        orbitGroup.position.y = 1.6;
        [0x0077ff, 0xe63946].forEach((c, i) => {
          const node = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 12), new THREE.MeshStandardMaterial({ color: c, roughness: 0.3 }));
          node.position.set(i === 0 ? 1.7 : -1.7, 0, 0);
          orbitGroup.add(node);
        });
        station.add(orbitGroup);
        this.animatedObjects.push({ type: 'spin', mesh: orbitGroup, speed: 1.5 });
      } else {
        const wBus = new THREE.Mesh(new THREE.BoxGeometry(0.24, 2.4, 0.24), new THREE.MeshStandardMaterial({ color: 0x00b4d8, emissive: 0x0077b6, emissiveIntensity: 0.4 }));
        wBus.position.y = 1.5;
        station.add(wBus);
        [-0.9, 0.9].forEach((bx, i) => {
          [0.9, 1.8].forEach((by) => {
            const reg = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.45, 0.6), new THREE.MeshStandardMaterial({ color: i === 0 ? 0x1d3557 : 0xe63946, roughness: 0.45 }));
            reg.position.set(bx, by, 0);
            station.add(reg);
          });
        });
      }

      this.eastLabGroup.add(station);
    });
  }

  hydrateGuestbook(notes) {
    while (this.guestbookGroup.children.length > 0) {
      this.guestbookGroup.remove(this.guestbookGroup.children[0]);
    }
    const topNotes = (notes || []).slice(0, 3);
    const lines = [{ text: 'LIVE SKY-GUESTBOOK', size: 36, weight: 'bold', color: '#E63946', gap: 18 }];
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
      const d = Math.hypot(pos.x - z.x, pos.z - z.z);
      if (d <= z.radius && d < minDist) {
        minDist = d;
        closest = z;
      }
    }
    return closest;
  }

  checkRingCollection(pos, onCollect) {
    for (const item of this.collectibles) {
      if (item.collected) continue;
      const d = Math.hypot(pos.x - item.mesh.position.x, pos.y - item.mesh.position.y, pos.z - item.mesh.position.z);
      if (d < 3.6) {
        item.collected = true;
        item.mesh.material.color.setHex(0x52b788);
        item.mesh.material.emissive.setHex(0x2d6a4f);
        if (onCollect) onCollect();
      }
    }
  }

  update(elapsedTime, activeZoneId) {
    for (const item of this.animatedObjects) {
      if (item.type === 'cloud') {
        item.mesh.position.x = item.baseX + Math.sin(elapsedTime * 0.15 + item.phase) * 3.5;
      } else if (item.type === 'spin') {
        item.mesh.rotation.y = elapsedTime * item.speed;
      }
    }

    for (const ring of this.collectibles) {
      ring.mesh.position.y = ring.baseY + Math.sin(elapsedTime * 2.0 + ring.phase) * 0.45;
    }

    this.zoneRings.forEach((ring, id) => {
      const isActive = id === activeZoneId;
      ring.material.opacity = isActive ? 0.85 + Math.sin(elapsedTime * 5) * 0.15 : 0.48;
    });
  }
}
