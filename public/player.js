// player.js
import * as THREE from 'three';

export class Player {
  constructor(scene, position, playerData = null) {
    this.scene = scene;
    this.position = position;
    this.health = 100;
    this.power = 40; // Initial firing power
    this.turretAngle = 0; // Horizontal angle in radians
    this.elevation = 0.2; // Vertical angle in radians
    
    // Add fuel for movement
    this.fuel = 100; // Maximum fuel
    this.fuelConsumptionRate = 0.5; // Fuel consumption per second while moving
    this.isMoving = false;
    this.moveDirection = new THREE.Vector3();
    this.moveSpeed = 5; // Units per second
    this.rotationSpeed = 2; // Radians per second
    
    // Player profile and progression data
    this.playerProfile = playerData || {
      uid: null,
      displayName: 'Guest Tank',
      photoURL: null,
      isGuest: true,
      createdAt: Date.now(),
      lastLogin: Date.now()
    };
    
    // Resources and progression system
    this.resources = playerData?.resources || {
      credits: 1000,       // In-game currency
      experience: 0,       // Experience points
      level: 1,            // Player level
      victories: 0,        // Number of wins
      defeats: 0,          // Number of losses
      shotsFired: 0,       // Total shots fired
      tanksDestroyed: 0,   // Total enemy tanks destroyed
      gamesPlayed: 0       // Total games played
    };
    
    // Tank customization and upgrades
    this.upgrades = playerData?.upgrades || {
      armorLevel: 1,       // Reduces damage taken
      firepower: 1,        // Increases damage dealt
      fuelEfficiency: 1,   // Reduces power consumption
      turretSpeed: 1,      // Increases turret rotation speed
      radarRange: 1,       // Increases visibility of enemies
      windResistance: 1    // Reduces effect of wind on projectiles
    };
    
    // Equipment and customization
    this.equipment = playerData?.equipment || {
      tankColor: 0x22aa22,    // Default tank color
      turretModel: 'basic',   // Turret model type
      projectileType: 'basic' // Projectile type
    };
    
    this.createTank();
    this.applyUpgrades();
  }
  
