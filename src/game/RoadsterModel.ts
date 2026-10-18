import * as THREE from 'three';

export interface RoadsterColorConfig {
  name: string;
  id: string;
  hex: number;
  roughness: number;
  metalness: number;
  clearcoat: number;
}

export const ROADSTER_COLORS: RoadsterColorConfig[] = [
  { name: 'Pearl White Multi-Coat', id: 'white', hex: 0xf6f8fc, roughness: 0.07, metalness: 0.18, clearcoat: 1.0 },
  { name: 'Ultra Red Metallic', id: 'red', hex: 0xd90429, roughness: 0.09, metalness: 0.90, clearcoat: 1.0 },
  { name: 'SpaceX Stealth Obsidian', id: 'stealth', hex: 0x111317, roughness: 0.20, metalness: 0.96, clearcoat: 0.85 },
  { name: 'Liquid Quicksilver', id: 'silver', hex: 0xd8dde4, roughness: 0.05, metalness: 0.98, clearcoat: 1.0 },
  { name: 'Deep Sea Metallic Blue', id: 'blue', hex: 0x0047ab, roughness: 0.10, metalness: 0.92, clearcoat: 1.0 },
];

export class RoadsterModel {
  public group: THREE.Group;
  public bodyGroup: THREE.Group;
  public spoilerGroup: THREE.Group;
  public frontLeftWheel: THREE.Group;
  public frontRightWheel: THREE.Group;
  public rearLeftWheel: THREE.Group;
  public rearRightWheel: THREE.Group;
  public thrusterLightLeft: THREE.PointLight;
  public thrusterLightRight: THREE.PointLight;
  public headlightLeft: THREE.SpotLight;
  public headlightRight: THREE.SpotLight;
  public contactShadow: THREE.Mesh;
  public brakeLightMesh: THREE.Mesh;
  public thrusterNozzles: THREE.Mesh[] = [];

  // PBR Automotive Materials
  private bodyMaterial: THREE.MeshPhysicalMaterial;
  private carbonMaterial: THREE.MeshPhysicalMaterial;
  private blackGlassMaterial: THREE.MeshPhysicalMaterial;
  private brakeLightMaterial: THREE.MeshBasicMaterial;
  private thrusterGlowMaterial: THREE.MeshBasicMaterial;
  private tireRubberMaterial: THREE.MeshStandardMaterial;
  private brakeRotorMaterial: THREE.MeshStandardMaterial;
  private mirrorMaterial: THREE.MeshStandardMaterial;
  private interiorMaterial: THREE.MeshStandardMaterial;
  private screenMaterial: THREE.MeshBasicMaterial;

