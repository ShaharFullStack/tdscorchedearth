import * as THREE from 'three';

export class Terrain {
  constructor(scene, quality = 'high') {
    this.scene = scene;
    this.size = 100;
    this.quality = quality;
    
    // Adjust segment count based on quality for performance
    this.segments = this.quality === 'low' ? 50 : 100;
    
    this.heightMap = this.generateHeightMap();
    this.createMesh();
  }
  
  generateHeightMap() {
    const size = this.segments + 1;
    const data = new Float32Array(size * size);
    
    // Generate terrain using simplified perlin-like noise
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        const x = i / this.segments;
        const y = j / this.segments;
        
        // Simple noise function approximation using sine waves at different frequencies
        let height = 0;
        height += Math.sin(x * 10) * 2;
        height += Math.sin(x * 18 + y * 13) * 1.5;
        height += Math.sin(y * 10) * 2;
        height += Math.sin(Math.sqrt((x - 0.5) * (x - 0.5) + (y - 0.5) * (y - 0.5)) * 20) * 3;
        
        // Create more interesting terrain features
        // Add some ridges
        height += Math.max(0, Math.sin(x * 20) * Math.sin(y * 20) * 3);
        
        // Flatten the center a bit for gameplay
        const distFromCenter = Math.sqrt(Math.pow(x - 0.5, 2) + Math.pow(y - 0.5, 2));
        height *= Math.max(0.3, distFromCenter * 1.5);
        
        // Add some small random noise for texture
        height += Math.random() * 0.5;
        
        data[i + j * size] = height;
      }
    }
    
    return data;
  }
  
  createMesh() {
    // Create geometry based on quality setting
    const geometry = new THREE.PlaneGeometry(
      this.size, 
      this.size, 
      this.segments, 
      this.segments
    );
    
    geometry.rotateX(-Math.PI / 2); // Make it horizontal
    
    // Apply height map to vertices
    const vertices = geometry.attributes.position.array;
    for (let i = 0; i < vertices.length; i += 3) {
      const x = (vertices[i] + this.size / 2) / this.size;
      const z = (vertices[i + 2] + this.size / 2) / this.size;
      if (x >= 0 && x <= 1 && z >= 0 && z <= 1) {
        const height = this.getHeightAt(vertices[i], vertices[i + 2]);
        vertices[i + 1] = height;
      }
    }
    
    // Compute normals for proper lighting
    geometry.computeVertexNormals();
    
    // Create base terrain material
    const material = new THREE.MeshStandardMaterial({
      color: 0x5d8b52, // Base green for grass
      flatShading: this.quality === 'low',
      roughness: 0.8,
      metalness: 0.1
    });
    
    // For high quality, add texture detail
    if (this.quality !== 'low') {
      // Vertex colors for enhanced terrain detail
      const colors = new Float32Array(vertices.length);
      
      for (let i = 0; i < vertices.length; i += 3) {
        // Calculate height and slope
        const y = vertices[i + 1];
        
        // Use height to determine color
        let color = new THREE.Color();
        
        if (y < 0) {
          // Water/beach areas
          color.setRGB(0.8, 0.8, 0.6); // Sandy color
        } else if (y < 3) {
          // Grass
          color.setRGB(0.36, 0.54, 0.32);
        } else if (y < 7) {
          // Higher terrain - mix in some dirt
          const mix = (y - 3) / 4;
          color.setRGB(0.36 * (1 - mix) + 0.5 * mix, 0.54 * (1 - mix) + 0.35 * mix, 0.32 * (1 - mix) + 0.2 * mix);
        } else {
          // Mountain tops - rocky
          color.setRGB(0.5, 0.5, 0.5);
        }
        
        // Apply color to RGB channels
        colors[i] = color.r;
        colors[i + 1] = color.g;
        colors[i + 2] = color.b;
      }
      
      // Add colors attribute to geometry
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      material.vertexColors = true;
    }
    
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.receiveShadow = this.quality !== 'low';
    this.mesh.castShadow = false;
    
    // Add the terrain mesh to the scene
    this.scene.add(this.mesh);
    
    // Add terrain decorations if high quality
    if (this.quality === 'high') {
      this.addTerrainDetail();
    }
  }
  
  addTerrainDetail() {
    // Add basic ground plane for water
    const waterGeometry = new THREE.PlaneGeometry(this.size * 3, this.size * 3);
    waterGeometry.rotateX(-Math.PI / 2);
    waterGeometry.translate(0, -0.5, 0);
    
    const waterMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x3366aa,
      transparent: true,
      opacity: 0.7
    });
    
    const water = new THREE.Mesh(waterGeometry, waterMaterial);
    this.scene.add(water);
  }
  
  getHeightAt(x, z) {
    // Convert world coords to local 0-1 coords
    const localX = (x + this.size / 2) / this.size;
    const localZ = (z + this.size / 2) / this.size;
    
    if (localX < 0 || localX > 1 || localZ < 0 || localZ > 1) {
      return 0; // Outside terrain
    }
    
    // Find grid coordinates
    const gridX = Math.min(Math.floor(localX * this.segments), this.segments - 1);
    const gridZ = Math.min(Math.floor(localZ * this.segments), this.segments - 1);
    
    // Calculate fractional position
    const fracX = localX * this.segments - gridX;
    const fracZ = localZ * this.segments - gridZ;
    
    // Get heights at grid points
    const size = this.segments + 1;
    const h00 = this.heightMap[gridX + gridZ * size];
    const h10 = this.heightMap[(gridX + 1) + gridZ * size];
    const h01 = this.heightMap[gridX + (gridZ + 1) * size];
    const h11 = this.heightMap[(gridX + 1) + (gridZ + 1) * size];
    
    // Bilinear interpolation
    const h0 = h00 * (1 - fracX) + h10 * fracX;
    const h1 = h01 * (1 - fracX) + h11 * fracX;
    return h0 * (1 - fracZ) + h1 * fracZ;
  }
  
  setQuality(quality) {
    // Only rebuild if quality changed
    if (this.quality !== quality) {
      this.quality = quality;
      
      // Remove existing mesh
      this.scene.remove(this.mesh);
      
      // Build new mesh with updated quality
      this.segments = this.quality === 'low' ? 50 : 100;
      this.heightMap = this.generateHeightMap();
      this.createMesh();
    }
  }
}