  createTank() {
    // Tank body - simple box
    const bodyGeometry = new THREE.BoxGeometry(3, 1, 2);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: this.equipment.tankColor });
    this.body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    this.body.position.copy(this.position);
    this.body.castShadow = true;
    this.body.receiveShadow = true;
    
    // Tank turret base - cylinder
    const baseGeometry = new THREE.CylinderGeometry(1, 1, 0.5, 16);
    const baseMaterial = new THREE.MeshStandardMaterial({ 
      color: new THREE.Color(this.equipment.tankColor).multiplyScalar(0.8) 
    });
    this.turretBase = new THREE.Mesh(baseGeometry, baseMaterial);
    this.turretBase.position.set(0, 0.75, 0);
    this.turretBase.castShadow = true;
    
    // Tank barrel - cylinder
    const barrelGeometry = new THREE.CylinderGeometry(0.2, 0.2, 2, 8);
    const barrelMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
    this.barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
    this.barrel.rotation.x = Math.PI / 2;
    this.barrel.position.set(0, 0, 1);
    this.barrel.castShadow = true;
    
    // Assemble the tank
    this.turretPivot = new THREE.Object3D();
    this.turretPivot.position.set(0, 0, 0);
    
    this.elevationPivot = new THREE.Object3D();
    this.elevationPivot.position.set(0, 0, 0);
    
    this.elevationPivot.add(this.barrel);
    this.turretPivot.add(this.turretBase);
    this.turretPivot.add(this.elevationPivot);
    this.body.add(this.turretPivot);
    
    // Add to scene
    this.scene.add(this.body);
    
    // Update initial rotation
    this.rotateTurret(0);
    this.adjustElevation(0);
    
    // Add player nameplate if available
    if (this.playerProfile.displayName && this.playerProfile.displayName !== 'Guest Tank') {
      this.addNameplate();
    }
  }
  
  addNameplate() {
    // Create canvas for nameplate
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 256;
    canvas.height = 64;
    
    // Fill background
    context.fillStyle = 'rgba(0, 0, 0, 0.5)';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw border
    context.strokeStyle = '#22aa22';
    context.lineWidth = 2;
    context.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);
    
    // Draw text
    context.fillStyle = 'white';
    context.font = '24px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(this.playerProfile.displayName, canvas.width / 2, canvas.height / 2);
    
    // Create texture and material
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
    
    // Create sprite and position above tank
    this.nameplate = new THREE.Sprite(material);
    this.nameplate.scale.set(2, 0.5, 1);
    this.nameplate.position.set(0, 2.5, 0);
    this.body.add(this.nameplate);
  }
  
  applyUpgrades() {
    // Apply armor upgrade (affects health)
    this.maxHealth = 100 + (this.upgrades.armorLevel - 1) * 25;
    this.health = this.maxHealth;
    
    // Apply turret speed upgrade
    this.turretRotationSpeed = 0.05 * (1 + (this.upgrades.turretSpeed - 1) * 0.2);
    
    // Apply fuel efficiency upgrade
    this.fuelConsumptionRate = 0.5 * (1 - (this.upgrades.fuelEfficiency - 1) * 0.1);
    
    // Apply visual upgrades if tank has been created
    if (this.body) {
      // Adjust tank size based on armor level
      const armorScale = 1 + (this.upgrades.armorLevel - 1) * 0.1;
      this.body.scale.set(1, armorScale, 1);
      
      // Adjust barrel length based on firepower
      if (this.barrel) {
        const firepowerScale = 1 + (this.upgrades.firepower - 1) * 0.15;
        this.barrel.scale.set(1, firepowerScale, 1);
      }
    }
  }
  
  getTankPosition() {
    return this.body.position.clone();
  }
  
  getTurretPosition() {
    // Calculate world position of the barrel end
    const position = new THREE.Vector3(0, 0, 2);
    this.elevationPivot.localToWorld(position);
    return position;
  }
  
  getTurretDirection() {
    // Calculate the direction the barrel is pointing
    const start = new THREE.Vector3(0, 0, 0);
    const end = new THREE.Vector3(0, 0, 1);
    
    this.elevationPivot.localToWorld(start);
    this.elevationPivot.localToWorld(end);
    
    return end.sub(start).normalize();
  }
  
  rotateTurret(angle) {
    // Apply turret speed upgrade
    const adjustedAngle = angle * (1 + (this.upgrades.turretSpeed - 1) * 0.2);
    this.turretAngle += adjustedAngle;
    this.turretPivot.rotation.y = this.turretAngle;
  }
  
  rotateTurretToward(targetAngle) {
    // Gradually rotate toward the target angle
    const currentAngle = this.turretAngle;
    let angleDiff = targetAngle - currentAngle;
    
    // Normalize the angle difference to be between -PI and PI
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    
    // Apply maximum rotation based on turret speed
    const maxRotation = this.turretRotationSpeed * 3;
    const rotation = Math.max(-maxRotation, Math.min(maxRotation, angleDiff * 0.1));
    
    this.rotateTurret(rotation);
  }
  
  adjustElevation(angle) {
    this.elevation += angle;
    this.elevation = Math.max(0, Math.min(Math.PI / 3, this.elevation));
    this.elevationPivot.rotation.x = -this.elevation;
  }
  
  increasePower() {
    // Apply fuel efficiency upgrade - higher levels can achieve more power
    const maxPower = 60 + (this.upgrades.fuelEfficiency - 1) * 10;
    this.power = Math.min(maxPower, this.power + 5);
  }
  
  decreasePower() {
    this.power = Math.max(10, this.power - 5);
  }
  
  getPower() {
    return this.power;
  }
  
  getFuel() {
    return this.fuel;
  }
  
  getWindResistance() {
    // Calculate wind resistance factor based on upgrade level
    return 1 - (this.upgrades.windResistance - 1) * 0.1; // 10% less wind effect per level
  }
  
  // Handle keyboard WASD movement
  startMoving(direction) {
    if (this.fuel <= 0) return false;
    
    this.isMoving = true;
    
    // Calculate movement direction based on key
    switch(direction) {
      case 'KeyW':
        this.moveDirection.set(0, 0, -1);
        break;
      case 'KeyS':
        this.moveDirection.set(0, 0, 1);
        break;
      case 'KeyA':
        // Rotate tank left
        this.body.rotation.y += 0.1;
        return true;
      case 'KeyD':
        // Rotate tank right
        this.body.rotation.y -= 0.1;
        return true;
    }
    
    // Apply tank's rotation to movement direction
    this.moveDirection.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.body.rotation.y);
    
    return true;
  }
  
  stopMoving(direction) {
    if (direction === 'KeyW' || direction === 'KeyS') {
      this.moveDirection.set(0, 0, 0);
    }
    
    // Check if any movement is still happening
    if (this.moveDirection.length() === 0) {
      this.isMoving = false;
    }
  }
  
  update(deltaTime, terrain) {
    // Handle movement and fuel consumption
    if (this.isMoving && this.fuel > 0) {
      // Consume fuel
      this.fuel = Math.max(0, this.fuel - this.fuelConsumptionRate * deltaTime);
      
      // Move tank if we have fuel
      if (this.fuel > 0 && this.moveDirection.length() > 0) {
        // Calculate movement amount
        const moveAmount = this.moveSpeed * deltaTime;
        const movement = this.moveDirection.clone().normalize().multiplyScalar(moveAmount);
        
        // Calculate new position
        const newPosition = this.body.position.clone().add(movement);
        
        // Get height at new position
        if (terrain) {
          const terrainHeight = terrain.getHeightAt(newPosition.x, newPosition.z);
          newPosition.y = terrainHeight + 0.5; // Position slightly above terrain
        }
        
        // Update position
        this.body.position.copy(newPosition);
      }
    }
    
    // When tank is out of fuel, slowly regenerate a small amount
    if (!this.isMoving && this.fuel < 100) {
      this.fuel = Math.min(100, this.fuel + 0.05 * deltaTime);
    }
  }
  
  fireProjectile() {
    // Track shots fired for stats
    this.resources.shotsFired++;
    return {
      // Return projectile properties affected by upgrades
      damage: 30 * (1 + (this.upgrades.firepower - 1) * 0.2), // 20% more damage per level
      type: this.equipment.projectileType,
      windResistance: this.getWindResistance()
    };
  }
  
  checkHit(position, radius) {
    // Check if explosion hits this tank
    const distance = position.distanceTo(this.getTankPosition());
    return distance < radius + 1.5; // 1.5 is rough tank radius
  }
  
  takeDamage(amount) {
    // Apply armor damage reduction
    const damageReduction = (this.upgrades.armorLevel - 1) * 0.1; // 10% less damage per level
    const actualDamage = amount * (1 - damageReduction);
    
    this.health = Math.max(0, this.health - actualDamage);
    if (this.health <= 0) {
      // Tank destroyed
      this.body.material.color.set(0x444444); // Darkened color
      this.turretBase.material.color.set(0x444444);
      
      // Update stats
      this.resources.defeats++;
    }
    
    return this.health <= 0; // Return whether tank was destroyed
  }
  
  awardVictory(creditsEarned = 100, experienceEarned = 50) {
    // Update player stats
    this.resources.victories++;
    this.resources.gamesPlayed++;
    
    // Award resources
    this.resources.credits += creditsEarned;
    this.resources.experience += experienceEarned;
    
    // Check for level up
    this.checkLevelUp();
    
    // Save player data
    this.savePlayerData();
    
    return {
      credits: creditsEarned,
      experience: experienceEarned,
      newLevel: this.resources.level
    };
  }
  
  recordDefeat(creditsEarned = 25, experienceEarned = 10) {
    // Update player stats
    this.resources.defeats++;
    this.resources.gamesPlayed++;
    
    // Award consolation resources
    this.resources.credits += creditsEarned;
    this.resources.experience += experienceEarned;
    
    // Check for level up
    this.checkLevelUp();
    
    // Save player data
    this.savePlayerData();
    
    return {
      credits: creditsEarned,
      experience: experienceEarned,
      newLevel: this.resources.level
    };
  }
  
  recordEnemyDestroyed() {
    // Update player stats
    this.resources.tanksDestroyed++;
    
    // Award resources for destroying an enemy
    const creditsEarned = 50;
    const experienceEarned = 25;
    
    this.resources.credits += creditsEarned;
    this.resources.experience += experienceEarned;
    
    // Check for level up
    this.checkLevelUp();
    
    return {
      credits: creditsEarned,
      experience: experienceEarned
    };
  }
  
  checkLevelUp() {
    // Simple level calculation based on experience
    // Formula: Each level requires level * 100 experience
    const experienceNeeded = this.resources.level * 100;
    
    if (this.resources.experience >= experienceNeeded) {
      this.resources.experience -= experienceNeeded;
      this.resources.level++;
      return true;
    }
    
    return false;
  }
  
  purchaseUpgrade(upgradeType, cost) {
    // Check if player has enough credits
    if (this.resources.credits < cost) {
      return {
        success: false,
        message: 'Not enough credits'
      };
    }
    
    // Check if upgrade exists
    if (!this.upgrades[upgradeType]) {
      return {
        success: false,
        message: 'Invalid upgrade type'
      };
    }
    
    // Check if upgrade is already at max level (max level is 5)
    if (this.upgrades[upgradeType] >= 5) {
      return {
        success: false,
        message: 'Upgrade already at maximum level'
      };
    }
    
    // Purchase upgrade
    this.resources.credits -= cost;
    this.upgrades[upgradeType]++;
    
    // Apply upgrade effects
    this.applyUpgrades();
    
    // Save player data
    this.savePlayerData();
    
    return {
      success: true,
      message: `${upgradeType} upgraded to level ${this.upgrades[upgradeType]}`,
      newLevel: this.upgrades[upgradeType]
    };
  }
  
  refill() {
    // Refill fuel to full
    this.fuel = 100;
  }
  
  savePlayerData() {
    // Only save if player is logged in
    if (this.playerProfile.uid) {
      const playerData = {
        profile: this.playerProfile,
        resources: this.resources,
        upgrades: this.upgrades,
        equipment: this.equipment
      };
      
      // Save to localStorage for now
      localStorage.setItem(`tankGame_player_${this.playerProfile.uid}`, JSON.stringify(playerData));
      
      // In a real app, you would also save to a server or Firebase
      // firebase.database().ref(`users/${this.playerProfile.uid}`).set(playerData);
    }
  }
  
  static loadPlayerData(uid) {
    // Try to load from localStorage
    const savedData = localStorage.getItem(`tankGame_player_${uid}`);
    if (savedData) {
      try {
        return JSON.parse(savedData);
      } catch (e) {
        console.error('Error parsing saved player data', e);
      }
    }
    return null;
  }
}