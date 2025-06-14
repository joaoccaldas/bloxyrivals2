// player.js

import { checkCollision } from '../core/collision.js';
import { HealthBar } from '../ui/healthBar.js';
import { PowerUpType } from './PowerUp.js'; // Make sure PowerUpType is imported

export class Player {
  /**
   * @param {number} x - initial x position
   * @param {number} y - initial y position
   * @param {number} width - player width
   * @param {number} height - player height
   * @param {string} spritePath - URL for player sprite
   * @param {Function} onDeath - callback when health <= 0
   * @param {SpriteManager} spriteManager - Optional sprite manager for directional sprites
   * @param {string} spriteId - Optional sprite ID for directional sprites
   */  constructor(x, y, width, height, spritePath = '', onDeath = () => {}, spriteManager = null, spriteId = null) {
    // Debug flags
    this.DEBUG_MOVEMENT = false; // Set to true for movement debugging
    
    this.x = x;
    this.y = y;
    this.initialX = x; // Store initial X
    this.initialY = y; // Store initial Y
    this.width = width;
    this.height = height;
    
    // Active power-up effects
    this.activePowerUps = {}; // Stores type and expiry time

    // Sprite management
    this.spriteManager = spriteManager;
    this.spriteId = spriteId;
    this.sprite = new Image();
    this.sprite.src = spritePath;

    // Movement deltas (unit vector)
    this.dx = 0;
    this.dy = 0;
    // Speed in pixels per second
    this.speed = 200;// Health
    this.maxHealth = 100;
    this.health    = this.maxHealth;
    this.onDeath   = onDeath;
    this.isDead = false;
    this.respawnCountdown = 0; // Added for respawn system

    this.totalDamageTaken = 0; // For ranking stats
    
    // Weather effects
    this.weatherSpeedMultiplier = 1.0;
    this.weatherVisibilityMultiplier = 1.0;    // Health bar for player
    this.healthBar = new HealthBar();
    this.healthBar.width = 60; // Wider for player
    this.healthBar.height = 8; // Taller for player
    this.healthBar.isPlayerHealthBar = true; // Mark as player health bar
    this.healthBar.visible = true; // Always visible for player

    // Visibility and state flags
    this.isVisible = true;
    this.isDead = false;
  }
  /**
   * Set movement direction as a unit vector
   * @param {number} dx
   * @param {number} dy
   */  setDirection(dx, dy) {
    // DEBUG: Log when setDirection is called
    if ((dx !== 0 || dy !== 0) && this.DEBUG_MOVEMENT) {
      console.log(`🎯 Player.setDirection() called: dx=${dx}, dy=${dy}`);
    }
    this.dx = dx;
    this.dy = dy;
  }

  // --- POWER-UP METHODS ---
  applyPowerUp(powerUp) {
    console.log(`Player: Applying ${powerUp.type}`);
    const now = Date.now();
    this.activePowerUps[powerUp.type] = now + powerUp.duration;

    // Immediate effects (if any)
    if (powerUp.type === PowerUpType.SPEED_BOOST) {
      // Speed boost is handled in getEffectiveSpeed
    }
    // Score multiplier is handled in PointSystem or Game.js when points are awarded
    
    // Potentially trigger UI update or sound effect here
  }

  updateActivePowerUps() {
    const now = Date.now();
    for (const type in this.activePowerUps) {
      if (now > this.activePowerUps[type]) {
        console.log(`Player: Power-up ${type} expired.`);
        delete this.activePowerUps[type];
        // Potentially trigger UI update for expiration
      }
    }
  }

  hasPowerUp(type) {
    return this.activePowerUps[type] && Date.now() < this.activePowerUps[type];
  }

  getEffectiveSpeed() {
    let currentSpeed = this.speed * (this.weatherSpeedMultiplier || 1.0);
    if (this.hasPowerUp(PowerUpType.SPEED_BOOST)) {
      currentSpeed *= 1.5; // 50% speed increase
    }
    return currentSpeed;
  }
  // --- END POWER-UP METHODS ---

