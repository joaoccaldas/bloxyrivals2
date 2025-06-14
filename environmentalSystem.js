/**
 * Interactive Environmental Elements System
 * Adds destructible objects, traps, power-up stations, and dynamic environment interactions
 */

export class EnvironmentalSystem {
  constructor(game) {
    this.game = game;
    this.elements = [];
    this.elementTypes = new Map();
    this.spawnTimer = 0;
    this.spawnInterval = 15000; // 15 seconds
    this.maxElements = 20;
    
    // Particle effects
    this.particles = [];
    
    // Initialize element types
    this.initializeElementTypes();
    
    // Spawn initial elements
    this.spawnInitialElements();
    
    console.log('🎮 Environmental System initialized with', this.elementTypes.size, 'element types');
  }

  initializeElementTypes() {
    const elementTypes = [
      // Destructible Objects
      {
        id: 'explosive_barrel',
        name: 'Explosive Barrel',
        type: 'destructible',
        icon: '🛢️',
        size: 30,
        health: 50,
        color: '#FF4500',
        explosionRadius: 80,
        explosionDamage: 40,
        weight: 0.7,
        rewards: { score: 50, chance: 0.3 }
      },
      {
        id: 'energy_crystal',
        name: 'Energy Crystal',
        type: 'destructible',
        icon: '💎',
        size: 25,
        health: 30,
        color: '#00FFFF',
        energyBoost: 25,
        weight: 0.5,
        rewards: { score: 75, powerUp: 'energy_boost' }
      },
      {
        id: 'metal_crate',
        name: 'Metal Crate',
        type: 'destructible',
        icon: '📦',
        size: 35,
        health: 80,
        color: '#808080',
        lootTable: ['health_pack', 'ammo_boost', 'speed_boost'],
        weight: 0.6,
        rewards: { score: 25 }
      },
      {
        id: 'force_field',
        name: 'Force Field',
        type: 'destructible',
        icon: '🔵',
        size: 40,
        health: 100,
        color: '#0080FF',
        shieldValue: 50,
        weight: 0.3,
        rewards: { score: 100, powerUp: 'shield_boost' }
      },
      
      // Interactive Stations
      {
        id: 'health_station',
        name: 'Health Station',
        type: 'station',
        icon: '🏥',
        size: 45,
        color: '#00FF00',
        healAmount: 50,
        cooldown: 10000,
        usesLeft: 3,
        weight: 0.4
      },
      {
        id: 'weapon_forge',
        name: 'Weapon Forge',
        type: 'station',
        icon: '⚒️',
        size: 50,
        color: '#FFD700',
        upgradeTypes: ['damage', 'fireRate', 'range'],
        cooldown: 20000,
        usesLeft: 2,
        weight: 0.2
      },
      {
        id: 'teleporter',
        name: 'Teleporter',
        type: 'station',
        icon: '🌀',
        size: 40,
        color: '#9932CC',
        teleportRange: 200,
        cooldown: 5000,
        usesLeft: 5,
        weight: 0.3
      },
      {
        id: 'ammo_depot',
        name: 'Ammo Depot',
        type: 'station',
        icon: '📋',
        size: 35,
        color: '#FFA500',
        ammoBoost: 100,
        cooldown: 8000,
        usesLeft: 4,
        weight: 0.5
      },
      
      // Environmental Hazards
      {
        id: 'spike_trap',
        name: 'Spike Trap',
        type: 'trap',
        icon: '⚡',
        size: 30,
        color: '#FF0000',
        damage: 25,
        activationRadius: 40,
        cooldown: 3000,
        weight: 0.4
      },
      {
        id: 'electric_field',
        name: 'Electric Field',
        type: 'trap',
        icon: '⚡',
        size: 60,
        color: '#FFFF00',
        damage: 15,
        slowEffect: 0.5,
        duration: 2000,
        weight: 0.3
      },
      {
        id: 'gravity_well',
        name: 'Gravity Well',
        type: 'trap',
        icon: '🌀',
        size: 50,
        color: '#4B0082',
        pullForce: 2,
        pullRadius: 100,
        damage: 10,
        weight: 0.2
      },
      
      // Dynamic Objects
      {
        id: 'bouncer_pad',
        name: 'Bouncer Pad',
        type: 'dynamic',
        icon: '🔄',
        size: 35,
        color: '#00FF80',
        bounceForce: 5,
        direction: 'up',
        weight: 0.4
      },
      {
        id: 'speed_boost_ring',
        name: 'Speed Ring',
        type: 'dynamic',
        icon: '💨',
        size: 45,
        color: '#00BFFF',
        speedMultiplier: 2.0,
        duration: 3000,
        weight: 0.3
      },
      {
        id: 'shield_generator',
        name: 'Shield Generator',
        type: 'dynamic',
        icon: '🛡️',
        size: 40,
        color: '#32CD32',
        shieldRadius: 80,
        shieldStrength: 0.5,
        duration: 5000,
        weight: 0.2
      }
    ];

    elementTypes.forEach(elementType => {
      this.elementTypes.set(elementType.id, elementType);
    });
  }

