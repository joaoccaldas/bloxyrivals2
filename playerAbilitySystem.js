/**
 * Special Player Abilities & Cooldowns System
 * Provides special abilities with cooldown management and visual effects
 */

export class PlayerAbilitySystem {
  constructor(game) {
    this.game = game;
    this.abilities = new Map();
    this.activeAbilities = new Set();
    this.cooldowns = new Map();
    this.lastUpdate = Date.now();
    
    // UI elements
    this.abilityBar = null;
    this.createAbilityUI();
    
    // Initialize default abilities
    this.initializeAbilities();
    
    console.log('⚡ Player Ability System initialized with', this.abilities.size, 'abilities');
  }

  initializeAbilities() {
    const abilities = [
      {
        id: 'dash',
        name: 'Lightning Dash',
        description: 'Teleport forward instantly',
        icon: '⚡',
        cooldown: 5000, // 5 seconds
        duration: 500,
        keyBinding: 'Space',
        effect: 'movement',
        color: '#FFD700'
      },
      {
        id: 'shield',
        name: 'Energy Shield',
        description: 'Become invulnerable for 3 seconds',
        icon: '🛡️',
        cooldown: 15000, // 15 seconds
        duration: 3000,
        keyBinding: 'Q',
        effect: 'defense',
        color: '#00BFFF'
      },
      {
        id: 'time_slow',
        name: 'Time Dilation',
        description: 'Slow down time for 4 seconds',
        icon: '⏰',
        cooldown: 20000, // 20 seconds
        duration: 4000,
        keyBinding: 'E',
        effect: 'time',
        color: '#9370DB'
      },
      {
        id: 'fire_burst',
        name: 'Fire Burst',
        description: 'Create explosive area damage',
        icon: '🔥',
        cooldown: 8000, // 8 seconds
        duration: 1000,
        keyBinding: 'R',
        effect: 'damage',
        color: '#FF4500'
      },
      {
        id: 'multi_shot',
        name: 'Multi Shot',
        description: 'Next 5 shots fire in spread pattern',
        icon: '🎯',
        cooldown: 12000, // 12 seconds
        duration: 0, // Instant use
        keyBinding: 'F',
        effect: 'weapon',
        color: '#32CD32'
      }
    ];

    abilities.forEach(ability => {
      this.abilities.set(ability.id, {
        ...ability,
        unlocked: true, // Can be tied to achievements later
        uses: 0
      });
      this.cooldowns.set(ability.id, 0);
    });
  }

