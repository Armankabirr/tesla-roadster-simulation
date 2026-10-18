import * as THREE from 'three';

export interface TrafficCar {
  group: THREE.Group;
  type: 'cybertruck' | 'sedan' | 'suv';
  speedMph: number;
  lane: number;
  length: number;
  width: number;
  height: number;
  boundingBox: THREE.Box3;
  passedPlayer: boolean;
}

export interface CollectibleItem {
  group: THREE.Group;
  type: 'battery' | 'thruster';
  boundingBox: THREE.Box3;
  collected: boolean;
}

export class TrafficManager {
  public scene: THREE.Scene;
  public cars: TrafficCar[] = [];
  public collectibles: CollectibleItem[] = [];

  // 4 Lanes on the highway: -7.5, -2.5, 2.5, 7.5
  public laneCoords = [-7.5, -2.5, 2.5, 7.5];

  // Materials & Geometries
  private glassMat!: THREE.MeshPhysicalMaterial;
  private rubberMat!: THREE.MeshStandardMaterial;
  private rimMat!: THREE.MeshStandardMaterial;
  private batteryGeom!: THREE.BufferGeometry;
  private batteryMat!: THREE.MeshStandardMaterial;
  private thrusterGeom!: THREE.BufferGeometry;
  private thrusterMat!: THREE.MeshStandardMaterial;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.initSharedAssets();
  }

  private initSharedAssets() {
    this.glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x0f172a,
      roughness: 0.05,
      metalness: 0.1,
      transmission: 0.9,
      transparent: true,
      opacity: 0.88,
    });

    this.rubberMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.85,
      metalness: 0.05,
    });

    this.rimMat = new THREE.MeshStandardMaterial({
      color: 0x27272a,
      roughness: 0.25,
      metalness: 0.92,
    });

    // Battery Token Geometry
    this.batteryGeom = new THREE.CylinderGeometry(0.5, 0.5, 0.9, 16);
    this.batteryMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x0891b2,
      emissiveIntensity: 0.85,
      roughness: 0.2,
      metalness: 0.8,
    });

    // SpaceX Thruster Tank Geometry
    this.thrusterGeom = new THREE.CapsuleGeometry(0.35, 0.6, 8, 16);
    this.thrusterMat = new THREE.MeshStandardMaterial({
      color: 0xa855f7,
      emissive: 0x9333ea,
      emissiveIntensity: 0.9,
      roughness: 0.2,
      metalness: 0.85,
    });
  }

  public spawnInitialTraffic(playerZ: number, count = 10) {
    this.clearAll();
    for (let i = 0; i < count; i++) {
      const z = playerZ + 40 + i * 35 + Math.random() * 15;
      const lane = Math.floor(Math.random() * 4);
      this.spawnCar(lane, z);
    }

    // Spawn initial collectibles
    for (let i = 0; i < 6; i++) {
      const z = playerZ + 30 + i * 45 + Math.random() * 15;
      const lane = Math.floor(Math.random() * 4);
      const type = Math.random() > 0.4 ? 'battery' : 'thruster';
      this.spawnCollectible(lane, z, type);
    }
  }

  public spawnCar(laneIndex: number, z: number) {
    const roll = Math.random();
    const group = new THREE.Group();

    let carType: 'cybertruck' | 'sedan' | 'suv';
    let length = 4.4;
    let width = 1.95;
    let height = 1.35;
    let speedMph = 70;

    if (roll < 0.38) {
      // 1. Realistic Cybertruck Model
      carType = 'cybertruck';
      length = 5.2;
      width = 2.15;
      height = 1.65;
      speedMph = 68 + Math.random() * 8;
      this.buildCybertruckModel(group);
    } else if (roll < 0.72) {
      // 2. Realistic Cyber-Sedan (Model S style)
      carType = 'sedan';
      length = 4.6;
      width = 1.92;
      height = 1.28;
      speedMph = 85 + Math.random() * 20;
      this.buildSedanModel(group);
    } else {
      // 3. Realistic Electric SUV (Model X style)
      carType = 'suv';
      length = 4.8;
      width = 2.05;
      height = 1.55;
      speedMph = 75 + Math.random() * 12;
      this.buildSUVModel(group);
    }

    const x = this.laneCoords[laneIndex];
    group.position.set(x, 0, z);

    this.scene.add(group);

    this.cars.push({
      group,
      type: carType,
      speedMph,
      lane: laneIndex,
      length,
      width,
      height,
      boundingBox: new THREE.Box3().setFromObject(group),
      passedPlayer: false,
    });
  }

  private buildCybertruckModel(group: THREE.Group) {
    // Stainless Steel exoskeleton material
    const stainlessMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.95,
      roughness: 0.28,
    });

    const blackTrimMat = new THREE.MeshStandardMaterial({
      color: 0x111317,
      roughness: 0.7,
      metalness: 0.3,
    });

    // Lower origami faceted hull
    const hullGeom = new THREE.BoxGeometry(2.1, 0.55, 5.2);
    const hull = new THREE.Mesh(hullGeom, stainlessMat);
    hull.position.y = 0.55;
    hull.castShadow = true;
    hull.receiveShadow = true;
    group.add(hull);

    // Pointed Apex Roof Cabin (Angular Triangle Profile)
    const peakGeom = new THREE.BoxGeometry(1.82, 0.65, 2.6);
    const peak = new THREE.Mesh(peakGeom, this.glassMat);
    peak.position.set(0, 1.15, 0.1);
    peak.castShadow = true;
    group.add(peak);

    // Sloped Tonneau Bed Cover
    const bedCoverGeom = new THREE.BoxGeometry(1.88, 0.08, 1.8);
    const bedCover = new THREE.Mesh(bedCoverGeom, blackTrimMat);
    bedCover.position.set(0, 0.88, -1.6);
    bedCover.rotation.x = -0.12;
    group.add(bedCover);

    // Front Full-Width Cyber Lightbar
    const frontBarGeom = new THREE.BoxGeometry(2.0, 0.05, 0.08);
    const frontBar = new THREE.Mesh(frontBarGeom, new THREE.MeshBasicMaterial({ color: 0xffffff }));
    frontBar.position.set(0, 0.8, 2.62);
    group.add(frontBar);

    // Rear Full-Width Red Blade Lightbar
    const rearBarGeom = new THREE.BoxGeometry(2.0, 0.05, 0.08);
    const rearBar = new THREE.Mesh(rearBarGeom, new THREE.MeshBasicMaterial({ color: 0xef4444 }));
    rearBar.position.set(0, 0.85, -2.62);
    group.add(rearBar);

    // All-terrain wheels with angular aero covers
    this.addDetailedWheels(group, 0.44, 0.32, 2.1, 5.2);
  }

  private buildSedanModel(group: THREE.Group) {
    const colors = [0x1e3a8a, 0x334155, 0x1e293b, 0x111827, 0xf1f5f9];
    const paintColor = colors[Math.floor(Math.random() * colors.length)];

    const paintMat = new THREE.MeshPhysicalMaterial({
      color: paintColor,
      roughness: 0.16,
      metalness: 0.90,
      clearcoat: 0.95,
      clearcoatRoughness: 0.05,
    });

    // Sleek Fastback Sedan Extruded Profile (Tesla Model S Plaid style)
    const shape = new THREE.Shape();
    shape.moveTo(2.25, 0.20);
    shape.quadraticCurveTo(2.15, 0.40, 1.85, 0.46);
    shape.quadraticCurveTo(1.35, 0.52, 0.85, 0.56);
    shape.quadraticCurveTo(0.45, 0.86, -0.05, 1.02);
    shape.lineTo(-0.75, 1.02);
    shape.quadraticCurveTo(-1.35, 0.90, -1.75, 0.62);
    shape.lineTo(-2.20, 0.58);
    shape.lineTo(-2.25, 0.22);
    shape.lineTo(2.25, 0.20);

    const geom = new THREE.ExtrudeGeometry(shape, {
      depth: 1.84,
      bevelEnabled: true,
      bevelSegments: 5,
      bevelSize: 0.06,
      bevelThickness: 0.06,
    });
    geom.center();
    geom.computeVertexNormals();

    const body = new THREE.Mesh(geom, paintMat);
    body.rotation.y = -Math.PI / 2;
    body.position.set(0, 0.52, 0.05);
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // Tinted Glass Canopy
    const cabinGeom = new THREE.BoxGeometry(1.42, 0.40, 2.2);
    const cabin = new THREE.Mesh(cabinGeom, this.glassMat);
    cabin.position.set(0, 0.82, -0.15);
    cabin.castShadow = true;
    group.add(cabin);

    // Slim LED Headlights & Taillights
    const headGeom = new THREE.BoxGeometry(0.35, 0.06, 0.06);
    const headMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc });
    const hL = new THREE.Mesh(headGeom, headMat);
    hL.position.set(-0.68, 0.45, 2.26);
    const hR = new THREE.Mesh(headGeom, headMat);
    hR.position.set(0.68, 0.45, 2.26);
    group.add(hL, hR);

    const tailGeom = new THREE.BoxGeometry(1.68, 0.05, 0.06);
    const tailMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const tail = new THREE.Mesh(tailGeom, tailMat);
    tail.position.set(0, 0.54, -2.26);
    group.add(tail);

    this.addDetailedWheels(group, 0.36, 0.26, 1.90, 4.5);
  }

  private buildSUVModel(group: THREE.Group) {
    const colors = [0x0f172a, 0x1e3a5f, 0x3f3f46, 0x18181b, 0xe2e8f0];
    const paintColor = colors[Math.floor(Math.random() * colors.length)];

    const paintMat = new THREE.MeshPhysicalMaterial({
      color: paintColor,
      roughness: 0.20,
      metalness: 0.85,
      clearcoat: 0.9,
    });

    // Sculpted Electric Luxury SUV Profile (Model X style)
    const shape = new THREE.Shape();
    shape.moveTo(2.35, 0.24);
    shape.quadraticCurveTo(2.25, 0.50, 1.95, 0.58);
    shape.quadraticCurveTo(1.45, 0.65, 0.95, 0.70);
    shape.quadraticCurveTo(0.60, 1.10, 0.15, 1.25);
    shape.lineTo(-0.85, 1.25);
    shape.quadraticCurveTo(-1.45, 1.15, -1.85, 0.75);
    shape.lineTo(-2.30, 0.68);
    shape.lineTo(-2.35, 0.26);
    shape.lineTo(2.35, 0.24);

    const geom = new THREE.ExtrudeGeometry(shape, {
      depth: 1.96,
      bevelEnabled: true,
      bevelSegments: 5,
      bevelSize: 0.06,
      bevelThickness: 0.06,
    });
    geom.center();
    geom.computeVertexNormals();

    const body = new THREE.Mesh(geom, paintMat);
    body.rotation.y = -Math.PI / 2;
    body.position.set(0, 0.62, 0.05);
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // Spacious Panoramic Glass Canopy
    const cabinGeom = new THREE.BoxGeometry(1.58, 0.50, 2.5);
    const cabin = new THREE.Mesh(cabinGeom, this.glassMat);
    cabin.position.set(0, 1.02, -0.12);
    cabin.castShadow = true;
    group.add(cabin);

    // Roof Rails
    const railGeom = new THREE.BoxGeometry(0.04, 0.05, 2.3);
    const railMat = new THREE.MeshStandardMaterial({ color: 0x27272a, metalness: 0.9, roughness: 0.3 });
    const railL = new THREE.Mesh(railGeom, railMat);
    railL.position.set(-0.78, 1.32, -0.12);
    const railR = new THREE.Mesh(railGeom, railMat);
    railR.position.set(0.78, 1.32, -0.12);
    group.add(railL, railR);

    // Headlights & Taillights
    const headGeom = new THREE.BoxGeometry(0.40, 0.10, 0.06);
    const headMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const hL = new THREE.Mesh(headGeom, headMat);
    hL.position.set(-0.72, 0.56, 2.36);
    const hR = new THREE.Mesh(headGeom, headMat);
    hR.position.set(0.72, 0.56, 2.36);
    group.add(hL, hR);

    const tailGeom = new THREE.BoxGeometry(1.78, 0.06, 0.06);
    const tail = new THREE.Mesh(tailGeom, new THREE.MeshBasicMaterial({ color: 0xef4444 }));
    tail.position.set(0, 0.66, -2.36);
    group.add(tail);

    this.addDetailedWheels(group, 0.40, 0.28, 2.0, 4.7);
  }

  private addDetailedWheels(group: THREE.Group, radius: number, width: number, carWidth: number, carLength: number) {
    const offsets = [
      [-carWidth / 2, radius, carLength * 0.32],
      [carWidth / 2, radius, carLength * 0.32],
      [-carWidth / 2, radius, -carLength * 0.32],
      [carWidth / 2, radius, -carLength * 0.32],
    ];

    const tireGeom = new THREE.CylinderGeometry(radius, radius, width, 20);
    tireGeom.rotateZ(Math.PI / 2);
    tireGeom.computeVertexNormals();

    const rimGeom = new THREE.CylinderGeometry(radius * 0.74, radius * 0.74, width * 1.02, 16);
    rimGeom.rotateZ(Math.PI / 2);

    for (const [x, y, z] of offsets) {
      const wg = new THREE.Group();
      wg.position.set(x, y, z);

      const tire = new THREE.Mesh(tireGeom, this.rubberMat);
      tire.castShadow = true;
      wg.add(tire);

      const rim = new THREE.Mesh(rimGeom, this.rimMat);
      wg.add(rim);

      group.add(wg);
    }
  }

  public spawnCollectible(laneIndex: number, z: number, type: 'battery' | 'thruster') {
    const group = new THREE.Group();
    const mesh = new THREE.Mesh(
      type === 'battery' ? this.batteryGeom : this.thrusterGeom,
      type === 'battery' ? this.batteryMat : this.thrusterMat
    );
    mesh.position.y = 0.85;
    mesh.castShadow = true;
    group.add(mesh);

    // Glow ring underneath
    const ringGeom = new THREE.RingGeometry(0.6, 0.85, 16);
    ringGeom.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: type === 'battery' ? 0x06b6d4 : 0xa855f7,
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(ringGeom, ringMat);
    ring.position.y = 0.05;
    group.add(ring);

    const x = this.laneCoords[laneIndex];
    group.position.set(x, 0, z);

    this.scene.add(group);

    this.collectibles.push({
      group,
      type,
      boundingBox: new THREE.Box3().setFromObject(group),
      collected: false,
    });
  }

  public update(playerZ: number, dt: number, onNearMiss?: () => void) {
    // 1. Update Traffic Cars
    for (let i = this.cars.length - 1; i >= 0; i--) {
      const car = this.cars[i];
      const speedMs = car.speedMph * 0.447;
      car.group.position.z += speedMs * dt;
      car.boundingBox.setFromObject(car.group);

      // Check near-miss
      if (!car.passedPlayer && car.group.position.z < playerZ - car.length) {
        car.passedPlayer = true;
        if (onNearMiss) onNearMiss();
      }

      // Recycle cars that are far behind player
      if (car.group.position.z < playerZ - 30) {
        this.scene.remove(car.group);
        this.cars.splice(i, 1);

        const aheadZ = playerZ + 180 + Math.random() * 40;
        const newLane = Math.floor(Math.random() * 4);
        this.spawnCar(newLane, aheadZ);
      }
    }

    // 2. Update Collectibles
    for (let i = this.collectibles.length - 1; i >= 0; i--) {
      const item = this.collectibles[i];
      item.group.children[0].rotation.y += 2.5 * dt;
      item.group.children[0].position.y = 0.85 + Math.sin(performance.now() * 0.004) * 0.15;
      item.boundingBox.setFromObject(item.group);

      if (item.group.position.z < playerZ - 20 || item.collected) {
        this.scene.remove(item.group);
        this.collectibles.splice(i, 1);

        if (!item.collected) {
          const aheadZ = playerZ + 200 + Math.random() * 50;
          const newLane = Math.floor(Math.random() * 4);
          const type = Math.random() > 0.4 ? 'battery' : 'thruster';
          this.spawnCollectible(newLane, aheadZ, type);
        }
      }
    }

    // Maintain minimum traffic density
    while (this.cars.length < 12) {
      const aheadZ = playerZ + 120 + Math.random() * 100;
      const newLane = Math.floor(Math.random() * 4);
      this.spawnCar(newLane, aheadZ);
    }

    // Maintain minimum collectibles
    while (this.collectibles.length < 6) {
      const aheadZ = playerZ + 100 + Math.random() * 80;
      const newLane = Math.floor(Math.random() * 4);
      const type = Math.random() > 0.4 ? 'battery' : 'thruster';
      this.spawnCollectible(newLane, aheadZ, type);
    }
  }

  public clearAll() {
    for (const c of this.cars) {
      this.scene.remove(c.group);
    }
    for (const item of this.collectibles) {
      this.scene.remove(item.group);
    }
    this.cars = [];
    this.collectibles = [];
  }
}
