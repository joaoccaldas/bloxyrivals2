// Dynamic Difficulty Scaling System
// Automatically adjusts game difficulty based on player performance

export class DifficultySystem {
  constructor(game) {
    this.game = game;
      // Difficulty scaling parameters (adjusted for easier gameplay)
    this.currentLevel = 1;
    this.maxLevel = 10;
    this.scoreThreshold = 150; // Increased points needed to increase difficulty
    this.timeThreshold = 45000; // 45 seconds survival increases difficulty (increased from 30s)
    
    // Performance tracking
    this.playerStats = {
      totalKills: 0,
      survivalTime: 0,
      currentScore: 0,
      lastDifficultyIncrease: 0,
      averageDamageDealt: 0,
      averageDamageTaken: 0
    };
      // Scaling factors for each difficulty level (reduced for easier gameplay)
    this.difficultyModifiers = {
      1: { mobSpeed: 0.8, mobHealth: 0.7, mobSpawnRate: 0.8, powerUpSpawnRate: 1.2 },
      2: { mobSpeed: 0.85, mobHealth: 0.8, mobSpawnRate: 0.9, powerUpSpawnRate: 1.1 },
      3: { mobSpeed: 0.9, mobHealth: 0.9, mobSpawnRate: 1.0, powerUpSpawnRate: 1.0 },
      4: { mobSpeed: 0.95, mobHealth: 1.0, mobSpawnRate: 1.1, powerUpSpawnRate: 0.9 },
      5: { mobSpeed: 1.0, mobHealth: 1.05, mobSpawnRate: 1.2, powerUpSpawnRate: 0.8 },
      6: { mobSpeed: 1.1, mobHealth: 1.1, mobSpawnRate: 1.3, powerUpSpawnRate: 0.7 },
      7: { mobSpeed: 1.2, mobHealth: 1.2, mobSpawnRate: 1.4, powerUpSpawnRate: 0.6 },
      8: { mobSpeed: 1.3, mobHealth: 1.3, mobSpawnRate: 1.5, powerUpSpawnRate: 0.5 },
      9: { mobSpeed: 1.4, mobHealth: 1.4, mobSpawnRate: 1.6, powerUpSpawnRate: 0.4 },
      10: { mobSpeed: 1.5, mobHealth: 1.5, mobSpawnRate: 1.7, powerUpSpawnRate: 0.3 }
    };
    
    // Visual feedback
    this.showDifficultyNotification = false;
    this.notificationTimer = 0;
    this.notificationDuration = 3000; // 3 seconds
    
    console.log('🎚️ Dynamic Difficulty System initialized');
  }

  /**
   * Update difficulty based on player performance
   * @param {number} delta - Time delta
   */
  update(delta) {
    if (!this.game.player || this.game.state !== 'playing') return;
    
    // Track survival time
    this.playerStats.survivalTime += delta;
    this.playerStats.currentScore = this.game.score || 0;
    
    // Check if difficulty should increase
    this.checkDifficultyIncrease();
    
    // Update notification timer
    if (this.showDifficultyNotification) {
      this.notificationTimer -= delta;
      if (this.notificationTimer <= 0) {
        this.showDifficultyNotification = false;
      }
    }
  }

  /**
   * Check if difficulty should be increased
   */
  checkDifficultyIncrease() {
    if (this.currentLevel >= this.maxLevel) return;
    
    const scoreIncrease = this.playerStats.currentScore - this.playerStats.lastDifficultyIncrease;
    const shouldIncrease = 
      scoreIncrease >= this.scoreThreshold || 
      this.playerStats.survivalTime >= this.timeThreshold * this.currentLevel;
    
    if (shouldIncrease) {
      this.increaseDifficulty();
    }
  }

  /**
   * Increase difficulty level
   */
  increaseDifficulty() {
    if (this.currentLevel >= this.maxLevel) return;
    
    this.currentLevel++;
    this.playerStats.lastDifficultyIncrease = this.playerStats.currentScore;
    
    // Apply new modifiers
    this.applyDifficultyModifiers();
    
    // Show notification
    this.showDifficultyNotification = true;
    this.notificationTimer = this.notificationDuration;
    
    console.log(`🔥 Difficulty increased to level ${this.currentLevel}!`);
    
    // Optional: Play sound effect or screen flash
    this.triggerDifficultyIncreaseFeedback();
  }

  /**
   * Apply difficulty modifiers to game systems
   */
  applyDifficultyModifiers() {
    const modifiers = this.difficultyModifiers[this.currentLevel];
    if (!modifiers) return;
    
    // Apply to existing mobs
    if (this.game.mobs) {
      this.game.mobs.forEach(mob => {
        mob.speed = (mob.baseSpeed || mob.speed) * modifiers.mobSpeed;
        mob.maxHealth = (mob.baseMaxHealth || mob.maxHealth) * modifiers.mobHealth;
        if (mob.health > mob.maxHealth) {
          mob.health = mob.maxHealth;
        }
      });
    }
    
    // Store modifiers for new spawns
    this.game.difficultyModifiers = modifiers;
  }

