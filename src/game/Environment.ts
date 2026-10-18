import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

export class Environment {
  public scene: THREE.Scene;
  public dirLight: THREE.DirectionalLight;
  public hemiLight: THREE.HemisphereLight;

  // Road chunks for seamless infinite streaming
  private roadChunks: THREE.Group[] = [];
  public chunkLength = 160;
  public totalChunks = 6;
  private lastPlayerZ = 0;

  // Ocean Water Mesh
  private oceanMesh!: THREE.Mesh;

  // Shared Scenery Geometries & Materials
  private roadMaterial!: THREE.MeshStandardMaterial;
  private shoulderMaterial!: THREE.MeshStandardMaterial;
  private barrierMaterial!: THREE.MeshStandardMaterial;
  private neonStripeMaterial!: THREE.MeshBasicMaterial;
  private treeGeom!: THREE.BufferGeometry;
  private treeMat!: THREE.MeshStandardMaterial;
  private rockGeom!: THREE.BufferGeometry;
  private rockMat!: THREE.MeshStandardMaterial;
  private lampGeom!: THREE.BufferGeometry;
  private lampMat!: THREE.MeshStandardMaterial;

  constructor(scene: THREE.Scene, renderer: THREE.WebGLRenderer) {
    this.scene = scene;

    // 1. Atmosphere & Fog
    const horizonColor = 0x090f1d;
    this.scene.background = new THREE.Color(horizonColor);
    this.scene.fog = new THREE.FogExp2(horizonColor, 0.007);

    // 2. Studio Environment Reflections
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 3. Realistic Sunlight & Sky Rig
    this.hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x1e1b4b, 1.1);
    this.hemiLight.position.set(0, 50, 0);
    this.scene.add(this.hemiLight);

    this.dirLight = new THREE.DirectionalLight(0xffedd5, 2.4);
    this.dirLight.position.set(50, 70, 50);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 2048;
    this.dirLight.shadow.mapSize.height = 2048;
    this.dirLight.shadow.camera.near = 10;
    this.dirLight.shadow.camera.far = 220;
    const d = 36;
    this.dirLight.shadow.camera.left = -d;
    this.dirLight.shadow.camera.right = d;
    this.dirLight.shadow.camera.top = d;
    this.dirLight.shadow.camera.bottom = -d;
    this.dirLight.shadow.bias = -0.0005;
    this.dirLight.shadow.normalBias = 0.02;
    this.scene.add(this.dirLight);

    // 4. Initialize Shared Assets
    this.initSharedAssets();

