// mobs.js

import { checkCollision } from '../core/collision.js';
import { MobType, getMobConfigByType } from '../data/mobData.js'; // Import mob types and configs
import { HealthBar } from '../ui/healthBar.js'; // Import the main HealthBar class

// Random names pool for mobs
const MOB_NAMES = [
  'Razor', 'Spike', 'Venom', 'Blaze', 'Frost', 'Shadow', 'Thunder', 'Storm',
  'Bolt', 'Claw', 'Fang', 'Hunter', 'Warrior', 'Beast', 'Rage', 'Fury',
  'Titan', 'Demon', 'Ghost', 'Phantom', 'Reaper', 'Slayer', 'Crusher', 'Bane',
  'Savage', 'Wild', 'Fierce', 'Brutal', 'Deadly', 'Terror', 'Menace', 'Doom',
  'Striker', 'Fighter', 'Guardian', 'Destroyer', 'Predator', 'Stalker', 'Prowler', 'Rampage'
];

export class Mob {
  /**
   * @param {number} x         - Initial X position
   * @param {number} y         - Initial Y position
   * @param {string[]|string} sprites - Array of sprite URLs to choose from or single sprite path
   * @param {object} options - Mob-specific options including type
   * @param {string} options.type - MobType (e.g., MobType.GRUNT)
   * @param {SpriteManager} options.spriteManager - Sprite manager instance
   * @param {string} options.spriteId - Base sprite ID for this mob
   */  constructor(x, y, sprites, options = {}) {
    const config = getMobConfigByType(options.type || MobType.GRUNT);

    // Validate input coordinates
    this.x = isFinite(x) ? x : 0;
    this.y = isFinite(y) ? y : 0;
    this.width  = config.width;
    this.height = config.height;

    // Validate and set health properties
    this.health = isFinite(config.health) ? config.health : 100;
    this.maxHealth = this.health;
    this.speed = isFinite(config.speed) ? config.speed : 50;
    this.damage = isFinite(config.damage) ? config.damage : 10;
    
    this.name = `${config.namePrefix} ${MOB_NAMES[Math.floor(Math.random() * MOB_NAMES.length)]}`;
    this.type = options.type || MobType.GRUNT;
    this.behavior = config.behavior;
    this.points = config.points;
    this.attackCooldownValue = config.attackCooldown;
    this.currentAttackCooldown = 0; // Time until next attack

    // Ranged specific properties (if applicable)
    if (this.behavior === 'RANGED_KITE') {
      this.attackRange = config.attackRange;
      this.projectileSpeed = config.projectileSpeed;
      this.projectileDamage = config.projectileDamage;
      this.projectiles = []; // Store active projectiles
    }

    // Add health bar
    this.healthBar = new HealthBar();
    
    // Weather effects
    this.weatherSpeedMultiplier = 1.0;
    this.weatherVisibilityMultiplier = 1.0;

    // Movement state and direction tracking
    this.dx = 0;
    this.dy = 0;
    this.changeDirCooldown = 0;
    this.hitCooldown = 0; // Renamed to currentAttackCooldown, but keep for now if used elsewhere or phase out
    this.direction = 'base'; // 'left', 'right', 'base'
    this.lastX = this.x;

    // Sprite management - support both new SpriteManager and legacy sprite system
    this.spriteManager = options.spriteManager || null;
    this.spriteId = options.spriteId || null;
    
    if (this.spriteManager && this.spriteId) {
      // Using new sprite manager system
      this.usingModernSprites = true;
    } else {
      // Legacy sprite system
      this.usingModernSprites = false;
      const spritePath = Array.isArray(sprites) && sprites.length
        ? sprites[Math.floor(Math.random() * sprites.length)]
        : sprites;
      this.sprite = new Image();
      this.sprite.src = spritePath;
    }
  }  /**
   * Update mob position and handle collisions with the player and other mobs.
   * @param {number} delta   - Time since last frame (ms)
   * @param {Player} player  - Player instance for collision
   * @param {Mob[]} allMobs  - Array of all mobs for mob-to-mob combat
   */
  update(delta, player, allMobs = [], world) { // Added world for boundaries
    // Store previous position for direction tracking
    this.lastX = this.x;
    this.currentAttackCooldown = Math.max(0, this.currentAttackCooldown - delta);

    // --- BEHAVIOR LOGIC ---
    switch (this.behavior) {
      case 'MELEE_AGGRESSIVE':
        this.behaveMeleeAggressive(delta, player, allMobs, world);
        break;
      case 'RANGED_KITE':
        this.behaveRangedKite(delta, player, allMobs, world);
        break;
      default:
        this.behaveMeleeAggressive(delta, player, allMobs, world); // Default behavior
    }
    // --- END BEHAVIOR LOGIC ---

    // Update direction based on movement for sprite system
    this._updateDirection();

    // Update projectiles for ranged mobs
    if (this.behavior === 'RANGED_KITE') {
      this.updateProjectiles(delta, player, world);
    }    // Update health bar
    // Debug: Check for invalid mob coordinates before health bar update
    if (!isFinite(this.x) || !isFinite(this.y) || !isFinite(this.health) || !isFinite(this.maxHealth)) {
      console.error('🚨 Mob health bar update with invalid values, sanitizing:', {
        mobType: this.type,
        x: this.x,
        y: this.y,
        health: this.health,
        maxHealth: this.maxHealth,
        mobName: this.name
      });
      
      // Sanitize invalid values instead of just returning
      if (!isFinite(this.x)) this.x = 0;
      if (!isFinite(this.y)) this.y = 0;
      if (!isFinite(this.health)) this.health = this.maxHealth;
      if (!isFinite(this.maxHealth)) this.maxHealth = 100;
    }
    
    this.healthBar.update(this.x, this.y, this.health, this.maxHealth, delta);
  }  behaveMeleeAggressive(delta, player, allMobs, world) {
    // Validate input parameters
    if (!player || !isFinite(player.x) || !isFinite(player.y) || !isFinite(delta)) {
      console.warn('🚨 behaveMeleeAggressive: Invalid parameters, skipping update');
      return;
    }
    
    const playerDistance = Math.hypot(player.x - this.x, player.y - this.y);
    let targetX = player.x;
    let targetY = player.y;
    
    // Basic chase player
    const dirX = targetX - this.x;
    const dirY = targetY - this.y;
    const length = Math.hypot(dirX, dirY);    if (length > 0 && isFinite(length)) {
      this.dx = dirX / length;
      this.dy = dirY / length;
    } else {
      this.dx = 0;
      this.dy = 0;
    }

    // Ensure dx and dy are always finite before movement calculation
    if (!isFinite(this.dx)) this.dx = 0;
    if (!isFinite(this.dy)) this.dy = 0;

    const effectiveSpeed = this.speed * (this.weatherSpeedMultiplier || 1.0);
    const distance = (effectiveSpeed * delta) / 1000;
    let newX = this.x + this.dx * distance;
    let newY = this.y + this.dy * distance;

    // Validate coordinates to prevent NaN
    if (!isFinite(newX) || !isFinite(newY)) {
      console.warn('🚨 Mob movement calculated invalid coordinates, using current position');
      newX = this.x;
      newY = this.y;
    }

    // World boundary collision
    if (world) {
        newX = Math.max(0, Math.min(newX, world.width - this.width));
        newY = Math.max(0, Math.min(newY, world.height - this.height));
    }

    // Final validation before assignment
    if (isFinite(newX) && isFinite(newY)) {
      this.x = newX;
      this.y = newY;
    }

    // Collision with player
    if (this.currentAttackCooldown <= 0 && checkCollision(this.getAABB(), player.getAABB())) {
      player.takeDamage(this.damage);
      this.currentAttackCooldown = this.attackCooldownValue;
    }
  }
  behaveRangedKite(delta, player, allMobs, world) {
    // Validate input parameters
    if (!player || !isFinite(player.x) || !isFinite(player.y) || !isFinite(delta)) {
      console.warn('🚨 behaveRangedKite: Invalid parameters, skipping update');
      return;
    }
    
    const playerDistance = Math.hypot(player.x - this.x, player.y - this.y);    // Determine movement: kite if too close, approach if too far, strafe if in range
    if (playerDistance < this.attackRange * 0.5) { // Too close, kite away
      const dirX = this.x - player.x;
      const dirY = this.y - player.y;
      const length = Math.hypot(dirX, dirY);
      if (length > 0 && isFinite(length)) {
        this.dx = dirX / length;
        this.dy = dirY / length;
      } else {
        this.dx = 0;
        this.dy = 0;
      }
    } else if (playerDistance > this.attackRange * 0.8) { // Too far, approach
      const dirX = player.x - this.x;
      const dirY = player.y - this.y;
      const length = Math.hypot(dirX, dirY);
      if (length > 0 && isFinite(length)) {
        this.dx = dirX / length;
        this.dy = dirY / length;
      } else {
        this.dx = 0;
        this.dy = 0;
      }    } else { // In optimal range, strafe or stand still
      // Simple strafing: occasionally move perpendicular to player
      if (Math.random() < 0.05) { // 5% chance to change strafe direction per update
        const perpX = -(player.y - this.y);
        const perpY = player.x - this.x;
        const length = Math.hypot(perpX, perpY);
        if (length > 0 && isFinite(length)) {
            this.dx = (perpX / length) * (Math.random() < 0.5 ? 1 : -1);
            this.dy = (perpY / length) * (Math.random() < 0.5 ? 1 : -1);
        } else {
            this.dx = 0;
            this.dy = 0;
        }
      } else if (Math.random() < 0.02) { // 2% chance to stop strafing
          this.dx = 0;
          this.dy = 0;      }
      // If not strafing, dx/dy remain from previous state or become 0
    }

    // Ensure dx and dy are always finite before movement calculation
    if (!isFinite(this.dx)) this.dx = 0;
    if (!isFinite(this.dy)) this.dy = 0;

      const effectiveSpeed = this.speed * (this.weatherSpeedMultiplier || 1.0);
    const distance = (effectiveSpeed * delta) / 1000;
    let newX = this.x + this.dx * distance;
    let newY = this.y + this.dy * distance;

    // Validate coordinates to prevent NaN
    if (!isFinite(newX) || !isFinite(newY)) {
      console.warn('🚨 Ranged mob movement calculated invalid coordinates, using current position');
      newX = this.x;
      newY = this.y;
    }

    // World boundary collision
    if (world) {
        newX = Math.max(0, Math.min(newX, world.width - this.width));
        newY = Math.max(0, Math.min(newY, world.height - this.height));
    }

    // Final validation before assignment
    if (isFinite(newX) && isFinite(newY)) {
      this.x = newX;
      this.y = newY;
    }

    // Attack player if in range and cooldown ready
    if (this.currentAttackCooldown <= 0 && playerDistance < this.attackRange) {
      this.fireProjectile(player.x + player.width / 2, player.y + player.height / 2);
      this.currentAttackCooldown = this.attackCooldownValue;
    }
  }