  createAbilityUI() {
    // Create ability bar UI
    const abilityBar = document.createElement('div');
    abilityBar.id = 'ability-bar';
    abilityBar.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 10px;
      background: rgba(0, 0, 0, 0.8);
      padding: 10px;
      border-radius: 10px;
      border: 2px solid #333;
      z-index: 1000;
    `;
    
    document.body.appendChild(abilityBar);
    this.abilityBar = abilityBar;
  }

  updateAbilityUI() {
    if (!this.abilityBar) return;
    
    this.abilityBar.innerHTML = '';
    
    this.abilities.forEach((ability, id) => {
      if (!ability.unlocked) return;
      
      const cooldownRemaining = Math.max(0, this.cooldowns.get(id) - Date.now());
      const isOnCooldown = cooldownRemaining > 0;
      const isActive = this.activeAbilities.has(id);
      
      const abilitySlot = document.createElement('div');
      abilitySlot.style.cssText = `
        width: 60px;
        height: 60px;
        background: ${isActive ? ability.color : (isOnCooldown ? '#444' : '#666')};
        border: 2px solid ${isOnCooldown ? '#666' : ability.color};
        border-radius: 8px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        position: relative;
        cursor: ${isOnCooldown ? 'not-allowed' : 'pointer'};
        opacity: ${isOnCooldown ? 0.5 : 1};
        transition: all 0.2s ease;
      `;
      
      // Ability icon
      const icon = document.createElement('div');
      icon.textContent = ability.icon;
      icon.style.cssText = `
        font-size: 24px;
        margin-bottom: 2px;
      `;
      
      // Key binding
      const key = document.createElement('div');
      key.textContent = ability.keyBinding;
      key.style.cssText = `
        font-size: 10px;
        color: white;
        font-weight: bold;
      `;
      
      // Cooldown overlay
      if (isOnCooldown) {
        const cooldownOverlay = document.createElement('div');
        const progress = 1 - (cooldownRemaining / ability.cooldown);
        cooldownOverlay.style.cssText = `
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: ${progress * 100}%;
          background: rgba(255, 255, 255, 0.3);
          transition: height 0.1s ease;
        `;
        abilitySlot.appendChild(cooldownOverlay);
        
        // Cooldown timer text
        const timerText = document.createElement('div');
        timerText.textContent = Math.ceil(cooldownRemaining / 1000);
        timerText.style.cssText = `
          position: absolute;
          top: 2px;
          right: 2px;
          font-size: 12px;
          color: white;
          font-weight: bold;
          text-shadow: 1px 1px 2px black;
        `;
        abilitySlot.appendChild(timerText);
      }
      
      abilitySlot.appendChild(icon);
      abilitySlot.appendChild(key);
      
      // Tooltip
      abilitySlot.title = `${ability.name}\n${ability.description}\nCooldown: ${ability.cooldown / 1000}s`;
      
      this.abilityBar.appendChild(abilitySlot);
    });
  }

  useAbility(abilityId) {
    const ability = this.abilities.get(abilityId);
    if (!ability || !ability.unlocked) return false;
    
    const cooldownEnd = this.cooldowns.get(abilityId);
    if (Date.now() < cooldownEnd) return false;
    
    // Set cooldown
    this.cooldowns.set(abilityId, Date.now() + ability.cooldown);
    
    // Activate ability
    this.activateAbility(ability);
    
    // Track usage
    ability.uses++;
    
    console.log(`⚡ Used ability: ${ability.name}`);
    return true;
  }

  activateAbility(ability) {
    this.activeAbilities.add(ability.id);
    
    switch (ability.effect) {
      case 'movement':
        this.applyDashEffect(ability);
        break;
      case 'defense':
        this.applyShieldEffect(ability);
        break;
      case 'time':
        this.applyTimeSlowEffect(ability);
        break;
      case 'damage':
        this.applyFireBurstEffect(ability);
        break;
      case 'weapon':
        this.applyMultiShotEffect(ability);
        break;
    }
    
    // Visual effect
    this.createAbilityEffect(ability);
    
    // Deactivate after duration
    if (ability.duration > 0) {
      setTimeout(() => {
        this.deactivateAbility(ability.id);
      }, ability.duration);
    } else {
      // Instant abilities
      setTimeout(() => {
        this.activeAbilities.delete(ability.id);
      }, 100);
    }
  }

  applyDashEffect(ability) {
    const player = this.game.player;
    if (!player) return;
    
    // Calculate dash direction
    const dashDistance = 100;
    let dashX = 0, dashY = 0;
    
    // Use movement keys to determine direction
    if (this.game.input.keys['ArrowUp'] || this.game.input.keys['w']) dashY = -dashDistance;
    if (this.game.input.keys['ArrowDown'] || this.game.input.keys['s']) dashY = dashDistance;
    if (this.game.input.keys['ArrowLeft'] || this.game.input.keys['a']) dashX = -dashDistance;
    if (this.game.input.keys['ArrowRight'] || this.game.input.keys['d']) dashX = dashDistance;
    
    // Default forward if no direction
    if (dashX === 0 && dashY === 0) {
      dashX = Math.cos(player.rotation) * dashDistance;
      dashY = Math.sin(player.rotation) * dashDistance;
    }
    
    // Apply dash
    player.x = Math.max(0, Math.min(this.game.canvas.width, player.x + dashX));
    player.y = Math.max(0, Math.min(this.game.canvas.height, player.y + dashY));
    
    // Temporary invulnerability during dash
    player.invulnerable = true;
    setTimeout(() => {
      if (player) player.invulnerable = false;
    }, ability.duration);
  }

  applyShieldEffect(ability) {
    const player = this.game.player;
    if (!player) return;
    
    player.shielded = true;
    player.invulnerable = true;
  }

  applyTimeSlowEffect(ability) {
    // Slow down enemy movement and projectiles
    this.game.timeScale = 0.3;
  }

  applyFireBurstEffect(ability) {
    const player = this.game.player;
    if (!player) return;
    
    // Create explosion effect around player
    const explosionRadius = 80;
    
    // Damage all enemies in radius
    if (this.game.mobSystem && this.game.mobSystem.mobs) {
      this.game.mobSystem.mobs.forEach(mob => {
        const distance = Math.sqrt(
          Math.pow(mob.x - player.x, 2) + Math.pow(mob.y - player.y, 2)
        );
        
        if (distance <= explosionRadius) {
          mob.health -= 50; // High damage
          
          // Knockback effect
          const angle = Math.atan2(mob.y - player.y, mob.x - player.x);
          mob.x += Math.cos(angle) * 30;
          mob.y += Math.sin(angle) * 30;
        }
      });
    }
  }

  applyMultiShotEffect(ability) {
    const player = this.game.player;
    if (!player) return;
    
    player.multiShotCount = 5;
    player.multiShotSpread = Math.PI / 6; // 30 degree spread
  }

  deactivateAbility(abilityId) {
    this.activeAbilities.delete(abilityId);
    
    const ability = this.abilities.get(abilityId);
    if (!ability) return;
    
    switch (ability.effect) {
      case 'defense':
        if (this.game.player) {
          this.game.player.shielded = false;
          this.game.player.invulnerable = false;
        }
        break;
      case 'time':
        this.game.timeScale = 1.0;
        break;
    }
  }

  createAbilityEffect(ability) {
    // Create visual effect for ability use
    const effect = document.createElement('div');
    effect.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 48px;
      color: ${ability.color};
      text-shadow: 2px 2px 4px black;
      z-index: 2000;
      pointer-events: none;
      animation: abilityEffect 1s ease-out forwards;
    `;
    effect.textContent = ability.icon;
    
    // Add CSS animation
    if (!document.getElementById('ability-effect-style')) {
      const style = document.createElement('style');
      style.id = 'ability-effect-style';
      style.textContent = `
        @keyframes abilityEffect {
          0% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 1; transform: translate(-50%, -50%) scale(1.5); }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(2); }
        }
      `;
      document.head.appendChild(style);
    }
    
    document.body.appendChild(effect);
    
    setTimeout(() => {
      document.body.removeChild(effect);
    }, 1000);
  }

