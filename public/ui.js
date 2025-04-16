// ui.js
export class UI {
  constructor(container, isMobile) {
    this.container = container;
    this.isMobile = isMobile;
    this.onRestart = null; // Callback function for restart button
    this.createUI();
  }
  
  createUI() {
    // Create UI container
    this.uiContainer = document.createElement('div');
    this.uiContainer.style.position = 'absolute';
    this.uiContainer.style.top = '10px';
    this.uiContainer.style.left = '10px';
    this.uiContainer.style.right = '10px';
    this.uiContainer.style.padding = '10px';
    this.uiContainer.style.color = 'white';
    this.uiContainer.style.fontFamily = 'Arial, sans-serif';
    this.uiContainer.style.pointerEvents = 'none';
    this.uiContainer.style.userSelect = 'none';
    this.uiContainer.style.fontSize = this.isMobile ? '14px' : '16px';
    this.container.appendChild(this.uiContainer);
    
    // Message display
    this.messageElement = document.createElement('div');
    this.messageElement.style.marginBottom = '10px';
    this.messageElement.style.padding = '5px 10px';
    this.messageElement.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
    this.messageElement.style.borderRadius = '5px';
    this.messageElement.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
    this.messageElement.style.textAlign = 'center';
    this.uiContainer.appendChild(this.messageElement);
    
    // Game info container (wind and power)
    this.gameInfoContainer = document.createElement('div');
    this.gameInfoContainer.style.display = 'flex';
    this.gameInfoContainer.style.justifyContent = 'space-between';
    this.gameInfoContainer.style.marginBottom = '10px';
    this.uiContainer.appendChild(this.gameInfoContainer);
    
    // Wind indicator
    this.windElement = document.createElement('div');
    this.windElement.style.padding = '5px 10px';
    this.windElement.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
    this.windElement.style.borderRadius = '5px';
    this.windElement.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
    this.windElement.style.flex = '1 1 30%';
    this.gameInfoContainer.appendChild(this.windElement);
    
    // Spacer
    const spacer1 = document.createElement('div');
    spacer1.style.width = '10px';
    this.gameInfoContainer.appendChild(spacer1);
    
    // Power meter
    this.powerContainer = document.createElement('div');
    this.powerContainer.style.padding = '5px 10px';
    this.powerContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
    this.powerContainer.style.borderRadius = '5px';
    this.powerContainer.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
    this.powerContainer.style.flex = '1 1 30%';
    this.gameInfoContainer.appendChild(this.powerContainer);
    
    this.powerLabel = document.createElement('div');
    this.powerLabel.textContent = 'Power:';
    this.powerContainer.appendChild(this.powerLabel);
    
    this.powerMeter = document.createElement('div');
    this.powerMeter.style.height = '10px';
    this.powerMeter.style.marginTop = '5px';
    this.powerMeter.style.backgroundColor = '#333';
    this.powerMeter.style.borderRadius = '5px';
    this.powerMeter.style.overflow = 'hidden';
    this.powerContainer.appendChild(this.powerMeter);
    
    this.powerFill = document.createElement('div');
    this.powerFill.style.height = '100%';
    this.powerFill.style.backgroundColor = '#ff7700';
    this.powerFill.style.width = '50%';
    this.powerFill.style.transition = 'width 0.2s ease';
    this.powerMeter.appendChild(this.powerFill);
    
    // Spacer
    const spacer2 = document.createElement('div');
    spacer2.style.width = '10px';
    this.gameInfoContainer.appendChild(spacer2);
    
    // Fuel meter
    this.fuelContainer = document.createElement('div');
    this.fuelContainer.style.padding = '5px 10px';
    this.fuelContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
    this.fuelContainer.style.borderRadius = '5px';
    this.fuelContainer.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
    this.fuelContainer.style.flex = '1 1 30%';
    this.gameInfoContainer.appendChild(this.fuelContainer);
    
    this.fuelLabel = document.createElement('div');
    this.fuelLabel.textContent = 'Fuel:';
    this.fuelContainer.appendChild(this.fuelLabel);
    
    this.fuelMeter = document.createElement('div');
    this.fuelMeter.style.height = '10px';
    this.fuelMeter.style.marginTop = '5px';
    this.fuelMeter.style.backgroundColor = '#333';
    this.fuelMeter.style.borderRadius = '5px';
    this.fuelMeter.style.overflow = 'hidden';
    this.fuelContainer.appendChild(this.fuelMeter);
    
    this.fuelFill = document.createElement('div');
    this.fuelFill.style.height = '100%';
    this.fuelFill.style.backgroundColor = '#22aa22';
    this.fuelFill.style.width = '100%';
    this.fuelFill.style.transition = 'width 0.2s ease';
    this.fuelMeter.appendChild(this.fuelFill);
    
    // Health bars container
    this.healthContainer = document.createElement('div');
    this.healthContainer.style.padding = '5px 10px';
    this.healthContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
    this.healthContainer.style.borderRadius = '5px';
    this.healthContainer.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
    this.uiContainer.appendChild(this.healthContainer);
    
    // Player health
    this.playerHealthLabel = document.createElement('div');
    this.playerHealthLabel.textContent = 'Player:';
    this.healthContainer.appendChild(this.playerHealthLabel);
    
    this.playerHealthBar = document.createElement('div');
    this.playerHealthBar.style.height = '10px';
    this.playerHealthBar.style.marginTop = '5px';
    this.playerHealthBar.style.marginBottom = '10px';
    this.playerHealthBar.style.backgroundColor = '#333';
    this.playerHealthBar.style.borderRadius = '5px';
    this.playerHealthBar.style.overflow = 'hidden';
    this.healthContainer.appendChild(this.playerHealthBar);
    
    this.playerHealthFill = document.createElement('div');
    this.playerHealthFill.style.height = '100%';
    this.playerHealthFill.style.backgroundColor = '#22aa22';
    this.playerHealthFill.style.width = '100%';
    this.playerHealthFill.style.transition = 'width 0.3s ease';
    this.playerHealthBar.appendChild(this.playerHealthFill);
    
    // Enemy health bars will be added dynamically
    this.enemyHealthBars = [];
    
    // Controls info
    this.createControlsInfo();
    
    // Restart button (hidden initially)
    this.restartButton = document.createElement('button');
    this.restartButton.textContent = 'Play Again';
    this.restartButton.style.position = 'absolute';
    this.restartButton.style.top = '50%';
    this.restartButton.style.left = '50%';
    this.restartButton.style.transform = 'translate(-50%, -50%)';
    this.restartButton.style.padding = '10px 20px';
    this.restartButton.style.fontSize = '18px';
    this.restartButton.style.backgroundColor = '#22aa22';
    this.restartButton.style.color = 'white';
    this.restartButton.style.border = 'none';
    this.restartButton.style.borderRadius = '5px';
    this.restartButton.style.cursor = 'pointer';
    this.restartButton.style.display = 'none';
    this.restartButton.style.pointerEvents = 'auto';
    this.restartButton.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
    this.container.appendChild(this.restartButton);
    
    // Restart button event
    this.restartButton.addEventListener('click', () => {
      if (this.onRestart) this.onRestart();
    });
    
    // Performance stats (hidden initially)
    this.statsContainer = document.createElement('div');
    this.statsContainer.style.position = 'absolute';
    this.statsContainer.style.top = '10px';
    this.statsContainer.style.right = '10px';
    this.statsContainer.style.padding = '5px 10px';
    this.statsContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
    this.statsContainer.style.color = 'white';
    this.statsContainer.style.borderRadius = '5px';
    this.statsContainer.style.fontFamily = 'monospace';
    this.statsContainer.style.fontSize = '12px';
    this.statsContainer.style.display = 'none';
    this.container.appendChild(this.statsContainer);
    
    // Message display for notifications (like "Out of fuel!")
    this.notificationContainer = document.createElement('div');
    this.notificationContainer.style.position = 'absolute';
    this.notificationContainer.style.bottom = '80px';
    this.notificationContainer.style.left = '50%';
    this.notificationContainer.style.transform = 'translateX(-50%)';
    this.notificationContainer.style.padding = '10px 20px';
    this.notificationContainer.style.backgroundColor = 'rgba(50, 50, 200, 0.8)';
    this.notificationContainer.style.color = 'white';
    this.notificationContainer.style.borderRadius = '5px';
    this.notificationContainer.style.fontWeight = 'bold';
    this.notificationContainer.style.textAlign = 'center';
    this.notificationContainer.style.opacity = '0';
    this.notificationContainer.style.transition = 'opacity 0.3s ease';
    this.notificationContainer.style.pointerEvents = 'none';
    this.container.appendChild(this.notificationContainer);
  }
  
