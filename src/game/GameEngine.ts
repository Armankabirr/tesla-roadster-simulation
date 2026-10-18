import * as THREE from 'three';
import { RoadsterModel } from './RoadsterModel.ts';
import { Environment } from './Environment.ts';
import { TrafficManager } from './TrafficManager.ts';
import { ParticleSystem } from './ParticleSystem.ts';
import { PoliceInterceptor } from './PoliceInterceptor.ts';
import { Helicopter } from './Helicopter.ts';
import { sound } from '../audio/soundEngine.ts';

export type GameMode = 'chase' | 'freedrive' | 'drag';
export type CameraView = 'chase' | 'cockpit' | 'drone';

export interface DragStats {
  reactionTimeSec: number;
  zeroToSixtySec: number | null;
  zeroToHundredSec: number | null;
  quarterMileSec: number | null;
  quarterMileSpeedMph: number | null;
  peakGForce: number;
}

export interface TelemetryData {
  speedMph: number;
  gear: string;
  rpm: number;
  batteryPct: number;
  thrusterFuelPct: number;
  gForce: number;
  score: number;
  distanceMeters: number;
  multiplier: number;
  nearMissCount: number;
  isPlaidActive: boolean;
  isThrusterActive: boolean;
  cameraView: CameraView;
  fsdVisionActive: boolean;
  gameMode: GameMode;
  dragStats: DragStats;
  dragCountdownState: 'idle' | 'countdown' | 'go' | 'finished';
  dragCountdownStep: number;
  // Pursuit telemetry
  pursuitStatus: 'PURSUIT ACTIVE' | 'EVADING' | 'PURSUIT EVADED';
  closestPoliceDist: number;
  helicopterDist: number;
}

export class GameEngine {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;

  // Subsystems
  public roadster: RoadsterModel;
  public environment: Environment;
  public traffic: TrafficManager;
  public particles: ParticleSystem;
  public police1: PoliceInterceptor;
  public police2: PoliceInterceptor;
  public helicopter: Helicopter;

  // Animation Loop & Timing
  private animationFrameId: number | null = null;
  private lastTime = 0;
  private isRunning = false;
  private isPaused = false;

  // Game States
  public gameMode: GameMode = 'chase';
  public cameraView: CameraView = 'chase';
  public fsdVisionActive = false;

  // Car Kinematics
  public carPos = new THREE.Vector3(0, 0, 0);
  public carVel = new THREE.Vector3(0, 0, 0);
  public speedMph = 0;
  public steerAngle = 0;
  public hoverHeight = 0;
  public hoverVelocity = 0;
  public isAirborne = false;

  // Car Resources
  public batteryPct = 100;
  public thrusterFuelPct = 100;
  public score = 0;
  public distanceMeters = 0;
  public multiplier = 1.0;
  public nearMissCount = 0;

  // Drag Mode Variables
  public dragCountdownState: 'idle' | 'countdown' | 'go' | 'finished' = 'idle';
  public dragCountdownStep = 0;
  private dragStartTime = 0;
  private launchReactStartTime = 0;
  public dragStats: DragStats = {
    reactionTimeSec: 0,
    zeroToSixtySec: null,
    zeroToHundredSec: null,
    quarterMileSec: null,
    quarterMileSpeedMph: null,
    peakGForce: 0,
  };

  // Input states
  public inputs = {
    throttle: false,
    brake: false,
    left: false,
    right: false,
    thruster: false,
  };

  // Scratch Math Helpers (Zero GC in loop)
  private _targetCamPos = new THREE.Vector3();
  private _targetCamLookAt = new THREE.Vector3();
  private _carBox = new THREE.Box3();
  private _orbitAngle = 0;

  // Callbacks
  public onTelemetryUpdate?: (data: TelemetryData) => void;
  public onGameOver?: (reason: string, finalScore: number, distanceM: number, topSpeed: number) => void;

  private topSpeedRecorded = 0;

  constructor(container: HTMLElement) {
    this.container = container;

    // 1. Initialize Renderer with ACES ToneMapping & SRGB
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(this.renderer.domElement);

    // 2. Initialize Scene & Camera
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      65,
      container.clientWidth / container.clientHeight,
      0.1,
      800
    );
    this.camera.position.set(0, 3.5, -8);
    this.camera.lookAt(0, 1.2, 5);

