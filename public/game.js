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
    this.isPointerLocked = false;
    this.mouseEnabled = false;
    this.mouseMove = { x: 0, y: 0 };
    
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
      this.isMobile ? 70 : 60, // Wider FOV on mobile for better visibility
      aspectRatio,
      0.1,
      1000
    );
    
    this.camera.position.set(0, 10, 20);
    this.camera.lookAt(0, 0, 0);
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
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.1;
    this.controls.enabled = false; // Will enable in free camera mode
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
    
    // Set camera to player's position
    this.updateCameraToPlayerView();
  }
  
  updateCameraToPlayerView() {
    const tankPosition = this.player.getTankPosition();
    const turretPosition = this.player.getTurretPosition();
    
    this.camera.position.copy(turretPosition);
    this.camera.position.y += 0.5; // Slightly above turret
    
    const lookDirection = this.player.getTurretDirection();
    const lookAt = new THREE.Vector3().copy(turretPosition).add(lookDirection.multiplyScalar(10));
    this.camera.lookAt(lookAt);
  }
  
  setupUI() {
    this.ui = new UI(this.container, this.isMobile);
  }
  
  setupDeviceController() {
    this.controller = new DeviceController(this.container, this.isMobile);
    
    // Setup callback for controller events
    this.controller.onAction = (actionType, actionData) => {
      if (!this.isPlayerTurn || this.shotInProgress) return;
      
      switch(actionType) {
        case 'fire':
          this.fireProjectile();
          break;
        case 'rotate':
          this.player.rotateTurret(actionData.amount);
          this.updateCameraToPlayerView();
          break;
        case 'elevate':
          this.player.adjustElevation(actionData.amount);
          this.updateCameraToPlayerView();
          break;
        case 'power':
          if (actionData.increase) {
            this.player.increasePower();
          } else {
            this.player.decreasePower();
          }
          this.ui.updatePowerMeter(this.player.getPower());
          break;
      }
    };
  }
  
  setupEventListeners() {
    // Mouse controls - Pointer Lock API for improved mouse control
    this.renderer.domElement.addEventListener('click', () => this.requestPointerLock());
    
    document.addEventListener('pointerlockchange', () => this.handlePointerLockChange());
    document.addEventListener('pointerlockerror', () => {
      console.error('Pointer lock error');
      this.ui.updateMessage("Pointer lock failed. Click again to aim with mouse.");
    });

    // Mouse movement only tracked when pointer is locked
    document.addEventListener('mousemove', (event) => this.handleMouseMove(event));
    
    // Mouse click for firing
    this.renderer.domElement.addEventListener('mousedown', (event) => this.handleMouseDown(event));
    
    // Keyboard controls on desktop
    if (!this.isMobile) {
      document.addEventListener('keydown', (event) => this.handleKeyDown(event));
    }
    
    // Debug key (only in development)
    document.addEventListener('keydown', (event) => {
      if (event.key === 'p') {
        this.showPerformanceStats = !this.showPerformanceStats;
        this.ui.togglePerformanceStats(this.showPerformanceStats);
      }
    });
  }
  
  requestPointerLock() {
    // Don't request pointer lock if it's not player's turn or shot is in progress
    if (!this.isPlayerTurn || this.shotInProgress) return;
    
    if (!this.isPointerLocked) {
      this.renderer.domElement.requestPointerLock();
    }
  }
  
  handlePointerLockChange() {
    this.isPointerLocked = document.pointerLockElement === this.renderer.domElement;
    this.mouseEnabled = this.isPointerLocked;
    
    if (this.isPointerLocked) {
      this.ui.updateMessage("Mouse locked. Move mouse to aim, click to fire.");
    } else {
      this.ui.updateMessage("Click game to enable mouse aiming.");
    }
  }
  
  handleKeyDown(event) {
    if (!this.isPlayerTurn || this.shotInProgress) return;
    
    switch(event.key) {
      case ' ':
        this.fireProjectile();
        break;
      case 'ArrowLeft':
        this.player.rotateTurret(-0.05);
        this.updateCameraToPlayerView();
        break;
      case 'ArrowRight':
        this.player.rotateTurret(0.05);
        this.updateCameraToPlayerView();
        break;
      case 'ArrowUp':
        this.player.adjustElevation(0.05);
        this.updateCameraToPlayerView();
        break;
      case 'ArrowDown':
        this.player.adjustElevation(-0.05);
        this.updateCameraToPlayerView();
        break;
      case 'w':
        this.player.increasePower();
        this.ui.updatePowerMeter(this.player.getPower());
        break;
      case 's':
        this.player.decreasePower();
        this.ui.updatePowerMeter(this.player.getPower());
        break;
    }
  }
  
  handleMouseDown(event) {
    // Only process left click for firing when pointer is locked and it's player's turn
    if (!this.isPointerLocked || !this.isPlayerTurn || this.shotInProgress) return;
    
    if (event.button === 0) { // Left click
      this.fireProjectile();
    }
  }
  
  handleMouseMove(event) {
    // Only process mouse movement when pointer is locked and it's player's turn
    if (!this.isPointerLocked || !this.isPlayerTurn || this.shotInProgress) return;
    
    // Get mouse movement (movementX/Y are relative movements since last event)
    const movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
    const movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;
    
    // Apply mouse sensitivity - adjust these values for better control
    const sensitivity = 0.002;
    
    // Rotate turret based on horizontal mouse movement
    this.player.rotateTurret(movementX * sensitivity);
    
    // Adjust elevation based on vertical mouse movement (inverted for intuitive control)
    this.player.adjustElevation(-movementY * sensitivity);
    
    // Update camera view
    this.updateCameraToPlayerView();
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
      return;
    }
    
    if (this.enemies.length === 0) {
      this.ui.updateMessage("You win! All enemies destroyed!");
      this.ui.showRestartButton();
      return;
    }
    
    this.isPlayerTurn = !this.isPlayerTurn;
    
    if (this.isPlayerTurn) {
      this.updateCameraToPlayerView();
      const controlMsg = this.isMobile ? 
        "Your turn! Use touch controls to aim and fire" : 
        "Your turn! Click to enable mouse aiming or use arrow keys";
      this.ui.updateMessage(controlMsg);
      this.ui.updatePowerMeter(this.player.getPower());
    } else {
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
    if (this.controls.enabled) {
      this.controls.update();
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
    // Release pointer lock if active
    if (this.isPointerLocked) {
      document.exitPointerLock();
    }
    
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
    
    // Spawn new tanks
    this.spawnTanks();
    
    // Reset UI
    this.ui.updateMessage("Your turn! Click to enable mouse aiming or use arrow keys");
    this.ui.updatePowerMeter(this.player.getPower());
    this.ui.updateWindIndicator(this.windStrength);
    this.ui.updateHealthBars(this.player.health, this.enemies.map(e => e.health));
    this.ui.hideRestartButton();
  }
  
  start() {
    // Initial UI setup
    const controlMsg = this.isMobile ? 
      "Your turn! Use touch controls to aim and fire" : 
      "Your turn! Click to enable mouse aiming or use arrow keys";
    
    this.ui.updateMessage(controlMsg);
    this.ui.updatePowerMeter(this.player.getPower());
    this.ui.updateWindIndicator(this.windStrength);
    this.ui.updateHealthBars(this.player.health, this.enemies.map(e => e.health));
    // Don't call updateFuelMeter as it's not needed in our implementation
    
    // Set restart handler
    this.ui.onRestart = () => this.restart();
    
    // Start animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      this.update();
      this.renderer.render(this.scene, this.camera);
    };
    
    animate();
  }
}