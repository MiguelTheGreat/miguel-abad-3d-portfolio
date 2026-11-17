import * as THREE from 'three';

export function buildRoadNetwork(scene, zones) {
  const ALL_ROAD_SAMPLES = [];
  const ALL_ROAD_POLYLINES = [];
  const streetLampBulbs = [];

  const redCurbMat = new THREE.MeshStandardMaterial({ color: 0xe63946, roughness: 0.5 });
  const whiteCurbMat = new THREE.MeshStandardMaterial({ color: 0xf8f9fa, roughness: 0.5 });
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x2b2d42, roughness: 0.4, metalness: 0.6 });
  const stripeMat = new THREE.MeshStandardMaterial({ color: 0xffb703, roughness: 0.4 });
  const asphaltMat = new THREE.MeshStandardMaterial({ color: 0x2b2d42, roughness: 0.82, side: THREE.DoubleSide });

  function buildCurvedRoad(points, width = 9.6, withLamps = true) {
    const curve = new THREE.CatmullRomCurve3(points.map(([x, z]) => new THREE.Vector3(x, 0.08, z)));
    const divisions = 260;
    const roadPts = curve.getSpacedPoints(divisions);
    const poly = [];
    for (let s = 0; s <= 320; s++) {
      const pt = curve.getPointAt(s / 320);
      ALL_ROAD_SAMPLES.push({ x: pt.x, z: pt.z, halfWidth: width * 0.5 });
    }

    const positions = [];
    const indices = [];
    for (let i = 0; i < roadPts.length; i++) {
      const p = roadPts[i];
      const tan = curve.getTangentAt(i / divisions).normalize();
      poly.push([p.x, p.z]);
      const norm = new THREE.Vector3(-tan.z, 0, tan.x);
      const l = p.clone().addScaledVector(norm, width / 2);
      const r = p.clone().addScaledVector(norm, -width / 2);
      positions.push(l.x, l.y, l.z, r.x, r.y, r.z);
      if (i < roadPts.length - 1) {
        const a = i * 2, b = i * 2 + 1, c = (i + 1) * 2, d = (i + 1) * 2 + 1;
        indices.push(a, b, c, b, d, c);
      }
    }
    ALL_ROAD_POLYLINES.push(poly);

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    const mesh = new THREE.Mesh(geo, asphaltMat);
    mesh.receiveShadow = true;
    scene.add(mesh);

    for (let i = 3; i < roadPts.length - 3; i += 6) {
      const p = roadPts[i];
      const tan = curve.getTangentAt(i / divisions).normalize();
      const yaw = Math.atan2(tan.x, tan.z);
      const dash = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.04, 2.2), stripeMat);
      dash.position.set(p.x, 0.1, p.z);
      dash.rotation.y = yaw;
      scene.add(dash);

      const norm = new THREE.Vector3(-tan.z, 0, tan.x);
      const cMat = (i / 6) % 2 === 0 ? redCurbMat : whiteCurbMat;
      [-1, 1].forEach(side => {
        const cp = p.clone().addScaledVector(norm, side * (width * 0.5 + 0.35));
        const curb = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.08, 2.3), cMat);
        curb.position.set(cp.x, 0.1, cp.z);
        curb.rotation.y = yaw;
        scene.add(curb);
      });
    }

    if (withLamps) {
      for (let i = 18; i < roadPts.length - 18; i += 34) {
        const p = roadPts[i];
        const tan = curve.getTangentAt(i / divisions).normalize();
        const norm = new THREE.Vector3(-tan.z, 0, tan.x);
        const side = (i % 68 === 18) ? 1 : -1;
        const lp = p.clone().addScaledVector(norm, side * (width * 0.5 + 3.4));
        if (zones.some(z => Math.hypot(lp.x - z.x, lp.z - z.z) < z.radius + 9)) continue;
        const lampGrp = new THREE.Group();
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.2, 6.2, 12), poleMat);
        post.position.y = 3.1; post.castShadow = true; lampGrp.add(post);
        const arm = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.14, 0.14), poleMat);
        arm.position.set(-side * 0.7, 6.1, 0); lampGrp.add(arm);
        const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffe599 });
        const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 12), bulbMat);
        bulb.position.set(-side * 1.35, 5.9, 0); lampGrp.add(bulb);
        lampGrp.position.set(lp.x, 0, lp.z);
        lampGrp.rotation.y = Math.atan2(tan.x, tan.z);
        scene.add(lampGrp);
        streetLampBulbs.push(bulbMat);
      }
    }
    return curve;
  }

  const roadCurves = [
    buildCurvedRoad([[0, 0], [42, -82], [-62, -168], [-55, -255]], 9.6, true),
    buildCurvedRoad([[0, 0], [92, -48], [178, 30], [270, -35]], 9.6, true),
    buildCurvedRoad([[0, 0], [-82, 60], [-178, -22], [-260, 45]], 9.6, true),
    buildCurvedRoad([[0, 0], [-45, 86], [68, 174], [55, 260]], 9.6, true),
    buildCurvedRoad([[-55, -255], [150, -235], [270, -35], [240, 178], [55, 260], [-152, 232], [-260, 45], [-215, -165], [-55, -255]], 8.0, false)
  ];

  // Glowing Highway Turbo Boost Pads
  const boostPads = [];
  const boostPadMat = new THREE.MeshBasicMaterial({ color: 0x00f5d4, side: THREE.DoubleSide, transparent: true, opacity: 0.85 });
  [
    [roadCurves[0], 0.35], [roadCurves[0], 0.72],
    [roadCurves[1], 0.45], [roadCurves[2], 0.45],
    [roadCurves[3], 0.45], [roadCurves[4], 0.15],
    [roadCurves[4], 0.42], [roadCurves[4], 0.82]
  ].forEach(([curve, u]) => {
    const pt = curve.getPointAt(u);
    const tan = curve.getTangentAt(u).normalize();
    const padGrp = new THREE.Group();
    const base = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 6.8), new THREE.MeshBasicMaterial({ color: 0x0077ff, transparent: true, opacity: 0.35, side: THREE.DoubleSide }));
    base.rotation.x = -Math.PI / 2; padGrp.add(base);
    [-1.6, 0, 1.6].forEach(zOff => {
      const chev = new THREE.Mesh(new THREE.RingGeometry(1.1, 1.65, 3), boostPadMat);
      chev.rotation.x = -Math.PI / 2; chev.rotation.z = -Math.PI / 2;
      chev.position.set(0, 0.02, zOff); padGrp.add(chev);
    });
    padGrp.position.set(pt.x, 0.11, pt.z);
    padGrp.rotation.y = Math.atan2(tan.x, tan.z);
    scene.add(padGrp);
    boostPads.push({ x: pt.x, z: pt.z, grp: padGrp, cooldown: 0 });
  });

  // Collectible Star Gates
  const collectibles = [];
  [
    [roadCurves[0], 0.25], [roadCurves[0], 0.62],
    [roadCurves[1], 0.30], [roadCurves[1], 0.68],
    [roadCurves[2], 0.30], [roadCurves[2], 0.68],
    [roadCurves[3], 0.30], [roadCurves[3], 0.68],
    [roadCurves[4], 0.28], [roadCurves[4], 0.72]
  ].forEach(([curve, u], idx) => {
    const pt = curve.getPointAt(u);
    const m = new THREE.Mesh(
      new THREE.TorusGeometry(2.8, 0.3, 16, 40),
      new THREE.MeshStandardMaterial({ color: 0xffb703, emissive: 0xfb8500, emissiveIntensity: 0.45, roughness: 0.25, metalness: 0.6 })
    );
    m.position.set(pt.x, 2.9, pt.z);
    scene.add(m);
    collectibles.push({ mesh: m, baseY: 2.9, phase: idx, collected: false });
  });

  return {
    ALL_ROAD_SAMPLES,
    ALL_ROAD_POLYLINES,
    streetLampBulbs,
    boostPads,
    collectibles,
    redCurbMat,
    whiteCurbMat
  };
}
