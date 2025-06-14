// Combo & Chain Kill System
// Rewards players for consecutive kills with multipliers and special effects

export class ComboSystem {
  constructor(game) {
    this.game = game;
    
    // Combo tracking
    this.currentCombo = 0;
    this.maxCombo = 0;
    this.comboTimer = 0;
    this.comboTimeLimit = 3000; // 3 seconds to maintain combo
    this.lastKillTime = 0;
    
    // Multiplier system
    this.baseMultiplier = 1;
    this.comboMultipliers = {
      5: 1.5,   // 5 kills = 1.5x points
      10: 2.0,  // 10 kills = 2x points
      15: 2.5,  // 15 kills = 2.5x points
      20: 3.0,  // 20 kills = 3x points
      25: 3.5,  // 25 kills = 3.5x points
      30: 4.0,  // 30+ kills = 4x points
      50: 5.0   // 50+ kills = 5x points (legendary!)
    };
    
    // Chain kill effects
    this.chainEffects = {
      explosionRadius: 80,
      explosionDamage: 50,
      lightningChance: 0.3, // 30% chance for lightning at 10+ combo
      freezeChance: 0.2,     // 20% chance for freeze at 15+ combo
      fireChance: 0.25       // 25% chance for fire spread at 20+ combo
    };
    
    // Visual effects
    this.comboParticles = [];
    this.comboFlashTimer = 0;
    this.comboFlashDuration = 200;
    this.showComboText = false;
    this.comboTextTimer = 0;
    this.comboTextDuration = 2000;
    
    // Achievement tracking
    this.achievements = {
      firstCombo: false,
      comboMaster: false,
      chainReaction: false,
      unstoppable: false
    };
    
    console.log('⚡ Combo System initialized');
  }

  /**
   * Update combo system
   * @param {number} delta - Time delta
   */
  update(delta) {
    // Update combo timer
    if (this.currentCombo > 0) {
      this.comboTimer -= delta;
      if (this.comboTimer <= 0) {
        this.resetCombo();
      }
    }
    
    // Update visual effects
    this.updateParticles(delta);
    
    if (this.comboFlashTimer > 0) {
      this.comboFlashTimer -= delta;
    }
    
    if (this.showComboText && this.comboTextTimer > 0) {
      this.comboTextTimer -= delta;
      if (this.comboTextTimer <= 0) {
        this.showComboText = false;
      }
    }
  }

  /**
   * Register a kill and update combo
   * @param {Object} mob - The killed mob
   * @param {Object} killPosition - Position where kill occurred
   */
  registerKill(mob, killPosition) {
    this.currentCombo++;
    this.comboTimer = this.comboTimeLimit;
    this.lastKillTime = Date.now();
    
    // Update max combo
    if (this.currentCombo > this.maxCombo) {
      this.maxCombo = this.currentCombo;
    }
    
    // Calculate points with multiplier
    const basePoints = mob.points || 10;
    const multiplier = this.getCurrentMultiplier();
    const totalPoints = Math.floor(basePoints * multiplier);
    
    // Add points to game
    if (this.game.addScore) {
      this.game.addScore(totalPoints - basePoints); // Add bonus points
    }
    
    // Trigger combo effects
    this.triggerComboEffects(killPosition);
    
    // Create combo particles
    this.createComboParticles(killPosition);
    
    // Show combo text
    this.showComboText = true;
    this.comboTextTimer = this.comboTextDuration;
    
    // Trigger flash effect
    this.comboFlashTimer = this.comboFlashDuration;
    
    // Check achievements
    this.checkAchievements();
    
    console.log(`🔥 Combo: ${this.currentCombo}x (${multiplier}x multiplier, +${totalPoints} points)`);
  }

  /**
   * Reset combo counter
   */
  resetCombo() {
    if (this.currentCombo > 0) {
      console.log(`💔 Combo broken at ${this.currentCombo}x`);
      this.currentCombo = 0;
      this.comboTimer = 0;
    }
  }

  /**
   * Get current score multiplier
   * @returns {number}
   */
  getCurrentMultiplier() {
    let multiplier = this.baseMultiplier;
    
    for (const [threshold, mult] of Object.entries(this.comboMultipliers)) {
      if (this.currentCombo >= parseInt(threshold)) {
        multiplier = mult;
      }
    }
    
    return multiplier;
  }

  /**
   * Trigger special combo effects
   * @param {Object} position - Position to trigger effects
   */
  triggerComboEffects(position) {
    if (this.currentCombo >= 10 && Math.random() < this.chainEffects.lightningChance) {
      this.triggerLightningEffect(position);
    }
    
    if (this.currentCombo >= 15 && Math.random() < this.chainEffects.freezeChance) {
      this.triggerFreezeEffect(position);
    }
    
    if (this.currentCombo >= 20 && Math.random() < this.chainEffects.fireChance) {
      this.triggerFireEffect(position);
    }
    
    // Explosion effect for high combos
    if (this.currentCombo >= 5 && this.currentCombo % 5 === 0) {
      this.triggerExplosionEffect(position);
    }
  }