  /**
   * Update position and check for collisions
   * @param {number} delta - ms since last frame
   * @param {World} world
   */  update(delta, world) {
    // Debug: Check if player.update is being called and with what direction
    if ((this.dx !== 0 || this.dy !== 0) && this.DEBUG_MOVEMENT) {
      console.log(`🎮 Player.update() called: dx=${this.dx}, dy=${this.dy}, currentPos=(${this.x.toFixed(1)}, ${this.y.toFixed(1)}), delta=${delta.toFixed(1)}`);
    }

    // Don't update position if dead or not visible
    if (this.isDead || !this.isVisible) {
      return;
    }

    // Update active power-ups
    this.updateActivePowerUps();

    // Move with weather effects and power-ups
    const effectiveSpeed = this.getEffectiveSpeed();
    const dist = (effectiveSpeed * delta) / 1000;
    let newX = this.x + this.dx * dist;
    let newY = this.y + this.dy * dist;

    // Debug: Log movement calculation
    if ((this.dx !== 0 || this.dy !== 0) && this.DEBUG_MOVEMENT) {
      console.log(`📐 Movement calc: speed=${effectiveSpeed}, delta=${delta}, dist=${dist.toFixed(3)}, newPos=(${newX.toFixed(1)}, ${newY.toFixed(1)})`);
    }    // Clamp to world bounds
    newX = Math.max(0, Math.min(world.width - this.width, newX));
    newY = Math.max(0, Math.min(world.height - this.height, newY));

    // Debug: Check if world bounds changed anything
    if ((this.dx !== 0 || this.dy !== 0) && this.DEBUG_MOVEMENT) {
      console.log(`🌍 After world bounds: newPos=(${newX.toFixed(1)}, ${newY.toFixed(1)})`);
    }

    // Debug: Final position update
    const oldX = this.x, oldY = this.y;
    this.x = newX;
    this.y = newY;
    
    if ((this.dx !== 0 || this.dy !== 0) && this.DEBUG_MOVEMENT) {
      console.log(`🏁 FINAL: (${oldX.toFixed(1)}, ${oldY.toFixed(1)}) → (${this.x.toFixed(1)}, ${this.y.toFixed(1)}) | Movement: ${(Math.abs(this.x - oldX) + Math.abs(this.y - oldY)).toFixed(3)}`);
    }// Update health bar position
    const healthBarX = this.x + this.width / 2;
    const healthBarY = this.y + this.height + 10;
    
    // Debug: Check for invalid values before health bar update
    if (!isFinite(healthBarX) || !isFinite(healthBarY) || !isFinite(this.health) || !isFinite(this.maxHealth)) {
      console.error('🚨 Player health bar update with invalid values:', {
        x: this.x,
        y: this.y,
        width: this.width,
        height: this.height,
        healthBarX,
        healthBarY,
        health: this.health,
        maxHealth: this.maxHealth
      });
      return; // Skip health bar update if values are invalid
    }
    
    this.healthBar.update(
      healthBarX, 
      healthBarY, // Below player
      this.health, 
      this.maxHealth, 
      delta
    );
  }/**
   * Draw the player sprite at current position
   * @param {CanvasRenderingContext2D} ctx
   * @param {string} direction - Optional direction override ('left', 'right', 'base')
   */  draw(ctx, direction = null) {
    // Don't draw if player is not visible (during respawn)
    if (this.isVisible === false || this.isDead === true) {
      console.log(`🚫 Player draw skipped - isVisible: ${this.isVisible}, isDead: ${this.isDead}`);
      return;
    }
    
    // Debug: Ensure player is visible during normal gameplay
    if (this.health > 0 && !this.isDead && !this.isVisible) {
      console.warn('⚠️ Player has health but is not visible - fixing visibility');
      this.isVisible = true;
    }

    let spriteToUse = this.sprite;
    let selectedDirection = 'base';
    
    // Use directional sprite if sprite manager is available
    if (this.spriteManager && this.spriteId) {
      if (direction) {
        // Use provided direction
        selectedDirection = direction;
        spriteToUse = this.spriteManager.getDirectionalSprite(this.spriteId, direction);
      } else {
        // Use movement-based direction
        if (Math.abs(this.dx) > Math.abs(this.dy)) {
          selectedDirection = this.dx > 0 ? 'right' : 'left';
        }
        spriteToUse = this.spriteManager.getSpriteForMovement(this.spriteId, this.dx, this.dy);
      }
  
      
      // Fallback to original sprite if directional sprite not found
      if (!spriteToUse) {
        spriteToUse = this.sprite;
      }
    }
      if (spriteToUse && spriteToUse.complete && spriteToUse.naturalWidth) {
      ctx.drawImage(spriteToUse, this.x, this.y, this.width, this.height);
    } else {
      // Enhanced fallback - try base sprite first
      if (this.sprite && this.sprite.complete && this.sprite.naturalWidth) {
        ctx.drawImage(this.sprite, this.x, this.y, this.width, this.height);
        console.log(`🔄 Using fallback base sprite for player`);
      } else {
        // Final fallback - colored rectangle with character indicator
        ctx.fillStyle = '#00FF00';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Add character indicator
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('P', this.x + this.width/2, this.y + this.height/2);
        
        console.warn(`⚠️ Player sprite failed to load, using fallback rectangle`);
      }
    }

    // Draw health bar below player
    this.healthBar.draw(ctx);

    // Draw active power-up timers (simple text for now)
    this._drawActivePowerUpTimers(ctx);
  }