  spawnInitialElements() {
    // Spawn some initial elements
    for (let i = 0; i < 8; i++) {
      this.spawnRandomElement();
    }
  }

  spawnRandomElement() {
    if (this.elements.length >= this.maxElements) return;

    // Create weighted array for random selection
    const weightedTypes = [];
    this.elementTypes.forEach((elementType, id) => {
      const weight = Math.floor(elementType.weight * 100);
      for (let i = 0; i < weight; i++) {
        weightedTypes.push(id);
      }
    });

    if (weightedTypes.length === 0) return;

    const selectedTypeId = weightedTypes[Math.floor(Math.random() * weightedTypes.length)];
    this.spawnElement(selectedTypeId);
  }

  spawnElement(typeId, x = null, y = null) {
    const elementType = this.elementTypes.get(typeId);
    if (!elementType) return null;

    // Random position if not specified
    if (x === null) x = Math.random() * (this.game.canvas.width - elementType.size * 2) + elementType.size;
    if (y === null) y = Math.random() * (this.game.canvas.height - elementType.size * 2) + elementType.size;

    // Ensure not too close to player
    if (this.game.player) {
      const distanceToPlayer = Math.sqrt(
        Math.pow(x - this.game.player.x, 2) + Math.pow(y - this.game.player.y, 2)
      );
      if (distanceToPlayer < 100) {
        // Try different position
        return this.spawnElement(typeId);
      }
    }

    const element = {
      id: Date.now() + Math.random(),
      typeId: typeId,
      ...elementType,
      x: x,
      y: y,
      active: true,
      lastInteraction: 0,
      currentCooldown: 0,
      health: elementType.health || 0,
      maxHealth: elementType.health || 0,
      animationFrame: 0,
      rotation: Math.random() * Math.PI * 2,
      pulsePhase: Math.random() * Math.PI * 2
    };

    this.elements.push(element);
    console.log(`🎮 Spawned environmental element: ${element.name}`);
    return element;
  }

  update(deltaTime) {
    // Spawn new elements
    this.spawnTimer += deltaTime;
    if (this.spawnTimer >= this.spawnInterval && this.elements.length < this.maxElements) {
      if (Math.random() < 0.4) { // 40% chance per interval
        this.spawnRandomElement();
      }
      this.spawnTimer = 0;
    }

    // Update existing elements
    this.elements.forEach(element => {
      this.updateElement(element, deltaTime);
    });

    // Update particles
    this.updateParticles(deltaTime);

    // Remove destroyed elements
    this.elements = this.elements.filter(element => element.active);
  }

  updateElement(element, deltaTime) {
    // Update cooldowns
    if (element.currentCooldown > 0) {
      element.currentCooldown -= deltaTime;
    }

    // Update animation
    element.animationFrame += deltaTime * 0.005;
    element.pulsePhase += deltaTime * 0.008;

    // Type-specific updates
    switch (element.type) {
      case 'trap':
        this.updateTrap(element, deltaTime);
        break;
      case 'dynamic':
        this.updateDynamic(element, deltaTime);
        break;
      case 'station':
        this.updateStation(element, deltaTime);
        break;
    }

    // Check interactions with player
    this.checkPlayerInteraction(element);

    // Check interactions with projectiles
    this.checkProjectileInteractions(element);
  }