  createControlsInfo() {
    // Create a controls info panel
    this.controlsInfo = document.createElement('div');
    this.controlsInfo.style.position = 'absolute';
    this.controlsInfo.style.bottom = '10px';
    this.controlsInfo.style.right = '10px';
    this.controlsInfo.style.padding = '10px';
    this.controlsInfo.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
    this.controlsInfo.style.color = 'white';
    this.controlsInfo.style.borderRadius = '5px';
    this.controlsInfo.style.fontSize = '12px';
    this.controlsInfo.style.maxWidth = '200px';
    this.controlsInfo.style.pointerEvents = 'none';
    
    // Only show on desktop
    if (!this.isMobile) {
      this.controlsInfo.innerHTML = `
        <strong>Controls:</strong><br>
        WASD: Move Tank<br>
        ←→: Rotate Turret<br>
        ↑↓: Adjust Power<br>
        Space: Fire<br>
        C: Change Camera<br>
        R: Refill Fuel (Debug)
      `;
      this.container.appendChild(this.controlsInfo);
    }
  }
  
  updateMessage(message) {
    this.messageElement.textContent = message;
    
    // Flash effect for important messages
    this.messageElement.style.backgroundColor = 'rgba(50, 50, 200, 0.8)';
    setTimeout(() => {
      this.messageElement.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
    }, 300);
  }
  
