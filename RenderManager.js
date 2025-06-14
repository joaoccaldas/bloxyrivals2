// RenderManager.js
// Manages all rendering operations and visual effects

export class RenderManager {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;
    
    // Visual effects state
    this.damageFlash = 0;
    this.lowHealthPulse = 0;
    
    // Rendering options
    this.options = {
      enableDamageFlash: true,
      enableLowHealthPulse: true,
      enableParticleEffects: true,
      showDebugInfo: false
    };

    // Performance tracking
    this.frameCount = 0;
    this.lastFpsTime = performance.now();
    this.fps = 0;
    this.lastUpdateTime = 0;
    this.lastRenderTime = 0;
  }

  /**
   * Set rendering options
   * @param {Object} options - Rendering options to set
   */
  setOptions(options) {
    this.options = { ...this.options, ...options };
  }

  /**
   * Clear the canvas
   * @param {string} color - Background color (default: '#1C7ED6')
   */
  clearCanvas(color = '#1C7ED6') {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * Render the game world and entities
   * @param {Object} gameData - Game data containing entities and camera
   */
  renderGame(gameData) {
    const { world, entities, camera, weatherSystem } = gameData;

    // Clear canvas
    this.clearCanvas();

    // Begin camera transformation
    camera.begin(this.ctx);

    // Render world
    if (world) {
      world.draw(this.ctx);
    }    // Render entities
    if (entities) {
      // Render mobs (they handle their own directional sprites)
      entities.getMobs().forEach(mob => mob.draw(this.ctx));
      
      // Render player (let player handle directional sprites internally using movement deltas)
      const player = entities.getPlayer();
      player.draw(this.ctx);
      
      // Render damage numbers
      entities.getDamageNumbers().forEach(dmgNum => dmgNum.draw(this.ctx));
    }// Render attack range indicator (if available)
    if (gameData.controls && gameData.controls.drawAttackRange) {
      gameData.controls.drawAttackRange(this.ctx);
    }

    // Render medal system
    if (gameData.medalSystem) {
      gameData.medalSystem.render(this.ctx, camera);
    }

    // End camera transformation
    camera.end(this.ctx);

    // Render weather effects (handles its own camera transformations)
    if (weatherSystem) {
      weatherSystem.draw(this.ctx, camera);
    }
  }

  /**
   * Render UI elements
   * @param {Object} uiData - UI data containing score, health, etc.
   * @param {number} delta - Time delta for animations
   */  renderUI(uiData, delta) {
    const { scoreManager, player, controls, medalSystem } = uiData;

    // Update visual effects
    this._updateVisualEffects(delta, player);

    // Render joystick controls (if mobile)
    if (controls && controls.drawJoystick) {
      controls.drawJoystick(this.ctx);
    }

    // Render damage flash effect
    if (this.options.enableDamageFlash) {
      this._renderDamageFlash();
    }

    // Render low health pulse effect
    if (this.options.enableLowHealthPulse && player) {
      this._renderLowHealthPulse(player);
    }

    // Render score and stats
    if (scoreManager) {
      this._renderScoreUI(scoreManager);
    }

    // Render medal system UI
    if (medalSystem) {
      medalSystem.renderUI(this.ctx, 300, 10); // Position next to score
    }

    // Render debug info
    if (this.options.showDebugInfo) {
      this._renderDebugInfo(uiData);
    }

    // Update FPS counter
    this._updateFPS();
  }

  /**
   * Trigger damage flash effect
   * @param {number} intensity - Flash intensity (0-1)
   */
  triggerDamageFlash(intensity = 1.0) {
    this.damageFlash = Math.max(this.damageFlash, 200 * intensity);
  }

  /**
   * Update visual effects
   * @private
   */
  _updateVisualEffects(delta, player) {
    // Update damage flash
    if (this.damageFlash > 0) {
      this.damageFlash -= delta;
      this.damageFlash = Math.max(0, this.damageFlash);
    }

    // Update low health pulse
    if (player && player.health < player.maxHealth * 0.3) {
      this.lowHealthPulse += delta * 0.01;
      if (this.lowHealthPulse > Math.PI * 2) {
        this.lowHealthPulse = 0;
      }
    } else {
      this.lowHealthPulse = 0;
    }
  }

  /**
   * Render damage flash effect
   * @private
   */
  _renderDamageFlash() {
    if (this.damageFlash <= 0) return;

    this.ctx.save();
    this.ctx.fillStyle = `rgba(255,0,0,${Math.min(this.damageFlash / 200, 0.5)})`;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.restore();
  }

  /**
   * Render low health pulse effect
   * @private
   */
  _renderLowHealthPulse(player) {
    if (this.lowHealthPulse <= 0) return;

    const pulse = Math.sin(this.lowHealthPulse * 5) * 0.3 + 0.3;
    this.ctx.save();
    this.ctx.fillStyle = `rgba(255,0,0,${pulse * 0.2})`;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.restore();
  }

  /**
   * Render score and statistics UI
   * @private
   */
  _renderScoreUI(scoreManager) {
    const stats = scoreManager.getStats();
    
    this.ctx.save();
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = 'bold 16px Arial';
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 2;

    // Score
    const scoreText = `Score: ${stats.currentScore}`;
    this.ctx.strokeText(scoreText, 10, 30);
    this.ctx.fillText(scoreText, 10, 30);

    // Kills
    const killsText = `Kills: ${stats.currentKills}`;
    this.ctx.strokeText(killsText, 10, 55);
    this.ctx.fillText(killsText, 10, 55);

    // High Score
    const highScoreText = `High Score: ${stats.highScore}`;
    this.ctx.strokeText(highScoreText, 10, 80);
    this.ctx.fillText(highScoreText, 10, 80);

    // Play Time
    const timeText = `Time: ${stats.playTimeFormatted}`;
    this.ctx.strokeText(timeText, 10, 105);
    this.ctx.fillText(timeText, 10, 105);

    this.ctx.restore();
  }

  /**
   * Render debug information
   * @private
   */
  _renderDebugInfo(uiData) {
    const { entities, player } = uiData;
    
    this.ctx.save();
    this.ctx.fillStyle = '#FFFF00';
    this.ctx.font = '12px monospace';
    
    let y = this.canvas.height - 100;
    
    // FPS
    this.ctx.fillText(`FPS: ${this.fps}`, 10, y);
    y += 15;
    
    // Entity count
    if (entities) {
      this.ctx.fillText(`Mobs: ${entities.getMobs().length}`, 10, y);
      y += 15;
      this.ctx.fillText(`Damage Numbers: ${entities.getDamageNumbers().length}`, 10, y);
      y += 15;
    }
    
    // Player position
    if (player) {
      this.ctx.fillText(`Player: (${Math.round(player.x)}, ${Math.round(player.y)})`, 10, y);
      y += 15;
      this.ctx.fillText(`Health: ${player.health}/${player.maxHealth}`, 10, y);
    }
    
    this.ctx.restore();
  }

  /**
   * Update FPS counter
   * @private
   */
  _updateFPS() {
    this.frameCount++;
    const now = performance.now();
    
    if (now - this.lastFpsTime >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / (now - this.lastFpsTime));
      this.frameCount = 0;
      this.lastFpsTime = now;
    }
  }

  /**
   * Render a loading screen
   * @param {string} message - Loading message
   * @param {number} progress - Loading progress (0-1)
   */
  renderLoadingScreen(message = 'Loading...', progress = 0) {
    this.clearCanvas('#2C3E50');
    
    this.ctx.save();
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = 'bold 24px Arial';
    this.ctx.textAlign = 'center';
    
    // Loading text
    this.ctx.fillText(message, this.canvas.width / 2, this.canvas.height / 2 - 50);
    
    // Progress bar
    if (progress > 0) {
      const barWidth = 300;
      const barHeight = 20;
      const x = (this.canvas.width - barWidth) / 2;
      const y = this.canvas.height / 2;
      
      // Background
      this.ctx.fillStyle = '#34495E';
      this.ctx.fillRect(x, y, barWidth, barHeight);
      
      // Progress
      this.ctx.fillStyle = '#3498DB';
      this.ctx.fillRect(x, y, barWidth * progress, barHeight);
      
      // Border
      this.ctx.strokeStyle = '#FFFFFF';
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(x, y, barWidth, barHeight);
      
      // Percentage
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.font = '14px Arial';
      this.ctx.fillText(`${Math.round(progress * 100)}%`, this.canvas.width / 2, y + 40);
    }
    
    this.ctx.restore();
  }

  /**
   * Render a game over screen
   * @param {Object} finalStats - Final game statistics
   */
  renderGameOverScreen(finalStats) {
    this.clearCanvas('#2C3E50');
    
    this.ctx.save();
    this.ctx.textAlign = 'center';
    
    // Game Over title
    this.ctx.fillStyle = '#E74C3C';
    this.ctx.font = 'bold 48px Arial';
    this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 100);
    
    // Final stats
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = 'bold 20px Arial';
    
    let y = this.canvas.height / 2 - 30;
    this.ctx.fillText(`Final Score: ${finalStats.currentScore}`, this.canvas.width / 2, y);
    y += 30;
    this.ctx.fillText(`Mobs Killed: ${finalStats.currentKills}`, this.canvas.width / 2, y);
    y += 30;
    this.ctx.fillText(`Survival Time: ${finalStats.playTimeFormatted}`, this.canvas.width / 2, y);
    
    // High score notification
    if (finalStats.currentScore >= finalStats.highScore) {
      y += 50;
      this.ctx.fillStyle = '#F1C40F';
      this.ctx.font = 'bold 24px Arial';
      this.ctx.fillText('NEW HIGH SCORE!', this.canvas.width / 2, y);
    }
    
    this.ctx.restore();
  }

  /**
   * Get current FPS
   * @returns {number} Current FPS
   */
  getFPS() {
    return this.fps;
  }

  /**
   * Get last update time in milliseconds
   * @returns {number} Last update time
   */
  getLastUpdateTime() {
    return this.lastUpdateTime;
  }

  /**
   * Get last render time in milliseconds
   * @returns {number} Last render time
   */
  getLastRenderTime() {
    return this.lastRenderTime;
  }

  /**
   * Record update timing
   * @param {number} startTime - Start time of update
   */
  recordUpdateTime(startTime) {
    this.lastUpdateTime = performance.now() - startTime;
  }

  /**
   * Record render timing
   * @param {number} startTime - Start time of render
   */
  recordRenderTime(startTime) {
    this.lastRenderTime = performance.now() - startTime;
  }

  /**
   * Enable/disable debug mode
   * @param {boolean} enabled - Whether to enable debug mode
   */
  setDebugMode(enabled) {
    this.options.showDebugInfo = enabled;
  }
}