  constructor(initialColorId: string = 'white') {
    this.group = new THREE.Group();
    this.bodyGroup = new THREE.Group();
    this.group.add(this.bodyGroup);

    const selectedColor = ROADSTER_COLORS.find(c => c.id === initialColorId) || ROADSTER_COLORS[0];

    // 1. Procedural PBR Textures (Carbon Fiber, Brake Discs, Tires, Dashboard Screen)
    const carbonTexture = this.generateCarbonFiberTexture();
    const brakeRotorTexture = this.generateBrakeRotorTexture();
    const tireTreadTexture = this.generateTireTreadTexture();
    const screenTexture = this.generateTeslaScreenTexture();

    // 2. AAA PBR Multi-Coat Automotive Metallic Paint
    this.bodyMaterial = new THREE.MeshPhysicalMaterial({
      color: selectedColor.hex,
      metalness: selectedColor.metalness,
      roughness: selectedColor.roughness,
      clearcoat: selectedColor.clearcoat,
      clearcoatRoughness: 0.02,
      reflectivity: 0.98,
      ior: 1.58,
      sheen: 0.22,
      sheenColor: new THREE.Color(0xdbeafe),
      specularIntensity: 1.0,
    });

    // High-Gloss 2x2 Twill Weave Carbon Fiber
    this.carbonMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x14161a,
      roughness: 0.22,
      metalness: 0.82,
      bumpMap: carbonTexture,
      bumpScale: 0.025,
      clearcoat: 0.95,
      clearcoatRoughness: 0.05,
    });

    // Optical Tinted Glass (Reflective & Transparent)
    this.blackGlassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x03060a,
      metalness: 0.04,
      roughness: 0.02,
      transmission: 0.92,
      thickness: 1.1,
      transparent: true,
      opacity: 0.90,
      ior: 1.55,
      reflectivity: 0.99,
    });

    // Performance Rubber Compound
    this.tireRubberMaterial = new THREE.MeshStandardMaterial({
      color: 0x16181b,
      roughness: 0.88,
      metalness: 0.05,
      bumpMap: tireTreadTexture,
      bumpScale: 0.04,
    });

    // Cross-Drilled Carbon-Ceramic Brake Rotor
    this.brakeRotorMaterial = new THREE.MeshStandardMaterial({
      color: 0xb0b8c4,
      roughness: 0.24,
      metalness: 0.96,
      map: brakeRotorTexture,
    });

    // Chrome Side Mirrors
    this.mirrorMaterial = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.98,
      roughness: 0.02,
    });

    // Vegan Leather / Dark Alcantara Interior
    this.interiorMaterial = new THREE.MeshStandardMaterial({
      color: 0x181a1f,
      roughness: 0.82,
      metalness: 0.08,
    });

    // 17-Inch Tesla High-Res OLED Screen
    this.screenMaterial = new THREE.MeshBasicMaterial({
      map: screenTexture,
    });

    // 3. Build Realistic 2026 Tesla Roadster Sculpted Body
    // Exact Dimensions: Length: 4.52m, Width: 2.02m (rear stance), Height: 1.12m, Clearance: 0.10m
    this.buildHypercarBody();

    // 4. Aerodynamic Side Mirrors & B-Pillar Camera Fins
    this.buildAeroSideMirrors();

    // 5. Active Aerodynamic Carbon Rear Wing with Dual Actuators
    this.spoilerGroup = this.buildActiveSpoiler();
    this.group.add(this.spoilerGroup);

    // 6. Large Staggered Performance Wheels (20" Front, 21" Rear, Flush Stance)
    const frontRadius = 0.355; // 20-inch + low profile tire
    const frontWidth = 0.265;
    const rearRadius = 0.375;  // 21-inch + wide low profile tire
    const rearWidth = 0.325;

    this.frontLeftWheel = this.createPerformanceWheel(frontRadius, frontWidth, true);
    this.frontRightWheel = this.createPerformanceWheel(frontRadius, frontWidth, false);
    this.rearLeftWheel = this.createPerformanceWheel(rearRadius, rearWidth, true);
    this.rearRightWheel = this.createPerformanceWheel(rearRadius, rearWidth, false);

    // Deep stance flush with flared arches
    this.frontLeftWheel.position.set(-0.965, frontRadius, 1.40);
    this.frontRightWheel.position.set(0.965, frontRadius, 1.40);
    this.rearLeftWheel.position.set(-1.005, rearRadius, -1.35);
    this.rearRightWheel.position.set(1.005, rearRadius, -1.35);

    this.group.add(this.frontLeftWheel);
    this.group.add(this.frontRightWheel);
    this.group.add(this.rearLeftWheel);
    this.group.add(this.rearRightWheel);

    // 7. Multi-Element Jewel LED Headlight Assemblies
    this.buildJewelLEDHeadlights();

    // 8. Slim Edge-Lit 3D OLED Ribbon Taillight
    this.brakeLightMaterial = new THREE.MeshBasicMaterial({ color: 0xff0f2b });
    const rearLightGeom = new THREE.BoxGeometry(1.82, 0.035, 0.05);
    this.brakeLightMesh = new THREE.Mesh(rearLightGeom, this.brakeLightMaterial);
    this.brakeLightMesh.position.set(0, 0.63, -2.17);
    this.group.add(this.brakeLightMesh);

    // 9. Dual SpaceX Cold-Gas Rocket Thruster Nozzles
    this.thrusterGlowMaterial = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.15,
    });

    const nozzleHousingGeom = new THREE.CylinderGeometry(0.10, 0.13, 0.30, 24, 1, true);
    nozzleHousingGeom.rotateX(Math.PI / 2);
    const titaniumMat = new THREE.MeshStandardMaterial({
      color: 0x242830,
      metalness: 0.98,
      roughness: 0.15,
    });

    const nozzleL = new THREE.Mesh(nozzleHousingGeom, titaniumMat);
    nozzleL.position.set(-0.35, 0.33, -2.15);
    const nozzleR = new THREE.Mesh(nozzleHousingGeom, titaniumMat);
    nozzleR.position.set(0.35, 0.33, -2.15);

    const coreGeom = new THREE.CylinderGeometry(0.075, 0.09, 0.18, 16);
    coreGeom.rotateX(Math.PI / 2);
    const coreL = new THREE.Mesh(coreGeom, this.thrusterGlowMaterial);
    coreL.position.set(-0.35, 0.33, -2.21);
    const coreR = new THREE.Mesh(coreGeom, this.thrusterGlowMaterial);
    coreR.position.set(0.35, 0.33, -2.21);

    this.group.add(nozzleL, nozzleR, coreL, coreR);
    this.thrusterNozzles = [coreL, coreR];

    this.thrusterLightLeft = new THREE.PointLight(0x38bdf8, 0, 14);
    this.thrusterLightLeft.position.set(-0.35, 0.33, -2.35);
    this.thrusterLightRight = new THREE.PointLight(0x38bdf8, 0, 14);
    this.thrusterLightRight.position.set(0.35, 0.33, -2.35);
    this.group.add(this.thrusterLightLeft, this.thrusterLightRight);

    // 10. Soft Elliptical Ambient Ground Contact Shadow
    this.contactShadow = this.createContactShadow();
    this.contactShadow.position.set(0, 0.015, 0);
    this.group.add(this.contactShadow);
  }

  /**
   * Constructs the 2026 Tesla Roadster hypercar body:
   * Smooth aerodynamic curves, low 1.12m height, wide 2.02m stance,
   * sculpted hood air extractors, glass canopy, and carbon venturi diffuser.
   */
  private buildHypercarBody() {
    // 1. Aerodynamic Main Fuselage: Sculpted Profile Extruded Along Width
    const shape = new THREE.Shape();
    // Continuous sports profile from front nose to rear diffuser
    shape.moveTo(2.26, 0.14); // Front splitter lip
    shape.quadraticCurveTo(2.22, 0.30, 1.95, 0.40); // Front nose cone
    shape.quadraticCurveTo(1.48, 0.48, 0.90, 0.57); // Sloping hood line
    shape.quadraticCurveTo(0.40, 0.87, -0.12, 0.98); // Raked windshield & roof apex (1.12m total height)
    shape.quadraticCurveTo(-0.76, 0.94, -1.36, 0.77); // Fastback rear glass hatch
    shape.quadraticCurveTo(-1.86, 0.69, -2.14, 0.75); // Rear ducktail aerofoil
    shape.lineTo(-2.20, 0.36); // Vertical tail deck
    shape.quadraticCurveTo(-2.06, 0.20, -1.86, 0.14); // Rear diffuser bottom
    shape.lineTo(1.86, 0.14); // Flat undertray (0.10m ground clearance)
    shape.lineTo(2.26, 0.14); // Close

    const extrudeSettings: THREE.ExtrudeGeometryOptions = {
      steps: 4,
      depth: 1.82,
      bevelEnabled: true,
      bevelThickness: 0.10,
      bevelSize: 0.09,
      bevelOffset: 0,
      bevelSegments: 8,
    };

    const mainGeom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    mainGeom.center();
    mainGeom.computeVertexNormals();

    const bodyMesh = new THREE.Mesh(mainGeom, this.bodyMaterial);
    bodyMesh.rotation.y = -Math.PI / 2;
    bodyMesh.position.set(0, 0.54, 0.0);
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    this.bodyGroup.add(bodyMesh);

    // 2. Sculpted Muscular Hood with Central Aero Trough (Visible from Hood/Cockpit cam)
    const hoodTroughGeom = new THREE.BoxGeometry(0.88, 0.03, 1.15);
    const hoodTrough = new THREE.Mesh(hoodTroughGeom, this.carbonMaterial);
    hoodTrough.position.set(0, 0.46, 1.35);
    hoodTrough.rotation.x = -0.14;
    this.bodyGroup.add(hoodTrough);

    // Twin hood extractor louvers / air extractors
    for (const side of [-0.34, 0.34]) {
      const ventGeom = new THREE.BoxGeometry(0.18, 0.02, 0.45);
      const vent = new THREE.Mesh(ventGeom, this.carbonMaterial);
      vent.position.set(side, 0.49, 1.25);
      vent.rotation.x = -0.14;
      this.bodyGroup.add(vent);
    }

    // 3. Voluptuous Muscular Fender Arches (Front & Wide Rear Stance)
    const frontFenderGeom = new THREE.CylinderGeometry(0.44, 0.42, 0.22, 28, 1, false, 0, Math.PI);
    frontFenderGeom.rotateZ(Math.PI / 2);
    frontFenderGeom.computeVertexNormals();

    const fenderFL = new THREE.Mesh(frontFenderGeom, this.bodyMaterial);
    fenderFL.position.set(-0.90, 0.355, 1.40);
    fenderFL.rotation.y = -Math.PI / 2;
    fenderFL.castShadow = true;

    const fenderFR = new THREE.Mesh(frontFenderGeom, this.bodyMaterial);
    fenderFR.position.set(0.90, 0.355, 1.40);
    fenderFR.rotation.y = -Math.PI / 2;
    fenderFR.castShadow = true;
    this.bodyGroup.add(fenderFL, fenderFR);

    // Inner dark wheel well liner covers
    const innerLinerGeom = new THREE.CylinderGeometry(0.42, 0.42, 0.18, 16, 1, false, 0, Math.PI);
    innerLinerGeom.rotateZ(Math.PI / 2);
    const linerMat = new THREE.MeshStandardMaterial({ color: 0x0a0c0e, roughness: 0.95 });
    const linerFL = new THREE.Mesh(innerLinerGeom, linerMat);
    linerFL.position.set(-0.84, 0.355, 1.40);
    linerFL.rotation.y = -Math.PI / 2;
    const linerFR = new THREE.Mesh(innerLinerGeom, linerMat);
    linerFR.position.set(0.84, 0.355, 1.40);
    linerFR.rotation.y = -Math.PI / 2;
    this.bodyGroup.add(linerFL, linerFR);

    // Widebody Flared Rear Haunches (Aggressive 2.02m track width)
    const rearHaunchGeom = new THREE.CylinderGeometry(0.47, 0.45, 0.28, 28, 1, false, 0, Math.PI);
    rearHaunchGeom.rotateZ(Math.PI / 2);
    rearHaunchGeom.computeVertexNormals();

    const haunchRL = new THREE.Mesh(rearHaunchGeom, this.bodyMaterial);
    haunchRL.position.set(-0.94, 0.375, -1.35);
    haunchRL.rotation.y = -Math.PI / 2;
    haunchRL.castShadow = true;

    const haunchRR = new THREE.Mesh(rearHaunchGeom, this.bodyMaterial);
    haunchRR.position.set(0.94, 0.375, -1.35);
    haunchRR.rotation.y = -Math.PI / 2;
    haunchRR.castShadow = true;
    this.bodyGroup.add(haunchRL, haunchRR);

    // 4. Removable Black Glass Roof & Realistic Windshield Curvature
    this.buildCompoundGlassRoof();

    // 5. Flush Aerodynamic Door Handles
    this.buildFlushDoorHandles();

    // 6. Carbon Fiber Aerodynamic Ground Effects (Splitter, Skirts, Diffuser)
    this.buildCarbonGroundEffects();

    // 7. High-Fidelity Cockpit Interior (Tesla Yoke, 17" Screen, Bolstered Seats)
    this.buildDetailedInterior();
  }

  private buildAeroSideMirrors() {
    // Ultra-sleek aerodynamic side mirror stalks
    for (const isLeft of [true, false]) {
      const sign = isLeft ? -1 : 1;
      const mirrorGroup = new THREE.Group();

      // Carbon Fiber Stalk
      const stalkGeom = new THREE.BoxGeometry(0.12, 0.022, 0.04);
      const stalk = new THREE.Mesh(stalkGeom, this.carbonMaterial);
      stalk.position.set(sign * 0.06, 0, 0);
      mirrorGroup.add(stalk);

      // Teardrop Housing
      const housingGeom = new THREE.BoxGeometry(0.18, 0.08, 0.12);
      const housing = new THREE.Mesh(housingGeom, this.bodyMaterial);
      housing.position.set(sign * 0.14, 0.02, -0.02);
      mirrorGroup.add(housing);

      // Reflective Glass Face
      const glassFaceGeom = new THREE.PlaneGeometry(0.14, 0.065);
      const glassFace = new THREE.Mesh(glassFaceGeom, this.mirrorMaterial);
      glassFace.position.set(sign * 0.14, 0.02, -0.081);
      glassFace.rotation.y = Math.PI;
      mirrorGroup.add(glassFace);

      mirrorGroup.position.set(sign * 0.88, 0.68, 0.72);
      this.bodyGroup.add(mirrorGroup);

      // Autopilot Side Repeater Camera Fins (below mirrors on front fenders)
      const camHousingGeom = new THREE.BoxGeometry(0.025, 0.04, 0.14);
      const camHousing = new THREE.Mesh(camHousingGeom, this.carbonMaterial);
      camHousing.position.set(sign * 0.955, 0.54, 0.95);
      this.bodyGroup.add(camHousing);

      const camLensGeom = new THREE.CylinderGeometry(0.012, 0.012, 0.03, 12);
      camLensGeom.rotateZ(Math.PI / 2);
      const camLens = new THREE.Mesh(camLensGeom, this.blackGlassMaterial);
      camLens.position.set(sign * 0.965, 0.54, 0.92);
      this.bodyGroup.add(camLens);
    }
  }

  private buildJewelLEDHeadlights() {
    const headlightMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc });

    // Slim Continuous Front Blade
    const frontBladeGeom = new THREE.BoxGeometry(1.62, 0.022, 0.05);
    const frontBlade = new THREE.Mesh(frontBladeGeom, headlightMat);
    frontBlade.position.set(0, 0.42, 2.24);
    this.group.add(frontBlade);

    // Angled Side Fender DRL Blades with triple projector LED lenses
    for (const isLeft of [true, false]) {
      const sign = isLeft ? -1 : 1;

      // Dark Bezel Housing
      const bezelGeom = new THREE.BoxGeometry(0.24, 0.05, 0.38);
      const bezelMat = new THREE.MeshStandardMaterial({ color: 0x08090b, roughness: 0.9 });
      const bezel = new THREE.Mesh(bezelGeom, bezelMat);
      bezel.position.set(sign * 0.68, 0.44, 2.05);
      bezel.rotation.y = sign * 0.28;
      bezel.rotation.x = -0.08;
      this.group.add(bezel);

      // Razor DRL Blade
      const eyeletGeom = new THREE.BoxGeometry(0.22, 0.026, 0.36);
      const eyelet = new THREE.Mesh(eyeletGeom, headlightMat);
      eyelet.position.set(sign * 0.68, 0.44, 2.05);
      eyelet.rotation.y = sign * 0.28;
      eyelet.rotation.x = -0.08;
      this.group.add(eyelet);

      // Triple Jewel Projector Crystal Lenses
      for (let p = 0; p < 3; p++) {
        const lensGeom = new THREE.SphereGeometry(0.028, 12, 12);
        const lens = new THREE.Mesh(lensGeom, headlightMat);
        lens.position.set(sign * (0.62 + p * 0.04), 0.43, 2.10 + p * 0.05);
        this.group.add(lens);
      }
    }

    // High-Intensity Forward Spotlights
    this.headlightLeft = new THREE.SpotLight(0xffffff, 28, 75, Math.PI / 5.5, 0.35, 1);
    this.headlightLeft.position.set(-0.65, 0.43, 2.26);
    this.headlightLeft.target.position.set(-0.65, 0, 30);
    this.group.add(this.headlightLeft);
    this.group.add(this.headlightLeft.target);

    this.headlightRight = new THREE.SpotLight(0xffffff, 28, 75, Math.PI / 5.5, 0.35, 1);
    this.headlightRight.position.set(0.65, 0.43, 2.26);
    this.headlightRight.target.position.set(0.65, 0, 30);
    this.group.add(this.headlightRight);
    this.group.add(this.headlightRight.target);
  }

  private buildCompoundGlassRoof() {
    // 1. Double-Curved Windshield Glass (Curved aerodynamic visor)
    const windshield = new THREE.Mesh(
      new THREE.BoxGeometry(1.24, 0.32, 1.08),
      this.blackGlassMaterial
    );
    windshield.position.set(0, 0.72, 0.35);
    windshield.rotation.x = 0.46; // Raked aerodynamic angle
    windshield.castShadow = true;
    this.bodyGroup.add(windshield);

    // Ceramic Black Frit Border around Windshield
    const fritMat = new THREE.MeshBasicMaterial({ color: 0x05070a });
    const fritTop = new THREE.Mesh(new THREE.BoxGeometry(1.24, 0.02, 0.12), fritMat);
    fritTop.position.set(0, 0.88, -0.06);
    this.bodyGroup.add(fritTop);

    // 2. Removable Black Tinted Targa Glass Center Panel
    const targaGeom = new THREE.BoxGeometry(1.18, 0.05, 0.86);
    const targaRoof = new THREE.Mesh(targaGeom, this.blackGlassMaterial);
    targaRoof.position.set(0, 0.93, -0.22);
    targaRoof.castShadow = true;
    this.bodyGroup.add(targaRoof);

    // Fine rubber weatherstripping seal around targa roof
    const sealMat = new THREE.MeshStandardMaterial({ color: 0x090a0d, roughness: 0.95 });
    const sealL = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.06, 0.88), sealMat);
    sealL.position.set(-0.60, 0.93, -0.22);
    const sealR = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.06, 0.88), sealMat);
    sealR.position.set(0.60, 0.93, -0.22);
    this.bodyGroup.add(sealL, sealR);

    // 3. Fastback Sloping Rear Glass Hatch
    const hatchGeom = new THREE.BoxGeometry(1.18, 0.25, 1.02);
    const rearHatch = new THREE.Mesh(hatchGeom, this.blackGlassMaterial);
    rearHatch.position.set(0, 0.76, -0.96);
    rearHatch.rotation.x = -0.38;
    rearHatch.castShadow = true;
    this.bodyGroup.add(rearHatch);

    // Slim blackened A-pillars for wraparound helmet-visor aesthetic
    const aPillarGeom = new THREE.BoxGeometry(0.045, 0.48, 0.05);
    const aPillarL = new THREE.Mesh(aPillarGeom, this.carbonMaterial);
    aPillarL.position.set(-0.61, 0.72, 0.35);
    aPillarL.rotation.x = 0.46;

    const aPillarR = new THREE.Mesh(aPillarGeom, this.carbonMaterial);
    aPillarR.position.set(0.61, 0.72, 0.35);
    aPillarR.rotation.x = 0.46;
    this.bodyGroup.add(aPillarL, aPillarR);
  }

  private buildFlushDoorHandles() {
    const handleMat = new THREE.MeshStandardMaterial({
      color: 0x18191e,
      roughness: 0.3,
      metalness: 0.8,
    });

    const handleGeom = new THREE.BoxGeometry(0.02, 0.035, 0.22);
    const handleL = new THREE.Mesh(handleGeom, handleMat);
    handleL.position.set(-0.96, 0.58, 0.05);

    const handleR = new THREE.Mesh(handleGeom, handleMat);
    handleR.position.set(0.96, 0.58, 0.05);

    this.bodyGroup.add(handleL, handleR);
  }

  private buildCarbonGroundEffects() {
    // 1. Front Carbon Chin Splitter with Endplate Dive Planes
    const splitterGeom = new THREE.BoxGeometry(1.88, 0.04, 0.60);
    const splitter = new THREE.Mesh(splitterGeom, this.carbonMaterial);
    splitter.position.set(0, 0.14, 2.18);
    this.bodyGroup.add(splitter);

    const wingletGeom = new THREE.BoxGeometry(0.03, 0.12, 0.24);
    const wingletL = new THREE.Mesh(wingletGeom, this.carbonMaterial);
    wingletL.position.set(-0.94, 0.20, 2.08);
    wingletL.rotation.y = 0.20;

    const wingletR = new THREE.Mesh(wingletGeom, this.carbonMaterial);
    wingletR.position.set(0.94, 0.20, 2.08);
    wingletR.rotation.y = -0.20;
    this.bodyGroup.add(wingletL, wingletR);

    // 2. Ground-Effect Side Skirts
    const skirtGeom = new THREE.BoxGeometry(0.12, 0.06, 2.60);
    const skirtL = new THREE.Mesh(skirtGeom, this.carbonMaterial);
    skirtL.position.set(-0.95, 0.15, 0);

    const skirtR = new THREE.Mesh(skirtGeom, this.carbonMaterial);
    skirtR.position.set(0.95, 0.15, 0);
    this.bodyGroup.add(skirtL, skirtR);

    // 3. Massive Rear Carbon Aerodynamic Venturi Diffuser
    const diffuserGeom = new THREE.BoxGeometry(1.88, 0.20, 0.56);
    const diffuser = new THREE.Mesh(diffuserGeom, this.carbonMaterial);
    diffuser.position.set(0, 0.20, -2.12);
    this.bodyGroup.add(diffuser);

    // 4 Vertical Venturi Strakes
    for (let s = -3; s <= 3; s += 2) {
      const strakeGeom = new THREE.BoxGeometry(0.022, 0.16, 0.50);
      const strake = new THREE.Mesh(strakeGeom, this.carbonMaterial);
      strake.position.set(s * 0.24, 0.18, -2.14);
      this.bodyGroup.add(strake);
    }
  }

  private buildDetailedInterior() {
    const cockpit = new THREE.Group();

    // 1. Dual Sculpted Lightweight Sport Bucket Seats
    for (const side of [-0.35, 0.35]) {
      // Seat Cushion with lateral thigh bolsters
      const seatBase = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.12, 0.46), this.interiorMaterial);
      seatBase.position.set(side, 0.36, -0.20);

      // Backrest with sculpted shoulder bolsters
      const seatBack = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.50, 0.10), this.interiorMaterial);
      seatBack.position.set(side, 0.64, -0.42);
      seatBack.rotation.x = -0.16;

      // Headrest with aerodynamic cutout
      const headrest = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.14, 0.08), this.interiorMaterial);
      headrest.position.set(side, 0.90, -0.48);

      // Red seatbelt clasps
      const buckleGeom = new THREE.BoxGeometry(0.03, 0.08, 0.03);
      const buckleMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
      const buckle = new THREE.Mesh(buckleGeom, buckleMat);
      buckle.position.set(side < 0 ? side + 0.18 : side - 0.18, 0.42, -0.20);

      cockpit.add(seatBase, seatBack, headrest, buckle);
    }

    // 2. Sculpted Minimalist Alcantara Dashboard
    const dash = new THREE.Mesh(new THREE.BoxGeometry(1.30, 0.12, 0.42), this.interiorMaterial);
    dash.position.set(0, 0.60, 0.36);
    cockpit.add(dash);

    // Continuous HVAC Vent Slit
    const ventRibbon = new THREE.Mesh(
      new THREE.BoxGeometry(1.24, 0.015, 0.04),
      new THREE.MeshStandardMaterial({ color: 0x0a0c10, roughness: 0.9 })
    );
    ventRibbon.position.set(0, 0.63, 0.42);
    cockpit.add(ventRibbon);

    // 3. Floating 17-inch Portrait OLED Display with dynamic Tesla UI
    const screen = new THREE.Mesh(
      new THREE.BoxGeometry(0.32, 0.24, 0.018),
      this.screenMaterial
    );
    screen.position.set(0, 0.66, 0.28);
    screen.rotation.x = -0.26;
    cockpit.add(screen);

    // 4. Tesla Butterfly Yoke Steering Wheel with Metallic Rim
    const yokeGroup = new THREE.Group();
    const yokeGrip = new THREE.Mesh(
      new THREE.TorusGeometry(0.125, 0.020, 10, 24, Math.PI * 1.3),
      new THREE.MeshStandardMaterial({ color: 0x0c0e12, roughness: 0.55 })
    );
    yokeGrip.rotation.z = -Math.PI / 2 + 0.35;

    // Center Airbag Boss with Tesla Emblem
    const centerBoss = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 0.025, 16),
      new THREE.MeshStandardMaterial({ color: 0x1a1d24, metalness: 0.7, roughness: 0.3 })
    );
    centerBoss.rotateX(Math.PI / 2);

    // Twin Metallic Thumbwheels
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0xd4d4d8, metalness: 0.9, roughness: 0.2 });
    const wheelL = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.016, 12), wheelMat);
    wheelL.position.set(-0.065, 0, 0.01);
    const wheelR = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.016, 12), wheelMat);
    wheelR.position.set(0.065, 0, 0.01);

    yokeGroup.add(yokeGrip, centerBoss, wheelL, wheelR);
    yokeGroup.position.set(-0.35, 0.68, 0.36);
    yokeGroup.rotation.x = -0.38;
    cockpit.add(yokeGroup);

    // 5. Center Console with Cup Holders & Wireless Charging Pads
    const consoleGeom = new THREE.BoxGeometry(0.24, 0.16, 0.75);
    const centerConsole = new THREE.Mesh(consoleGeom, this.carbonMaterial);
    centerConsole.position.set(0, 0.40, -0.05);
    cockpit.add(centerConsole);

    this.bodyGroup.add(cockpit);
  }

  private buildActiveSpoiler(): THREE.Group {
    const spoiler = new THREE.Group();

    // Carbon Wing Blade
    const wingGeom = new THREE.BoxGeometry(1.74, 0.032, 0.30);
    const wingMesh = new THREE.Mesh(wingGeom, this.carbonMaterial);
    wingMesh.castShadow = true;

    // Twin Hydraulic Actuator Struts
    const strutGeom = new THREE.CylinderGeometry(0.015, 0.015, 0.20, 12);
    const strutL = new THREE.Mesh(strutGeom, this.carbonMaterial);
    strutL.position.set(-0.50, -0.09, 0);

    const strutR = new THREE.Mesh(strutGeom, this.carbonMaterial);
    strutR.position.set(0.50, -0.09, 0);

    // Endplate Fins
    const endGeom = new THREE.BoxGeometry(0.022, 0.12, 0.32);
    const endL = new THREE.Mesh(endGeom, this.carbonMaterial);
    endL.position.set(-0.87, 0.02, 0);

    const endR = new THREE.Mesh(endGeom, this.carbonMaterial);
    endR.position.set(0.87, 0.02, 0);

    spoiler.add(wingMesh, strutL, strutR, endL, endR);
    spoiler.position.set(0, 0.74, -1.96);
    return spoiler;
  }

  /**
   * Builds an ultra-detailed performance wheel:
   * Michelin-style rubber tire with tread grooves, concave directional turbine alloy rim,
   * cross-drilled carbon-ceramic brake rotor, and Brembo 6-piston red brake caliper.
   */
  private createPerformanceWheel(radius: number, width: number, isLeft: boolean): THREE.Group {
    const wg = new THREE.Group();

    // 1. Performance Rubber Tire with Asymmetric Tread
    const tireGeom = new THREE.CylinderGeometry(radius, radius, width, 32, 1, false);
    tireGeom.rotateZ(Math.PI / 2);
    tireGeom.computeVertexNormals();

    const tire = new THREE.Mesh(tireGeom, this.tireRubberMaterial);
    tire.castShadow = true;
    wg.add(tire);

    // 2. Concave Satin Dark Turbine Alloy Rim
    const rimRadius = radius * 0.79;
    const rimGeom = new THREE.CylinderGeometry(rimRadius, rimRadius, width * 1.02, 28);
    rimGeom.rotateZ(Math.PI / 2);
    const rimMat = new THREE.MeshStandardMaterial({
      color: 0x1e2128,
      roughness: 0.15,
      metalness: 0.96,
    });
    const rim = new THREE.Mesh(rimGeom, rimMat);
    wg.add(rim);

    // 3. 10 Forged Directional Turbine Spokes with Aero Inset
    const spokeGeom = new THREE.BoxGeometry(width * 1.03, rimRadius * 0.88, 0.026);
    for (let i = 0; i < 5; i++) {
      const spoke1 = new THREE.Mesh(spokeGeom, rimMat);
      spoke1.rotation.x = (i * Math.PI) / 2.5;
      const spoke2 = new THREE.Mesh(spokeGeom, rimMat);
      spoke2.rotation.x = (i * Math.PI) / 2.5 + 0.14;
      wg.add(spoke1, spoke2);
    }

    // 4. Center Lug Hub with Metallic Tesla Badge
    const hubGeom = new THREE.CylinderGeometry(0.055, 0.055, width * 1.05, 16);
    hubGeom.rotateZ(Math.PI / 2);
    const hubMat = new THREE.MeshStandardMaterial({ color: 0xd4d4d8, metalness: 0.95, roughness: 0.10 });
    const hub = new THREE.Mesh(hubGeom, hubMat);
    wg.add(hub);

    // 5. Cross-Drilled Carbon-Ceramic Brake Rotor with Radial Cooling Holes
    const rotorGeom = new THREE.CylinderGeometry(radius * 0.68, radius * 0.68, width * 0.28, 28);
    rotorGeom.rotateZ(Math.PI / 2);
    const rotor = new THREE.Mesh(rotorGeom, this.brakeRotorMaterial);
    wg.add(rotor);

    // 6. High-Gloss Brembo 6-Piston Red Caliper
    const caliperGeom = new THREE.BoxGeometry(width * 0.48, radius * 0.42, radius * 0.24);
    const caliperMat = new THREE.MeshPhysicalMaterial({
      color: 0xef4444,
      roughness: 0.14,
      metalness: 0.75,
      clearcoat: 1.0,
      clearcoatRoughness: 0.04,
    });
    const caliper = new THREE.Mesh(caliperGeom, caliperMat);
    caliper.position.set(isLeft ? width * 0.11 : -width * 0.11, radius * 0.32, 0);
    wg.add(caliper);

    return wg;
  }

  // --- Procedural Canvas Textures for AAA PBR Realism ---

  private generateCarbonFiberTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#111317';
      ctx.fillRect(0, 0, 64, 64);

      // 2x2 Twill weave pattern
      ctx.fillStyle = '#22252c';
      for (let x = 0; x < 64; x += 8) {
        for (let y = 0; y < 64; y += 8) {
          if ((x / 8 + y / 8) % 2 === 0) {
            ctx.fillRect(x, y, 8, 4);
          } else {
            ctx.fillRect(x + 4, y, 4, 8);
          }
        }
      }
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(16, 16);
    return texture;
  }

  private generateBrakeRotorTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Brushed metallic radial background
      const grad = ctx.createRadialGradient(128, 128, 20, 128, 128, 120);
      grad.addColorStop(0, '#555a64');
      grad.addColorStop(0.3, '#8e96a4');
      grad.addColorStop(0.7, '#6b7280');
      grad.addColorStop(1, '#374151');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 256, 256);

      // Cross-drilled spiral ventilation holes
      ctx.fillStyle = '#111317';
      for (let arm = 0; arm < 12; arm++) {
        const baseAngle = (arm * Math.PI * 2) / 12;
        for (let r = 40; r < 115; r += 16) {
          const angle = baseAngle + (r / 115) * 0.45;
          const hx = 128 + Math.cos(angle) * r;
          const hy = 128 + Math.sin(angle) * r;
          ctx.beginPath();
          ctx.arc(hx, hy, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  private generateTireTreadTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#141618';
      ctx.fillRect(0, 0, 128, 128);

      // Circumferential tread channels
      ctx.fillStyle = '#08090a';
      ctx.fillRect(0, 24, 128, 8);
      ctx.fillRect(0, 48, 128, 8);
      ctx.fillRect(0, 72, 128, 8);
      ctx.fillRect(0, 96, 128, 8);

      // Lateral sipes
      for (let x = 0; x < 128; x += 16) {
        ctx.fillRect(x, 0, 3, 24);
        ctx.fillRect(x + 8, 104, 3, 24);
      }
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 12);
    return texture;
  }

  private generateTeslaScreenTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 384;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Dark UI background
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, 256, 384);

      // Top Status Bar (Battery, Time, LTE)
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, 256, 36);
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 16px monospace';
      ctx.fillText('TESLA PLAID OS', 12, 24);
      ctx.fillStyle = '#22c55e';
      ctx.fillText('100%', 205, 24);

      // Speed Display
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 48px sans-serif';
      ctx.fillText('0', 24, 96);
      ctx.font = 'bold 16px sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('MPH', 65, 96);

      // Autopilot 3D Vector Lanes
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(80, 280);
      ctx.lineTo(110, 160);
      ctx.moveTo(176, 280);
      ctx.lineTo(146, 160);
      ctx.stroke();

      // Digital Roadster Graphic Representation in center
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.roundRect(114, 185, 28, 54, 6);
      ctx.fill();

      // Lower Controls Grid
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 310, 256, 74);
      ctx.fillStyle = '#0284c7';
      ctx.font = '12px sans-serif';
      ctx.fillText('NAVIGATION', 20, 345);
      ctx.fillText('CLIMATE 70°', 105, 345);
      ctx.fillText('SETTINGS', 190, 345);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  private createContactShadow(): THREE.Mesh {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, 256, 256);
      const grad = ctx.createRadialGradient(128, 128, 20, 128, 128, 124);
      grad.addColorStop(0, 'rgba(0, 0, 0, 0.88)');
      grad.addColorStop(0.45, 'rgba(0, 0, 0, 0.45)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 256, 256);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.generateMipmaps = false;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;

    const geom = new THREE.PlaneGeometry(2.4, 4.6);
    geom.rotateX(-Math.PI / 2);

    const mat = new THREE.MeshBasicMaterial({
      map: texture,
      color: 0x000000,
      transparent: true,
      depthWrite: false,
      opacity: 0.65,
    });

    return new THREE.Mesh(geom, mat);
  }

  public setColor(colorId: string) {
    const cfg = ROADSTER_COLORS.find(c => c.id === colorId);
    if (!cfg) return;
    this.bodyMaterial.color.setHex(cfg.hex);
    this.bodyMaterial.roughness = cfg.roughness;
    this.bodyMaterial.metalness = cfg.metalness;
    this.bodyMaterial.clearcoat = cfg.clearcoat;
    this.bodyMaterial.needsUpdate = true;
  }

  public updateAnimation(
    speedMph: number,
    steerAngle: number,
    isBraking: boolean,
    isThrusterActive: boolean,
    hoverHeight: number,
    dt: number
  ) {
    // 1. Wheel rotation
    const wheelRotSpeed = (speedMph * 0.447) / 0.355;
    const dTheta = wheelRotSpeed * dt;
    this.frontLeftWheel.children[0].rotation.x += dTheta;
    this.frontRightWheel.children[0].rotation.x += dTheta;
    this.rearLeftWheel.children[0].rotation.x += dTheta;
    this.rearRightWheel.children[0].rotation.x += dTheta;

    // 2. Front wheel steering yaw
    const targetSteer = steerAngle * 0.42;
    this.frontLeftWheel.rotation.y = THREE.MathUtils.damp(this.frontLeftWheel.rotation.y, targetSteer, 14, dt);
    this.frontRightWheel.rotation.y = THREE.MathUtils.damp(this.frontRightWheel.rotation.y, targetSteer, 14, dt);

    // 3. Active Rear Spoiler elevation & air braking pitch
    const targetSpoilerY = speedMph > 80 || isBraking ? 0.90 : 0.74;
    const targetSpoilerPitch = isBraking ? 0.40 : speedMph > 140 ? 0.15 : 0.0;
    this.spoilerGroup.position.y = THREE.MathUtils.damp(this.spoilerGroup.position.y, targetSpoilerY, 10, dt);
    this.spoilerGroup.rotation.x = THREE.MathUtils.damp(this.spoilerGroup.rotation.x, targetSpoilerPitch, 10, dt);

    // 4. Brake lights
    if (isBraking) {
      this.brakeLightMaterial.color.setHex(0xff0025);
    } else {
      this.brakeLightMaterial.color.setHex(0x880015);
    }

    // 5. SpaceX Cold-Gas Thruster Plume Glow
    if (isThrusterActive) {
      this.thrusterGlowMaterial.opacity = 0.98;
      this.thrusterLightLeft.intensity = 26 + Math.random() * 8;
      this.thrusterLightRight.intensity = 26 + Math.random() * 8;
    } else {
      this.thrusterGlowMaterial.opacity = 0.12;
      this.thrusterLightLeft.intensity = 0;
      this.thrusterLightRight.intensity = 0;
    }

    // 6. Contact shadow
    const shadowScale = Math.max(0.35, 1.0 - hoverHeight * 0.20);
    this.contactShadow.scale.set(shadowScale, 1, shadowScale);
    (this.contactShadow.material as THREE.MeshBasicMaterial).opacity = Math.max(0.0, 0.65 - hoverHeight * 0.25);
  }
}