  showMessage(message, duration = 2000) {
    // Show a temporary notification message
    this.notificationContainer.textContent = message;
    this.notificationContainer.style.opacity = '1';
    
    setTimeout(() => {
      this.notificationContainer.style.opacity = '0';
    }, duration);
  }
  
  updateWindIndicator(windStrength) {
    const direction = windStrength > 0 ? 'right' : 'left';
    const strength = Math.abs(windStrength).toFixed(1);
    
    // Add an arrow indicator based on direction and strength
    const arrow = windStrength > 0 ? '→' : '←';
    const arrowCount = Math.min(5, Math.ceil(Math.abs(windStrength)));
    const arrows = arrow.repeat(arrowCount);
    
    this.windElement.innerHTML = `<span>Wind: </span><span style="font-weight: bold;">${strength}</span> ${arrows}`;
    
    // Color coding based on strength
    let color = '#22aa22'; // Green for weak wind
    if (Math.abs(windStrength) > 3) {
      color = '#aaaa22'; // Yellow for medium wind
    }
    if (Math.abs(windStrength) > 4) {
      color = '#aa2222'; // Red for strong wind
    }
    
    this.windElement.style.borderLeft = `3px solid ${color}`;
  }
  
  updatePowerMeter(power) {
    // Normalize power from 10-60 to 0-100%
    const percentage = ((power - 10) / 50) * 100;
    this.powerFill.style.width = `${percentage}%`;
    this.powerLabel.textContent = `Power: ${power}`;
    
    // Color coding based on power level
    if (power < 20) {
      this.powerFill.style.backgroundColor = '#2222aa'; // Blue for low power
    } else if (power < 40) {
      this.powerFill.style.backgroundColor = '#22aa22'; // Green for medium power
    } else {
      this.powerFill.style.backgroundColor = '#aa2222'; // Red for high power
    }
  }
  
  updateFuelMeter(fuel) {
    // Normalize fuel from 0-100 to 0-100%
    const percentage = Math.max(0, Math.min(100, fuel));
    this.fuelFill.style.width = `${percentage}%`;
    this.fuelLabel.textContent = `Fuel: ${Math.round(percentage)}%`;
    
    // Color coding based on fuel level
    if (percentage < 20) {
      this.fuelFill.style.backgroundColor = '#aa2222'; // Red for low fuel
    } else if (percentage < 50) {
      this.fuelFill.style.backgroundColor = '#aaaa22'; // Yellow for medium fuel
    } else {
      this.fuelFill.style.backgroundColor = '#22aa22'; // Green for high fuel
    }
    
    // Flash warning when fuel is low
    if (percentage < 20) {
      this.fuelFill.style.animation = 'pulseFuel 1s infinite';
      if (!document.getElementById('fuel-animation')) {
        const style = document.createElement('style');
        style.id = 'fuel-animation';
        style.textContent = `
          @keyframes pulseFuel {
            0% { opacity: 0.6; }
            50% { opacity: 1; }
            100% { opacity: 0.6; }
          }
        `;
        document.head.appendChild(style);
      }
    } else {
      this.fuelFill.style.animation = 'none';
    }
  }
  
