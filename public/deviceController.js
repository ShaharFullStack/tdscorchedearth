// deviceController.js
export class DeviceController {
  constructor(container, isMobile) {
    this.container = container;
    this.isMobile = isMobile;
    this.onAction = null; // Callback function for actions
    
    // Pointer lock properties
    this.isPointerLocked = false;
    this.sensitivity = 0.002; // Mouse sensitivity
    
    // Key states for WASD movement
    this.keyStates = {
      KeyW: false,
      KeyA: false,
      KeyS: false,
      KeyD: false,
      Space: false,
      ShiftLeft: false
    };
    
    // Mobile touch properties
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.lastTouchX = 0;
    this.lastTouchY = 0;
    this.touchActive = false;
    
    // Initialize appropriate controls
    if (isMobile) {
      this.setupTouchControls();
    } else {
      this.setupPointerLock();
      this.setupKeyboardControls();
    }
  }
  
  setupPointerLock() {
    // Request pointer lock when container is clicked
    this.container.addEventListener('click', () => {
      if (!this.isPointerLocked) {
        this.requestPointerLock();
      }
    });
    
    // Setup pointer lock change event
    document.addEventListener('pointerlockchange', () => {
      if (document.pointerLockElement === this.container) {
        this.isPointerLocked = true;
        document.addEventListener('mousemove', this.handleMouseMove.bind(this));
      } else {
        this.isPointerLocked = false;
        document.removeEventListener('mousemove', this.handleMouseMove.bind(this));
      }
    });
    
    // Setup pointer lock error event
    document.addEventListener('pointerlockerror', () => {
      console.error('Pointer lock error');
    });
    
    // Mouse click for firing
    this.container.addEventListener('mousedown', (e) => {
      if (this.isPointerLocked && e.button === 0) { // Left click
        if (this.onAction) this.onAction('fire');
      }
    });
    
    // Mouse wheel for power adjustment
    this.container.addEventListener('wheel', (e) => {
      if (this.isPointerLocked) {
        e.preventDefault();
        const increase = e.deltaY < 0;
        if (this.onAction) this.onAction('power', { increase });
      }
    });
    
    // Add instructions overlay
    this.createInstructionsOverlay();
  }
  
  requestPointerLock() {
    // Request pointer lock on the container
    this.container.requestPointerLock = this.container.requestPointerLock ||
                                        this.container.mozRequestPointerLock ||
                                        this.container.webkitRequestPointerLock;
    this.container.requestPointerLock();
  }
  
  createInstructionsOverlay() {
    this.instructions = document.createElement('div');
    this.instructions.className = 'pointer-lock-instructions';
    this.instructions.textContent = 'Click to enable FPS controls';
    this.instructions.style.position = 'absolute';
    this.instructions.style.top = '50%';
    this.instructions.style.left = '50%';
    this.instructions.style.transform = 'translate(-50%, -50%)';
    this.instructions.style.color = 'white';
    this.instructions.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    this.instructions.style.padding = '20px';
    this.instructions.style.borderRadius = '5px';
    this.instructions.style.fontSize = '18px';
    this.instructions.style.textAlign = 'center';
    this.instructions.style.pointerEvents = 'none'; // Don't block clicks
    this.instructions.style.zIndex = '100';
    
    // Create key bindings list
    const keyBindings = document.createElement('div');
    keyBindings.style.marginTop = '10px';
    keyBindings.style.fontSize = '14px';
    keyBindings.style.textAlign = 'left';
    keyBindings.innerHTML = `
      <strong>Controls:</strong><br>
      WASD - Movement<br>
      Mouse - Look around<br>
      Left Click - Fire<br>
      Mouse Wheel - Adjust power<br>
      Shift - Sprint<br>
      Space - Jump/Boost
    `;
    
    this.instructions.appendChild(keyBindings);
    this.container.appendChild(this.instructions);
    
    // Update instruction visibility based on pointer lock state
    document.addEventListener('pointerlockchange', () => {
      if (document.pointerLockElement === this.container) {
        this.instructions.style.display = 'none';
      } else {
        this.instructions.style.display = 'block';
      }
    });
  }
  
