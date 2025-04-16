// game.js
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Terrain } from './terrain.js';
import { Player } from './player.js';
import { Enemy } from './enemy.js';
import { Projectile } from './projectile.js';
import { UI } from './ui.js';
import { DeviceController } from './deviceController.js';

export class Game {
  constructor(container, isMobile) {
    // Mouse look Euler angles
    this.eulerX = 0; // Pitch (up/down)
    this.eulerY = 0; // Yaw (left/right)
    // Increase mouse sensitivity
    this.rotateSpeed = 0.01;
    this.container = container;
    this.isMobile = isMobile;
    this.players = [];
    this.enemies = [];
    this.projectiles = [];
    this.currentProjectile = null;
    this.currentTurn = 0;
    this.isPlayerTurn = true;
    this.windStrength = Math.random() * 10 - 5; // Between -5 and 5
    this.shotInProgress = false;
    this.quality = isMobile ? 'low' : 'high'; // Quality setting for performance

    // FPS Controls
    this.moveForward = false;
    this.moveBackward = false;
    this.moveLeft = false;
    this.moveRight = false;
    this.canMove = true;
    this.moveSpeed = 0.15;
    this.rotateSpeed = 0.002;
    this.fpsCameraActive = true;

    // Mouse controls
    this.mouseX = 0;
    this.mouseY = 0;
    this.targetTurretAngle = 0;
    this.targetElevation = 0.2;

    // Performance monitoring
    this.fpsCounter = { value: 0, frames: 0, lastTime: performance.now() };

    this.setupScene();
    this.setupLights();
    this.setupCamera();
    this.setupControls();
    this.createTerrain();
    this.spawnTanks();
    this.setupUI();
    this.setupDeviceController();
    this.setupEventListeners();
    this.setupResizeHandler();
  }

  setupScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87CEEB); // Sky blue

    // Adjust fog based on device performance
    const fogDistance = this.quality === 'low' ? 300 : 500;
    this.scene.fog = new THREE.Fog(0x87CEEB, 100, fogDistance);

    // Setup renderer with appropriate settings
    this.renderer = new THREE.WebGLRenderer({
      antialias: this.quality !== 'low',
      powerPreference: 'high-performance'
    });

    this.renderer.setPixelRatio(this.isMobile ? Math.min(window.devicePixelRatio, 2) : window.devicePixelRatio);
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.shadowMap.enabled = this.quality !== 'low';
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Add stats if in development mode
    this.showPerformanceStats = false;

    this.container.appendChild(this.renderer.domElement);
  }

  setupLights() {
    // Ambient light for general illumination
    const ambientLight = new THREE.AmbientLight(0xcccccc, 0.4);
    this.scene.add(ambientLight);

    // Directional light for shadows
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 1, 0.5).normalize();

    // Only enable shadows on high-quality settings
    if (this.quality !== 'low') {
      directionalLight.castShadow = true;
      directionalLight.shadow.mapSize.width = this.isMobile ? 512 : 1024;
      directionalLight.shadow.mapSize.height = this.isMobile ? 512 : 1024;
      directionalLight.shadow.camera.near = 0.5;
      directionalLight.shadow.camera.far = 500;
      directionalLight.shadow.camera.left = -100;
      directionalLight.shadow.camera.right = 100;
      directionalLight.shadow.camera.top = 100;
      directionalLight.shadow.camera.bottom = -100;
    }

    this.scene.add(directionalLight);
  }

  setupCamera() {
    const aspectRatio = this.container.clientWidth / this.container.clientHeight;

    this.camera = new THREE.PerspectiveCamera(
      this.isMobile ? 70 : 75, // Wider FOV for first-person
      aspectRatio,
      0.1,
      1000
    );

    this.camera.position.set(0, 2, 0); // Will be updated when tank is positioned
    this.camera.lookAt(0, 2, 5);
  }

  setupResizeHandler() {
    const handleResize = () => {
      const width = this.container.clientWidth;
      const height = this.container.clientHeight;

      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);

      // Update UI for new dimensions
      this.ui.handleResize(width, height);
    };

    window.addEventListener('resize', handleResize);

    // Also handle device orientation change for mobile
    if (this.isMobile) {
      window.addEventListener('orientationchange', () => {
        // Small delay to ensure dimensions have updated
        setTimeout(handleResize, 200);
      });
    }
  }

  setupControls() {
    // OrbitControls are now only used for debugging
    this.orbitControls = new OrbitControls(this.camera, this.renderer.domElement);
    this.orbitControls.enableDamping = true;
    this.orbitControls.dampingFactor = 0.05;
    this.orbitControls.maxPolarAngle = Math.PI / 2 - 0.1;
    this.orbitControls.enabled = false; // Disabled by default

    // Lock pointer for FPS controls (will be requested when game starts)
    this.pointerLocked = false;
  }

  createTerrain() {
    // Pass quality setting to terrain for LOD adjustments
    this.terrain = new Terrain(this.scene, this.quality);
  }

  spawnTanks() {
    // Player tank
    const playerX = -40 + Math.random() * 20;
    const playerZ = -40 + Math.random() * 20;
    const playerY = this.terrain.getHeightAt(playerX, playerZ) + 1;

    this.player = new Player(this.scene, new THREE.Vector3(playerX, playerY, playerZ));
    this.players.push(this.player);

    // Enemy tanks (2-3) - fewer on mobile for performance
    const numEnemies = this.isMobile ? 2 : (2 + Math.floor(Math.random()));
    for (let i = 0; i < numEnemies; i++) {
      const enemyX = 20 + Math.random() * 40;
      const enemyZ = -40 + Math.random() * 80;
      const enemyY = this.terrain.getHeightAt(enemyX, enemyZ) + 1;

      const enemy = new Enemy(this.scene, new THREE.Vector3(enemyX, enemyY, enemyZ));
      this.enemies.push(enemy);
    }

    // Set camera to first person view
    this.updateCameraToFirstPersonView();
  }

  updateCameraToFirstPersonView() {
    // Position camera at the player's "head" position (above turret)
    const tankPosition = this.player.getTankPosition();
    
    // Set camera at turret height (plus a bit for "head" height)
    this.camera.position.set(
      tankPosition.x,
      tankPosition.y + 1.8, // Slightly above the tank turret
      tankPosition.z
    );
    
    // Initialize euler angles based on tank's turret orientation
    this.eulerY = this.player.turretAngle; // Set initial yaw to match turret
    this.eulerX = 0; // Start looking straight ahead
    
    // Apply initial rotation
    const quaternion = new THREE.Quaternion();
    quaternion.setFromEuler(new THREE.Euler(this.eulerX, this.eulerY, 0, 'YXZ'));
    this.camera.quaternion.copy(quaternion);
    
    // Update player turret to match camera direction
    this.player.rotateTurret(0); // Set initial turret rotation
  }

  // Update this method in game.js

  updateCameraFromControls() {
    if (!this.fpsCameraActive) return;

    // Get the player's position
    const tankPosition = this.player.getTankPosition();

    // Movement - WASD controls
    if (this.canMove) {
      // Calculate movement direction relative to camera orientation
      const moveDirection = new THREE.Vector3();

      if (this.moveForward) moveDirection.z -= this.moveSpeed;
      if (this.moveBackward) moveDirection.z += this.moveSpeed;
      if (this.moveLeft) moveDirection.x -= this.moveSpeed;
      if (this.moveRight) moveDirection.x += this.moveSpeed;

      // Only apply movement if there is any
      if (moveDirection.length() > 0) {
        // Get camera's forward and right vectors (ignoring pitch)
        const cameraDirection = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
        cameraDirection.y = 0; // Keep movement on XZ plane
        cameraDirection.normalize();

        const cameraRight = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion);
        cameraRight.y = 0; // Keep movement on XZ plane
        cameraRight.normalize();

        // Combine vectors for movement
        const movement = new THREE.Vector3();
        if (this.moveForward || this.moveBackward) {
          movement.addScaledVector(cameraDirection, this.moveForward ? this.moveSpeed : -this.moveSpeed);
        }
        if (this.moveLeft || this.moveRight) {
          movement.addScaledVector(cameraRight, this.moveRight ? this.moveSpeed : -this.moveSpeed);
        }

        // Apply movement
        let newX = tankPosition.x + movement.x;
        let newZ = tankPosition.z + movement.z;

        // Check map boundaries
        newX = Math.max(-50, Math.min(50, newX));
        newZ = Math.max(-50, Math.min(50, newZ));

        // Get height at new position
        const newY = this.terrain.getHeightAt(newX, newZ) + 1;

        // Move player
        this.player.body.position.set(newX, newY, newZ);

        // Update camera height
        this.camera.position.y = newY + 1.8;
      }
    }

    // Always update camera position to follow player
    const tankPos = this.player.getTankPosition();
    this.camera.position.x = tankPos.x;
    this.camera.position.z = tankPos.z;

    // Extract turret direction from camera orientation
    const cameraDirection = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);

    // Calculate turret angle (yaw) from camera direction
    const turretAngle = Math.atan2(cameraDirection.x, cameraDirection.z);

    // Calculate elevation angle (pitch) from camera direction
    // Invert because the turret elevation works opposite to the camera pitch
    const verticalAngle = -Math.asin(cameraDirection.y);
    const clampedElevation = Math.max(0, Math.min(Math.PI / 3, verticalAngle));

    // Update player turret to match camera direction
    this.player.turretAngle = turretAngle;
    this.player.turretPivot.rotation.y = turretAngle;
    this.player.elevation = clampedElevation;
    this.player.elevationPivot.rotation.x = -clampedElevation;
  }

  setupUI() {
    this.ui = new UI(this.container, this.isMobile);
  }
  // Add this to the game.js file in the setupDeviceController method

  setupDeviceController() {
    this.controller = new DeviceController(this.container, this.isMobile);

    // Setup callback for controller events
    this.controller.onAction = (actionType, actionData) => {
      if (!this.isPlayerTurn || this.shotInProgress) return;

      switch (actionType) {
        case 'fire':
          this.fireProjectile();
          break;
        case 'rotate':
          this.player.rotateTurret(actionData.amount);
          break;
        case 'elevate':
          this.player.adjustElevation(actionData.amount);
          break;
        case 'look':
          // Handle mobile look controls similar to mouse movement
          this.eulerY -= actionData.x;
          this.eulerX -= actionData.y;

          // Clamp vertical rotation to prevent flipping
          const maxPitch = Math.PI / 2 - 0.1;
          const minPitch = -Math.PI / 2 + 0.1;
          this.eulerX = Math.max(minPitch, Math.min(maxPitch, this.eulerX));

          // Apply rotation to camera using quaternion
          const quaternion = new THREE.Quaternion();
          quaternion.setFromEuler(new THREE.Euler(this.eulerX, this.eulerY, 0, 'YXZ'));
          this.camera.quaternion.copy(quaternion);
          break;
        case 'power':
          if (actionData.increase) {
            this.player.increasePower();
          } else {
            this.player.decreasePower();
          }
          this.ui.updatePowerMeter(this.player.getPower());
          break;
        case 'move':
          // Handle mobile movement controls
          if (this.canMove) {
            // Get camera's forward and right vectors (ignoring pitch)
            const cameraDirection = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
            cameraDirection.y = 0; // Keep movement on XZ plane
            cameraDirection.normalize();

            const cameraRight = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion);
            cameraRight.y = 0; // Keep movement on XZ plane
            cameraRight.normalize();

            // Calculate movement based on joystick
            const movement = new THREE.Vector3();
            movement.addScaledVector(cameraDirection, -actionData.y * this.moveSpeed);
            movement.addScaledVector(cameraRight, actionData.x * this.moveSpeed);

            // Get current position
            const tankPosition = this.player.getTankPosition();

            // Apply movement
            let newX = tankPosition.x + movement.x;
            let newZ = tankPosition.z + movement.z;

            // Check map boundaries
            newX = Math.max(-50, Math.min(50, newX));
            newZ = Math.max(-50, Math.min(50, newZ));

            // Get height at new position
            const newY = this.terrain.getHeightAt(newX, newZ) + 1;

            // Move player
            this.player.body.position.set(newX, newY, newZ);

            // Update camera height
            this.camera.position.y = newY + 1.8;
          }
          break;
      }
    };
  }

  setupEventListeners() {
    // Setup pointer lock for FPS controls
    this.renderer.domElement.addEventListener('click', () => {
      if (!this.pointerLocked && this.isPlayerTurn && !this.shotInProgress) {
        this.requestPointerLock();
      }
    });

    // Handle pointer lock change
    document.addEventListener('pointerlockchange', () => this.onPointerLockChange());
    document.addEventListener('mozpointerlockchange', () => this.onPointerLockChange());
    document.addEventListener('webkitpointerlockchange', () => this.onPointerLockChange());

    // Handle mouse movement for camera rotation - IMPORTANT: attach to document, not renderer
    document.addEventListener('mousemove', (event) => this.handleMouseMove(event));

    // Handle keyboard
    document.addEventListener('keydown', (event) => this.handleKeyDown(event));
    document.addEventListener('keyup', (event) => this.handleKeyUp(event));

    // Handle mouse click for firing
    document.addEventListener('mousedown', (event) => this.handleMouseDown(event));

    // Debug key (only in development)
    document.addEventListener('keydown', (event) => {
      if (event.key === 'p') {
        this.showPerformanceStats = !this.showPerformanceStats;
        this.ui.togglePerformanceStats(this.showPerformanceStats);
      }
      // Toggle camera mode (for debugging)
      if (event.key === 'c') {
        this.toggleCameraMode();
      }
    });
  }

  requestPointerLock() {
    this.renderer.domElement.requestPointerLock =
      this.renderer.domElement.requestPointerLock ||
      this.renderer.domElement.mozRequestPointerLock ||
      this.renderer.domElement.webkitRequestPointerLock;

    this.renderer.domElement.requestPointerLock();
    console.log("Requesting pointer lock");
  }

  onPointerLockChange() {
    const isLocked =
      document.pointerLockElement === this.renderer.domElement ||
      document.mozPointerLockElement === this.renderer.domElement ||
      document.webkitPointerLockElement === this.renderer.domElement;

    console.log("Pointer lock changed. Locked:", isLocked);
    this.pointerLocked = isLocked;

    // When lock is lost and we're in the middle of a turn, try to regain it
    if (!this.pointerLocked && this.isPlayerTurn && !this.shotInProgress) {
      // Delay to prevent immediate relock which can be annoying
      setTimeout(() => {
        this.ui.updateMessage("Click to regain control");
      }, 100);
    }
  }

  handleMouseMove(event) {
    if (!this.pointerLocked || !this.isPlayerTurn || this.shotInProgress) {
      return; // Exit early if not locked or not player's turn
    }

    // Get mouse movement (with browser compatibility)
    const movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
    const movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

    // Increase sensitivity significantly
    const sensitivityX = 0.01;
    const sensitivityY = 0.01;

    // Update euler angles
    this.eulerY -= movementX * sensitivityX;
    this.eulerX -= movementY * sensitivityY;

    // Clamp vertical rotation to prevent flipping
    const maxPitch = Math.PI / 2 - 0.1;
    const minPitch = -Math.PI / 2 + 0.1;
    this.eulerX = Math.max(minPitch, Math.min(maxPitch, this.eulerX));

    // Apply rotation to camera using quaternion
    const quaternion = new THREE.Quaternion();
    quaternion.setFromEuler(new THREE.Euler(this.eulerX, this.eulerY, 0, 'YXZ'));
    this.camera.quaternion.copy(quaternion);

    // Log for debugging
    console.log(`Mouse moved: ${movementX}, ${movementY} | Camera rotation: ${this.eulerX.toFixed(2)}, ${this.eulerY.toFixed(2)}`);
  }

  toggleCameraMode() {
    this.fpsCameraActive = !this.fpsCameraActive;
    this.orbitControls.enabled = !this.fpsCameraActive;

    if (this.fpsCameraActive) {
      this.updateCameraToFirstPersonView();
    } else {
      // Switch to orbit camera mode (for debugging)
      const tankPosition = this.player.getTankPosition();
      this.orbitControls.target.set(tankPosition.x, tankPosition.y, tankPosition.z);
      this.camera.position.set(tankPosition.x, tankPosition.y + 10, tankPosition.z + 15);
    }
  }

  handleMouseMove(event) {
    if (!this.pointerLocked || !this.isPlayerTurn || this.shotInProgress) return;

    // Use movement X and Y directly for mouse look
    const movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
    const movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

    // Rotate the camera based on mouse movement
    this.camera.rotation.y -= movementX * this.rotateSpeed;

    // Limit vertical rotation to prevent flipping
    const maxPitch = Math.PI / 2 - 0.1; // Just under 90 degrees up
    const minPitch = -Math.PI / 2 + 0.1; // Just under 90 degrees down

    this.camera.rotation.x -= movementY * this.rotateSpeed;
    this.camera.rotation.x = Math.max(minPitch, Math.min(maxPitch, this.camera.rotation.x));
  }

  handleKeyDown(event) {
    if (!this.isPlayerTurn || this.shotInProgress) return;

    switch (event.key) {
      case ' ':
        this.fireProjectile();
        break;
      case 'w':
      case 'W':
        this.moveForward = true;
        break;
      case 's':
      case 'S':
        this.moveBackward = true;
        break;
      case 'a':
      case 'A':
        this.moveLeft = true;
        break;
      case 'd':
      case 'D':
        this.moveRight = true;
        break;
      case 'q':
      case 'Q':
        this.player.decreasePower();
        this.ui.updatePowerMeter(this.player.getPower());
        break;
      case 'e':
      case 'E':
        this.player.increasePower();
        this.ui.updatePowerMeter(this.player.getPower());
        break;
      case 'Shift':
        // Sprint (faster movement)
        this.moveSpeed = 0.3;
        break;
    }
  }

  handleKeyUp(event) {
    switch (event.key) {
      case 'w':
      case 'W':
        this.moveForward = false;
        break;
      case 's':
      case 'S':
        this.moveBackward = false;
        break;
      case 'a':
      case 'A':
        this.moveLeft = false;
        break;
      case 'd':
      case 'D':
        this.moveRight = false;
        break;
      case 'Shift':
        // Normal movement speed
        this.moveSpeed = 0.15;
        break;
    }
  }

  handleMouseDown(event) {
    if (!this.isPlayerTurn || this.shotInProgress) return;

    if (event.button === 0) { // Left click
      this.fireProjectile();
    }
  }

  fireProjectile() {
    if (this.shotInProgress) return;

    this.shotInProgress = true;
    const direction = this.player.getTurretDirection();
    const position = this.player.getTurretPosition();
    const power = this.player.getPower();

    // Create visual and audio feedback
    this.createMuzzleFlash(position, direction);

    this.currentProjectile = new Projectile(
      this.scene,
      position,
      direction.multiplyScalar(power),
      this.windStrength,
      this.quality
    );

    this.ui.updateMessage("Firing!");
  }

  createMuzzleFlash(position, direction) {
    // Skip on low quality settings
    if (this.quality === 'low') return;

    const flashGeometry = new THREE.SphereGeometry(0.5, 8, 8);
    const flashMaterial = new THREE.MeshBasicMaterial({
      color: 0xff9900,
      transparent: true,
      opacity: 0.8
    });

    const flash = new THREE.Mesh(flashGeometry, flashMaterial);

    // Position slightly in front of barrel
    const flashPos = position.clone().add(direction.clone().normalize().multiplyScalar(0.5));
    flash.position.copy(flashPos);

    this.scene.add(flash);

    // Animate and remove
    const startTime = Date.now();
    const duration = 200; // 200ms flash

    const animateFlash = () => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / duration;

      if (progress >= 1) {
        this.scene.remove(flash);
        return;
      }

      flash.material.opacity = 0.8 * (1 - progress);
      flash.scale.set(1 + progress, 1 + progress, 1 + progress);

      requestAnimationFrame(animateFlash);
    };

    animateFlash();
  }

  enemyTurn() {
    if (this.enemies.length === 0) {
      this.ui.updateMessage("You win! All enemies destroyed!");
      return;
    }

    this.ui.updateMessage("Enemy is aiming...");

    setTimeout(() => {
      // Pick random active enemy
      const activeEnemy = this.enemies[Math.floor(Math.random() * this.enemies.length)];

      // Make the enemy aim at the player with some randomness based on difficulty
      const targetDirection = new THREE.Vector3()
        .subVectors(this.player.getTankPosition(), activeEnemy.getTankPosition())
        .normalize();

      // Add some randomness to the aim (more on mobile for easier gameplay)
      const randomFactor = (this.isMobile ? 0.3 : 0.2) - Math.random() * (this.isMobile ? 0.6 : 0.4);
      targetDirection.x += randomFactor;
      targetDirection.y += Math.random() * 0.2; // Slight upward adjustment with randomness
      targetDirection.normalize();

      activeEnemy.aimAt(targetDirection);

      // Random power between 20 and 60
      const power = 20 + Math.random() * 40;

      setTimeout(() => {
        this.ui.updateMessage("Enemy firing!");

        // Create muzzle flash for enemy too
        this.createMuzzleFlash(activeEnemy.getTurretPosition(), targetDirection);

        this.currentProjectile = new Projectile(
          this.scene,
          activeEnemy.getTurretPosition(),
          targetDirection.multiplyScalar(power),
          this.windStrength,
          this.quality
        );

        this.shotInProgress = true;
      }, 1000);
    }, 1500);
  }

  nextTurn() {
    this.shotInProgress = false;
    this.currentTurn++;

    // Change wind
    this.windStrength = Math.random() * 10 - 5;
    this.ui.updateWindIndicator(this.windStrength);

    if (this.player.health <= 0) {
      this.ui.updateMessage("Game Over! You were destroyed!");
      this.ui.showRestartButton();
      // Exit pointer lock when game ends
      document.exitPointerLock();
      return;
    }

    if (this.enemies.length === 0) {
      this.ui.updateMessage("You win! All enemies destroyed!");
      this.ui.showRestartButton();
      // Exit pointer lock when game ends
      document.exitPointerLock();
      return;
    }

    this.isPlayerTurn = !this.isPlayerTurn;

    if (this.isPlayerTurn) {
      this.canMove = true; // Re-enable movement
      const controlMsg = this.isMobile ?
        "Your turn! Use touch controls to aim and fire" :
        "Your turn! Use WASD to move, mouse to aim, click to fire";
      this.ui.updateMessage(controlMsg);
      this.ui.updatePowerMeter(this.player.getPower());

      // If not already locked, show message to click for control
      if (!this.pointerLocked) {
        this.ui.updateMessage("Click game area to enable mouse control");
      }
    } else {
      this.canMove = false; // Disable movement during enemy turn
      this.enemyTurn();
    }
  }

  updatePerformanceStats() {
    this.fpsCounter.frames++;

    const now = performance.now();
    const elapsed = now - this.fpsCounter.lastTime;

    if (elapsed >= 1000) {
      this.fpsCounter.value = Math.round(this.fpsCounter.frames * 1000 / elapsed);
      this.fpsCounter.frames = 0;
      this.fpsCounter.lastTime = now;

      // Update stats display if enabled
      if (this.showPerformanceStats) {
        this.ui.updatePerformanceStats(this.fpsCounter.value);

        // Auto-adjust quality if performance is poor
        if (this.fpsCounter.value < 30 && this.quality !== 'low') {
          this.quality = 'low';
          this.adjustQualitySettings();
          console.log("Reduced quality settings for better performance");
        }
      }
    }
  }

  adjustQualitySettings() {
    // Adjust renderer
    this.renderer.shadowMap.enabled = this.quality !== 'low';

    // Update terrain
    this.terrain.setQuality(this.quality);

    // Update other quality-dependent settings
    this.scene.fog.far = this.quality === 'low' ? 300 : 500;
  }

  update() {
    this.updatePerformanceStats();

    // Update camera position based on controls
    this.updateCameraFromControls();

    if (this.currentProjectile) {
      const hitInfo = this.currentProjectile.update();

      if (hitInfo.hit) {
        // Check if projectile hit any tank
        const tankHit = [...this.players, ...this.enemies].find(tank => {
          return tank.checkHit(hitInfo.position, hitInfo.explosionRadius);
        });

        if (tankHit) {
          tankHit.takeDamage(30);
          this.ui.updateHealthBars(this.player.health, this.enemies.map(e => e.health));

          // Remove destroyed enemies
          this.enemies = this.enemies.filter(enemy => enemy.health > 0);
        }

        // Create explosion effect
        this.createExplosion(hitInfo.position, hitInfo.explosionRadius);

        // Remove the projectile
        this.currentProjectile.remove();
        this.currentProjectile = null;

        // After a delay, go to next turn
        setTimeout(() => this.nextTurn(), 1500);
      }
    }

    // Update controller if active
    this.controller.update();

    // Update controls if enabled
    if (this.orbitControls.enabled) {
      this.orbitControls.update();
    }
  }

  createExplosion(position, radius) {
    // Simplified explosion on low quality
    const segments = this.quality === 'low' ? 8 : 16;

    const explosion = new THREE.Mesh(
      new THREE.SphereGeometry(radius, segments, segments),
      new THREE.MeshBasicMaterial({
        color: 0xff6600,
        transparent: true,
        opacity: 0.8
      })
    );

    explosion.position.copy(position);
    this.scene.add(explosion);

    // Add a point light for the explosion
    let light = null;
    if (this.quality !== 'low') {
      light = new THREE.PointLight(0xff9900, 5, radius * 3);
      light.position.copy(position);
      this.scene.add(light);
    }

    // Animate the explosion
    const startTime = Date.now();
    const duration = 1000; // 1 second

    const animateExplosion = () => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / duration;

      if (progress >= 1) {
        this.scene.remove(explosion);
        if (light) this.scene.remove(light);
        return;
      }

      explosion.material.opacity = 0.8 * (1 - progress);
      explosion.scale.set(1 + progress, 1 + progress, 1 + progress);

      if (light) {
        light.intensity = 5 * (1 - progress);
      }

      requestAnimationFrame(animateExplosion);
    };

    animateExplosion();
  }

  restart() {
    // Clear existing objects
    [...this.players, ...this.enemies].forEach(tank => {
      this.scene.remove(tank.body);
    });

    if (this.currentProjectile) {
      this.currentProjectile.remove();
      this.currentProjectile = null;
    }

    this.players = [];
    this.enemies = [];
    this.shotInProgress = false;
    this.currentTurn = 0;
    this.isPlayerTurn = true;
    this.windStrength = Math.random() * 10 - 5;

    // Reset movement flags
    this.moveForward = false;
    this.moveBackward = false;
    this.moveLeft = false;
    this.moveRight = false;
    this.canMove = true;

    // Spawn new tanks
    this.spawnTanks();

    // Reset UI
    this.ui.updateMessage("Your turn! Use WASD to move, mouse to aim, click to fire");
    this.ui.updatePowerMeter(this.player.getPower());
    this.ui.updateWindIndicator(this.windStrength);
    this.ui.updateHealthBars(this.player.health, this.enemies.map(e => e.health));
    this.ui.hideRestartButton();

    // Request pointer lock again
    if (this.isPlayerTurn) {
      this.ui.updateMessage("Click game area to enable mouse control");
    }
  }

  start() {
    // Initial UI setup
    const controlMsg = this.isMobile ?
      "Your turn! Use touch controls to aim and fire" :
      "Your turn! Use WASD to move, mouse to aim, click to fire";

    this.ui.updateMessage(controlMsg);
    this.ui.updatePowerMeter(this.player.getPower());
    this.ui.updateWindIndicator(this.windStrength);
    this.ui.updateHealthBars(this.player.health, this.enemies.map(e => e.health));

    // Set restart handler
    this.ui.onRestart = () => this.restart();

    // Request pointer lock on initial click
    if (!this.isMobile) {
      this.ui.updateMessage(controlMsg + " - Click to enable mouse control");
    }

    // Start animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      this.update();
      this.renderer.render(this.scene, this.camera);
    };

    animate();
  }
}