  updateHealthBars(playerHealth, enemyHealths) {
    // Update player health with color transition
    this.playerHealthFill.style.width = `${playerHealth}%`;
    
    if (playerHealth > 60) {
      this.playerHealthFill.style.backgroundColor = '#22aa22'; // Green
    } else if (playerHealth > 30) {
      this.playerHealthFill.style.backgroundColor = '#aaaa22'; // Yellow
    } else {
      this.playerHealthFill.style.backgroundColor = '#aa2222'; // Red
    }
    
    // Update or create enemy health bars
    while (this.enemyHealthBars.length < enemyHealths.length) {
      this.addEnemyHealthBar();
    }
    
    // Update enemy health values
    for (let i = 0; i < enemyHealths.length; i++) {
      this.enemyHealthBars[i].label.textContent = `Enemy ${i + 1}:`;
      this.enemyHealthBars[i].fill.style.width = `${enemyHealths[i]}%`;
      
      // Color transitions for enemy health
      if (enemyHealths[i] > 60) {
        this.enemyHealthBars[i].fill.style.backgroundColor = '#aa2222'; // Red - enemy at full strength
      } else if (enemyHealths[i] > 30) {
        this.enemyHealthBars[i].fill.style.backgroundColor = '#aaaa22'; // Yellow
      } else {
        this.enemyHealthBars[i].fill.style.backgroundColor = '#aa6622'; // Orange-red
      }
      
      this.enemyHealthBars[i].container.style.display = 'block';
    }
    
    // Hide unused enemy health bars
    for (let i = enemyHealths.length; i < this.enemyHealthBars.length; i++) {
      this.enemyHealthBars[i].container.style.display = 'none';
    }
  }
  
  addEnemyHealthBar() {
    const container = document.createElement('div');
    container.style.marginBottom = '5px';
    this.healthContainer.appendChild(container);
    
    const label = document.createElement('div');
    label.textContent = `Enemy ${this.enemyHealthBars.length + 1}:`;
    container.appendChild(label);
    
    const bar = document.createElement('div');
    bar.style.height = '10px';
    bar.style.marginTop = '5px';
    bar.style.backgroundColor = '#333';
    bar.style.borderRadius = '5px';
    bar.style.overflow = 'hidden';
    container.appendChild(bar);
    
    const fill = document.createElement('div');
    fill.style.height = '100%';
    fill.style.backgroundColor = '#aa2222';
    fill.style.width = '100%';
    fill.style.transition = 'width 0.3s ease, background-color 0.3s ease';
    bar.appendChild(fill);
    
    this.enemyHealthBars.push({ container, label, bar, fill });
  }
  
  showRestartButton() {
    this.restartButton.style.display = 'block';
    
    // Add a fade-in effect
    this.restartButton.style.opacity = '0';
    setTimeout(() => {
      this.restartButton.style.opacity = '1';
      this.restartButton.style.transition = 'opacity 0.5s ease';
    }, 10);
  }
  
  hideRestartButton() {
    this.restartButton.style.display = 'none';
  }
  
  updatePerformanceStats(fps) {
    this.statsContainer.textContent = `FPS: ${fps}`;
  }
  
  togglePerformanceStats(show) {
    this.statsContainer.style.display = show ? 'block' : 'none';
  }
  
  handleResize(width, height) {
    // Adapt UI for different screen sizes
    const isLandscape = width > height;
    const isMobile = width < 768;
    
    // Adjust font size for screen size
    this.uiContainer.style.fontSize = isMobile ? '14px' : '16px';
    
    // Adjust layout for orientation
    if (isLandscape) {
      // For landscape orientation, position UI elements differently
      this.uiContainer.style.top = '10px';
      this.uiContainer.style.left = '10px';
      this.uiContainer.style.right = 'auto';
      this.uiContainer.style.width = '30%';
      this.uiContainer.style.maxWidth = '300px';
    } else {
      // For portrait orientation, stretch UI across top
      this.uiContainer.style.top = '10px';
      this.uiContainer.style.left = '10px';
      this.uiContainer.style.right = '10px';
      this.uiContainer.style.width = 'auto';
    }
    
    // Adjust health bars for screen size
    const barHeight = isMobile ? '8px' : '10px';
    this.playerHealthBar.style.height = barHeight;
    for (let i = 0; i < this.enemyHealthBars.length; i++) {
      this.enemyHealthBars[i].bar.style.height = barHeight;
    }
    
    // Adjust controls info
    if (this.controlsInfo) {
      if (isMobile) {
        this.controlsInfo.style.display = 'none';
      } else {
        this.controlsInfo.style.display = 'block';
        if (isLandscape) {
          this.controlsInfo.style.right = '10px';
          this.controlsInfo.style.bottom = '10px';
          this.controlsInfo.style.left = 'auto';
        } else {
          this.controlsInfo.style.right = '10px';
          this.controlsInfo.style.bottom = '10px';
        }
      }
    }
  }
}