  updateTrap(element, deltaTime) {
    if (!this.game.player || element.currentCooldown > 0) return;

    const player = this.game.player;
    const distance = Math.sqrt(
      Math.pow(element.x - player.x, 2) + Math.pow(element.y - player.y, 2)
    );

    if (distance <= element.activationRadius) {
      this.activateTrap(element);
    }
  }

  updateDynamic(element, deltaTime) {
    // Continuous effects for dynamic elements
    if (!this.game.player) return;

    const player = this.game.player;
    const distance = Math.sqrt(
      Math.pow(element.x - player.x, 2) + Math.pow(element.y - player.y, 2)
    );

    if (distance <= element.size + 20) {
      this.applyDynamicEffect(element, player);
    }
  }

  updateStation(element, deltaTime) {
    // Stations are manually activated
    element.rotation += deltaTime * 0.001;
  }

  checkPlayerInteraction(element) {
    if (!this.game.player) return;

    const player = this.game.player;
    const distance = Math.sqrt(
      Math.pow(element.x - player.x, 2) + Math.pow(element.y - player.y, 2)
    );

    // Check for interaction range
    if (distance <= element.size + 25) {
      // Show interaction prompt for stations
      if (element.type === 'station' && element.currentCooldown <= 0 && element.usesLeft > 0) {
        this.showInteractionPrompt(element);
        
        // Auto-interact if close enough
        if (distance <= element.size + 10) {
          this.interactWithStation(element);
        }
      }
    }
  }

  checkProjectileInteractions(element) {
    if (element.type !== 'destructible' || element.health <= 0) return;

    // Check bullets from projectile system
    if (this.game.projectileSystem && this.game.projectileSystem.projectiles) {
      this.game.projectileSystem.projectiles.forEach(projectile => {
        if (projectile.fromPlayer) {
          const distance = Math.sqrt(
            Math.pow(element.x - projectile.x, 2) + Math.pow(element.y - projectile.y, 2)
          );

          if (distance <= element.size) {
            this.damageElement(element, projectile.damage || 10);
            // Remove projectile
            projectile.life = 0;
          }
        }
      });
    }
  }

  damageElement(element, damage) {
    element.health -= damage;
    
    // Create damage particles
    this.createDamageParticles(element.x, element.y, element.color);

    if (element.health <= 0) {
      this.destroyElement(element);
    }
  }

  destroyElement(element) {
    // Apply destruction effects
    switch (element.typeId) {
      case 'explosive_barrel':
        this.createExplosion(element.x, element.y, element.explosionRadius, element.explosionDamage);
        break;
      case 'energy_crystal':
        this.givePlayerEnergyBoost(element.energyBoost);
        break;
      case 'metal_crate':
        this.dropLoot(element.x, element.y, element.lootTable);
        break;
      case 'force_field':
        this.givePlayerShield(element.shieldValue);
        break;
    }

    // Award score
    if (element.rewards && element.rewards.score && this.game.addScore) {
      this.game.addScore(element.rewards.score);
    }

    // Create destruction particles
    this.createDestructionParticles(element.x, element.y, element.color);

    // Remove element
    element.active = false;

    console.log(`🎮 Destroyed: ${element.name}`);
  }

  activateTrap(element) {
    element.currentCooldown = element.cooldown;

    const player = this.game.player;
    if (!player || player.invulnerable) return;

    switch (element.typeId) {
      case 'spike_trap':
        this.damagePlayer(element.damage);
        this.createTrapEffect(element.x, element.y, '#FF0000');
        break;
      case 'electric_field':
        this.damagePlayer(element.damage);
        this.applySlowEffect(player, element.slowEffect, element.duration);
        this.createTrapEffect(element.x, element.y, '#FFFF00');
        break;
      case 'gravity_well':
        this.applyGravityPull(player, element);
        this.damagePlayer(element.damage);
        this.createTrapEffect(element.x, element.y, '#4B0082');
        break;
    }

    console.log(`🎮 Activated trap: ${element.name}`);
  }