  handleKeyPress(key) {
    // Check if key matches any ability binding
    this.abilities.forEach((ability, id) => {
      if (ability.keyBinding.toLowerCase() === key.toLowerCase()) {
        this.useAbility(id);
      }
    });
  }

  update(deltaTime) {
    this.updateAbilityUI();
    
    // Update any active ability effects
    this.activeAbilities.forEach(abilityId => {
      const ability = this.abilities.get(abilityId);
      if (ability && ability.effect === 'time') {
        // Ensure time scale is maintained
        this.game.timeScale = 0.3;
      }
    });
  }

  unlockAbility(abilityId) {
    const ability = this.abilities.get(abilityId);
    if (ability) {
      ability.unlocked = true;
      console.log(`⚡ Unlocked ability: ${ability.name}`);
    }
  }

  getAbilityStats() {
    const stats = {
      totalAbilities: this.abilities.size,
      unlockedAbilities: 0,
      totalUses: 0,
      abilities: []
    };
    
    this.abilities.forEach((ability, id) => {
      if (ability.unlocked) stats.unlockedAbilities++;
      stats.totalUses += ability.uses;
      
      stats.abilities.push({
        id,
        name: ability.name,
        unlocked: ability.unlocked,
        uses: ability.uses,
        cooldown: ability.cooldown / 1000
      });
    });
    
    return stats;
  }
}