  /**
   * Lightning effect - damages nearby enemies
   * @param {Object} center - Center position
   */
  triggerLightningEffect(center) {
    if (!this.game.mobs) return;
    
    const lightningRange = 120;
    const lightningDamage = 30;
    
    this.game.mobs.forEach(mob => {
      const distance = Math.sqrt(
        Math.pow(mob.x - center.x, 2) + Math.pow(mob.y - center.y, 2)
      );
      
      if (distance <= lightningRange) {
        mob.takeDamage(lightningDamage);
        
        // Create lightning visual effect
        this.createLightningEffect(center, { x: mob.x, y: mob.y });
      }
    });
    
    console.log('⚡ Lightning effect triggered!');
  }

  /**
   * Freeze effect - slows nearby enemies
   * @param {Object} center - Center position
   */
  triggerFreezeEffect(center) {
    if (!this.game.mobs) return;
    
    const freezeRange = 100;
    const freezeDuration = 2000; // 2 seconds
    
    this.game.mobs.forEach(mob => {
      const distance = Math.sqrt(
        Math.pow(mob.x - center.x, 2) + Math.pow(mob.y - center.y, 2)
      );
      
      if (distance <= freezeRange) {
        // Apply freeze effect
        mob.speed *= 0.3; // Slow to 30% speed
        mob.frozenUntil = Date.now() + freezeDuration;
        mob.isFrozen = true;
        
        // Visual freeze effect
        this.createFreezeEffect({ x: mob.x, y: mob.y });
      }
    });
    
    console.log('❄️ Freeze effect triggered!');
  }

  /**
   * Fire effect - spreads damage over time
   * @param {Object} center - Center position
   */
  triggerFireEffect(center) {
    if (!this.game.mobs) return;
    
    const fireRange = 90;
    const fireDamage = 5;
    const fireDuration = 3000; // 3 seconds
    
    this.game.mobs.forEach(mob => {
      const distance = Math.sqrt(
        Math.pow(mob.x - center.x, 2) + Math.pow(mob.y - center.y, 2)
      );
      
      if (distance <= fireRange) {
        // Apply burning effect
        mob.burning = {
          damage: fireDamage,
          duration: fireDuration,
          startTime: Date.now()
        };
        
        // Visual fire effect
        this.createFireEffect({ x: mob.x, y: mob.y });
      }
    });
    
    console.log('🔥 Fire effect triggered!');
  }

  /**
   * Explosion effect for combo milestones
   * @param {Object} center - Center position
   */
  triggerExplosionEffect(center) {
    if (!this.game.mobs) return;
    
    const { explosionRadius, explosionDamage } = this.chainEffects;
    
    this.game.mobs.forEach(mob => {
      const distance = Math.sqrt(
        Math.pow(mob.x - center.x, 2) + Math.pow(mob.y - center.y, 2)
      );
      
      if (distance <= explosionRadius) {
        const damage = Math.floor(explosionDamage * (1 - distance / explosionRadius));
        mob.takeDamage(damage);
      }
    });
    
    // Create explosion visual
    this.createExplosionEffect(center);
    
    console.log('💥 Explosion effect triggered!');
  }

  /**
   * Create combo particles
   * @param {Object} position - Position to create particles
   */
  createComboParticles(position) {
    for (let i = 0; i < 5; i++) {
      this.comboParticles.push({
        x: position.x + (Math.random() - 0.5) * 20,
        y: position.y + (Math.random() - 0.5) * 20,
        vx: (Math.random() - 0.5) * 100,
        vy: (Math.random() - 0.5) * 100 - 50,
        life: 1000,
        maxLife: 1000,
        color: this.getComboColor()
      });
    }
  }

  /**
   * Update particles
   * @param {number} delta - Time delta
   */
  updateParticles(delta) {
    this.comboParticles = this.comboParticles.filter(particle => {
      particle.x += particle.vx * delta / 1000;
      particle.y += particle.vy * delta / 1000;
      particle.life -= delta;
      return particle.life > 0;
    });
  }

  /**
   * Get combo color based on current combo
   * @returns {string}
   */
  getComboColor() {
    if (this.currentCombo >= 50) return '#FF1493'; // Hot pink - Legendary
    if (this.currentCombo >= 30) return '#FF4500'; // Red-orange - Epic
    if (this.currentCombo >= 20) return '#FF6B35'; // Orange - Rare
    if (this.currentCombo >= 10) return '#FFD700'; // Gold - Uncommon
    if (this.currentCombo >= 5) return '#00FF00';  // Green - Common
    return '#FFFFFF'; // White - Basic
  }

  /**
   * Create visual effects for special abilities
   */
  createLightningEffect(start, end) {
    // Add lightning effect to game's effect system if available
    if (this.game.addEffect) {
      this.game.addEffect('lightning', { start, end, duration: 300 });
    }
  }

  createFreezeEffect(position) {
    if (this.game.addEffect) {
      this.game.addEffect('freeze', { position, duration: 500 });
    }
  }