  handleMouseMove(e) {
    if (!this.isPointerLocked) return;
    
    // Use movementX and movementY for pointer lock movement
    const movementX = e.movementX || e.mozMovementX || e.webkitMovementX || 0;
    const movementY = e.movementY || e.mozMovementY || e.webkitMovementY || 0;
    
    // Horizontal movement controls rotation (yaw)
    if (this.onAction) {
      this.onAction('rotate', { amount: movementX * this.sensitivity });
    }
    
    // Vertical movement controls elevation (pitch)
    if (this.onAction) {
      // Negative to invert Y axis, more intuitive for FPS
      this.onAction('elevate', { amount: -movementY * this.sensitivity });
    }
  }
  
  setupKeyboardControls() {
    // Key down events
    document.addEventListener('keydown', (e) => {
      if (this.isPointerLocked) {
        if (e.code in this.keyStates) {
          this.keyStates[e.code] = true;
          e.preventDefault();
        }
        
        // Handle one-time key presses
        switch (e.code) {
          case 'Escape':
            // ESC to exit pointer lock
            document.exitPointerLock();
            break;
          case 'KeyR':
            // R to reload
            if (this.onAction) this.onAction('reload');
            break;
        }
      }
    });
    
    // Key up events
    document.addEventListener('keyup', (e) => {
      if (e.code in this.keyStates) {
        this.keyStates[e.code] = false;
        e.preventDefault();
      }
    });
  }
  