  applyDynamicEffect(element, player) {
    switch (element.typeId) {
      case 'bouncer_pad':
        this.applyBounceEffect(player, element);
        break;
      case 'speed_boost_ring':
        this.applySpeedBoost(player, element);
        break;
      case 'shield_generator':
        this.applyShieldField(player, element);
        break;
    }
  }

  interactWithStation(element) {
    if (element.currentCooldown > 0 || element.usesLeft <= 0) return;

    element.currentCooldown = element.cooldown;
    element.usesLeft--;

    const player = this.game.player;

    switch (element.typeId) {
      case 'health_station':
        this.healPlayer(element.healAmount);
        break;
      case 'weapon_forge':
        this.upgradeWeapon(element);
        break;
      case 'teleporter':
        this.teleportPlayer(element);
        break;
      case 'ammo_depot':
        this.refillAmmo(element.ammoBoost);
        break;
    }

    // Create interaction effect
    this.createInteractionEffect(element.x, element.y, element.color);

    console.log(`🎮 Used station: ${element.name} (${element.usesLeft} uses left)`);

    // Remove station if no uses left
    if (element.usesLeft <= 0) {
      element.active = false;
    }
  }

  // Effect implementations
  createExplosion(x, y, radius, damage) {
    // Damage all entities in radius
    if (this.game.mobSystem && this.game.mobSystem.mobs) {
      this.game.mobSystem.mobs.forEach(mob => {
        const distance = Math.sqrt(Math.pow(mob.x - x, 2) + Math.pow(mob.y - y, 2));
        if (distance <= radius) {
          mob.health -= damage;
          // Knockback
          const angle = Math.atan2(mob.y - y, mob.x - x);
          mob.x += Math.cos(angle) * 50;
          mob.y += Math.sin(angle) * 50;
        }
      });
    }

    // Damage player if in range
    if (this.game.player) {
      const distance = Math.sqrt(
        Math.pow(this.game.player.x - x, 2) + Math.pow(this.game.player.y - y, 2)
      );
      if (distance <= radius) {
        this.damagePlayer(damage * 0.7); // Reduced damage to player
      }
    }

    // Create explosion particles
    this.createExplosionParticles(x, y, radius);
  }

  givePlayerEnergyBoost(amount) {
    const player = this.game.player;
    if (!player) return;

    // Restore energy/abilities
    if (this.game.playerAbilitySystem) {
      // Reduce all ability cooldowns
      this.game.playerAbilitySystem.cooldowns.forEach((cooldown, abilityId) => {
        this.game.playerAbilitySystem.cooldowns.set(abilityId, Math.max(0, cooldown - amount * 100));
      });
    }
  }

  givePlayerShield(amount) {
    const player = this.game.player;
    if (player) {
      player.shield = (player.shield || 0) + amount;
      player.maxShield = Math.max(player.maxShield || 0, player.shield);
    }
  }

  dropLoot(x, y, lootTable) {
    // Create temporary loot pickup
    const loot = lootTable[Math.floor(Math.random() * lootTable.length)];
    
    // Spawn power-up
    if (this.game.powerUpSystem) {
      this.game.powerUpSystem.spawnPowerUp(loot, x, y);
    }
  }

  damagePlayer(damage) {
    if (this.game.damagePlayer) {
      this.game.damagePlayer(damage);
    }
  }

  healPlayer(amount) {
    const player = this.game.player;
    if (player) {
      player.health = Math.min(player.maxHealth, player.health + amount);
    }
  }

  applySlowEffect(player, slowFactor, duration) {
    const originalSpeed = player.baseSpeed || player.speed || 1.0;
    player.speed = originalSpeed * slowFactor;
    
    setTimeout(() => {
      if (player) {
        player.speed = originalSpeed;
      }
    }, duration);
  }