  _drawActivePowerUpTimers(ctx) {
    const now = Date.now();
    let yOffset = 0;
    ctx.save();
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'left';
    
    for (const type in this.activePowerUps) {
      if (this.activePowerUps[type] > now) {
        const timeLeft = ((this.activePowerUps[type] - now) / 1000).toFixed(1);
        let text = '';
        let color = 'white';

        if (type === PowerUpType.SPEED_BOOST) {
          text = `Speed: ${timeLeft}s`;
          color = 'cyan';
        } else if (type === PowerUpType.SCORE_MULTIPLIER) {
          text = `Score x2: ${timeLeft}s`;
          color = 'gold';
        }
        // Add more types as needed

        if (text) {
          ctx.fillStyle = 'rgba(0,0,0,0.5)';
          ctx.fillRect(this.x, this.y - 20 - yOffset, ctx.measureText(text).width + 8, 16);
          ctx.fillStyle = color;
          ctx.fillText(text, this.x + 4, this.y - 10 - yOffset);
          yOffset += 18; // Stack multiple timers
        }
      }
    }
    ctx.restore();
  }
  /**
   * Apply damage and trigger death callback if needed
   * @param {number} amount
   */
  takeDamage(amount) {
    if (this.isDead || this.respawnCountdown > 0) return 0; // No damage if dead or respawning

    const actualDamage = Math.min(amount, this.health);
    this.health -= actualDamage;
    this.totalDamageTaken += actualDamage; // Track total damage taken

    console.log(`Player took ${actualDamage} damage, health: ${this.health}`);
    if (this.health <= 0) {
      this.health = 0;
      this.isDead = true; // Mark player as dead so they stop being rendered
      this.isVisible = false; // Also make them invisible
      this.onDeath();
    }
  }

  // Method to get total damage taken for stats
  getTotalDamageTaken() {
    return this.totalDamageTaken;
  }

  /**
   * Force player to be visible (for debugging visibility issues)
   */
  forceVisible() {
    this.isVisible = true;
    this.isDead = false;
    if (this.health <= 0) {
      this.health = 1; // Give minimal health to keep visible
    }
    console.log('🔧 Player visibility forced on');
  }

  /**
   * Debug method to check player state
   */
  debugState() {
    console.log('🔍 Player Debug State:', {
      x: this.x,
      y: this.y,
      health: this.health,
      maxHealth: this.maxHealth,
      isVisible: this.isVisible,
      isDead: this.isDead,
      sprite: this.sprite ? this.sprite.src : 'none',
      spriteLoaded: this.sprite ? this.sprite.complete : false,
      spriteManager: !!this.spriteManager,
      spriteId: this.spriteId
    });
  }

  /**
   * Axis-aligned bounding box for collision
   */
  getAABB() {
    return {
      left: this.x,
      top: this.y,
      right: this.x + this.width,
      bottom: this.y + this.height
    };
  }
  // Reset player state, including stats for a new game or respawn
  resetState(newX, newY) {
    this.x = newX;
    this.y = newY;
    this.health = this.maxHealth;
    this.isDead = false;
    this.dx = 0;
    this.dy = 0;
    this.direction = 'base';
    this.activePowerUps = {}; // Clear all active power-ups
    // Reset stats that are session-based if needed, or handle in Game.js
    // For now, totalDamageTaken is reset here, assuming a full game reset.
    // If player persists across sessions with cumulative damage, this would be different.
    this.totalDamageTaken = 0; 
    // this.respawnCountdown is handled by RespawnSystem
  }

  // Load player state from saved data
  load(data) {
    this.x = data.x ?? this.x;
    this.y = data.y ?? this.y;
    this.health = data.health ?? this.health;
    this.maxHealth = data.maxHealth || 100;
    this.health = data.health;
    this.speed = data.speed;
    this.totalDamageTaken = data.totalDamageTaken || 0;
    // Note: activePowerUps are not typically saved/loaded in this manner
    // as they are transient. If needed, specific logic would be required.
  }

  // Serialize player state
  serialize() {
    return {
      x: this.x,
      y: this.y,
      health: this.health,
      maxHealth: this.maxHealth,
      speed: this.speed,
      totalDamageTaken: this.totalDamageTaken,
      // activePowerUps are generally not serialized for save games
    };
  }
}