  setupTouchControls() {
    // Create touch areas
    this.createControlElements();
    
    // Add touch event listeners
    this.aimArea.addEventListener('touchstart', (e) => this.handleTouchStart(e));
    this.aimArea.addEventListener('touchmove', (e) => this.handleTouchMove(e));
    this.aimArea.addEventListener('touchend', (e) => this.handleTouchEnd(e));
    
    this.fireButton.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.fireButton.classList.add('active');
      if (this.onAction) this.onAction('fire');
    });
    
    this.fireButton.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.fireButton.classList.remove('active');
    });
    
    this.powerUpButton.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.powerUpButton.classList.add('active');
      if (this.onAction) this.onAction('power', { increase: true });
    });
    
    this.powerUpButton.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.powerUpButton.classList.remove('active');
    });
    
    this.powerDownButton.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.powerDownButton.classList.add('active');
      if (this.onAction) this.onAction('power', { increase: false });
    });
    
    this.powerDownButton.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.powerDownButton.classList.remove('active');
    });
    
    // Movement button listeners
    this.setupMovementButtonListeners();
    
    // Handle orientation changes
    window.addEventListener('orientationchange', () => {
      // Small delay to ensure dimensions have updated
      setTimeout(() => this.adjustControlPositions(), 200);
    });
    
    // Initial positioning
    this.adjustControlPositions();
  }
  
  createControlElements() {
    // Create aim area (covers most of the screen)
    this.aimArea = document.createElement('div');
    this.aimArea.className = 'aim-area';
    this.aimArea.style.position = 'absolute';
    this.aimArea.style.left = '0';
    this.aimArea.style.top = '0';
    this.aimArea.style.right = '0';
    this.aimArea.style.bottom = '120px'; // Space for buttons at bottom
    this.aimArea.style.zIndex = '10';
    this.aimArea.style.touchAction = 'none'; // Prevent browser handling of touch gestures
    
    // Add crosshair to aim area
    this.crosshair = document.createElement('div');
    this.crosshair.className = 'crosshair';
    this.crosshair.style.position = 'absolute';
    this.crosshair.style.left = '50%';
    this.crosshair.style.top = '50%';
    this.crosshair.style.transform = 'translate(-50%, -50%)';
    this.crosshair.style.width = '20px';
    this.crosshair.style.height = '20px';
    this.crosshair.style.backgroundImage = 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'20\' height=\'20\'><circle cx=\'10\' cy=\'10\' r=\'1\' fill=\'white\'/><line x1=\'10\' y1=\'5\' x2=\'10\' y2=\'7\' stroke=\'white\' stroke-width=\'2\'/><line x1=\'10\' y1=\'13\' x2=\'10\' y2=\'15\' stroke=\'white\' stroke-width=\'2\'/><line x1=\'5\' y1=\'10\' x2=\'7\' y2=\'10\' stroke=\'white\' stroke-width=\'2\'/><line x1=\'13\' y1=\'10\' x2=\'15\' y2=\'10\' stroke=\'white\' stroke-width=\'2\'/></svg>")';
    this.crosshair.style.backgroundRepeat = 'no-repeat';
    this.crosshair.style.zIndex = '12';
    this.aimArea.appendChild(this.crosshair);
    
    // Create fire button
    this.fireButton = document.createElement('div');
    this.fireButton.className = 'control-button fire-button';
    this.fireButton.innerHTML = '🔥 FIRE';
    this.fireButton.style.position = 'absolute';
    this.fireButton.style.right = '20px';
    this.fireButton.style.bottom = '60px';
    this.fireButton.style.width = '80px';
    this.fireButton.style.height = '80px';
    this.fireButton.style.borderRadius = '50%';
    this.fireButton.style.backgroundColor = 'rgba(255, 50, 50, 0.7)';
    this.fireButton.style.color = 'white';
    this.fireButton.style.display = 'flex';
    this.fireButton.style.alignItems = 'center';
    this.fireButton.style.justifyContent = 'center';
    this.fireButton.style.fontWeight = 'bold';
    this.fireButton.style.boxShadow = '0 0 10px rgba(0,0,0,0.3)';
    this.fireButton.style.zIndex = '11';
    this.fireButton.style.touchAction = 'none';
    
    // Create power control buttons
    this.powerUpButton = document.createElement('div');
    this.powerUpButton.className = 'control-button power-up';
    this.powerUpButton.innerHTML = '+';
    this.powerUpButton.style.position = 'absolute';
    this.powerUpButton.style.right = '110px';
    this.powerUpButton.style.bottom = '95px';
    this.powerUpButton.style.width = '50px';
    this.powerUpButton.style.height = '50px';
    this.powerUpButton.style.borderRadius = '25px';
    this.powerUpButton.style.backgroundColor = 'rgba(50, 150, 255, 0.7)';
    this.powerUpButton.style.color = 'white';
    this.powerUpButton.style.display = 'flex';
    this.powerUpButton.style.alignItems = 'center';
    this.powerUpButton.style.justifyContent = 'center';
    this.powerUpButton.style.fontWeight = 'bold';
    this.powerUpButton.style.fontSize = '24px';
    this.powerUpButton.style.boxShadow = '0 0 10px rgba(0,0,0,0.3)';
    this.powerUpButton.style.zIndex = '11';
    this.powerUpButton.style.touchAction = 'none';
    
    this.powerDownButton = document.createElement('div');
    this.powerDownButton.className = 'control-button power-down';
    this.powerDownButton.innerHTML = '-';
    this.powerDownButton.style.position = 'absolute';
    this.powerDownButton.style.right = '110px';
    this.powerDownButton.style.bottom = '40px';
    this.powerDownButton.style.width = '50px';
    this.powerDownButton.style.height = '50px';
    this.powerDownButton.style.borderRadius = '25px';
    this.powerDownButton.style.backgroundColor = 'rgba(50, 150, 255, 0.7)';
    this.powerDownButton.style.color = 'white';
    this.powerDownButton.style.display = 'flex';
    this.powerDownButton.style.alignItems = 'center';
    this.powerDownButton.style.justifyContent = 'center';
    this.powerDownButton.style.fontWeight = 'bold';
    this.powerDownButton.style.fontSize = '24px';
    this.powerDownButton.style.boxShadow = '0 0 10px rgba(0,0,0,0.3)';
    this.powerDownButton.style.zIndex = '11';
    this.powerDownButton.style.touchAction = 'none';
    
    // Create movement buttons (WASD style)
    this.createMovementButtons();
    
    // Add active state styles
    const style = document.createElement('style');
    style.textContent = `
      .control-button.active {
        transform: scale(0.9);
        opacity: 0.9;
      }
    `;
    document.head.appendChild(style);
    
    // Add elements to the container
    this.container.appendChild(this.aimArea);
    this.container.appendChild(this.fireButton);
    this.container.appendChild(this.powerUpButton);
    this.container.appendChild(this.powerDownButton);
  }
  
  createMovementButtons() {
    // Movement controls container
    this.movementContainer = document.createElement('div');
    this.movementContainer.className = 'movement-controls';
    this.movementContainer.style.position = 'absolute';
    this.movementContainer.style.left = '20px';
    this.movementContainer.style.bottom = '20px';
    this.movementContainer.style.width = '150px';
    this.movementContainer.style.height = '150px';
    this.movementContainer.style.zIndex = '11';
    
    // Forward button (W)
    this.forwardButton = this.createDirectionButton('↑', 'forward');
    this.forwardButton.style.top = '0';
    this.forwardButton.style.left = '50px';
    this.movementContainer.appendChild(this.forwardButton);
    
    // Left button (A)
    this.leftButton = this.createDirectionButton('←', 'left');
    this.leftButton.style.top = '50px';
    this.leftButton.style.left = '0';
    this.movementContainer.appendChild(this.leftButton);
    
    // Right button (D)
    this.rightButton = this.createDirectionButton('→', 'right');
    this.rightButton.style.top = '50px';
    this.rightButton.style.left = '100px';
    this.movementContainer.appendChild(this.rightButton);
    
    // Backward button (S)
    this.backwardButton = this.createDirectionButton('↓', 'backward');
    this.backwardButton.style.top = '100px';
    this.backwardButton.style.left = '50px';
    this.movementContainer.appendChild(this.backwardButton);
    
    // Jump/Boost button (Space)
    this.jumpButton = this.createDirectionButton('⮙', 'jump');
    this.jumpButton.style.position = 'absolute';
    this.jumpButton.style.left = '175px';
    this.jumpButton.style.bottom = '20px';
    this.jumpButton.style.backgroundColor = 'rgba(255, 200, 50, 0.7)';
    
    this.container.appendChild(this.movementContainer);
    this.container.appendChild(this.jumpButton);
  }
  
  createDirectionButton(symbol, direction) {
    const button = document.createElement('div');
    button.className = `control-button movement-button ${direction}`;
    button.innerHTML = symbol;
    button.style.position = 'absolute';
    button.style.width = '50px';
    button.style.height = '50px';
    button.style.borderRadius = '10px';
    button.style.backgroundColor = 'rgba(0, 200, 100, 0.7)';
    button.style.color = 'white';
    button.style.display = 'flex';
    button.style.alignItems = 'center';
    button.style.justifyContent = 'center';
    button.style.fontWeight = 'bold';
    button.style.fontSize = '24px';
    button.style.boxShadow = '0 0 10px rgba(0,0,0,0.3)';
    button.style.touchAction = 'none';
    button.dataset.direction = direction;
    
    return button;
  }
  
  setupMovementButtonListeners() {
    const buttons = [this.forwardButton, this.leftButton, this.rightButton, this.backwardButton, this.jumpButton];
    
    buttons.forEach(button => {
      // Touch start - activate movement
      button.addEventListener('touchstart', (e) => {
        e.preventDefault();
        button.classList.add('active');
        const direction = button.dataset.direction;
        if (this.onAction) {
          this.onAction('move', { direction, active: true });
        }
      });
      
      // Touch end - stop movement
      button.addEventListener('touchend', (e) => {
        e.preventDefault();
        button.classList.remove('active');
        const direction = button.dataset.direction;
        if (this.onAction) {
          this.onAction('move', { direction, active: false });
        }
      });
      
      // Touch cancel - stop movement
      button.addEventListener('touchcancel', (e) => {
        e.preventDefault();
        button.classList.remove('active');
        const direction = button.dataset.direction;
        if (this.onAction) {
          this.onAction('move', { direction, active: false });
        }
      });
    });
  }
  
  adjustControlPositions() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    const isLandscape = width > height;
    
    // Adjust aim area
    this.aimArea.style.bottom = isLandscape ? '20px' : '120px';
    
    // In landscape, position controls differently
    if (isLandscape) {
      // Fire button
      this.fireButton.style.right = '20px';
      this.fireButton.style.bottom = '20px';
      
      // Power buttons
      this.powerUpButton.style.right = '110px';
      this.powerUpButton.style.bottom = '55px';
      this.powerDownButton.style.right = '110px';
      this.powerDownButton.style.bottom = '0px';
      
      // Movement controls
      this.movementContainer.style.left = '20px';
      this.movementContainer.style.bottom = '20px';
      
      // Jump button
      this.jumpButton.style.left = '175px';
      this.jumpButton.style.bottom = '20px';
    } else {
      // Portrait mode layout
      // Fire button
      this.fireButton.style.right = '20px';
      this.fireButton.style.bottom = '60px';
      
      // Power buttons
      this.powerUpButton.style.right = '110px';
      this.powerUpButton.style.bottom = '95px';
      this.powerDownButton.style.right = '110px';
      this.powerDownButton.style.bottom = '40px';
      
      // Movement controls
      this.movementContainer.style.left = '20px';
      this.movementContainer.style.bottom = '20px';
      
      // Jump button
      this.jumpButton.style.left = '175px';
      this.jumpButton.style.bottom = '20px';
    }
    
    // Adjust button size for small screens
    const buttonSize = Math.min(80, width / 6);
    this.fireButton.style.width = `${buttonSize}px`;
    this.fireButton.style.height = `${buttonSize}px`;
    
    const smallButtonSize = Math.min(50, width / 8);
    this.powerUpButton.style.width = `${smallButtonSize}px`;
    this.powerUpButton.style.height = `${smallButtonSize}px`;
    this.powerDownButton.style.width = `${smallButtonSize}px`;
    this.powerDownButton.style.height = `${smallButtonSize}px`;
    this.jumpButton.style.width = `${smallButtonSize}px`;
    this.jumpButton.style.height = `${smallButtonSize}px`;
    
    // Adjust movement buttons
    const moveButtonSize = Math.min(50, width / 8);
    [this.forwardButton, this.leftButton, this.rightButton, this.backwardButton].forEach(button => {
      button.style.width = `${moveButtonSize}px`;
      button.style.height = `${moveButtonSize}px`;
    });
    
    // Update movement container size
    this.movementContainer.style.width = `${moveButtonSize * 3}px`;
    this.movementContainer.style.height = `${moveButtonSize * 3}px`;
    
    // Update movement button positions
    this.forwardButton.style.left = `${moveButtonSize}px`;
    this.forwardButton.style.top = '0';
    
    this.leftButton.style.left = '0';
    this.leftButton.style.top = `${moveButtonSize}px`;
    
    this.rightButton.style.left = `${moveButtonSize * 2}px`;
    this.rightButton.style.top = `${moveButtonSize}px`;
    
    this.backwardButton.style.left = `${moveButtonSize}px`;
    this.backwardButton.style.top = `${moveButtonSize * 2}px`;
  }
  
  handleTouchStart(e) {
    e.preventDefault();
    
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      this.touchStartX = touch.clientX;
      this.touchStartY = touch.clientY;
      this.lastTouchX = touch.clientX;
      this.lastTouchY = touch.clientY;
      this.touchActive = true;
    }
  }
  // Update these methods in deviceController.js