  applyGravityPull(player, element) {
    const dx = element.x - player.x;
    const dy = element.y - player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 0) {
      const pullForce = element.pullForce / distance;
      player.x += (dx / distance) * pullForce;
      player.y += (dy / distance) * pullForce;
    }
  }

  applyBounceEffect(player, element) {
    // Launch player upward or in specified direction
    if (element.direction === 'up') {
      player.y -= element.bounceForce * 20;
    }
    // Add velocity if player has physics
    if (player.vy !== undefined) {
      player.vy -= element.bounceForce;
    }
  }

  applySpeedBoost(player, element) {
    if (player.speedBoostEnd && Date.now() < player.speedBoostEnd) return; // Already boosted

    const originalSpeed = player.baseSpeed || player.speed || 1.0;
    player.speed = originalSpeed * element.speedMultiplier;
    player.speedBoostEnd = Date.now() + element.duration;
    
    setTimeout(() => {
      if (player && Date.now() >= player.speedBoostEnd) {
        player.speed = originalSpeed;
        player.speedBoostEnd = 0;
      }
    }, element.duration);
  }

  applyShieldField(player, element) {
    // Create temporary shield around player
    player.shieldField = {
      radius: element.shieldRadius,
      strength: element.shieldStrength,
      endTime: Date.now() + element.duration
    };
  }

  upgradeWeapon(element) {
    const player = this.game.player;
    if (!player) return;

    const upgradeType = element.upgradeTypes[Math.floor(Math.random() * element.upgradeTypes.length)];
    
    switch (upgradeType) {
      case 'damage':
        player.weaponDamage = (player.weaponDamage || 10) * 1.2;
        break;
      case 'fireRate':
        player.weaponFireRate = Math.max(50, (player.weaponFireRate || 300) * 0.8);
        break;
      case 'range':
        player.weaponRange = (player.weaponRange || 200) * 1.3;
        break;
    }

    console.log(`🎮 Weapon upgraded: ${upgradeType}`);
  }

  teleportPlayer(element) {
    const player = this.game.player;
    if (!player) return;

    // Random teleport within range
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * element.teleportRange;
    
    const newX = element.x + Math.cos(angle) * distance;
    const newY = element.y + Math.sin(angle) * distance;
    
    // Ensure within bounds
    player.x = Math.max(20, Math.min(this.game.canvas.width - 20, newX));
    player.y = Math.max(20, Math.min(this.game.canvas.height - 20, newY));
    
    // Temporary invulnerability
    player.invulnerable = true;
    setTimeout(() => {
      if (player) player.invulnerable = false;
    }, 1000);
  }

  refillAmmo(amount) {
    const player = this.game.player;
    if (player) {
      player.ammo = (player.ammo || 100) + amount;
      player.maxAmmo = Math.max(player.maxAmmo || 100, player.ammo);
    }
  }

  // Particle and effect systems
  createDamageParticles(x, y, color) {
    for (let i = 0; i < 5; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 20,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        size: Math.random() * 3 + 2,
        color: color,
        life: 500,
        maxLife: 500
      });
    }
  }

  createDestructionParticles(x, y, color) {
    for (let i = 0; i < 10; i++) {
      this.particles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        size: Math.random() * 5 + 3,
        color: color,
        life: 1000,
        maxLife: 1000
      });
    }
  }

  createExplosionParticles(x, y, radius) {
    for (let i = 0; i < 20; i++) {
      const angle = (Math.PI * 2 * i) / 20;
      this.particles.push({
        x: x + Math.cos(angle) * 10,
        y: y + Math.sin(angle) * 10,
        vx: Math.cos(angle) * 6,
        vy: Math.sin(angle) * 6,
        size: Math.random() * 4 + 2,
        color: '#FF4500',
        life: 800,
        maxLife: 800
      });
    }
  }

  createTrapEffect(x, y, color) {
    for (let i = 0; i < 8; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 40,
        y: y + (Math.random() - 0.5) * 40,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        size: Math.random() * 6 + 4,
        color: color,
        life: 600,
        maxLife: 600
      });
    }
  }

  createInteractionEffect(x, y, color) {
    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2 * i) / 12;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * 3,
        vy: Math.sin(angle) * 3,
        size: Math.random() * 3 + 2,
        color: color,
        life: 700,
        maxLife: 700
      });
    }
  }

  updateParticles(deltaTime) {
    this.particles = this.particles.filter(particle => {
      particle.x += particle.vx * deltaTime * 60;
      particle.y += particle.vy * deltaTime * 60;
      particle.life -= deltaTime;
      
      // Fade out
      particle.vx *= 0.98;
      particle.vy *= 0.98;
      
      return particle.life > 0;
    });
  }

  showInteractionPrompt(element) {
    // Could create UI prompt here
    console.log(`🎮 Press E to interact with ${element.name}`);
  }

  handleKeyPress(key) {
    if (key.toLowerCase() === 'e') {
      // Find nearby interactive station
      if (!this.game.player) return;

      const player = this.game.player;
      const nearbyStation = this.elements.find(element => {
        if (element.type !== 'station') return false;
        if (element.currentCooldown > 0 || element.usesLeft <= 0) return false;

        const distance = Math.sqrt(
          Math.pow(element.x - player.x, 2) + Math.pow(element.y - player.y, 2)
        );
        return distance <= element.size + 25;
      });

      if (nearbyStation) {
        this.interactWithStation(nearbyStation);
      }
    }
  }

  render(ctx) {
    // Draw elements
    this.elements.forEach(element => {
      this.renderElement(ctx, element);
    });

    // Draw particles
    this.particles.forEach(particle => {
      ctx.globalAlpha = particle.life / particle.maxLife;
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1.0;
  }

  renderElement(ctx, element) {
    ctx.save();
    ctx.translate(element.x, element.y);
    ctx.rotate(element.rotation);

    // Base shape
    const pulseSize = element.size + Math.sin(element.pulsePhase) * 3;
    
    ctx.fillStyle = element.color;
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;

    // Draw based on type
    switch (element.type) {
      case 'destructible':
        ctx.fillRect(-pulseSize/2, -pulseSize/2, pulseSize, pulseSize);
        ctx.strokeRect(-pulseSize/2, -pulseSize/2, pulseSize, pulseSize);
        
        // Health bar for destructibles
        if (element.health < element.maxHealth) {
          const barWidth = element.size;
          const barHeight = 4;
          const healthPercent = element.health / element.maxHealth;
          
          ctx.fillStyle = '#FF0000';
          ctx.fillRect(-barWidth/2, -element.size/2 - 10, barWidth, barHeight);
          ctx.fillStyle = '#00FF00';
          ctx.fillRect(-barWidth/2, -element.size/2 - 10, barWidth * healthPercent, barHeight);
        }
        break;
        
      case 'station':
        ctx.beginPath();
        ctx.arc(0, 0, pulseSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Cooldown indicator
        if (element.currentCooldown > 0) {
          const cooldownPercent = element.currentCooldown / element.cooldown;
          ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.arc(0, 0, pulseSize, -Math.PI/2, -Math.PI/2 + (Math.PI * 2 * cooldownPercent));
          ctx.fill();
        }
        break;
        
      case 'trap':
        // Draw as diamond
        ctx.beginPath();
        ctx.moveTo(0, -pulseSize);
        ctx.lineTo(pulseSize, 0);
        ctx.lineTo(0, pulseSize);
        ctx.lineTo(-pulseSize, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        break;
        
      case 'dynamic':
        // Draw as hexagon
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI * 2 * i) / 6;
          const x = Math.cos(angle) * pulseSize;
          const y = Math.sin(angle) * pulseSize;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        break;
    }

    ctx.restore();

    // Draw icon
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `${element.size * 0.6}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(element.icon, element.x, element.y);
  }

  getEnvironmentalStats() {
    const stats = {
      totalElements: this.elements.length,
      elementsByType: {},
      activeParticles: this.particles.length
    };

    this.elements.forEach(element => {
      if (!stats.elementsByType[element.type]) {
        stats.elementsByType[element.type] = 0;
      }
      stats.elementsByType[element.type]++;
    });

    return stats;
  }
}