    // 5. Build Road Chunks & Ocean
    this.createScenicOcean();
    this.createRoadChunks(0);
  }

  private initSharedAssets() {
    const roadTexture = this.createRoadTexture();

    this.roadMaterial = new THREE.MeshStandardMaterial({
      map: roadTexture,
      roughness: 0.32,
      metalness: 0.22,
    });

    this.shoulderMaterial = new THREE.MeshStandardMaterial({
      color: 0x1f2430,
      roughness: 0.85,
      metalness: 0.15,
    });

    this.barrierMaterial = new THREE.MeshStandardMaterial({
      color: 0xd1d5db,
      roughness: 0.45,
      metalness: 0.4,
    });

    this.neonStripeMaterial = new THREE.MeshBasicMaterial({
      color: 0x0ea5e9,
    });

    // Reusable Tree Geometry & Material
    this.treeGeom = new THREE.ConeGeometry(2.4, 7.5, 8);
    this.treeMat = new THREE.MeshStandardMaterial({
      color: 0x166534,
      roughness: 0.75,
      metalness: 0.1,
    });

    // Reusable Rock Geometry & Material
    this.rockGeom = new THREE.DodecahedronGeometry(4.5, 1);
    this.rockMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.88,
      metalness: 0.15,
    });

    // Reusable Highway Streetlight Geometry & Material
    this.lampGeom = new THREE.CylinderGeometry(0.12, 0.15, 9, 8);
    this.lampMat = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      metalness: 0.9,
      roughness: 0.3,
    });
  }

  private createRoadTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      // Dark High-Traction Asphalt
      ctx.fillStyle = '#111827';
      ctx.fillRect(0, 0, 512, 1024);

      // Aggregate noise
      ctx.fillStyle = '#1f2937';
      for (let i = 0; i < 5000; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 1024;
        ctx.fillRect(x, y, 2, 2);
      }

      // Left Solid Yellow Line
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(24, 0, 8, 1024);

      // Right Solid White Line
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(480, 0, 8, 1024);

      // 4-Lane Dashed White Lines
      ctx.fillStyle = '#f1f5f9';
      const laneX = [138, 256, 374];
      const dashLength = 80;
      const gapLength = 60;
      for (let y = 0; y < 1024; y += dashLength + gapLength) {
        for (const lx of laneX) {
          ctx.fillRect(lx - 4, y, 8, dashLength);
        }
      }

      // Reflective Cat's Eye Studs
      ctx.fillStyle = '#38bdf8';
      for (let y = 0; y < 1024; y += 140) {
        for (const lx of laneX) {
          ctx.fillRect(lx - 2, y, 4, 6);
        }
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 8);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  private createRoadChunks(startZ: number = 0) {
    // Clear existing chunks if any
    for (const chunk of this.roadChunks) {
      this.scene.remove(chunk);
    }
    this.roadChunks = [];

    // Chunks span from (startZ - chunkLength) to (startZ + (totalChunks - 1) * chunkLength)
    // For startZ = 0: chunk 0 is at -160, chunk 1 is at 0 (RIGHT UNDER THE CAR!), chunk 2 at 160, etc.
    for (let c = 0; c < this.totalChunks; c++) {
      const chunk = new THREE.Group();
      chunk.position.z = startZ - this.chunkLength + c * this.chunkLength;

      // 1. Main Asphalt Surface (Width 22m, 4 full lanes)
      const roadGeom = new THREE.PlaneGeometry(22, this.chunkLength);
      roadGeom.rotateX(-Math.PI / 2);
      const roadMesh = new THREE.Mesh(roadGeom, this.roadMaterial);
      roadMesh.receiveShadow = true;
      chunk.add(roadMesh);

      // 2. Concrete Road Shoulders / Ground
      const groundGeom = new THREE.PlaneGeometry(180, this.chunkLength);
      groundGeom.rotateX(-Math.PI / 2);
      const groundMesh = new THREE.Mesh(groundGeom, this.shoulderMaterial);
      groundMesh.position.y = -0.05;
      groundMesh.receiveShadow = true;
      chunk.add(groundMesh);

      // 3. Guardrails with Post Mounts
      const railGeom = new THREE.BoxGeometry(0.35, 0.75, this.chunkLength);
      const railL = new THREE.Mesh(railGeom, this.barrierMaterial);
      railL.position.set(-11.25, 0.42, 0);
      railL.castShadow = true;
      const railR = new THREE.Mesh(railGeom, this.barrierMaterial);
      railR.position.set(11.25, 0.42, 0);
      railR.castShadow = true;
      chunk.add(railL, railR);

      // Reflector strips on guardrails
      const stripGeom = new THREE.BoxGeometry(0.12, 0.08, this.chunkLength);
      const stripL = new THREE.Mesh(stripGeom, this.neonStripeMaterial);
      stripL.position.set(-11.22, 0.82, 0);
      const stripR = new THREE.Mesh(stripGeom, this.neonStripeMaterial);
      stripR.position.set(11.22, 0.82, 0);
      chunk.add(stripL, stripR);

      // 4. Roadside Scenery built directly into the chunk (Moves seamlessly with chunk!)
      this.populateChunkScenery(chunk);

      // 5. Overhead Highway Gantry on alternate chunks
      if (c % 2 === 1) {
        this.createOverheadGantry(chunk, c);
      }

      this.scene.add(chunk);
      this.roadChunks.push(chunk);
    }
  }

  private populateChunkScenery(chunk: THREE.Group) {
    // 6 Coastal Cypress Trees per chunk
    for (let i = 0; i < 6; i++) {
      const tree = new THREE.Mesh(this.treeGeom, this.treeMat);
      const isRight = i % 2 === 0;
      const x = isRight ? 16 + (i * 3) : -16 - (i * 2);
      const z = (i / 6) * this.chunkLength - this.chunkLength / 2;
      tree.position.set(x, 3.6, z);
      tree.castShadow = true;
      chunk.add(tree);
    }

    // 4 Canyon Rock Outcrops on the right cliff side per chunk
    for (let i = 0; i < 4; i++) {
      const rock = new THREE.Mesh(this.rockGeom, this.rockMat);
      const x = 32 + (i * 4);
      const z = (i / 4) * this.chunkLength - this.chunkLength / 2;
      rock.position.set(x, 4.0, z);
      rock.scale.set(1.5, 1.8, 1.5);
      rock.castShadow = true;
      chunk.add(rock);
    }

    // 2 Streetlights per chunk
    for (let i = 0; i < 2; i++) {
      const lamp = new THREE.Mesh(this.lampGeom, this.lampMat);
      const side = i === 0 ? -12.5 : 12.5;
      const z = i === 0 ? -this.chunkLength * 0.25 : this.chunkLength * 0.25;
      lamp.position.set(side, 4.5, z);
      chunk.add(lamp);
    }
  }

  private createScenicOcean() {
    const oceanGeom = new THREE.PlaneGeometry(400, 1000);
    oceanGeom.rotateX(-Math.PI / 2);

    const oceanMat = new THREE.MeshPhysicalMaterial({
      color: 0x03254c,
      roughness: 0.12,
      metalness: 0.85,
      reflectivity: 0.95,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
    });

    this.oceanMesh = new THREE.Mesh(oceanGeom, oceanMat);
    this.oceanMesh.position.set(-220, -2.5, 200);
    this.oceanMesh.receiveShadow = true;
    this.scene.add(this.oceanMesh);
  }

  private createOverheadGantry(chunk: THREE.Group, chunkIndex: number) {
    const archMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.9,
      roughness: 0.3,
    });

    const archGroup = new THREE.Group();
    archGroup.position.set(0, 0, 0);

    const colGeom = new THREE.BoxGeometry(0.8, 8.5, 0.8);
    const colL = new THREE.Mesh(colGeom, archMat);
    colL.position.set(-12, 4.25, 0);
    colL.castShadow = true;
    const colR = new THREE.Mesh(colGeom, archMat);
    colR.position.set(12, 4.25, 0);
    colR.castShadow = true;
    archGroup.add(colL, colR);

    const beamGeom = new THREE.BoxGeometry(24.8, 0.9, 1.2);
    const beam = new THREE.Mesh(beamGeom, archMat);
    beam.position.set(0, 8.2, 0);
    beam.castShadow = true;
    archGroup.add(beam);

    // High-Resolution Highway Signs
    const signCanvas = document.createElement('canvas');
    signCanvas.width = 512;
    signCanvas.height = 128;
    const sctx = signCanvas.getContext('2d');
    const signs = [
      'PACIFIC COAST HIGHWAY 1 ➔',
      'STARBASE LAUNCH COMPLEX · 2 MI',
      '⚡ TESLA SUPERCHARGER V4 DOCK',
      'PLAID SPEEDWAY · UNLIMITED',
      'CALIFORNIA 101 NORTH · STARLINK',
    ];
    const text = signs[chunkIndex % signs.length];

    if (sctx) {
      sctx.fillStyle = '#064e3b';
      sctx.fillRect(0, 0, 512, 128);
      sctx.lineWidth = 6;
      sctx.strokeStyle = '#ffffff';
      sctx.strokeRect(6, 6, 500, 116);

      sctx.font = 'bold 30px "Space Grotesk", sans-serif';
      sctx.fillStyle = '#ffffff';
      sctx.textAlign = 'center';
      sctx.textBaseline = 'middle';
      sctx.fillText(text, 256, 64);
    }
    const signTexture = new THREE.CanvasTexture(signCanvas);
    signTexture.colorSpace = THREE.SRGBColorSpace;

    const signGeom = new THREE.PlaneGeometry(13, 2.8);
    const signMat = new THREE.MeshBasicMaterial({ map: signTexture });
    const signMesh = new THREE.Mesh(signGeom, signMat);
    signMesh.position.set(0, 8.0, -0.65);
    signMesh.rotation.y = Math.PI;
    archGroup.add(signMesh);

    chunk.add(archGroup);
  }

  public reset(playerZ: number = 0) {
    this.lastPlayerZ = playerZ;
    // Position all chunks cleanly starting behind player and spanning forward
    for (let c = 0; c < this.totalChunks; c++) {
      if (this.roadChunks[c]) {
        this.roadChunks[c].position.z = playerZ - this.chunkLength + c * this.chunkLength;
      }
    }
    if (this.oceanMesh) {
      this.oceanMesh.position.z = playerZ + 200;
    }
  }

  public updateStreaming(playerZ: number) {
    // If player position jumped back (e.g., restart or new game mode), reset cleanly
    if (playerZ < this.lastPlayerZ - 40) {
      this.reset(playerZ);
      return;
    }
    this.lastPlayerZ = playerZ;

    // Keep directional sunlight smoothly centered around player
    this.dirLight.position.z = playerZ + 40;
    this.dirLight.target.position.set(0, 0, playerZ);
    this.dirLight.target.updateMatrixWorld();

    // Move ocean along with player
    if (this.oceanMesh) {
      this.oceanMesh.position.z = playerZ + 200;
    }

    // Stream road chunks seamlessly
    for (const chunk of this.roadChunks) {
      if (chunk.position.z < playerZ - this.chunkLength * 1.5) {
        chunk.position.z += this.totalChunks * this.chunkLength;
      }
    }
  }
}