handleMoveTouchMove(e) {
  e.preventDefault();
  
  if (this.moveTouchActive && e.touches.length > 0) {
    const touch = e.touches[0];
    this.lastMoveTouchX = touch.clientX;
    this.lastMoveTouchY = touch.clientY;
    
    // Calculate movement delta from center of joystick
    let deltaX = this.lastMoveTouchX - this.moveTouchStartX;
    let deltaY = this.lastMoveTouchY - this.moveTouchStartY;
    
    // Limit joystick movement radius
    const radius = 40;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    if (distance > radius) {
      deltaX = (deltaX / distance) * radius;
      deltaY = (deltaY / distance) * radius;
    }
    
    // Update joystick position
    this.moveStick.style.left = `${this.moveTouchStartX + deltaX}px`;
    this.moveStick.style.top = `${this.moveTouchStartY + deltaY}px`;
    
    // Normalize for movement (values between -1 and 1)
    const normalizedX = deltaX / radius;
    const normalizedY = deltaY / radius;
    
    // Send movement action
    if (this.onAction) {
      this.onAction('move', {
        x: normalizedX,
        y: -normalizedY // Invert Y for forward/backward
      });
    }
  }
}

handleTouchMove(e) {
  e.preventDefault();
  
  if (this.touchActive && e.touches.length > 0) {
    const touch = e.touches[0];
    const deltaX = touch.clientX - this.lastTouchX;
    const deltaY = this.lastTouchY - touch.clientY; // Inverted Y for intuitive control
    
    // Increase sensitivity for mobile look
    const sensitivityX = 0.01;
    const sensitivityY = 0.01;
    
    // Always treat as look controls in first-person mode
    if (this.onAction) {
      this.onAction('look', { 
        x: deltaX * sensitivityX,
        y: deltaY * sensitivityY
      });
    }
    
    this.lastTouchX = touch.clientX;
    this.lastTouchY = touch.clientY;
  }
}

  handleTouchMove(e) {
    e.preventDefault();
    
    if (this.touchActive && e.touches.length > 0) {
      const touch = e.touches[0];
      const deltaX = touch.clientX - this.lastTouchX;
      const deltaY = this.lastTouchY - touch.clientY; // Inverted Y for intuitive control
      
      // Determine if this is more of a horizontal or vertical swipe
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal movement - rotate turret
        if (this.onAction) {
          const sensitivity = 0.003;
          this.onAction('rotate', { amount: deltaX * sensitivity });
        }
      } else {
        // Vertical movement - adjust elevation
        if (this.onAction) {
          const sensitivity = 0.003;
          this.onAction('elevate', { amount: deltaY * sensitivity });
        }
      }
      
      this.lastTouchX = touch.clientX;
      this.lastTouchY = touch.clientY;
    }
  }
  
  handleTouchEnd(e) {
    e.preventDefault();
    this.touchActive = false;
  }
  
  update() {
    // Process keyboard movement for desktop FPS controls
    if (!this.isMobile && this.isPointerLocked) {
      // Forward (W)
      if (this.keyStates.KeyW && this.onAction) {
        this.onAction('move', { direction: 'forward', active: true });
      }
      
      // Left (A)
      if (this.keyStates.KeyA && this.onAction) {
        this.onAction('move', { direction: 'left', active: true });
      }
      
      // Backward (S)
      if (this.keyStates.KeyS && this.onAction) {
        this.onAction('move', { direction: 'backward', active: true });
      }
      
      // Right (D)
      if (this.keyStates.KeyD && this.onAction) {
        this.onAction('move', { direction: 'right', active: true });
      }
      
      // Jump/Boost (Space)
      if (this.keyStates.Space && this.onAction) {
        this.onAction('move', { direction: 'jump', active: true });
      }
      
      // Sprint (Shift)
      if (this.keyStates.ShiftLeft && this.onAction) {
        this.onAction('move', { direction: 'sprint', active: true });
      }
    }
  }
}