import * as THREE from 'three';

export class Helicopter {
  public group: THREE.Group;
  public mainRotor: THREE.Group;
  public tailRotor: THREE.Group;
  public searchlight: THREE.SpotLight;
  public searchlightTarget: THREE.Object3D;
  public beamCone: THREE.Mesh;

  private navStrobeRed: THREE.PointLight;
  private navStrobeGreen: THREE.PointLight;
  private strobeTimer: number = 0;

  public altitude: number = 20; // Meters above road
  public forwardSpeedMph: number = 90;

  constructor(initialZ: number) {
    this.group = new THREE.Group();
    this.group.position.set(0, this.altitude, initialZ);

    // Materials
    const fuselageMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.35,
      metalness: 0.8,
    });

    const whiteMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.3,
      metalness: 0.6,
    });

    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x0284c7,
      roughness: 0.05,
      metalness: 0.1,
      transmission: 0.92,
      transparent: true,
      opacity: 0.85,
    });

    const metalMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.4,
      metalness: 0.9,
    });

    // 1. Aerodynamic Helicopter Fuselage
    const fuselageGeom = new THREE.BoxGeometry(1.8, 1.9, 4.2);
    const fuselage = new THREE.Mesh(fuselageGeom, fuselageMat);
    fuselage.castShadow = true;
    fuselage.receiveShadow = true;
    this.group.add(fuselage);

    // White Police markings on sides
    const sideDecalGeom = new THREE.BoxGeometry(0.04, 0.7, 2.8);
    const sideL = new THREE.Mesh(sideDecalGeom, whiteMat);
    sideL.position.set(-0.92, 0, 0);
    const sideR = sideL.clone();
    sideR.position.set(0.92, 0, 0);
    this.group.add(sideL, sideR);

    // 2. Large Bubble Glass Cockpit
    const cockpitGeom = new THREE.BoxGeometry(1.68, 1.4, 1.8);
    const cockpit = new THREE.Mesh(cockpitGeom, glassMat);
    cockpit.position.set(0, 0.15, 1.8);
    cockpit.rotation.x = -0.25; // Aerodynamic front slant
    cockpit.castShadow = true;
    this.group.add(cockpit);

    // 3. Tail Boom & Fin
    const tailBoomGeom = new THREE.CylinderGeometry(0.22, 0.38, 5.2, 12);
    tailBoomGeom.rotateX(Math.PI / 2);
    const tailBoom = new THREE.Mesh(tailBoomGeom, fuselageMat);
    tailBoom.position.set(0, 0.3, -4.2);
    tailBoom.castShadow = true;
    this.group.add(tailBoom);

    // Vertical Stabilizer / Fin
    const finGeom = new THREE.BoxGeometry(0.08, 1.6, 1.0);
    const fin = new THREE.Mesh(finGeom, fuselageMat);
    fin.position.set(0, 1.0, -6.6);
    this.group.add(fin);

    // Horizontal Winglet
    const wingletGeom = new THREE.BoxGeometry(1.6, 0.06, 0.5);
    const winglet = new THREE.Mesh(wingletGeom, fuselageMat);
    winglet.position.set(0, 0.4, -5.8);
    this.group.add(winglet);

    // 4. Main Overhead Rotor Assembly
    this.mainRotor = new THREE.Group();
    this.mainRotor.position.set(0, 1.25, 0.2);

    // Rotor Mast
    const mastGeom = new THREE.CylinderGeometry(0.08, 0.08, 0.6, 12);
    const mast = new THREE.Mesh(mastGeom, metalMat);
    mast.position.y = -0.3;
    this.mainRotor.add(mast);

    // 4 Long Composite Rotor Blades (8.8m diameter)
    const bladeGeom = new THREE.BoxGeometry(0.26, 0.03, 4.4);
    const bladeMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.6, metalness: 0.4 });
    const b1 = new THREE.Mesh(bladeGeom, bladeMat);
    b1.position.z = 2.2;
    const b2 = new THREE.Mesh(bladeGeom, bladeMat);
    b2.position.z = -2.2;
    const b3 = new THREE.Mesh(bladeGeom, bladeMat);
    b3.rotation.y = Math.PI / 2;
    b3.position.x = 2.2;
    const b4 = new THREE.Mesh(bladeGeom, bladeMat);
    b4.rotation.y = Math.PI / 2;
    b4.position.x = -2.2;

    this.mainRotor.add(b1, b2, b3, b4);
    this.group.add(this.mainRotor);

    // 5. Tail Rotor
    this.tailRotor = new THREE.Group();
    this.tailRotor.position.set(-0.16, 1.2, -6.6);
    const tailBladeGeom = new THREE.BoxGeometry(0.02, 0.1, 1.2);
    const tb1 = new THREE.Mesh(tailBladeGeom, bladeMat);
    const tb2 = new THREE.Mesh(tailBladeGeom, bladeMat);
    tb2.rotation.x = Math.PI / 2;
    this.tailRotor.add(tb1, tb2);
    this.group.add(this.tailRotor);

    // 6. Landing Skids
    this.buildLandingSkids(metalMat);

    // 7. Police Searchlight (High-Intensity Tracking SpotLight)
    this.searchlight = new THREE.SpotLight(0xffffff, 45, 120, Math.PI / 7, 0.45, 1);
    this.searchlight.position.set(0, -0.6, 1.4);
    this.searchlight.castShadow = true;

    this.searchlightTarget = new THREE.Object3D();
    this.group.add(this.searchlightTarget);
    this.searchlight.target = this.searchlightTarget;
    this.group.add(this.searchlight);

    // Visible Volumetric-Style Light Cone Mesh
    const coneGeom = new THREE.ConeGeometry(7.5, 24, 24, 1, true);
    coneGeom.rotateX(Math.PI / 2);
    const coneMat = new THREE.MeshBasicMaterial({
      color: 0xecfeff,
      transparent: true,
      opacity: 0.12,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.beamCone = new THREE.Mesh(coneGeom, coneMat);
    this.beamCone.position.set(0, -12, 6);
    this.group.add(this.beamCone);

    // 8. Navigation Strobe Beacons (Red port, Green starboard)
    this.navStrobeRed = new THREE.PointLight(0xef4444, 4, 15);
    this.navStrobeRed.position.set(-1.2, 0.3, -0.2);
    this.navStrobeGreen = new THREE.PointLight(0x10b981, 4, 15);
    this.navStrobeGreen.position.set(1.2, 0.3, -0.2);
    this.group.add(this.navStrobeRed, this.navStrobeGreen);
  }

  private buildLandingSkids(metalMat: THREE.Material) {
    const skidGroup = new THREE.Group();

    // Twin Skids Tubes
    const skidGeom = new THREE.CylinderGeometry(0.045, 0.045, 4.4, 12);
    skidGeom.rotateX(Math.PI / 2);
    const skidL = new THREE.Mesh(skidGeom, metalMat);
    skidL.position.set(-1.1, -1.2, 0);
    const skidR = new THREE.Mesh(skidGeom, metalMat);
    skidR.position.set(1.1, -1.2, 0);
    skidGroup.add(skidL, skidR);

    // Angled Mounting Struts
    const strutGeom = new THREE.CylinderGeometry(0.035, 0.035, 0.75, 8);
    const strutOffsets = [
      [-0.8, -0.85, 1.0],
      [0.8, -0.85, 1.0],
      [-0.8, -0.85, -1.0],
      [0.8, -0.85, -1.0],
    ];

    for (const [sx, sy, sz] of strutOffsets) {
      const s = new THREE.Mesh(strutGeom, metalMat);
      s.position.set(sx, sy, sz);
      s.rotation.z = sx > 0 ? 0.35 : -0.35;
      skidGroup.add(s);
    }

    this.group.add(skidGroup);
  }

  public update(playerPos: THREE.Vector3, playerSpeedMph: number, dt: number) {
    // 1. Rapid Rotor Rotation (Chop speed)
    this.mainRotor.rotation.y += 26 * dt;
    this.tailRotor.rotation.x += 42 * dt;

    // 2. Flight Dynamics & Pursuit Tracking
    // Match forward speed smoothly up to 220 mph
    let targetSpeed = playerSpeedMph + 12;
    targetSpeed = Math.min(220, Math.max(60, targetSpeed));
    this.forwardSpeedMph = THREE.MathUtils.damp(this.forwardSpeedMph, targetSpeed, 2.5, dt);

    const forwardMs = this.forwardSpeedMph * 0.447;
    this.group.position.z += forwardMs * dt;

    // Follow slightly above and ahead or hovering right behind player
    const targetZ = playerPos.z + 18;
    this.group.position.z = THREE.MathUtils.damp(this.group.position.z, targetZ, 2.0, dt);

    // Follow player X with floating weave
    const targetX = playerPos.x + Math.sin(performance.now() * 0.001) * 3.5;
    this.group.position.x = THREE.MathUtils.damp(this.group.position.x, targetX, 2.5, dt);

    // Hover Altitude bobbing
    const targetY = this.altitude + Math.sin(performance.now() * 0.002) * 1.2;
    this.group.position.y = THREE.MathUtils.damp(this.group.position.y, targetY, 3.0, dt);

    // Bank into lateral motion (roll) and pitch nose down when accelerating forward
    const lateralDelta = targetX - this.group.position.x;
    const targetRoll = -lateralDelta * 0.08;
    const targetPitch = 0.15 + (this.forwardSpeedMph / 250) * 0.12;

    this.group.rotation.z = THREE.MathUtils.damp(this.group.rotation.z, targetRoll, 6, dt);
    this.group.rotation.x = THREE.MathUtils.damp(this.group.rotation.x, targetPitch, 5, dt);
    this.group.rotation.y = THREE.MathUtils.damp(this.group.rotation.y, lateralDelta * 0.04, 5, dt);

    // 3. Searchlight tracks the Tesla Roadster on the road
    this.searchlightTarget.position.set(
      playerPos.x - this.group.position.x,
      -this.group.position.y,
      playerPos.z - this.group.position.z
    );

    // Point beam cone towards target
    this.beamCone.lookAt(
      playerPos.x - this.group.position.x,
      -this.group.position.y,
      playerPos.z - this.group.position.z
    );

    // 4. Strobe Navigation Beacons (Flash every 0.8s)
    this.strobeTimer += dt;
    if (this.strobeTimer > 0.8) {
      this.strobeTimer = 0;
      this.navStrobeRed.intensity = 15;
      this.navStrobeGreen.intensity = 15;
    } else {
      this.navStrobeRed.intensity = THREE.MathUtils.damp(this.navStrobeRed.intensity, 2, 10, dt);
      this.navStrobeGreen.intensity = THREE.MathUtils.damp(this.navStrobeGreen.intensity, 2, 10, dt);
    }
  }

  public resetPosition(playerZ: number) {
    this.group.position.set(0, this.altitude, playerZ - 25);
    this.forwardSpeedMph = 85;
  }
}
