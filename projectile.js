// projectile.js
import * as THREE from 'three';

export class Projectile {
  constructor(scene, position, velocity, windStrength, quality = 'high') {
    this.scene = scene;
    this.position = position.clone();
    this.velocity = velocity.clone();
    this.windStrength = windStrength;
    this.quality = quality;
    this.gravity = 9.8;
    this.timeStep = 1/60;
    this.timeAlive = 0;
    this.maxTime = 10; // Max 10 seconds of flight
    this.explosionRadius = 5;
    
    // Optimize for mobile/low performance
    this.trailLength = this.quality === 'low' ? 50 : 100;
    this.trailUpdateInterval = this.quality === 'low' ? 2 : 1; // Update trail less frequently on low quality
    this.trailUpdateCounter = 0;
    
    this.createMesh();
    this.createTrail();
    
    // Add projectile light if high quality
    if (this.quality === 'high') {
      this.createLight();
    }
  }
  
  createMesh() {
    // Simpler geometry for low quality
    const segments = this.quality === 'low' ? 6 : 8;
    const geometry = new THREE.SphereGeometry(0.3, segments, segments);
    
    const material = new THREE.MeshBasicMaterial({ 
      color: this.quality === 'low' ? 0x000000 : 0x222222 
    });
    
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.copy(this.position);
    this.scene.add(this.mesh);
  }
  
  createTrail() {
    this.trailPoints = [];
    const trailGeometry = new THREE.BufferGeometry();
    
    const trailMaterial = new THREE.LineBasicMaterial({ 
      color: 0xffaa00,
      opacity: 0.7,
      transparent: true
    });
    
    this.trail = new THREE.Line(trailGeometry, trailMaterial);
    this.scene.add(this.trail);
    
    // Pre-allocate buffer for better performance
    this.positionsBuffer = new Float32Array(this.trailLength * 3);
    trailGeometry.setAttribute('position', new THREE.BufferAttribute(this.positionsBuffer, 3));
  }
  
  createLight() {
    this.light = new THREE.PointLight(0xffaa00, 1, 10);
    this.light.position.copy(this.position);
    this.scene.add(this.light);
  }
  
  update() {
    this.timeAlive += this.timeStep;
    
    // Check for timeout
    if (this.timeAlive > this.maxTime) {
      return { hit: true, position: this.position.clone(), explosionRadius: this.explosionRadius };
    }
    
    // Update velocity with gravity and wind
    this.velocity.y -= this.gravity * this.timeStep;
    this.velocity.x += this.windStrength * 0.1 * this.timeStep;
    
    // Update position
    this.position.add(this.velocity.clone().multiplyScalar(this.timeStep));
    this.mesh.position.copy(this.position);
    
    // Update light if exists
    if (this.light) {
      this.light.position.copy(this.position);
    }
    
    // Update trail with reduced frequency for better performance
    this.trailUpdateCounter++;
    if (this.trailUpdateCounter >= this.trailUpdateInterval) {
      this.trailUpdateCounter = 0;
      this.updateTrail();
    }
    
    // Check if hit terrain or out of bounds
    if (this.position.y < 0 || Math.abs(this.position.x) > 50 || Math.abs(this.position.z) > 50) {
      return { hit: true, position: this.position.clone(), explosionRadius: this.explosionRadius };
    }
    
    return { hit: false };
  }
  
  updateTrail() {
    // Add current position to trail
    this.trailPoints.push(this.position.clone());
    
    // Remove oldest points if exceeding max trail length
    if (this.trailPoints.length > this.trailLength) {
      this.trailPoints.shift();
    }
    
    // Update trail geometry
    for (let i = 0; i < this.trailPoints.length; i++) {
      this.positionsBuffer[i * 3] = this.trailPoints[i].x;
      this.positionsBuffer[i * 3 + 1] = this.trailPoints[i].y;
      this.positionsBuffer[i * 3 + 2] = this.trailPoints[i].z;
    }
    
    // If we have fewer points than the buffer size, fill the rest with the last point
    // This avoids having to recreate the buffer each time
    if (this.trailPoints.length < this.trailLength && this.trailPoints.length > 0) {
      const lastPoint = this.trailPoints[this.trailPoints.length - 1];
      for (let i = this.trailPoints.length; i < this.trailLength; i++) {
        this.positionsBuffer[i * 3] = lastPoint.x;
        this.positionsBuffer[i * 3 + 1] = lastPoint.y;
        this.positionsBuffer[i * 3 + 2] = lastPoint.z;
      }
    }
    
    // Mark the buffer for update
    this.trail.geometry.attributes.position.needsUpdate = true;
    
    // Optimize: Only update the drawable parts
    this.trail.geometry.setDrawRange(0, this.trailPoints.length);
  }
  
  remove() {
    this.scene.remove(this.mesh);
    this.scene.remove(this.trail);
    
    if (this.light) {
      this.scene.remove(this.light);
    }
  }
}