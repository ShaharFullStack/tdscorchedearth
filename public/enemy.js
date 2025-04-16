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
    
    // Movement and fuel properties
    this.tankRotation = Math.PI; // Overall tank rotation in radians
    this.velocity = new THREE.Vector3();
    this.moveSpeed = 0;
    this.rotationSpeed = 0;
    this.fuel = 0;
    this.currentFuel = 0;
    this.fuelConsumption = 0;
    this.moveTimer = 0;
    this.moveInterval = 0;
    this.moveDuration = 0;
    this.targetPosition = null;
    this.isMoving = false;
    
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
      moveSpeed: 3.0,   // Movement speed
      reactionTime: 2.0, // Time to react (seconds)
      tacticalAI: 0.5,  // How smart its targeting is (0-1)
      minPower: 20,     // Minimum firing power
      maxPower: 60,     // Maximum firing power
      maxFuel: 100,     // Maximum fuel capacity
      fuelConsumption: 0.5, // Fuel used per second while moving
      mobility: 0.5     // How often it decides to move (0-1)
    };
    
    // Adjust stats based on difficulty
    switch(difficulty) {
      case 'easy':
        stats.accuracy = 0.5;
        stats.firepower = 0.8;
        stats.maxHealth = 80;
        stats.tacticalAI = 0.3;
        stats.moveSpeed = 2.0;
        stats.mobility = 0.3;
        stats.maxFuel = 80;
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
        stats.moveSpeed = 4.0;
        stats.mobility = 0.7;
        stats.maxFuel = 120;
        stats.fuelConsumption = 0.4;
        break;
        
      case 'expert':
        stats.accuracy = 0.9;
        stats.firepower = 1.5;
        stats.maxHealth = 150;
        stats.reactionTime = 1.0;
        stats.tacticalAI = 0.9;
        stats.minPower = 30;
        stats.maxPower = 80;
        stats.moveSpeed = 5.0;
        stats.mobility = 0.9;
        stats.maxFuel = 150;
        stats.fuelConsumption = 0.3;
        break;
    }
    
    this.health = stats.maxHealth;
    
    // Set movement properties based on stats
    this.moveSpeed = stats.moveSpeed;
    this.rotationSpeed = stats.moveSpeed * 0.3;
    this.fuel = stats.maxFuel;
    this.currentFuel = stats.maxFuel;
    this.fuelConsumption = stats.fuelConsumption;
    
    // Set AI movement behavior based on difficulty
    this.moveInterval = this.calculateMoveInterval(stats.mobility);
    this.moveDuration = this.calculateMoveDuration(stats.mobility);
    
    return stats;
  }
  
  calculateMoveInterval(mobility) {
    // Higher mobility = more frequent movement decisions
    // Returns interval in seconds between movement attempts
    return 10 - mobility * 7; // 3-10 seconds based on mobility
  }
  
  calculateMoveDuration(mobility) {
    // Higher mobility = longer movement duration
    // Returns duration in seconds of movement
    return 1 + mobility * 3; // 1-4 seconds based on mobility
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
    
    // Add tank treads
    this.createTankTreads();
    
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
    
    // Add fuel tank to the back of the tank
    this.createFuelTank();
    
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
    this.body.rotation.y = this.tankRotation;
    this.turretPivot.rotation.y = this.turretAngle;
    this.elevationPivot.rotation.x = -this.elevation;
    
    // Add enemy level indicator based on difficulty
    this.addDifficultyIndicator();
  }
  
  createTankTreads() {
    // Left tread
    const leftTreadGeometry = new THREE.BoxGeometry(3.2, 0.4, 0.4);
    const treadMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
    this.leftTread = new THREE.Mesh(leftTreadGeometry, treadMaterial);
    this.leftTread.position.set(0, -0.3, -1.1);
    this.leftTread.castShadow = true;
    this.leftTread.receiveShadow = true;
    this.body.add(this.leftTread);
    
    // Right tread
    const rightTreadGeometry = new THREE.BoxGeometry(3.2, 0.4, 0.4);
    this.rightTread = new THREE.Mesh(rightTreadGeometry, treadMaterial);
    this.rightTread.position.set(0, -0.3, 1.1);
    this.rightTread.castShadow = true;
    this.rightTread.receiveShadow = true;
    this.body.add(this.rightTread);
    
    // Add tread details
    this.addTreadDetails(this.leftTread, 10);
    this.addTreadDetails(this.rightTread, 10);
  }
  
  addTreadDetails(tread, segments) {
    const length = 3.2;
    const segmentWidth = length / segments;
    
    for (let i = 0; i < segments; i++) {
      const detailGeometry = new THREE.BoxGeometry(segmentWidth * 0.8, 0.5, 0.5);
      const detailMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
      const detail = new THREE.Mesh(detailGeometry, detailMaterial);
      
      // Position each segment along the tread
      detail.position.set((i - segments/2 + 0.5) * segmentWidth, 0, 0);
      tread.add(detail);
    }
  }
  
  createFuelTank() {
    // Fuel tank - cylinder on the back
    const tankGeometry = new THREE.CylinderGeometry(0.4, 0.4, 1.5, 8);
    tankGeometry.rotateZ(Math.PI / 2); // Rotate to horizontal position
    
    const tankMaterial = new THREE.MeshStandardMaterial({ color: 0x666666 });
    this.fuelTankMesh = new THREE.Mesh(tankGeometry, tankMaterial);
    this.fuelTankMesh.position.set(-1.8, 0.5, 0); // Position at the back of the tank
    this.fuelTankMesh.castShadow = true;
    
    // Add fuel cap
    const capGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.1, 8);
    const capMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
    this.fuelCap = new THREE.Mesh(capGeometry, capMaterial);
    this.fuelCap.position.set(-2.3, 0.5, 0);
    this.fuelCap.rotation.z = Math.PI / 2;
    
    this.body.add(this.fuelTankMesh);
    this.body.add(this.fuelCap);
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
  
  rotateTank(angle) {
    this.tankRotation += angle;
    this.body.rotation.y = this.tankRotation;
  }
  
  // Move the tank based on terrain and AI behavior
  move(deltaTime, terrain, playerPosition, boundaries) {
    if (this.isDestroyed || this.currentFuel <= 0) {
      return false;
    }
    
    let moved = false;
    
    // If currently moving, continue with the movement
    if (this.isMoving) {
      // Calculate direction to target
      if (this.targetPosition) {
        const currentPos = this.getTankPosition();
        const direction = new THREE.Vector3().subVectors(this.targetPosition, currentPos).normalize();
        
        // Calculate angle to target
        const targetAngle = Math.atan2(direction.x, direction.z);
        const angleDiff = this.normalizeAngle(targetAngle - this.tankRotation);
        
        // Rotate towards target
        if (Math.abs(angleDiff) > 0.1) {
          const rotateDir = angleDiff > 0 ? 1 : -1;
          this.rotateTank(rotateDir * this.rotationSpeed * deltaTime);
          moved = true;
        } else {
          // Move forward if facing the right direction
          const moveDistance = this.moveSpeed * deltaTime;
          const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.tankRotation);
          
          // Calculate new position
          const newPosition = currentPos.clone().add(forward.multiplyScalar(moveDistance));
          
          // Check if we've reached the target
          const distanceToTarget = newPosition.distanceTo(this.targetPosition);
          if (distanceToTarget < 1) {
            this.isMoving = false;
            this.targetPosition = null;
          } else {
            // Check boundaries
            if (this.isWithinBoundaries(newPosition, boundaries)) {
              // Calculate terrain height at new position
              const terrainHeight = terrain.getHeightAt(newPosition.x, newPosition.z) + 1;
              newPosition.y = terrainHeight;
              
              // Move the tank
              this.body.position.copy(newPosition);
              
              // Adjust to terrain
              this.adjustToTerrain(terrain);
              
              moved = true;
            } else {
              // Hit boundary, stop moving
              this.isMoving = false;
              this.targetPosition = null;
            }
          }
        }
      }
      
      // Update move timer
      this.moveTimer += deltaTime;
      if (this.moveTimer >= this.moveDuration) {
        this.isMoving = false;
        this.moveTimer = 0;
      }
    } else {
      // Not currently moving, check if it's time to move
      this.moveTimer += deltaTime;
      if (this.moveTimer >= this.moveInterval) {
        this.moveTimer = 0;
        
        // Decide whether to move based on AI intelligence
        const shouldMove = Math.random() < this.stats.mobility;
        
        if (shouldMove) {
          this.isMoving = true;
          
          // Choose target position based on AI intelligence and player position
          this.chooseTargetPosition(playerPosition, boundaries);
        }
      }
    }
    
    // If moved, consume fuel
    if (moved) {
      const fuelUsed = this.fuelConsumption * deltaTime;
      this.currentFuel = Math.max(0, this.currentFuel - fuelUsed);
    }
    
    return moved;
  }
  
  // Normalize angle to -PI to PI range
  normalizeAngle(angle) {
    return ((angle + Math.PI) % (Math.PI * 2)) - Math.PI;
  }
  
  // Check if position is within game boundaries
  isWithinBoundaries(position, boundaries) {
    if (!boundaries) return true;
    
    const { minX, maxX, minZ, maxZ } = boundaries;
    return (
      position.x >= minX && position.x <= maxX &&
      position.z >= minZ && position.z <= maxZ
    );
  }
  
  // Choose a target position for movement
  chooseTargetPosition(playerPosition, boundaries) {
    const currentPos = this.getTankPosition();
    let targetPos = new THREE.Vector3();
    
    // Different behaviors based on difficulty and AI
    if (this.stats.tacticalAI > 0.7 && Math.random() < 0.7) {
      // Smart AI: Move strategically relative to player
      
      // Calculate distance to player
      const distanceToPlayer = currentPos.distanceTo(playerPosition);
      
      if (distanceToPlayer < 15) {
        // Too close, move away from player
        const direction = new THREE.Vector3().subVectors(currentPos, playerPosition).normalize();
        const distance = 10 + Math.random() * 10; // Move 10-20 units away
        targetPos.copy(currentPos).add(direction.multiplyScalar(distance));
      } else if (distanceToPlayer > 40) {
        // Too far, move closer to player
        const direction = new THREE.Vector3().subVectors(playerPosition, currentPos).normalize();
        const distance = 10 + Math.random() * 10; // Move 10-20 units closer
        targetPos.copy(currentPos).add(direction.multiplyScalar(distance));
      } else {
        // Good distance, move laterally to player
        // Create a perpendicular vector to the player direction
        const toPlayer = new THREE.Vector3().subVectors(playerPosition, currentPos).normalize();
        const perpendicular = new THREE.Vector3(-toPlayer.z, 0, toPlayer.x).normalize();
        
        // Randomly flip direction
        if (Math.random() < 0.5) perpendicular.multiplyScalar(-1);
        
        const distance = 5 + Math.random() * 10; // Move 5-15 units laterally
        targetPos.copy(currentPos).add(perpendicular.multiplyScalar(distance));
      }
    } else {
      // Less intelligent AI: Move randomly
      const angle = Math.random() * Math.PI * 2;
      const distance = 5 + Math.random() * 15; // Move 5-20 units
      
      targetPos.x = currentPos.x + Math.sin(angle) * distance;
      targetPos.z = currentPos.z + Math.cos(angle) * distance;
    }
    
    // Ensure the target is within boundaries
    if (boundaries) {
      const { minX, maxX, minZ, maxZ } = boundaries;
      targetPos.x = Math.max(minX, Math.min(maxX, targetPos.x));
      targetPos.z = Math.max(minZ, Math.min(maxZ, targetPos.z));
    }
    
    this.targetPosition = targetPos;
    return targetPos;
  }
  
  // Adjust tank rotation to match terrain slope
  adjustToTerrain(terrain) {
    const pos = this.body.position.clone();
    const ahead = pos.clone().add(new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.tankRotation));
    const right = pos.clone().add(new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.tankRotation));
    
    // Get heights at different positions
    const heightCenter = terrain.getHeightAt(pos.x, pos.z);
    const heightAhead = terrain.getHeightAt(ahead.x, ahead.z);
    const heightRight = terrain.getHeightAt(right.x, right.z);
    
    // Calculate pitch (front-back tilt)
    const pitch = Math.atan2(heightAhead - heightCenter, 1);
    
    // Calculate roll (side tilt)
    const roll = Math.atan2(heightRight - heightCenter, 1);
    
    // Apply smooth rotation to tank body
    this.body.rotation.x = this.lerpAngle(this.body.rotation.x, pitch, 0.1);
    this.body.rotation.z = this.lerpAngle(this.body.rotation.z, -roll, 0.1);
    this.body.rotation.y = this.tankRotation; // Maintain yaw (turning direction)
  }
  
  // Helper function to interpolate between angles
  lerpAngle(a, b, t) {
    const diff = (b - a) % (Math.PI * 2);
    const shortestAngle = ((diff + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
    return a + shortestAngle * t;
  }
  
  // Get current fuel level as percentage
  getFuelLevel() {
    return (this.currentFuel / this.fuel) * 100;
  }
  
  // Refill fuel 
  refillFuel(amount = null) {
    if (amount === null) {
      // Full refill
      this.currentFuel = this.fuel;
    } else {
      // Partial refill
      this.currentFuel = Math.min(this.fuel, this.currentFuel + amount);
    }
    return this.currentFuel;
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
  
  update(deltaTime, playerPosition, windStrength, terrain, boundaries) {
    if (this.isDestroyed) return;
    
    // Update internal timer
    this.timeSinceLastMove += deltaTime;
    
    // Try to move if we have fuel
    if (this.currentFuel > 0) {
      this.move(deltaTime, terrain, playerPosition, boundaries);
    }
    
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