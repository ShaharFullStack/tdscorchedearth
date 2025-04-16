// deviceController.js
export class DeviceController {
    constructor(container, isMobile) {
      this.container = container;
      this.isMobile = isMobile;
      this.onAction = null; // Callback function for actions
      this.touchStartX = 0;
      this.touchStartY = 0;
      this.lastTouchX = 0;
      this.lastTouchY = 0;
      this.touchActive = false;
      
      // Only create touch controls on mobile
      if (isMobile) {
        this.setupTouchControls();
      }
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
      this.aimArea.style.bottom = '100px'; // Space for buttons at bottom
      this.aimArea.style.zIndex = '10';
      this.aimArea.style.touchAction = 'none'; // Prevent browser handling of touch gestures
      
      // Create fire button
      this.fireButton = document.createElement('div');
      this.fireButton.className = 'control-button fire-button';
      this.fireButton.innerHTML = '🔥 FIRE';
      this.fireButton.style.position = 'absolute';
      this.fireButton.style.right = '20px';
      this.fireButton.style.bottom = '20px';
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
      this.powerUpButton.style.left = '20px';
      this.powerUpButton.style.bottom = '65px';
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
      this.powerDownButton.style.left = '20px';
      this.powerDownButton.style.bottom = '10px';
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
    
    adjustControlPositions() {
      const width = this.container.clientWidth;
      const height = this.container.clientHeight;
      const isLandscape = width > height;
      
      // Adjust aim area
      this.aimArea.style.bottom = isLandscape ? '0' : '100px';
      
      // In landscape, position controls on the right
      if (isLandscape) {
        this.fireButton.style.right = '20px';
        this.fireButton.style.bottom = '20px';
        this.fireButton.style.left = 'auto';
        
        this.powerUpButton.style.right = '100px';
        this.powerUpButton.style.bottom = '65px';
        this.powerUpButton.style.left = 'auto';
        
        this.powerDownButton.style.right = '100px';
        this.powerDownButton.style.bottom = '10px';
        this.powerDownButton.style.left = 'auto';
      } else {
        // In portrait, position on the bottom
        this.fireButton.style.right = '20px';
        this.fireButton.style.bottom = '20px';
        
        this.powerUpButton.style.left = '20px';
        this.powerUpButton.style.bottom = '65px';
        
        this.powerDownButton.style.left = '20px';
        this.powerDownButton.style.bottom = '10px';
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
      // For continuous processing if needed
    }
  }