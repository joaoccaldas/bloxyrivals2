// respawnSystem.js
// Player respawn system with countdown timer

export class RespawnSystem {
  constructor(game, respawnDelay = 5000) {
    this.game = game;
    this.respawnDelay = respawnDelay; // 5 seconds default
    this.isRespawning = false;
    this.respawnStartTime = null;
    this.respawnCountdown = 0;
    this.originalPosition = { x: 100, y: 100 }; // Default spawn position
    this.onRespawnComplete = null;
    
    // Visual styling for countdown
    this.countdownStyle = {
      font: 'bold 48px Arial',
      color: '#FF4444',
      outlineColor: '#000000',
      outlineWidth: 3,
      pulseSpeed: 2
    };
  }

  /**
   * Start the respawn process
   * @param {Object} player - Player object
   * @param {Function} onComplete - Callback when respawn is complete
   */
  startRespawn(player, onComplete = null) {
    if (this.isRespawning) return;
    
    console.log('💀 Player died - starting respawn countdown...');
    
    // Store original spawn position or use player's current position
    // MODIFIED: Use player's defined initial spawn position
    this.originalPosition = {
      x: player.initialX, // Use initialX from player object
      y: player.initialY  // Use initialY from player object
    };
    
    this.isRespawning = true;
    this.respawnStartTime = Date.now();
    this.respawnCountdown = Math.ceil(this.respawnDelay / 1000);
    this.onRespawnComplete = onComplete;
    
    // Hide player during respawn
    player.isVisible = false;
    player.isDead = true;
    
    // Start countdown update loop
    this.updateCountdown();
    
    console.log(`⏰ Respawn countdown started: ${this.respawnCountdown} seconds`);
  }

  /**
   * Update countdown timer
   */
  updateCountdown() {
    if (!this.isRespawning) return;
    
    const elapsed = Date.now() - this.respawnStartTime;
    const remaining = Math.max(0, this.respawnDelay - elapsed);
    this.respawnCountdown = Math.ceil(remaining / 1000);
    
    if (remaining <= 0) {
      this.completeRespawn();
    } else {
      // Continue countdown
      setTimeout(() => this.updateCountdown(), 100);
    }
  }

  /**
   * Complete the respawn process
   */
  completeRespawn() {
    if (!this.isRespawning) return;
    
    console.log('✨ Respawn complete - player is back!');
    
    const player = this.game.player;
    
    // Reset player state
    player.health = player.maxHealth;
    player.x = this.originalPosition.x;
    player.y = this.originalPosition.y;
    player.isVisible = true;
    player.isDead = false;
    
    // Clear respawn state
    this.isRespawning = false;
    this.respawnStartTime = null;
    this.respawnCountdown = 0;
    
    // Resume game
    if (this.game.state === 'respawning') {
      this.game.state = 'playing';
    }
    
    // Call completion callback
    if (this.onRespawnComplete) {
      this.onRespawnComplete();
    }
    
    console.log('🎮 Game resumed after respawn');
  }

  /**
   * Cancel respawn (if needed)
   */
  cancelRespawn() {
    if (!this.isRespawning) return;
    
    console.log('❌ Respawn cancelled');
    this.isRespawning = false;
    this.respawnStartTime = null;
    this.respawnCountdown = 0;
  }

  /**
   * Draw countdown overlay
   * @param {CanvasRenderingContext2D} ctx 
   * @param {Object} canvas 
   */
  drawCountdownOverlay(ctx, canvas) {
    if (!this.isRespawning || this.respawnCountdown <= 0) return;
    
    ctx.save();
    
    // Dark overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Calculate pulse effect
    const pulseTime = (Date.now() % 1000) / 1000;
    const pulseScale = 1 + Math.sin(pulseTime * Math.PI * this.countdownStyle.pulseSpeed) * 0.1;
    
    // Draw "Player Dead" text
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Death message
    ctx.font = 'bold 32px Arial';
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = this.countdownStyle.outlineColor;
    ctx.lineWidth = 2;
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2 - 60;
    
    ctx.strokeText('💀 YOU DIED', centerX, centerY);
    ctx.fillText('💀 YOU DIED', centerX, centerY);
    
    // Respawn countdown
    ctx.font = this.countdownStyle.font;
    ctx.fillStyle = this.countdownStyle.color;
    ctx.strokeStyle = this.countdownStyle.outlineColor;
    ctx.lineWidth = this.countdownStyle.outlineWidth;
    
    // Apply pulse effect
    ctx.save();
    ctx.translate(centerX, centerY + 80);
    ctx.scale(pulseScale, pulseScale);
    
    const countdownText = this.respawnCountdown.toString();
    ctx.strokeText(countdownText, 0, 0);
    ctx.fillText(countdownText, 0, 0);
    
    ctx.restore();
    
    // "Respawning in..." text
    ctx.font = 'bold 24px Arial';
    ctx.fillStyle = '#CCCCCC';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    
    const respawnText = `Respawning in...`;
    ctx.strokeText(respawnText, centerX, centerY + 140);
    ctx.fillText(respawnText, centerX, centerY + 140);
    
    ctx.restore();
  }

  /**
   * Check if currently respawning
   * @returns {boolean}
   */
  isCurrentlyRespawning() {
    return this.isRespawning;
  }

  /**
   * Get remaining respawn time in seconds
   * @returns {number}
   */
  getRemainingTime() {
    if (!this.isRespawning) return 0;
    return this.respawnCountdown;
  }

  /**
   * Set respawn delay
   * @param {number} delay - Delay in milliseconds
   */
  setRespawnDelay(delay) {
    this.respawnDelay = delay;
  }

  /**
   * Set spawn position
   * @param {number} x 
   * @param {number} y 
   */
  setSpawnPosition(x, y) {
    this.originalPosition = { x, y };
  }
}
