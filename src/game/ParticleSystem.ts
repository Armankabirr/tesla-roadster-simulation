import * as THREE from 'three';

export class ParticleSystem {
  public group: THREE.Group;

  // Thruster Plume Particles
  private thrusterParticles: THREE.Points;
  private thrusterPositions: Float32Array;
  private thrusterVelocities: Float32Array;
  private thrusterLifespans: Float32Array;
  private thrusterCount = 120;

  // Speed Warp Streaks (Plaid Mode)
  private warpLines: THREE.LineSegments;
  private warpPositions: Float32Array;
  private warpCount = 100;

  // Spark / Impact Particles
  private sparkParticles: THREE.Points;
  private sparkPositions: Float32Array;
  private sparkVelocities: Float32Array;
  private sparkLifespans: Float32Array;
  private sparkCount = 80;

  constructor() {
    this.group = new THREE.Group();

    // 1. SpaceX Thruster Plasma Jet Particles
    const thrusterGeom = new THREE.BufferGeometry();
    this.thrusterPositions = new Float32Array(this.thrusterCount * 3);
    this.thrusterVelocities = new Float32Array(this.thrusterCount * 3);
    this.thrusterLifespans = new Float32Array(this.thrusterCount);

    for (let i = 0; i < this.thrusterCount; i++) {
      this.thrusterLifespans[i] = -1; // Inactive
    }
    thrusterGeom.setAttribute('position', new THREE.BufferAttribute(this.thrusterPositions, 3));

    const thrusterMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.28,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.thrusterParticles = new THREE.Points(thrusterGeom, thrusterMat);
    this.group.add(this.thrusterParticles);

    // 2. Warp Speed Hyperspace Streaks
    const warpGeom = new THREE.BufferGeometry();
    this.warpPositions = new Float32Array(this.warpCount * 6); // 2 vertices per line
    for (let i = 0; i < this.warpCount; i++) {
      const x = (Math.random() - 0.5) * 28;
      const y = Math.random() * 8 + 0.5;
      const z = (Math.random() - 0.5) * 120;
      const len = 3 + Math.random() * 8;

      this.warpPositions[i * 6 + 0] = x;
      this.warpPositions[i * 6 + 1] = y;
      this.warpPositions[i * 6 + 2] = z;

      this.warpPositions[i * 6 + 3] = x;
      this.warpPositions[i * 6 + 4] = y;
      this.warpPositions[i * 6 + 5] = z + len;
    }
    warpGeom.setAttribute('position', new THREE.BufferAttribute(this.warpPositions, 3));
    const warpMat = new THREE.LineBasicMaterial({
      color: 0x67e8f9,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
    });
    this.warpLines = new THREE.LineSegments(warpGeom, warpMat);
    this.group.add(this.warpLines);

    // 3. Impact Sparks
    const sparkGeom = new THREE.BufferGeometry();
    this.sparkPositions = new Float32Array(this.sparkCount * 3);
    this.sparkVelocities = new Float32Array(this.sparkCount * 3);
    this.sparkLifespans = new Float32Array(this.sparkCount);
    for (let i = 0; i < this.sparkCount; i++) {
      this.sparkLifespans[i] = -1;
    }
    sparkGeom.setAttribute('position', new THREE.BufferAttribute(this.sparkPositions, 3));
    const sparkMat = new THREE.PointsMaterial({
      color: 0xf59e0b,
      size: 0.16,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.sparkParticles = new THREE.Points(sparkGeom, sparkMat);
    this.group.add(this.sparkParticles);
  }

  public emitThrusterPlume(carPos: THREE.Vector3, isThrusterActive: boolean, dt: number) {
    const posAttr = this.thrusterParticles.geometry.attributes.position as THREE.BufferAttribute;

    // Spawn new plume particles if thrusters active
    if (isThrusterActive) {
      const spawnCount = Math.floor(dt * 300);
      for (let s = 0; s < spawnCount; s++) {
        const idx = this.findFreeThrusterParticle();
        if (idx !== -1) {
          const side = Math.random() > 0.5 ? 0.35 : -0.35;
          this.thrusterPositions[idx * 3 + 0] = carPos.x + side + (Math.random() - 0.5) * 0.08;
          this.thrusterPositions[idx * 3 + 1] = carPos.y + 0.35 + (Math.random() - 0.5) * 0.08;
          this.thrusterPositions[idx * 3 + 2] = carPos.z - 2.2;

          this.thrusterVelocities[idx * 3 + 0] = (Math.random() - 0.5) * 0.8;
          this.thrusterVelocities[idx * 3 + 1] = (Math.random() - 0.5) * 0.5 - 0.2;
          this.thrusterVelocities[idx * 3 + 2] = -15 - Math.random() * 20;

          this.thrusterLifespans[idx] = 0.25;
        }
      }
    }

    // Update existing plume particles
    for (let i = 0; i < this.thrusterCount; i++) {
      if (this.thrusterLifespans[i] > 0) {
        this.thrusterLifespans[i] -= dt;
        this.thrusterPositions[i * 3 + 0] += this.thrusterVelocities[i * 3 + 0] * dt;
        this.thrusterPositions[i * 3 + 1] += this.thrusterVelocities[i * 3 + 1] * dt;
        this.thrusterPositions[i * 3 + 2] += this.thrusterVelocities[i * 3 + 2] * dt;
      } else {
        this.thrusterPositions[i * 3 + 1] = -1000; // Off-screen
      }
    }

    posAttr.needsUpdate = true;
  }

  private findFreeThrusterParticle(): number {
    for (let i = 0; i < this.thrusterCount; i++) {
      if (this.thrusterLifespans[i] <= 0) return i;
    }
    return -1;
  }

  public emitSparks(pos: THREE.Vector3, count = 25) {
    const posAttr = this.sparkParticles.geometry.attributes.position as THREE.BufferAttribute;
    let spawned = 0;
    for (let i = 0; i < this.sparkCount && spawned < count; i++) {
      if (this.sparkLifespans[i] <= 0) {
        this.sparkPositions[i * 3 + 0] = pos.x;
        this.sparkPositions[i * 3 + 1] = pos.y + 0.2;
        this.sparkPositions[i * 3 + 2] = pos.z;

        this.sparkVelocities[i * 3 + 0] = (Math.random() - 0.5) * 12;
        this.sparkVelocities[i * 3 + 1] = Math.random() * 8 + 2;
        this.sparkVelocities[i * 3 + 2] = (Math.random() - 0.5) * 12;

        this.sparkLifespans[i] = 0.4 + Math.random() * 0.3;
        spawned++;
      }
    }
    posAttr.needsUpdate = true;
  }

  public updateWarpLines(carZ: number, speedMph: number, dt: number) {
    const mat = this.warpLines.material as THREE.LineBasicMaterial;
    // Activate warp visual above 140 mph
    const warpRatio = Math.max(0, Math.min(1, (speedMph - 120) / 100));
    mat.opacity = warpRatio * 0.75;

    if (warpRatio <= 0) return;

    const posAttr = this.warpLines.geometry.attributes.position as THREE.BufferAttribute;
    const streamSpeed = speedMph * 0.8;

    for (let i = 0; i < this.warpCount; i++) {
      let z1 = this.warpPositions[i * 6 + 2] - streamSpeed * dt;
      let z2 = this.warpPositions[i * 6 + 5] - streamSpeed * dt;

      // Wrap around vehicle
      if (z2 < carZ - 20) {
        z1 = carZ + 60 + Math.random() * 40;
        z2 = z1 + 6 + warpRatio * 14;
        this.warpPositions[i * 6 + 0] = (Math.random() - 0.5) * 32;
        this.warpPositions[i * 6 + 1] = Math.random() * 9 + 0.5;
        this.warpPositions[i * 6 + 3] = this.warpPositions[i * 6 + 0];
        this.warpPositions[i * 6 + 4] = this.warpPositions[i * 6 + 1];
      }

      this.warpPositions[i * 6 + 2] = z1;
      this.warpPositions[i * 6 + 5] = z2;
    }
    posAttr.needsUpdate = true;
  }

  public updateSparks(dt: number) {
    const posAttr = this.sparkParticles.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < this.sparkCount; i++) {
      if (this.sparkLifespans[i] > 0) {
        this.sparkLifespans[i] -= dt;
        this.sparkVelocities[i * 3 + 1] -= 22 * dt; // gravity
        this.sparkPositions[i * 3 + 0] += this.sparkVelocities[i * 3 + 0] * dt;
        this.sparkPositions[i * 3 + 1] += this.sparkVelocities[i * 3 + 1] * dt;
        this.sparkPositions[i * 3 + 2] += this.sparkVelocities[i * 3 + 2] * dt;
      } else {
        this.sparkPositions[i * 3 + 1] = -1000;
      }
    }
    posAttr.needsUpdate = true;
  }
}
