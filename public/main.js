// main.js
import * as THREE from 'three';
import { Game } from './game.js';

// Get the render target
const renderDiv = document.getElementById('renderDiv');

// Detect device type
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

// Initialize the game with the render target and device info
const game = new Game(renderDiv, isMobile);

// Start the game loop
game.start();