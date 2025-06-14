/**
 * BattleStatUI - Displays battle statistics like remaining players
 */

export class BattleStatUI {  /**
   * @param {Object} options - Configuration options
   * @param {Function} options.getPlayerCount - Function that returns the current player count
   * @param {Function} options.onExit - Function to call when exit button is clicked
   */
  constructor(options = {}) {
    this.getPlayerCount = options.getPlayerCount || (() => 1);
    this.onExit = options.onExit || (() => {});
    this.totalPlayers = 14; // Default 13 bots + player = 14 total
    this.remainingPlayers = this.totalPlayers;
    this.exitButtonVisible = false;
    
    // UI element for displaying player count
    this.createPlayerCountUI();
  }
  
  /**
   * Create the UI element for player count
   */
  createPlayerCountUI() {
    // Check if element already exists
    this.playerCountContainer = document.getElementById('playerCountContainer');
    if (this.playerCountContainer) {
      document.body.removeChild(this.playerCountContainer);
    }
    
    // Create container for player count display
    this.playerCountContainer = document.createElement('div');
    this.playerCountContainer.id = 'playerCountContainer';
    this.playerCountContainer.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(0, 0, 0, 0.7);
      color: #FFFFFF;
      padding: 10px 15px;
      border-radius: 5px;
      border: 2px solid #3498db;
      font-size: 16px;
      font-weight: bold;
      z-index: 1000;
      text-shadow: 1px 1px 2px black;
    `;
    
    // Create element for player count text
    this.playerCountText = document.createElement('div');
    this.playerCountText.id = 'playerCountText';
    this.playerCountText.innerHTML = `Players Remaining: ${this.remainingPlayers}/${this.totalPlayers}`;
    
    // Add elements to DOM
    this.playerCountContainer.appendChild(this.playerCountText);
    document.body.appendChild(this.playerCountContainer);
  }
  
  /**
   * Update the player count display
   * @param {number} remainingPlayers - Number of remaining players (including the player)
   */
  updatePlayerCount(remainingPlayers) {
    this.remainingPlayers = remainingPlayers;
    
    if (this.playerCountText) {
      this.playerCountText.innerHTML = `Players Remaining: ${this.remainingPlayers}/${this.totalPlayers}`;
      
      // Change color based on number of remaining players
      if (this.remainingPlayers <= 3) {
        this.playerCountText.style.color = '#FF5555'; // Red for few players left
      } else if (this.remainingPlayers <= 6) {
        this.playerCountText.style.color = '#FFAA00'; // Orange for moderate players left
      } else {
        this.playerCountText.style.color = '#FFFFFF'; // White for many players left
      }
    }
  }
  
  /**
   * Set the total number of players in the battle
   * @param {number} totalPlayers - Total number of players including the user
   */
  setTotalPlayers(totalPlayers) {
    this.totalPlayers = totalPlayers;
    this.updatePlayerCount(this.remainingPlayers);
  }
  
  /**
   * Update the battle stats display
   */
  update() {
    // Get updated player count
    const playerCount = this.getPlayerCount();
    this.updatePlayerCount(playerCount);
  }
    /**
   * Remove the UI elements from the DOM
   */
  cleanup() {
    if (this.playerCountContainer && this.playerCountContainer.parentNode) {
      this.playerCountContainer.parentNode.removeChild(this.playerCountContainer);
    }
    
    // Also clean up exit button if present
    this.hideExitButton();
  }
  
  /**
   * Show exit button when player dies
   */
  showExitButton() {
    if (this.exitButtonVisible) return;
    this.exitButtonVisible = true;
    
    // Create exit button
    this.exitButton = document.createElement('div');
    this.exitButton.id = 'battleExitButton';    this.exitButton.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(220, 53, 69, 0.9);
      color: #FFFFFF;
      padding: 15px 30px;
      border-radius: 8px;
      border: 3px solid #FFFFFF;
      font-size: 24px;
      font-weight: bold;
      z-index: 9999;
      text-shadow: 1px 1px 2px black;
      cursor: pointer;
      animation: pulse 1.5s infinite;
      user-select: none;
      box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
      pointer-events: auto !important;
      transition: all 0.2s ease;
    `;
    
    // Add hover effect to make it more interactive
    this.exitButton.onmouseover = function() {
      this.style.backgroundColor = 'rgba(220, 53, 69, 1)';
      this.style.transform = 'translate(-50%, -50%) scale(1.1)';
    };
    
    this.exitButton.onmouseout = function() {
      this.style.backgroundColor = 'rgba(220, 53, 69, 0.9)';
      this.style.transform = 'translate(-50%, -50%)';
    };
    this.exitButton.innerHTML = 'QUIT TO MENU';
    
    // Add pulse animation
    const style = document.createElement('style');
    style.id = 'battleExitButtonStyle';
    style.textContent = `
      @keyframes pulse {
        0% { transform: translate(-50%, -50%) scale(1); }
        50% { transform: translate(-50%, -50%) scale(1.05); }
        100% { transform: translate(-50%, -50%) scale(1); }
      }
    `;
    document.head.appendChild(style);
      // Add click event with more robust handling
    this.exitButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('🚪 Exit button clicked, calling onExit()');
      if (typeof this.onExit === 'function') {
        this.onExit();
      } else {
        console.error('Exit handler is not a function');
        // Fallback - dispatch event directly
        window.dispatchEvent(new CustomEvent('game:exitToMenu'));
      }
    });
    
    // Add to DOM with higher z-index to ensure it's clickable
    document.body.appendChild(this.exitButton);
  }
  
  /**
   * Hide the exit button
   */
  hideExitButton() {
    if (!this.exitButtonVisible) return;
    
    if (this.exitButton && this.exitButton.parentNode) {
      this.exitButton.parentNode.removeChild(this.exitButton);
    }
    
    const style = document.getElementById('battleExitButtonStyle');
    if (style && style.parentNode) {
      style.parentNode.removeChild(style);
    }
    
    this.exitButtonVisible = false;
  }
}