  /**
   * Get current difficulty modifiers
   * @returns {Object}
   */
  getCurrentModifiers() {
    return this.difficultyModifiers[this.currentLevel] || this.difficultyModifiers[1];
  }

  /**
   * Trigger visual feedback for difficulty increase
   */
  triggerDifficultyIncreaseFeedback() {
    // Screen flash effect
    if (this.game.ctx) {
      const canvas = this.game.canvas;
      const ctx = this.game.ctx;
      
      // Brief red flash
      ctx.save();
      ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
    }
  }

  /**
   * Draw difficulty UI
   * @param {CanvasRenderingContext2D} ctx 
   */
  draw(ctx) {
    if (!ctx) return;
    
    ctx.save();
    
    // Draw difficulty level indicator
    ctx.font = '16px Arial';
    ctx.fillStyle = this.getDifficultyColor();
    ctx.textAlign = 'left';
    ctx.fillText(`Difficulty: Level ${this.currentLevel}`, 20, 100);
    
    // Draw difficulty notification
    if (this.showDifficultyNotification) {
      this.drawDifficultyNotification(ctx);
    }
    
    ctx.restore();
  }

  /**
   * Draw difficulty increase notification
   * @param {CanvasRenderingContext2D} ctx 
   */
  drawDifficultyNotification(ctx) {
    const canvas = this.game.canvas;
    const centerX = canvas.width / 2;
    const centerY = canvas.height * 0.3;
    
    // Pulsing effect
    const pulse = Math.sin(Date.now() * 0.01) * 0.1 + 1;
    
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = `${24 * pulse}px Arial`;
    ctx.fillStyle = '#FF6B35';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    
    const text = `DIFFICULTY INCREASED! LEVEL ${this.currentLevel}`;
    ctx.strokeText(text, centerX, centerY);
    ctx.fillText(text, centerX, centerY);
    
    // Subtitle
    ctx.font = '16px Arial';
    ctx.fillStyle = '#FFF';
    ctx.fillText('Enemies are now stronger and faster!', centerX, centerY + 30);
    
    ctx.restore();
  }

  /**
   * Get difficulty color based on level
   * @returns {string}
   */
  getDifficultyColor() {
    const colors = [
      '#00FF00', // Green - Easy
      '#7FFF00', // Lime
      '#FFFF00', // Yellow
      '#FF7F00', // Orange
      '#FF4500', // Red-Orange
      '#FF0000', // Red
      '#8B0000', // Dark Red
      '#4B0082', // Indigo
      '#8B008B', // Dark Magenta
      '#FF1493'  // Deep Pink - Nightmare
    ];
    return colors[this.currentLevel - 1] || colors[colors.length - 1];
  }

  /**
   * Reset difficulty (for new game)
   */
  reset() {
    this.currentLevel = 1;
    this.playerStats = {
      totalKills: 0,
      survivalTime: 0,
      currentScore: 0,
      lastDifficultyIncrease: 0,
      averageDamageDealt: 0,
      averageDamageTaken: 0
    };
    this.showDifficultyNotification = false;
    this.notificationTimer = 0;
    
    // Reset game modifiers
    if (this.game.difficultyModifiers) {
      this.game.difficultyModifiers = this.difficultyModifiers[1];
    }
    
    console.log('🔄 Difficulty system reset');
  }

  /**
   * Track player kill for stats
   */
  recordKill() {
    this.playerStats.totalKills++;
  }

  /**
   * Get performance summary
   * @returns {Object}
   */
  getPerformanceSummary() {
    return {
      level: this.currentLevel,
      kills: this.playerStats.totalKills,
      survivalTime: Math.floor(this.playerStats.survivalTime / 1000),
      score: this.playerStats.currentScore
    };
  }

  /**
   * Set player level from medal system
   * @param {number} medalLevel - Player level from medal progression
   */
  setPlayerLevel(medalLevel) {
    // Map medal level to difficulty level (medal levels go higher than difficulty levels)
    const mappedLevel = Math.min(Math.max(1, Math.floor(medalLevel / 5) + 1), this.maxLevel);
    
    if (mappedLevel !== this.currentLevel) {
      const oldLevel = this.currentLevel;
      this.currentLevel = mappedLevel;
      
      this.showDifficultyNotification = true;
      this.notificationTimer = this.notificationDuration;
      
      console.log(`🎚️ Difficulty adjusted based on medal progression: Level ${oldLevel} → ${this.currentLevel} (Medal Level: ${medalLevel})`);
    }
  }
}
