import * as THREE from 'three';

export class PoliceInterceptor {
  public group: THREE.Group;
  public id: string;
  public speedMph: number = 0;
  public targetLaneX: number = 0;
  public boundingBox: THREE.Box3;

  private redStrobeLight: THREE.PointLight;
  private blueStrobeLight: THREE.PointLight;
  private redLensMesh: THREE.Mesh;
  private blueLensMesh: THREE.Mesh;
  private wheels: THREE.Group[] = [];

  private strobeTimer: number = 0;
  private strobeState: 'red' | 'blue' = 'red';

  constructor(id: string, initialZ: number, laneX: number) {
    this.id = id;
    this.group = new THREE.Group();
    this.group.position.set(laneX, 0, initialZ);
    this.targetLaneX = laneX;

    // Automotive Paint Materials with realistic clearcoat
    const blackPaintMat = new THREE.MeshPhysicalMaterial({
      color: 0x0f1115,
      roughness: 0.20,
      metalness: 0.90,
      clearcoat: 0.9,
      clearcoatRoughness: 0.05,
    });

    const whiteDoorMat = new THREE.MeshPhysicalMaterial({
      color: 0xf8fafc,
      roughness: 0.20,
      metalness: 0.50,
      clearcoat: 0.9,
    });

    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x070c14,
      roughness: 0.04,
      metalness: 0.1,
      transmission: 0.92,
      transparent: true,
      opacity: 0.88,
    });

    const steelMat = new THREE.MeshStandardMaterial({
      color: 0x1f242d,
      roughness: 0.35,
      metalness: 0.92,
    });

    // 1. Sculpted Cruiser Body Profile with Bevels (ExtrudeGeometry)
    const shape = new THREE.Shape();
    shape.moveTo(2.35, 0.22); // Front bumper lip
    shape.quadraticCurveTo(2.30, 0.44, 2.05, 0.50); // Front nose curve
    shape.quadraticCurveTo(1.60, 0.54, 0.95, 0.58); // Long hood
    shape.quadraticCurveTo(0.55, 0.88, 0.10, 1.05); // Windshield rake
    shape.lineTo(-0.65, 1.05); // Roofline
    shape.quadraticCurveTo(-1.15, 0.95, -1.45, 0.65); // Rear window
    shape.lineTo(-2.20, 0.60); // Trunk lid
    shape.lineTo(-2.28, 0.24); // Rear bumper
    shape.lineTo(2.35, 0.22); // Close

    const extrudeSettings: THREE.ExtrudeGeometryOptions = {
      depth: 1.88,
      bevelEnabled: true,
      bevelSegments: 6,
      bevelSize: 0.07,
      bevelThickness: 0.07,
    };

    const cruiserGeom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    cruiserGeom.center();
    cruiserGeom.computeVertexNormals();

    const cruiserMesh = new THREE.Mesh(cruiserGeom, blackPaintMat);
    cruiserMesh.rotation.y = -Math.PI / 2;
    cruiserMesh.position.set(0, 0.56, 0.05);
    cruiserMesh.castShadow = true;
    cruiserMesh.receiveShadow = true;
    this.group.add(cruiserMesh);

    // 2. White Pursuit Door Panels (Iconic Police Livery)
    const doorLGeom = new THREE.BoxGeometry(0.04, 0.36, 1.9);
    const doorL = new THREE.Mesh(doorLGeom, whiteDoorMat);
    doorL.position.set(-0.96, 0.44, 0.1);

    const doorR = doorL.clone();
    doorR.position.set(0.96, 0.44, 0.1);
    this.group.add(doorL, doorR);

    // Golden Police Star Decals
    const starGeom = new THREE.BoxGeometry(0.06, 0.20, 0.35);
    const starMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    const starL = new THREE.Mesh(starGeom, starMat);
    starL.position.set(-0.97, 0.44, 0.1);
    const starR = starL.clone();
    starR.position.set(0.97, 0.44, 0.1);
    this.group.add(starL, starR);

    // 3. Cabin Windows & Raked Windshield
    const cabinGeom = new THREE.BoxGeometry(1.48, 0.44, 2.1);
    const cabin = new THREE.Mesh(cabinGeom, glassMat);
    cabin.position.set(0, 0.88, -0.15);
    cabin.castShadow = true;
    this.group.add(cabin);

    // 4. Heavy-Duty Steel Bull-Bar / Push Bumper
    const bullBarGeom = new THREE.BoxGeometry(1.58, 0.36, 0.12);
    const bullBar = new THREE.Mesh(bullBarGeom, steelMat);
    bullBar.position.set(0, 0.38, 2.38);
    bullBar.castShadow = true;
    this.group.add(bullBar);

    // Vertical push pads
    const padGeom = new THREE.BoxGeometry(0.12, 0.46, 0.16);
    const padL = new THREE.Mesh(padGeom, steelMat);
    padL.position.set(-0.52, 0.42, 2.40);
    const padR = new THREE.Mesh(padGeom, steelMat);
    padR.position.set(0.52, 0.42, 2.40);
    this.group.add(padL, padR);

    // 5. Roof Modern Low-Profile LED Strobe Lightbar
    const barBaseGeom = new THREE.BoxGeometry(1.24, 0.05, 0.22);
    const barBase = new THREE.Mesh(barBaseGeom, steelMat);
    barBase.position.set(0, 1.16, -0.12);
    this.group.add(barBase);

    // Left Red Lens & Right Blue Lens
    const lensGeom = new THREE.BoxGeometry(0.54, 0.07, 0.18);
    this.redLensMesh = new THREE.Mesh(lensGeom, new THREE.MeshBasicMaterial({ color: 0xef4444 }));
    this.redLensMesh.position.set(-0.31, 1.20, -0.12);

    this.blueLensMesh = new THREE.Mesh(lensGeom, new THREE.MeshBasicMaterial({ color: 0x3b82f6 }));
    this.blueLensMesh.position.set(0.31, 1.20, -0.12);
    this.group.add(this.redLensMesh, this.blueLensMesh);

    // Dynamic Flashing Strobe Point Lights
    this.redStrobeLight = new THREE.PointLight(0xef4444, 20, 28);
    this.redStrobeLight.position.set(-0.6, 1.4, -0.12);
    this.blueStrobeLight = new THREE.PointLight(0x3b82f6, 20, 28);
    this.blueStrobeLight.position.set(0.6, 1.4, -0.12);
    this.group.add(this.redStrobeLight, this.blueStrobeLight);

    // 6. Projector Headlights & Taillights
    const headlampGeom = new THREE.BoxGeometry(0.36, 0.10, 0.06);
    const headlampMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    const hL = new THREE.Mesh(headlampGeom, headlampMat);
    hL.position.set(-0.68, 0.44, 2.32);
    const hR = new THREE.Mesh(headlampGeom, headlampMat);
    hR.position.set(0.68, 0.44, 2.32);
    this.group.add(hL, hR);

    const taillampGeom = new THREE.BoxGeometry(0.40, 0.10, 0.06);
    const taillampMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const tL = new THREE.Mesh(taillampGeom, taillampMat);
    tL.position.set(-0.68, 0.46, -2.32);
    const tR = new THREE.Mesh(taillampGeom, taillampMat);
    tR.position.set(0.68, 0.46, -2.32);
    this.group.add(tL, tR);

    // 7. Heavy-Duty Pursuit Wheels with Chrome Center Caps
    const wheelRadius = 0.38;
    const wheelWidth = 0.28;
    const wheelOffsets = [
      [-0.95, wheelRadius, 1.42],
      [0.95, wheelRadius, 1.42],
      [-0.95, wheelRadius, -1.38],
      [0.95, wheelRadius, -1.38],
    ];

    for (const [wx, wy, wz] of wheelOffsets) {
      const wGroup = this.createPursuitWheel(wheelRadius, wheelWidth);
      wGroup.position.set(wx, wy, wz);
      this.group.add(wGroup);
      this.wheels.push(wGroup);
    }

    // 8. Ground Contact Shadow
    const shadowGeom = new THREE.PlaneGeometry(2.8, 5.2);
    shadowGeom.rotateX(-Math.PI / 2);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.55,
    });
    const shadow = new THREE.Mesh(shadowGeom, shadowMat);
    shadow.position.y = 0.02;
    this.group.add(shadow);

    this.boundingBox = new THREE.Box3().setFromObject(this.group);
  }

  private createPursuitWheel(radius: number, width: number): THREE.Group {
    const wg = new THREE.Group();

    // Rubber Tire with smooth normals
    const tireGeom = new THREE.CylinderGeometry(radius, radius, width, 22);
    tireGeom.rotateZ(Math.PI / 2);
    tireGeom.computeVertexNormals();

    const tireMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.85 });
    const tire = new THREE.Mesh(tireGeom, tireMat);
    tire.castShadow = true;
    wg.add(tire);

    // Black Steelie Rim with Chrome Center Cap
    const rimGeom = new THREE.CylinderGeometry(radius * 0.74, radius * 0.74, width * 1.02, 18);
    rimGeom.rotateZ(Math.PI / 2);
    const rimMat = new THREE.MeshStandardMaterial({ color: 0x111116, roughness: 0.3, metalness: 0.85 });
    const rim = new THREE.Mesh(rimGeom, rimMat);
    wg.add(rim);

    const capGeom = new THREE.CylinderGeometry(radius * 0.34, radius * 0.34, width * 1.06, 16);
    capGeom.rotateZ(Math.PI / 2);
    const capMat = new THREE.MeshStandardMaterial({ color: 0xd4d4d8, roughness: 0.15, metalness: 0.95 });
    const cap = new THREE.Mesh(capGeom, capMat);
    wg.add(cap);

    return wg;
  }

  public update(playerPos: THREE.Vector3, playerSpeedMph: number, role: 'tail' | 'flank', dt: number) {
    let targetSpeed = role === 'tail' ? playerSpeedMph + 8 : playerSpeedMph + 4;
    targetSpeed = Math.min(215, Math.max(70, targetSpeed));
    this.speedMph = THREE.MathUtils.damp(this.speedMph, targetSpeed, 3.5, dt);

    const forwardMs = this.speedMph * 0.447;
    this.group.position.z += forwardMs * dt;

    if (role === 'tail') {
      this.targetLaneX = playerPos.x;
    } else {
      const flankOffset = playerPos.x > 0 ? -4.5 : 4.5;
      this.targetLaneX = playerPos.x + flankOffset;
    }

    this.targetLaneX = Math.max(-9.0, Math.min(9.0, this.targetLaneX));
    this.group.position.x = THREE.MathUtils.damp(this.group.position.x, this.targetLaneX, 4.0, dt);

    const steerDelta = this.targetLaneX - this.group.position.x;
    this.group.rotation.y = THREE.MathUtils.damp(this.group.rotation.y, steerDelta * 0.12, 8, dt);

    const dTheta = (forwardMs / 0.38) * dt;
    for (const w of this.wheels) {
      w.children[0].rotation.x += dTheta;
    }

    // Code 3 Alternating Strobe
    this.strobeTimer += dt;
    if (this.strobeTimer > 0.11) {
      this.strobeTimer = 0;
      this.strobeState = this.strobeState === 'red' ? 'blue' : 'red';

      if (this.strobeState === 'red') {
        this.redStrobeLight.intensity = 24;
        this.blueStrobeLight.intensity = 0;
        (this.redLensMesh.material as THREE.MeshBasicMaterial).color.setHex(0xff3344);
        (this.blueLensMesh.material as THREE.MeshBasicMaterial).color.setHex(0x1e3a8a);
      } else {
        this.redStrobeLight.intensity = 0;
        this.blueStrobeLight.intensity = 24;
        (this.redLensMesh.material as THREE.MeshBasicMaterial).color.setHex(0x7f1d1d);
        (this.blueLensMesh.material as THREE.MeshBasicMaterial).color.setHex(0x38bdf8);
      }
    }

    this.boundingBox.setFromObject(this.group);
  }

  public resetPosition(playerZ: number, offsetX: number, offsetZ: number) {
    this.group.position.set(offsetX, 0, playerZ + offsetZ);
    this.speedMph = 90;
    this.targetLaneX = offsetX;
    this.boundingBox.setFromObject(this.group);
  }
}
