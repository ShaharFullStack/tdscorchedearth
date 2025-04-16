// enemy.js
import * as THREE from 'three';

export class Enemy {
  constructor(scene, position, difficulty = 'normal') {
    this.scene = scene;
    this.position = position;
    this.health = 100;
    this.turretAngle = Math.PI; // Start facing the opposite direction
    this.elevation = 0.3;
    this.difficulty = difficulty; // 'easy', 'normal', 'hard', or 'expert'
    this.timeSinceLastMove = 0;
    this.isDestroyed = false;
    
    // Enemy stats based on difficulty
    this.stats = this.initializeStats(difficulty);
    
    // Equipment and visuals based on difficulty
    this.equipment = this.initializeEquipment(difficulty);
    
    this.createTank();
  }
  
  initializeStats(difficulty) {
    // Base stats
    const stats = {
      maxHealth: 100,
      accuracy: 0.7,    // Targeting accuracy (0-1)
      firepower: 1.0,   // Damage multiplier
      aimSpeed: 1.0,    // How quickly it aims
      moveSpeed: 0.5,   // Movement speed (if moving is implemented)
      reactionTime: 2.0, // Time to react (seconds)
      tacticalAI: 0.5,  // How smart its targeting is (0-1)
      minPower: 20,     // Minimum firing power
      maxPower: 60      // Maximum firing power
    };
    
    // Adjust stats based on difficulty
    switch(difficulty) {
      case 'easy':
        stats.accuracy = 0.5;
        stats.firepower = 0.8;
        stats.maxHealth = 80;
        stats.tacticalAI = 0.3;
        break;
        
      case 'normal':
        // Default stats
        break;
        
      case 'hard':
        stats.accuracy = 0.8;
        stats.firepower = 1.2;
        stats.maxHealth = 120;
        stats.reactionTime = 1.5;
        stats.tacticalAI = 0.7;
        stats.minPower = 25;
        stats.maxPower = 70;
        break;
        
      case 'expert':
        stats.accuracy = 0.9;
        stats.firepower = 1.5;
        stats.maxHealth = 150;
        stats.reactionTime = 1.0;
        stats.tacticalAI = 0.9;
        stats.minPower = 30;
        stats.maxPower = 80;
        break;
    }
    
    this.health = stats.maxHealth;
    return stats;
  }
  
  initializeEquipment(difficulty) {
    // Base equipment
    const equipment = {
      tankColor: 0xaa2222,
      barrelLength: 2,
      turretSize: 1,
      specialAbilities: []
    };
    
    // Adjust equipment based on difficulty
    switch(difficulty) {
      case 'easy':
        equipment.tankColor = 0xaa6622; // Orange-red
        break;
        
      case 'normal':
        // Default equipment
        break;
        
      case 'hard':
        equipment.tankColor = 0x992222; // Darker red
        equipment.barrelLength = 2.5;
        equipment.specialAbilities.push('predictiveAiming');
        break;
        
      case 'expert':
        equipment.tankColor = 0x661111; // Very dark red
        equipment.barrelLength = 3;
        equipment.turretSize = 1.2;
        equipment.specialAbilities.push('predictiveAiming', 'windCompensation');
        break;
    }
    
    return equipment;
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
    const baseGeometry = new THREE.CylinderGeometry(
      this.equipment.turretSize, 
      this.equipment.turretSize, 
      0.5, 
      16
    );
    const baseMaterial = new THREE.MeshStandardMaterial({ 
      color: new THREE.Color(this.equipment.tankColor).multiplyScalar(0.8)
    });
    this.turretBase = new THREE.Mesh(baseGeometry, baseMaterial);
    this.turretBase.position.set(0, 0.75, 0);
    this.turretBase.castShadow = true;
    
    // Tank barrel - cylinder with length based on difficulty
    const barrelGeometry = new THREE.CylinderGeometry(
      0.2, 
      0.2, 
      this.equipment.barrelLength, 
      8
    );
    const barrelMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
    this.barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
    this.barrel.rotation.x = Math.PI / 2;
    this.barrel.position.set(0, 0, this.equipment.barrelLength / 2);
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
    this.turretPivot.rotation.y = this.turretAngle;
    this.elevationPivot.rotation.x = -this.elevation;
    
    // Add enemy level indicator based on difficulty
    this.addDifficultyIndicator();
  }
  