  fireProjectile(targetX, targetY) {
    const projX = this.x + this.width / 2;
    const projY = this.y + this.height / 2;
    const dirX = targetX - projX;
    const dirY = targetY - projY;
    const length = Math.hypot(dirX, dirY);

    if (length > 0) {
      this.projectiles.push({
        x: projX,
        y: projY,
        dx: dirX / length,
        dy: dirY / length,
        speed: this.projectileSpeed,
        damage: this.projectileDamage,
        width: 8, // Projectile size
        height: 8,
        owner: this, // Reference to the mob that fired it
      });
    }
  }

  updateProjectiles(delta, player, world) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      const distance = (p.speed * delta) / 1000;
      p.x += p.dx * distance;
      p.y += p.dy * distance;

      // Check collision with player
      const projectileAABB = { left: p.x, top: p.y, right: p.x + p.width, bottom: p.y + p.height };
      if (checkCollision(projectileAABB, player.getAABB())) {
        player.takeDamage(p.damage);
        this.projectiles.splice(i, 1); // Remove projectile
        continue;
      }

      // Remove projectile if out of bounds (using world boundaries)
      if (world && (p.x < 0 || p.x > world.width || p.y < 0 || p.y > world.height)) {
        this.projectiles.splice(i, 1);
      }
    }
  }


  /**
   * Update mob direction based on movement
   * @private
   */
  _updateDirection() {
    const deltaX = this.x - this.lastX;
    const threshold = 0.1; // Minimum movement to register direction change
    
    if (Math.abs(deltaX) > threshold) {
      this.direction = deltaX > 0 ? 'right' : 'left';
    } else if (this.dx !== 0) {
      // Use movement velocity if position delta is too small
      this.direction = this.dx > 0 ? 'right' : 'left';
    }
    // If no significant movement, keep current direction
  }  /**
   * Draw the mob sprite.
   * @param {CanvasRenderingContext2D} ctx
   */
  draw(ctx) {
    // Add error handling for invalid context
    if (!ctx || typeof ctx.drawImage !== 'function') {
      console.error('Invalid canvas context passed to Mob.draw');
      return;
    }

    try {
      if (this.usingModernSprites && this.spriteManager && this.spriteId) {
        // Use modern sprite system with directional support
        const sprite = this.spriteManager.getDirectionalSprite(this.spriteId, this.direction);
          if (sprite && sprite.complete && sprite.naturalWidth) {
          ctx.drawImage(sprite, this.x, this.y, this.width, this.height);
        } else {
          // Fallback to base sprite if directional sprite fails
          const baseSprite = this.spriteManager.getDirectionalSprite(this.spriteId, 'base');
          if (baseSprite && baseSprite.complete && baseSprite.naturalWidth) {
            ctx.drawImage(baseSprite, this.x, this.y, this.width, this.height);
          } else {
            // Final fallback box
            ctx.fillStyle = '#AA0000';
            ctx.fillRect(this.x, this.y, this.width, this.height);
          }
        }
      } else {
        // Legacy sprite system
        if (this.sprite && this.sprite.complete && this.sprite.naturalWidth) {
          ctx.drawImage(this.sprite, this.x, this.y, this.width, this.height);
        } else {
          // Fallback box
          ctx.fillStyle = '#AA0000';
          ctx.fillRect(this.x, this.y, this.width, this.height);
        }
      }
    } catch (error) {
      console.error('Error drawing mob sprite:', error);
      // Emergency fallback - draw a simple rectangle
      // Use config color if available, otherwise default
      const color = (this.type && getMobConfigByType(this.type).visual) ? getMobConfigByType(this.type).visual.color : '#FF0000';
      ctx.fillStyle = color;
      ctx.fillRect(this.x, this.y, this.width, this.height);
    }
    // Draw health bar
    try {
      this.healthBar.draw(ctx);
    } catch (error) {
      console.error('Error drawing mob health bar:', error);
    }

    // Draw projectiles for ranged mobs
    if (this.behavior === 'RANGED_KITE') {
      this.projectiles.forEach(p => {
        ctx.fillStyle = 'yellow'; // Simple projectile color
        ctx.fillRect(p.x - p.width / 2, p.y - p.height / 2, p.width, p.height);
      });
    }

    // Draw name with enhanced visibility
    try {
      ctx.save();
      ctx.font = 'bold 12px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      
      // Text shadow for better visibility
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.strokeText(this.name, this.x + this.width / 2, this.y - 25);
      
      // Main text
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(this.name, this.x + this.width / 2, this.y - 25);
      ctx.restore();
    } catch (error) {
      console.error('Error drawing mob name:', error);
      ctx.restore(); // Ensure context is restored even on error
    }
  }

  /**
   * Axis-aligned bounding box for collision.
   * @returns {{left:number, top:number, right:number, bottom:number}}
   */
  getAABB() {
    return {
      left:   this.x,
      top:    this.y,
      right:  this.x + this.width,
      bottom: this.y + this.height
    };
  }
  /**
   * Apply damage to this mob.
   * @param {number} amount
   * @returns {number} Actual damage dealt
   */  takeDamage(amount) {
    // Validate input parameters
    if (!isFinite(amount) || amount <= 0) {
      console.warn('🚨 takeDamage: Invalid damage amount:', amount);
      return 0;
    }
    
    // Validate current health
    if (!isFinite(this.health)) {
      console.warn('🚨 takeDamage: Mob health is invalid, resetting to maxHealth:', this.health);
      this.health = this.maxHealth;
    }
    
    const actualDamage = Math.min(amount, this.health);
    this.health = Math.max(0, this.health - actualDamage);
    
    // Final validation to ensure health remains finite
    if (!isFinite(this.health)) {
      console.error('🚨 takeDamage: Health became invalid after damage calculation, setting to 0');
      this.health = 0;
    }
    
    // Health bar will automatically show when health < maxHealth
    return actualDamage;
  }/**
   * Serialize mob state for saving.
   * @returns {{x:number,y:number,width:number,height:number,sprite:string,spriteId?:string,options:{health:number,speed:number,damage:number,name:string}}}
   */
  serialize() {
    const serialized = {
      x:      this.x,
      y:      this.y,
      // width, height, speed, damage, name are now derived from type
      options: {
        health: this.health, // Current health needs to be saved
        type: this.type, // Save the mob type
        // spriteId is part of the base options if using spriteManager
      }
    };

    if (this.usingModernSprites && this.spriteId) {
      serialized.options.spriteId = this.spriteId;
    } else if (this.sprite && this.sprite.src) {
      // Legacy sprite path saving might still be needed if not all mobs use spriteManager
      serialized.spritePath = this.sprite.src; // Use a different key to avoid conflict
    }
    
    // Save projectiles if any (for ranged mobs)
    if (this.projectiles && this.projectiles.length > 0) {
        serialized.projectiles = this.projectiles.map(p => ({
            x: p.x, y: p.y, dx: p.dx, dy: p.dy // Save essential projectile state
        }));
    }

    return serialized;
  }
}
