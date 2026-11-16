import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export class BalloonRig {
  constructor(scene, physicsWorld) {
    this.scene = scene;
    this.world = physicsWorld;

    this.root = new THREE.Group();
    this.swayGroup = new THREE.Group();
    this.root.add(this.swayGroup);
    this.scene.add(this.root);

    this.particles = [];
    this.tiltX = 0;
    this.tiltZ = 0;
    this.isBurning = false;

    this._buildVisualBalloon();
    this._buildShadowRing();
    this._buildPhysicsBody();
  }

  _buildVisualBalloon() {
    // 1. Gondola Basket (centered around y = 0 in local space)
    const basketGroup = new THREE.Group();
    const basketMat = new THREE.MeshStandardMaterial({
      color: 0x1c1c1e,
      roughness: 0.75,
      metalness: 0.15
    });
    const trimMat = new THREE.MeshStandardMaterial({
      color: 0xe63946,
      roughness: 0.4,
      metalness: 0.1
    });

    const basketBase = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.85, 1.3), basketMat);
    basketBase.position.y = 0.45;
    basketBase.castShadow = true;
    basketGroup.add(basketBase);

    const rim = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.12, 1.42), trimMat);
    rim.position.y = 0.9;
    rim.castShadow = true;
    basketGroup.add(rim);

    // 4 Corner uprights
    const postGeo = new THREE.CylinderGeometry(0.035, 0.035, 1.15, 8);
    const postMat = new THREE.MeshStandardMaterial({ color: 0x8d99ae, metalness: 0.7, roughness: 0.3 });
    const corners = [
      [-0.58, -0.58],
      [0.58, -0.58],
      [-0.58, 0.58],
      [0.58, 0.58]
    ];
    corners.forEach(([cx, cz]) => {
      const post = new THREE.Mesh(postGeo, postMat);
      post.position.set(cx, 1.45, cz);
      basketGroup.add(post);
    });

    // 2. Burner Assembly
    const burnerFrame = new THREE.Mesh(
      new THREE.CylinderGeometry(0.28, 0.28, 0.18, 12),
      new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8, roughness: 0.25 })
    );
    burnerFrame.position.y = 1.95;
    basketGroup.add(burnerFrame);

    // Flame cone
    const flameGeo = new THREE.ConeGeometry(0.24, 0.95, 12);
    const flameMat = new THREE.MeshBasicMaterial({
      color: 0xff7b00,
      transparent: true,
      opacity: 0.0
    });
    this.flameMesh = new THREE.Mesh(flameGeo, flameMat);
    this.flameMesh.position.y = 2.48;
    basketGroup.add(this.flameMesh);

    // Internal envelope illumination
    this.burnerLight = new THREE.PointLight(0xff7722, 0, 14, 1.6);
    this.burnerLight.position.set(0, 3.6, 0);
    basketGroup.add(this.burnerLight);

    this.swayGroup.add(basketGroup);

    // 3. Suspension Cables (from basket posts to envelope throat)
    const cableMat = new THREE.LineBasicMaterial({ color: 0x222222 });
    corners.forEach(([cx, cz]) => {
      const points = [
        new THREE.Vector3(cx, 2.0, cz),
        new THREE.Vector3(cx * 1.45, 2.85, cz * 1.45)
      ];
      const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), cableMat);
      this.swayGroup.add(line);
    });

    // 4. Stylized Swiss-Striped Envelope (#E63946 red, #FFFFFF white, #111111 black)
    const gores = 12;
    const lathePoints = [
      new THREE.Vector2(0.85, 2.85),
      new THREE.Vector2(1.45, 3.5),
      new THREE.Vector2(2.25, 4.5),
      new THREE.Vector2(2.55, 5.5),
      new THREE.Vector2(2.35, 6.5),
      new THREE.Vector2(1.70, 7.3),
      new THREE.Vector2(0.85, 7.8),
      new THREE.Vector2(0.01, 7.95)
    ];

    const swissPalette = [0xe63946, 0xffffff, 0x111111, 0xffffff];
    const goreAngle = (Math.PI * 2) / gores;

    for (let i = 0; i < gores; i++) {
      const color = swissPalette[i % swissPalette.length];
      const geo = new THREE.LatheGeometry(lathePoints, 4, i * goreAngle, goreAngle + 0.004);
      const mat = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.55,
        metalness: 0.05,
        side: THREE.DoubleSide,
        emissive: new THREE.Color(0xff5500),
        emissiveIntensity: 0.0
      });
      const goreMesh = new THREE.Mesh(geo, mat);
      goreMesh.castShadow = true;
      goreMesh.userData.isEnvelopeGore = true;
      this.swayGroup.add(goreMesh);
    }

    // Crown cap
    const crown = new THREE.Mesh(
      new THREE.CylinderGeometry(0.45, 0.55, 0.14, 16),
      new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.5 })
    );
    crown.position.y = 7.95;
    this.swayGroup.add(crown);

    // Warm air particle pool
    const pGeo = new THREE.SphereGeometry(0.11, 6, 6);
    for (let i = 0; i < 18; i++) {
      const pMat = new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? 0xff9e00 : 0xff5400,
        transparent: true,
        opacity: 0
      });
      const pMesh = new THREE.Mesh(pGeo, pMat);
      pMesh.visible = false;
      this.swayGroup.add(pMesh);
      this.particles.push({
        mesh: pMesh,
        life: 0,
        maxLife: 0.65,
        vx: 0,
        vy: 0,
        vz: 0
      });
    }
  }

  _buildShadowRing() {
    this.shadowGroup = new THREE.Group();
    const outerRing = new THREE.Mesh(
      new THREE.RingGeometry(1.5, 1.85, 36),
      new THREE.MeshBasicMaterial({
        color: 0xe63946,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.75
      })
    );
    outerRing.rotation.x = -Math.PI / 2;

    const innerDisc = new THREE.Mesh(
      new THREE.CircleGeometry(1.3, 32),
      new THREE.MeshBasicMaterial({
        color: 0x111111,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.22
      })
    );
    innerDisc.rotation.x = -Math.PI / 2;
    innerDisc.position.y = -0.01;

    this.shadowGroup.add(outerRing, innerDisc);
    this.shadowGroup.position.set(0, 0.08, 0);
    this.scene.add(this.shadowGroup);
  }

  _buildPhysicsBody() {
    this.body = new CANNON.Body({
      mass: 8,
      shape: new CANNON.Sphere(1.4),
      position: new CANNON.Vec3(0, 5.5, 14),
      linearDamping: 0.55,
      angularDamping: 0.99,
      fixedRotation: true
    });
    this.world.addBody(this.body);
  }

  resetPosition() {
    this.body.position.set(0, 5.5, 14);
    this.body.velocity.set(0, 0, 0);
    this.tiltX = 0;
    this.tiltZ = 0;
  }

  update(dt, input, elapsedTime) {
    const thrust = 125;
    const burnForce = 185;
    const ventForce = 135;

    // Gentle buoyant hover equilibrium (counteracts world gravity -9.82 * mass 8 = -78.56)
    const hoverBuoyancy = 78.56 + Math.sin(elapsedTime * 1.5) * 2.4;
    this.body.applyForce(new CANNON.Vec3(0, hoverBuoyancy, 0), this.body.position);

    // Subtle atmospheric wind drift
    const windX = Math.sin(elapsedTime * 0.28) * 3.2;
    const windZ = Math.cos(elapsedTime * 0.22) * 2.5;
    this.body.applyForce(new CANNON.Vec3(windX, 0, windZ), this.body.position);

    // Directional air-jet thrust (camera-aligned X/Z)
    const ax = input.x * thrust;
    const az = input.z * thrust;
    if (ax !== 0 || az !== 0) {
      this.body.applyForce(new CANNON.Vec3(ax, 0, az), this.body.position);
    }

    // Burner ascend / Vent descend
    this.isBurning = Boolean(input.burn);
    if (input.burn) {
      this.body.applyForce(new CANNON.Vec3(0, burnForce, 0), this.body.position);
    }
    if (input.vent) {
      this.body.applyForce(new CANNON.Vec3(0, -ventForce, 0), this.body.position);
    }

    // Soft altitude ceiling & floor clamp
    if (this.body.position.y > 38) {
      this.body.position.y = 38;
      if (this.body.velocity.y > 0) this.body.velocity.y *= 0.2;
    }
    if (this.body.position.y < 1.5) {
      this.body.position.y = 1.5;
      if (this.body.velocity.y < 0) this.body.velocity.y = 0;
    }

    // World boundary soft pushback (keep inside +-95m arena)
    const maxRange = 92;
    if (Math.abs(this.body.position.x) > maxRange) {
      this.body.applyForce(new CANNON.Vec3(-Math.sign(this.body.position.x) * 140, 0, 0), this.body.position);
    }
    if (Math.abs(this.body.position.z) > maxRange) {
      this.body.applyForce(new CANNON.Vec3(0, 0, -Math.sign(this.body.position.z) * 140), this.body.position);
    }

    // Sync visual root with physics body
    this.root.position.set(this.body.position.x, this.body.position.y - 1.2, this.body.position.z);

    // Pendulum gondola tilt on acceleration/velocity
    const targetTiltZ = THREE.MathUtils.clamp(-this.body.velocity.x * 0.024, -0.24, 0.24);
    const targetTiltX = THREE.MathUtils.clamp(this.body.velocity.z * 0.024, -0.24, 0.24);
    this.tiltZ = THREE.MathUtils.lerp(this.tiltZ, targetTiltZ, Math.min(1, dt * 6));
    this.tiltX = THREE.MathUtils.lerp(this.tiltX, targetTiltX, Math.min(1, dt * 6));
    this.swayGroup.rotation.set(this.tiltX, 0, this.tiltZ);

    // Burner flame & internal envelope glow
    const targetIntensity = this.isBurning ? 3.2 + Math.sin(elapsedTime * 35) * 0.7 : 0.0;
    this.burnerLight.intensity = THREE.MathUtils.lerp(this.burnerLight.intensity, targetIntensity, Math.min(1, dt * 14));
    this.flameMesh.material.opacity = THREE.MathUtils.lerp(
      this.flameMesh.material.opacity,
      this.isBurning ? 0.92 : 0.0,
      Math.min(1, dt * 16)
    );
    const flameScale = this.isBurning ? 0.9 + Math.sin(elapsedTime * 40) * 0.22 : 0.4;
    this.flameMesh.scale.set(flameScale, flameScale * 1.15, flameScale);

    this.swayGroup.traverse((child) => {
      if (child.userData?.isEnvelopeGore) {
        child.material.emissiveIntensity = this.burnerLight.intensity * 0.11;
      }
    });

    // Warm air particle emission
    this._updateParticles(dt);

    // Ground shadow ring directly beneath balloon
    this.shadowGroup.position.set(this.body.position.x, 0.08, this.body.position.z);
    const altScale = THREE.MathUtils.clamp(1 + (this.body.position.y - 2) * 0.03, 0.9, 1.85);
    this.shadowGroup.scale.set(altScale, 1, altScale);
  }

  _updateParticles(dt) {
    for (const p of this.particles) {
      if (p.life > 0) {
        p.life -= dt;
        p.mesh.position.x += p.vx * dt;
        p.mesh.position.y += p.vy * dt;
        p.mesh.position.z += p.vz * dt;
        const ratio = Math.max(0, p.life / p.maxLife);
        p.mesh.material.opacity = ratio * 0.75;
        p.mesh.scale.setScalar(0.6 + (1 - ratio) * 0.8);
        if (p.life <= 0) {
          p.mesh.visible = false;
        }
      } else if (this.isBurning && Math.random() < 0.38) {
        p.life = p.maxLife * (0.7 + Math.random() * 0.3);
        p.mesh.position.set(
          (Math.random() - 0.5) * 0.35,
          2.1,
          (Math.random() - 0.5) * 0.35
        );
        p.vx = (Math.random() - 0.5) * 0.4;
        p.vy = 2.4 + Math.random() * 1.4;
        p.vz = (Math.random() - 0.5) * 0.4;
        p.mesh.visible = true;
      }
    }
  }

  getPosition() {
    return this.body.position;
  }

  getSpeed() {
    return this.body.velocity.length();
  }

  getVerticalSpeed() {
    return this.body.velocity.y;
  }
}