  addDifficultyIndicator() {
    // Create a colored sphere above tank to indicate difficulty
    let color;
    switch(this.difficulty) {
      case 'easy': color = 0x22aa22; break; // Green
      case 'normal': color = 0xaaaa22; break; // Yellow
      case 'hard': color = 0xaa6622; break; // Orange
      case 'expert': color = 0xaa2222; break; // Red
      default: color = 0xaaaaaa; break; // Grey
    }
    
    const indicatorGeometry = new THREE.SphereGeometry(0.3, 8, 8);
    const indicatorMaterial = new THREE.MeshBasicMaterial({ color });
    this.difficultyIndicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
    this.difficultyIndicator.position.set(0, 2, 0);
    this.body.add(this.difficultyIndicator);
  }
  
  getTankPosition() {
    return this.body.position.clone();
  }
  
  getTurretPosition() {
    // Calculate world position of the barrel end
    const position = new THREE.Vector3(0, 0, this.equipment.barrelLength);
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
  
  aimAt(targetDirection) {
    // Set turret angle to match direction
    this.turretAngle = Math.atan2(targetDirection.x, targetDirection.z);
    this.turretPivot.rotation.y = this.turretAngle;
    
    // Set elevation
    this.elevation = Math.asin(targetDirection.y);
    this.elevation = Math.max(0, Math.min(Math.PI / 3, this.elevation));
    this.elevationPivot.rotation.x = -this.elevation;
  }
  
  prepareToFire(playerPosition, windStrength) {
    // Calculate basic direction vector to player
    const targetDirection = new THREE.Vector3()
      .subVectors(playerPosition, this.getTankPosition())
      .normalize();
    
    // Add inaccuracy based on difficulty
    // Less accurate on easy/normal, more accurate on hard/expert
    const maxRandomness = 1.0 - this.stats.accuracy;
    const randomFactor = maxRandomness - Math.random() * maxRandomness * 2;
    targetDirection.x += randomFactor;
    
    // For vertical aim, add a bit of randomness but generally aim upward
    // Smarter AIs can better calculate the arc needed
    const verticalRandomness = 0.2 - this.stats.tacticalAI * 0.1;
    targetDirection.y += Math.random() * verticalRandomness + 0.1;
    
    // Normalize to make direction vector unit length
    targetDirection.normalize();
    
    // Apply special abilities
    if (this.equipment.specialAbilities.includes('windCompensation')) {
      // Compensate for wind by adjusting aim
      // Expert enemies can factor in wind
      targetDirection.x -= windStrength * 0.02;
      targetDirection.normalize();
    }
    
    // Animate the aiming process
    this.animateAiming(targetDirection);
    
    // Calculate power based on distance and difficulty
    const distance = playerPosition.distanceTo(this.getTankPosition());
    // Basic power calculation as a function of distance
    let power = Math.min(
      this.stats.maxPower,
      Math.max(
        this.stats.minPower,
        distance * 0.8 + Math.random() * 10
      )
    );
    
    return { 
      direction: targetDirection,
      power,
      readyTime: this.stats.reactionTime * 1000 // Convert to milliseconds
    };
  }
  
  animateAiming(targetDirection) {
    // Animate the turret rotation to create a more realistic aiming effect
    // This should be called by the game loop for smooth animation
    const targetTurretAngle = Math.atan2(targetDirection.x, targetDirection.z);
    const targetElevation = Math.asin(targetDirection.y);
    
    // Calculate angle differences
    const turretAngleDiff = targetTurretAngle - this.turretAngle;
    const elevationDiff = targetElevation - this.elevation;
    
    // Apply a portion of the rotation based on aimSpeed
    this.turretAngle += turretAngleDiff * this.stats.aimSpeed * 0.1;
    this.elevation += elevationDiff * this.stats.aimSpeed * 0.1;
    
    // Clamp elevation
    this.elevation = Math.max(0, Math.min(Math.PI / 3, this.elevation));
    
    // Apply rotations
    this.turretPivot.rotation.y = this.turretAngle;
    this.elevationPivot.rotation.x = -this.elevation;
    
    // Return whether we're close enough to target aim
    return (Math.abs(turretAngleDiff) < 0.01 && Math.abs(elevationDiff) < 0.01);
  }
  
  fireProjectile() {
    // Return projectile properties based on difficulty
    return {
      damage: 30 * this.stats.firepower,
      type: 'standard'
    };
  }
  
  checkHit(position, radius) {
    if (this.isDestroyed) return false;
    
    // Check if explosion hits this tank
    const distance = position.distanceTo(this.getTankPosition());
    return distance < radius + 1.5; // 1.5 is rough tank radius
  }
  
  takeDamage(amount) {
    if (this.isDestroyed) return true;
    
    this.health = Math.max(0, this.health - amount);
    
    // Visual damage effect based on health percentage
    const healthPercentage = this.health / this.stats.maxHealth;
    if (healthPercentage < 0.7) {
      // Add some damage texture/color
      this.body.material.color.set(
        new THREE.Color(this.equipment.tankColor).lerp(
          new THREE.Color(0x333333), 
          1 - healthPercentage
        )
      );
    }
    
    if (this.health <= 0) {
      // Tank destroyed
      this.isDestroyed = true;
      this.destroyTank();
    }
    
    return this.health <= 0;
  }
  
  destroyTank() {
    // Visual destruction - could be enhanced with explosion effects
    this.scene.remove(this.body);
    
    // Add wreckage/debris
    this.createWreckage();
  }
  
  createWreckage() {
    // Create destroyed tank wreckage
    const wreckGeometry = new THREE.BoxGeometry(3, 0.6, 2);
    const wreckMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x444444,
      roughness: 0.9,
      metalness: 0.2
    });
    