    // 3. Initialize Procedural Systems
    this.roadster = new RoadsterModel('white');
    this.scene.add(this.roadster.group);

    this.environment = new Environment(this.scene, this.renderer);
    this.traffic = new TrafficManager(this.scene);
    this.particles = new ParticleSystem();
    this.scene.add(this.particles.group);

    // Police Chase Units
    this.police1 = new PoliceInterceptor('interceptor-alpha', -30, -3.5);
    this.police2 = new PoliceInterceptor('interceptor-bravo', -45, 3.5);
    this.helicopter = new Helicopter(-20);
    this.scene.add(this.police1.group);
    this.scene.add(this.police2.group);
    this.scene.add(this.helicopter.group);

    // Pre-warm shaders
    this.renderer.compile(this.scene, this.camera);

    // Window Resize Listener
    window.addEventListener('resize', this.handleResize);

    // Key Listeners
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.handleBlur);
  }

  private handleResize = () => {
    if (!this.container || !this.renderer) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  private handleKeyDown = (e: KeyboardEvent) => {
    // Avoid interfering if user is typing in an input
    if ((e.target as HTMLElement)?.tagName === 'INPUT') return;

    sound.resume();

    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.inputs.throttle = true;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.inputs.brake = true;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.inputs.left = true;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.inputs.right = true;
        break;
      case 'Space':
        e.preventDefault();
        this.inputs.thruster = true;
        break;
      case 'KeyC':
        this.cycleCamera();
        break;
      case 'KeyF':
        this.toggleFSDVision();
        break;
      case 'KeyM':
        sound.toggleMute();
        break;
    }
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.inputs.throttle = false;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.inputs.brake = false;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.inputs.left = false;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.inputs.right = false;
        break;
      case 'Space':
        this.inputs.thruster = false;
        break;
    }
  };

  private handleBlur = () => {
    // Clear held keys on blur to prevent sticking
    this.inputs.throttle = false;
    this.inputs.brake = false;
    this.inputs.left = false;
    this.inputs.right = false;
    this.inputs.thruster = false;
  };

  public cycleCamera() {
    if (this.cameraView === 'chase') this.cameraView = 'cockpit';
    else if (this.cameraView === 'cockpit') this.cameraView = 'drone';
    else this.cameraView = 'chase';
  }

  public setCameraView(view: CameraView) {
    this.cameraView = view;
  }

  public toggleFSDVision() {
    this.fsdVisionActive = !this.fsdVisionActive;
  }

  public start(mode: GameMode = 'chase') {
    this.gameMode = mode;
    this.resetCar();
    this.isRunning = true;
    this.isPaused = false;
    this.lastTime = performance.now();

    sound.init();
    sound.resume();

    if (mode === 'chase') {
      // 1. Police Chase Mode: Traffic + 2 Cruisers + 1 Chopper
      this.traffic.spawnInitialTraffic(this.carPos.z, 12);
      this.police1.group.visible = true;
      this.police2.group.visible = true;
      this.helicopter.group.visible = true;
      this.police1.resetPosition(this.carPos.z, -3.5, -28);
      this.police2.resetPosition(this.carPos.z, 3.5, -42);
      this.helicopter.resetPosition(this.carPos.z);
    } else if (mode === 'freedrive') {
      // 2. Normal Driving Mode: Traffic only in realistic environment (No Police)
      this.traffic.spawnInitialTraffic(this.carPos.z, 14);
      this.police1.group.visible = false;
      this.police2.group.visible = false;
      this.helicopter.group.visible = false;
      sound.updatePursuitAudio(999, 999);
    } else if (mode === 'drag') {
      // 3. 0-60 Drag Strip Mode
      this.traffic.clearAll();
      this.police1.group.visible = false;
      this.police2.group.visible = false;
      this.helicopter.group.visible = false;
      sound.updatePursuitAudio(999, 999);
      this.startDragCountdown();
    }

    if (!this.animationFrameId) {
      this.tick();
    }
  }

  public pause() {
    this.isPaused = true;
  }

  public resume() {
    this.isPaused = false;
    this.lastTime = performance.now();
  }

  public resetCar() {
    this.carPos.set(0, 0, 0);
    this.carVel.set(0, 0, 0);
    this.speedMph = 0;
    this.steerAngle = 0;
    this.hoverHeight = 0;
    this.hoverVelocity = 0;
    this.isAirborne = false;
    this.batteryPct = 100;
    this.thrusterFuelPct = 100;
    this.score = 0;
    this.distanceMeters = 0;
    this.multiplier = 1.0;
    this.nearMissCount = 0;
    this.topSpeedRecorded = 0;
    this.roadster.group.position.set(0, 0, 0);
    this.roadster.group.rotation.set(0, 0, 0);
    this.environment.reset(0);
  }

  public setCarColor(colorId: string) {
    this.roadster.setColor(colorId);
  }

  private startDragCountdown() {
    this.dragCountdownState = 'countdown';
    this.dragCountdownStep = 3;
    this.dragStats = {
      reactionTimeSec: 0,
      zeroToSixtySec: null,
      zeroToHundredSec: null,
      quarterMileSec: null,
      quarterMileSpeedMph: null,
      peakGForce: 0,
    };

    sound.playCountdownBeep(false);

    const stepInterval = window.setInterval(() => {
      this.dragCountdownStep--;
      if (this.dragCountdownStep > 0) {
        sound.playCountdownBeep(false);
      } else if (this.dragCountdownStep === 0) {
        sound.playCountdownBeep(true);
        this.dragCountdownState = 'go';
        this.dragStartTime = performance.now();
        this.launchReactStartTime = performance.now();
        clearInterval(stepInterval);
      }
    }, 1000);
  }

  private tick = () => {
    this.animationFrameId = requestAnimationFrame(this.tick);

    const now = performance.now();
    const rawDt = (now - this.lastTime) / 1000;
    this.lastTime = now;
    const dt = Math.min(rawDt, 0.05); // Frame delta clamp

    if (this.isRunning && !this.isPaused) {
      this.updatePhysics(dt);
      this.updateGameLogic(dt);
    } else if (!this.isRunning) {
      // Idle showcase mode: smooth cinematic camera rotation around car
      this._orbitAngle += 0.4 * dt;
      const radius = 7.5;
      this.camera.position.set(
        Math.sin(this._orbitAngle) * radius,
        2.4 + Math.sin(this._orbitAngle * 0.5) * 0.5,
        Math.cos(this._orbitAngle) * radius
      );
      this.camera.lookAt(0, 0.8, 0);
    }

    this.renderer.render(this.scene, this.camera);
  };

  private updatePhysics(dt: number) {
    // In Drag mode before green light, don't allow forward motion
    if (this.gameMode === 'drag' && this.dragCountdownState === 'countdown') {
      if (this.inputs.throttle) {
        // Rev motor sound
        sound.updateTelemetry(15, true, false, false);
      }
      return;
    }

    const isThrusterBoost = this.inputs.thruster && this.thrusterFuelPct > 0;

    // 1. Longitudinal Acceleration (0-60 in <1s Tesla Plaid + SpaceX thrusters)
    let accel = 0;
    const maxNormalSpeed = 250;
    const maxBoostSpeed = 320;
    const maxSpeed = isThrusterBoost ? maxBoostSpeed : maxNormalSpeed;

    if (this.inputs.throttle) {
      // Plaid sub-1-second torque profile
      const lowSpeedBoost = this.speedMph < 80 ? 45 : 22;
      accel = lowSpeedBoost;
      if (isThrusterBoost) {
        accel += this.gameMode === 'drag' ? 80 : 55; // Massive SpaceX cold gas thrust!
        this.thrusterFuelPct = Math.max(0, this.thrusterFuelPct - 20 * dt);
      }
      this.batteryPct = Math.max(0, this.batteryPct - 0.45 * dt);
    } else if (isThrusterBoost) {
      // Thruster boost active without gas pedal still accelerates forward
      accel = this.gameMode === 'drag' ? 65 : 45;
      this.thrusterFuelPct = Math.max(0, this.thrusterFuelPct - 20 * dt);
    } else if (this.inputs.brake) {
      accel = -55; // Regenerative + Carbon Ceramic brakes
    } else {
      // Natural rolling resistance and aerodynamic drag
      accel = -12 * (this.speedMph / maxNormalSpeed);
    }

    this.speedMph = Math.max(0, Math.min(maxSpeed, this.speedMph + accel * dt));

    if (this.speedMph > this.topSpeedRecorded) {
      this.topSpeedRecorded = this.speedMph;
    }

    // 2. Lateral Steering Kinematics
    const maxSteer = 0.55;
    const steerSpeed = 3.5;
    if (this.inputs.left) {
      this.steerAngle = Math.max(-maxSteer, this.steerAngle - steerSpeed * dt);
    } else if (this.inputs.right) {
      this.steerAngle = Math.min(maxSteer, this.steerAngle + steerSpeed * dt);
    } else {
      this.steerAngle = THREE.MathUtils.damp(this.steerAngle, 0, 8, dt);
    }

    // Lateral displacement based on speed and steer angle
    const lateralSpeed = this.speedMph * 0.447 * Math.sin(this.steerAngle) * 0.9;
    this.carPos.x -= lateralSpeed * dt;

    // Highway boundaries (-10.5m to 10.5m)
    if (this.carPos.x < -10.5) {
      this.carPos.x = -10.5;
      this.particles.emitSparks(this.carPos, 15);
      sound.playCrash();
    } else if (this.carPos.x > 10.5) {
      this.carPos.x = 10.5;
      this.particles.emitSparks(this.carPos, 15);
      sound.playCrash();
    }

    // 3. SpaceX Thrusters & Vertical Kinematics per mode:
    if (this.gameMode === 'drag') {
      // Mode 3 (0-60 Drag Strip):
      // Firmly grounded on track tarmac for maximum launch traction
      this.hoverHeight = 0;
      this.hoverVelocity = 0;
      this.isAirborne = false;
      if (isThrusterBoost && this.speedMph > 20 && Math.random() < 0.08) {
        sound.playSonicBoom();
      }
    } else {
      // Mode 1 (Police Chase) & Mode 2 (Scenic Free Drive):
      // SpaceX Cold-Gas Thrusters allow thrilling hover flight!
      // Tuned to fly higher as requested (up to 4.8m in chase, 3.8m in freedrive)
      const maxFlightHeight = this.gameMode === 'chase' ? 4.8 : 3.8;

      if (this.inputs.thruster && this.thrusterFuelPct > 0) {
        if (this.hoverHeight < maxFlightHeight) {
          this.hoverVelocity += 28 * dt; // Cold-gas rocket lift
          if (this.hoverHeight < 0.1) {
            sound.playSonicBoom();
          }
        } else {
          // Hover ceiling damping
          this.hoverVelocity = Math.min(this.hoverVelocity, 0);
        }
        this.thrusterFuelPct = Math.max(0, this.thrusterFuelPct - 18 * dt);
      } else {
        // Natural aerodynamic glide & gravity return to road
        this.hoverVelocity -= 34 * dt;
      }

      this.hoverHeight += this.hoverVelocity * dt;
      if (this.hoverHeight <= 0) {
        this.hoverHeight = 0;
        this.hoverVelocity = 0;
        this.isAirborne = false;
      } else if (this.hoverHeight > maxFlightHeight) {
        this.hoverHeight = maxFlightHeight;
        this.hoverVelocity = Math.min(this.hoverVelocity, 0);
        this.isAirborne = true;
      } else {
        this.isAirborne = true;
      }
    }

    // 4. Forward Translation (mph to meters per sec)
    const forwardMs = this.speedMph * 0.447;
    this.carPos.z += forwardMs * dt;
    this.distanceMeters += forwardMs * dt;

    // 5. Update Car Mesh Transform
    this.roadster.group.position.set(this.carPos.x, this.carPos.y + this.hoverHeight, this.carPos.z);

    // Car body roll & pitch dynamics
    const targetRoll = -this.steerAngle * 0.28;
    const targetPitch = this.inputs.throttle ? -0.04 : this.inputs.brake ? 0.05 : 0;
    this.roadster.group.rotation.z = THREE.MathUtils.damp(this.roadster.group.rotation.z, targetRoll, 10, dt);
    this.roadster.group.rotation.x = THREE.MathUtils.damp(this.roadster.group.rotation.x, targetPitch, 8, dt);
    this.roadster.group.rotation.y = THREE.MathUtils.damp(this.roadster.group.rotation.y, this.steerAngle * 0.35, 12, dt);

    // Update Roadster sub-components animation
    this.roadster.updateAnimation(
      this.speedMph,
      this.steerAngle,
      this.inputs.brake,
      isThrusterBoost,
      this.hoverHeight,
      dt
    );

    // 6. Particles & Audio
    this.particles.emitThrusterPlume(this.carPos, isThrusterBoost, dt);
    this.particles.updateWarpLines(this.carPos.z, this.speedMph, dt);
    this.particles.updateSparks(dt);

    const isDrifting = Math.abs(this.steerAngle) > 0.4 && this.speedMph > 60;
    sound.updateTelemetry(this.speedMph, this.inputs.throttle, isThrusterBoost, isDrifting);
  }

  private updateGameLogic(dt: number) {
    // 1. Environment Streaming
    this.environment.updateStreaming(this.carPos.z);

    // 2. Traffic & Powerups in Chase and Normal Free Drive Modes
    if (this.gameMode === 'chase' || this.gameMode === 'freedrive') {
      this.traffic.update(this.carPos.z, dt, () => {
        // On near miss: award points and boost multiplier
        this.nearMissCount++;
        this.multiplier = Math.min(4.0, this.multiplier + 0.2);
        this.score += Math.floor(250 * this.multiplier);
      });

      // Score grows continuously based on speed & multiplier
      this.score += Math.floor(this.speedMph * 0.5 * this.multiplier * dt);

      // Check Collision with Traffic Cars
      this._carBox.setFromObject(this.roadster.group);

      // If Roadster is hovering high (> 1.8m), it clears cars!
      const canJumpOver = this.hoverHeight > 1.8;

      for (const car of this.traffic.cars) {
        if (!canJumpOver && this._carBox.intersectsBox(car.boundingBox)) {
          this.handleCrash(car);
          break;
        }
      }

      // Check Collection of Batteries & Thruster Tanks
      for (const item of this.traffic.collectibles) {
        if (!item.collected && this._carBox.intersectsBox(item.boundingBox)) {
          item.collected = true;
          if (item.type === 'battery') {
            this.batteryPct = Math.min(100, this.batteryPct + 35);
            this.score += 500;
            sound.playBatteryPickup();
          } else {
            this.thrusterFuelPct = Math.min(100, this.thrusterFuelPct + 50);
            this.score += 800;
            sound.playRocketPickup();
          }
          this.particles.emitSparks(item.group.position, 20);
        }
      }

      // In Normal Free Drive, battery & thrusters automatically replenish for stress-free cruising!
      if (this.gameMode === 'freedrive') {
        this.batteryPct = 100;
        this.thrusterFuelPct = Math.min(100, this.thrusterFuelPct + 15 * dt);
      } else if (this.gameMode === 'chase' && this.batteryPct <= 0) {
        this.endGame('BATTERY DEPLETED');
      }
    }

    // 3. Police Chase & Helicopter AI Updates (ONLY in Chase Mode)
    let closestPoliceDist = 999;
    let chopperDist = 999;
    let pursuitStatus: 'PURSUIT ACTIVE' | 'EVADING' | 'PURSUIT EVADED' = 'PURSUIT ACTIVE';

    if (this.gameMode === 'chase') {
      this.police1.update(this.carPos, this.speedMph, 'tail', dt);
      this.police2.update(this.carPos, this.speedMph, 'flank', dt);
      this.helicopter.update(this.carPos, this.speedMph, dt);

      // Proximity calculations
      const distP1 = Math.abs(this.police1.group.position.z - this.carPos.z);
      const distP2 = Math.abs(this.police2.group.position.z - this.carPos.z);
      closestPoliceDist = Math.round(Math.min(distP1, distP2));
      chopperDist = Math.round(this.helicopter.group.position.distanceTo(this.carPos));

      // Pursuit Audio modulation
      sound.updatePursuitAudio(closestPoliceDist, chopperDist);

      // Check Collision with Police Cruisers
      this._carBox.setFromObject(this.roadster.group);
      const canJumpOver = this.hoverHeight > 1.8;

      if (!canJumpOver) {
        if (this._carBox.intersectsBox(this.police1.boundingBox)) {
          this.handlePoliceCrash(this.police1);
        } else if (this._carBox.intersectsBox(this.police2.boundingBox)) {
          this.handlePoliceCrash(this.police2);
        }
      }

      // Pursuit Status logic
      if (closestPoliceDist > 95 && this.speedMph > 180) {
        pursuitStatus = 'PURSUIT EVADED';
        this.score += Math.floor(35 * dt); // Bonus for shaking pursuit!
      } else if (this.speedMph > 160 && closestPoliceDist > 50) {
        pursuitStatus = 'EVADING';
      } else {
        pursuitStatus = 'PURSUIT ACTIVE';
      }
    } else {
      // In Free Drive or Drag, silence police siren & chopper audio
      sound.updatePursuitAudio(999, 999);
    }

    // 4. Drag Mode Logic
    if (this.gameMode === 'drag' && this.dragCountdownState === 'go') {
      const elapsedSec = (performance.now() - this.dragStartTime) / 1000;

      // Reaction time
      if (this.inputs.throttle && this.dragStats.reactionTimeSec === 0) {
        this.dragStats.reactionTimeSec = parseFloat(elapsedSec.toFixed(3));
      }

      // 0-60 mph timing
      if (this.speedMph >= 60 && this.dragStats.zeroToSixtySec === null) {
        this.dragStats.zeroToSixtySec = parseFloat(elapsedSec.toFixed(2));
      }

      // 0-100 mph timing
      if (this.speedMph >= 100 && this.dragStats.zeroToHundredSec === null) {
        this.dragStats.zeroToHundredSec = parseFloat(elapsedSec.toFixed(2));
      }

      // 1/4 Mile (402 meters)
      if (this.distanceMeters >= 402 && this.dragStats.quarterMileSec === null) {
        this.dragStats.quarterMileSec = parseFloat(elapsedSec.toFixed(2));
        this.dragStats.quarterMileSpeedMph = Math.round(this.speedMph);
        this.dragCountdownState = 'finished';
        sound.playSonicBoom();
      }

      // Peak G-Force calculation
      const currentG = (this.speedMph * 0.447) / Math.max(0.1, elapsedSec) / 9.81;
      if (currentG > this.dragStats.peakGForce) {
        this.dragStats.peakGForce = parseFloat(currentG.toFixed(2));
      }
    }

    // 5. Dynamic Camera Following with Exponential Damping
    this.updateCamera(dt);

    // 6. Telemetry update to React
    if (this.onTelemetryUpdate) {
      const isThrusterBoost = this.inputs.thruster && this.thrusterFuelPct > 0;
      const gForce = Math.max(0.2, (this.speedMph / 60) * 1.4);

      this.onTelemetryUpdate({
        speedMph: Math.round(this.speedMph),
        gear: this.speedMph > 200 ? 'PLAID' : this.speedMph > 80 ? 'D2' : 'D1',
        rpm: Math.round(this.speedMph * 80),
        batteryPct: Math.round(this.batteryPct),
        thrusterFuelPct: Math.round(this.thrusterFuelPct),
        gForce: parseFloat(gForce.toFixed(2)),
        score: this.score,
        distanceMeters: Math.round(this.distanceMeters),
        multiplier: parseFloat(this.multiplier.toFixed(1)),
        nearMissCount: this.nearMissCount,
        isPlaidActive: this.speedMph > 160,
        isThrusterActive: isThrusterBoost,
        cameraView: this.cameraView,
        fsdVisionActive: this.fsdVisionActive,
        gameMode: this.gameMode,
        dragStats: this.dragStats,
        dragCountdownState: this.dragCountdownState,
        dragCountdownStep: this.dragCountdownStep,
        pursuitStatus,
        closestPoliceDist,
        helicopterDist: chopperDist,
      });
    }
  }

  private handlePoliceCrash(police: PoliceInterceptor) {
    this.particles.emitSparks(this.carPos, 50);
    sound.playCrash();

    // Deduct battery and slow down
    this.speedMph = Math.max(30, this.speedMph * 0.4);
    this.batteryPct = Math.max(0, this.batteryPct - 20);
    this.multiplier = 1.0;

    // Push police car slightly back
    police.group.position.z -= 15;
    police.speedMph = Math.max(40, police.speedMph * 0.5);

    if (this.batteryPct <= 0) {
      this.endGame('BUSTED // VEHICLE DISABLED');
    }
  }

  private handleCrash(car: import('./TrafficManager.ts').TrafficCar) {
    this.particles.emitSparks(this.carPos, 45);
    sound.playCrash();

    // Deduct battery and score, push car back
    this.speedMph = Math.max(20, this.speedMph * 0.3);
    this.batteryPct = Math.max(0, this.batteryPct - 25);
    this.multiplier = 1.0;

    // Push away
    car.group.position.x += car.group.position.x > this.carPos.x ? 3 : -3;

    if (this.batteryPct <= 0) {
      this.endGame('CRITICAL COLLISION');
    }
  }

  private updateCamera(dt: number) {
    // Dynamic FOV widening during warp speeds
    const targetFov = 65 + Math.min(25, (this.speedMph / 250) * 22);
    this.camera.fov = THREE.MathUtils.damp(this.camera.fov, targetFov, 6, dt);
    this.camera.updateProjectionMatrix();

    if (this.cameraView === 'chase') {
      const chaseDistance = 7.2 + (this.speedMph / 250) * 2.0;
      const chaseHeight = 2.4 + (this.hoverHeight * 0.4);

      this._targetCamPos.set(
        this.carPos.x * 0.75,
        this.carPos.y + chaseHeight,
        this.carPos.z - chaseDistance
      );
      this._targetCamLookAt.set(
        this.carPos.x,
        this.carPos.y + 1.2 + this.hoverHeight * 0.8,
        this.carPos.z + 14
      );

      // Smooth exponential damping
      this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, this._targetCamPos.x, 9, dt);
      this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, this._targetCamPos.y, 9, dt);
      this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, this._targetCamPos.z, 14, dt);
      this.camera.lookAt(this._targetCamLookAt);
    } else if (this.cameraView === 'cockpit') {
      // Driver seat / hood camera
      this._targetCamPos.set(
        this.carPos.x,
        this.carPos.y + 0.95 + this.hoverHeight,
        this.carPos.z + 0.3
      );
      this._targetCamLookAt.set(
        this.carPos.x + this.steerAngle * 2.5,
        this.carPos.y + 1.0 + this.hoverHeight,
        this.carPos.z + 30
      );

      this.camera.position.copy(this._targetCamPos);
      this.camera.lookAt(this._targetCamLookAt);
    } else if (this.cameraView === 'drone') {
      // High-angle helicopter/drone view
      this._targetCamPos.set(
        this.carPos.x - 4,
        this.carPos.y + 8.5 + this.hoverHeight,
        this.carPos.z - 11
      );
      this._targetCamLookAt.set(
        this.carPos.x,
        this.carPos.y + this.hoverHeight,
        this.carPos.z + 8
      );

      this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, this._targetCamPos.x, 5, dt);
      this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, this._targetCamPos.y, 5, dt);
      this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, this._targetCamPos.z, 8, dt);
      this.camera.lookAt(this._targetCamLookAt);
    }
  }

  public endGame(reason: string) {
    this.isRunning = false;
    if (this.onGameOver) {
      this.onGameOver(reason, this.score, Math.round(this.distanceMeters), Math.round(this.topSpeedRecorded));
    }
  }

  public dispose() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('blur', this.handleBlur);

    sound.dispose();
    this.traffic.clearAll();
    this.renderer.dispose();

    if (this.container && this.renderer.domElement) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