  createFireEffect(position) {
    if (this.game.addEffect) {
      this.game.addEffect('fire', { position, duration: 1000 });
    }
  }

  createExplosionEffect(position) {
    if (this.game.addEffect) {
      this.game.addEffect('explosion', { position, radius: this.chainEffects.explosionRadius, duration: 600 });
    }
  }

  /**
   * Check and unlock achievements
   */
  checkAchievements() {
    if (this.currentCombo >= 5 && !this.achievements.firstCombo) {
      this.achievements.firstCombo = true;
      console.log('🏆 Achievement: First Combo! (5x)');
    }
    
    if (this.currentCombo >= 25 && !this.achievements.comboMaster) {
      this.achievements.comboMaster = true;
      console.log('🏆 Achievement: Combo Master! (25x)');
    }
    
    if (this.currentCombo >= 50 && !this.achievements.unstoppable) {
      this.achievements.unstoppable = true;
      console.log('🏆 Achievement: Unstoppable! (50x)');
    }
  }

  /**
   * Draw combo UI and effects
   * @param {CanvasRenderingContext2D} ctx 
   */
  draw(ctx) {
    if (!ctx) return;
    
    ctx.save();
    
    // Draw combo counter
    if (this.currentCombo > 0) {
      this.drawComboCounter(ctx);
    }
    
    // Draw combo text
    if (this.showComboText) {
      this.drawComboText(ctx);
    }
    
    // Draw particles
    this.drawParticles(ctx);
    
    // Draw flash effect
    if (this.comboFlashTimer > 0) {
      this.drawFlashEffect(ctx);
    }
    
    ctx.restore();
  }

  /**
   * Draw combo counter
   * @param {CanvasRenderingContext2D} ctx 
   */
  drawComboCounter(ctx) {
    const canvas = this.game.canvas;
    const x = canvas.width - 150;
    const y = 50;
    
    ctx.font = '24px Arial';
    ctx.fillStyle = this.getComboColor();
    ctx.textAlign = 'right';
    
    const multiplier = this.getCurrentMultiplier();
    ctx.fillText(`${this.currentCombo}x COMBO`, x, y);
    
    if (multiplier > 1) {
      ctx.font = '16px Arial';
      ctx.fillText(`${multiplier}x MULTIPLIER`, x, y + 25);
    }
    
    // Combo timer bar
    const barWidth = 100;
    const barHeight = 4;
    const timePercent = this.comboTimer / this.comboTimeLimit;
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(x - barWidth, y + 35, barWidth, barHeight);
    
    ctx.fillStyle = this.getComboColor();
    ctx.fillRect(x - barWidth, y + 35, barWidth * timePercent, barHeight);
  }

  /**
   * Draw combo achievement text
   * @param {CanvasRenderingContext2D} ctx 
   */
  drawComboText(ctx) {
    const canvas = this.game.canvas;
    const centerX = canvas.width / 2;
    const centerY = canvas.height * 0.25;
    
    const pulse = Math.sin(Date.now() * 0.01) * 0.1 + 1;
    
    ctx.textAlign = 'center';
    ctx.font = `${32 * pulse}px Arial`;
    ctx.fillStyle = this.getComboColor();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    
    let text = '';
    if (this.currentCombo >= 50) text = 'LEGENDARY COMBO!';
    else if (this.currentCombo >= 30) text = 'EPIC COMBO!';
    else if (this.currentCombo >= 20) text = 'AMAZING COMBO!';
    else if (this.currentCombo >= 10) text = 'GREAT COMBO!';
    else if (this.currentCombo >= 5) text = 'NICE COMBO!';
    
    if (text) {
      ctx.strokeText(text, centerX, centerY);
      ctx.fillText(text, centerX, centerY);
    }
  }

  /**
   * Draw particles
   * @param {CanvasRenderingContext2D} ctx 
   */
  drawParticles(ctx) {
    this.comboParticles.forEach(particle => {
      const alpha = particle.life / particle.maxLife;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  /**
   * Draw flash effect
   * @param {CanvasRenderingContext2D} ctx 
   */
  drawFlashEffect(ctx) {
    const canvas = this.game.canvas;
    const alpha = this.comboFlashTimer / this.comboFlashDuration * 0.3;
    
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.getComboColor();
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  }

  /**
   * Get combo statistics
   * @returns {Object}
   */
  getStats() {
    return {
      currentCombo: this.currentCombo,
      maxCombo: this.maxCombo,
      multiplier: this.getCurrentMultiplier(),
      achievements: { ...this.achievements }
    };
  }

  /**
   * Reset combo system
   */
  reset() {
    this.currentCombo = 0;
    this.maxCombo = 0;
    this.comboTimer = 0;
    this.comboParticles = [];
    this.showComboText = false;
    this.comboTextTimer = 0;
    this.comboFlashTimer = 0;
    
    // Reset achievements for new game
    this.achievements = {
      firstCombo: false,
      comboMaster: false,
      chainReaction: false,
      unstoppable: false
    };
    
    console.log('🔄 Combo system reset');
  }
}