    this.wreckage = new THREE.Mesh(wreckGeometry, wreckMaterial);
    this.wreckage.position.copy(this.position);
    // Tilt the wreckage slightly for effect
    this.wreckage.rotation.z = (Math.random() - 0.5) * 0.5;
    this.wreckage.rotation.x = (Math.random() - 0.5) * 0.3;
    
    this.wreckage.castShadow = true;
    this.wreckage.receiveShadow = true;
    
    this.scene.add(this.wreckage);
    
    // Add some debris pieces
    const debrisCount = 3 + Math.floor(Math.random() * 4);
    for (let i = 0; i < debrisCount; i++) {
      this.createDebrisPiece();
    }
  }
  
  createDebrisPiece() {
    // Random debris shapes
    const shapes = [
      new THREE.BoxGeometry(0.5, 0.2, 0.7),
      new THREE.CylinderGeometry(0.3, 0.3, 0.8, 6),
      new THREE.SphereGeometry(0.3, 6, 6)
    ];
    
    const debrisGeometry = shapes[Math.floor(Math.random() * shapes.length)];
    const debrisMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x333333 + Math.floor(Math.random() * 0x222222)
    });
    
    const debris = new THREE.Mesh(debrisGeometry, debrisMaterial);
    
    // Position debris around the tank
    const radius = 1 + Math.random() * 2;
    const angle = Math.random() * Math.PI * 2;
    debris.position.set(
      this.position.x + Math.cos(angle) * radius,
      this.position.y + 0.2 + Math.random() * 0.5,
      this.position.z + Math.sin(angle) * radius
    );
    
    // Random rotation
    debris.rotation.set(
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2
    );
    
    debris.castShadow = true;
    debris.receiveShadow = true;
    
    this.scene.add(debris);
  }
  
  update(deltaTime, playerPosition, windStrength) {
    if (this.isDestroyed) return;
    
    // Update internal timer
    this.timeSinceLastMove += deltaTime;
    
    // Periodically adjust aim at player (simulates tracking)
    if (this.timeSinceLastMove > 0.5 && this.stats.tacticalAI > 0.6) {
      this.timeSinceLastMove = 0;
      
      // If AI is sophisticated enough, it will continuously track player
      const targetDirection = new THREE.Vector3()
        .subVectors(playerPosition, this.getTankPosition())
        .normalize();
        
      // Apply slight tracking in hard/expert mode
      this.animateAiming(targetDirection);
    }
  }
  
  getDroppedResources() {
    // Calculate resources dropped when this enemy is defeated
    let credits, experience;
    
    switch(this.difficulty) {
      case 'easy':
        credits = 30 + Math.floor(Math.random() * 20);
        experience = 10 + Math.floor(Math.random() * 10);
        break;
      case 'normal':
        credits = 50 + Math.floor(Math.random() * 30);
        experience = 20 + Math.floor(Math.random() * 15);
        break;
      case 'hard':
        credits = 80 + Math.floor(Math.random() * 40);
        experience = 40 + Math.floor(Math.random() * 20);
        break;
      case 'expert':
        credits = 120 + Math.floor(Math.random() * 60);
        experience = 60 + Math.floor(Math.random() * 30);
        break;
      default:
        credits = 50;
        experience = 20;
    }
    
    return { credits, experience };
  }
}