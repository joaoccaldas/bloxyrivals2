// Dynamic Map Events System
// Adds random events that change the map and gameplay dynamically

export class MapEventsSystem {
  constructor(game) {
    this.game = game;
    
    // Event timing
    this.eventTimer = 0;
    this.minEventInterval = 15000; // 15 seconds minimum
    this.maxEventInterval = 45000; // 45 seconds maximum
    this.nextEventTime = this.getRandomEventTime();
    
    // Active events
    this.activeEvents = [];
    this.maxActiveEvents = 3;
    
    // Event types and their configurations
    this.eventTypes = {
      earthquake: {
        name: 'Earthquake',
        duration: 8000,
        probability: 0.2,
        description: 'Screen shakes and blocks fall from the sky!',
        icon: '🌍'
      },
      meteor_shower: {
        name: 'Meteor Shower',
        duration: 10000,
        probability: 0.15,
        description: 'Meteors rain down from above!',
        icon: '☄️'
      },
      speed_zone: {
        name: 'Speed Zone',
        duration: 12000,
        probability: 0.25,
        description: 'Everyone moves faster!',
        icon: '💨'
      },
      gravity_shift: {
        name: 'Gravity Shift',
        duration: 8000,
        probability: 0.1,
        description: 'Gravity changes direction!',
        icon: '🌀'
      },
      fog_of_war: {
        name: 'Fog of War',
        duration: 15000,
        probability: 0.2,
        description: 'Thick fog reduces visibility!',
        icon: '🌫️'
      },
      healing_rain: {
        name: 'Healing Rain',
        duration: 6000,
        probability: 0.15,
        description: 'Magical rain heals all players!',
        icon: '🌧️'
      },
      portal_storm: {
        name: 'Portal Storm',
        duration: 10000,
        probability: 0.1,
        description: 'Random teleportation portals appear!',
        icon: '🌪️'
      },
      time_warp: {
        name: 'Time Warp',
        duration: 7000,
        probability: 0.08,
        description: 'Time moves differently!',
        icon: '⏰'
      }
    };
    
    // Event state tracking
    this.eventWarningTime = 3000; // 3 second warning
    this.warningEvents = [];
    
    // Visual effects
    this.screenShake = { x: 0, y: 0, intensity: 0 };
    this.particles = [];
    
    console.log('🎭 Dynamic Map Events System initialized');
  }

  /**
   * Update events system
   * @param {number} delta - Time delta
   */
  update(delta) {
    if (this.game.state !== 'playing') return;
    
    this.eventTimer += delta;
    
    // Check if it's time for a new event
    if (this.eventTimer >= this.nextEventTime && this.activeEvents.length < this.maxActiveEvents) {
      this.triggerRandomEvent();
      this.eventTimer = 0;
      this.nextEventTime = this.getRandomEventTime();
    }
    
    // Update active events
    this.updateActiveEvents(delta);
    
    // Update warning events
    this.updateWarningEvents(delta);
    
    // Update visual effects
    this.updateScreenShake(delta);
    this.updateParticles(delta);
  }

  /**
   * Get random time until next event
   * @returns {number}
   */
  getRandomEventTime() {
    return this.minEventInterval + Math.random() * (this.maxEventInterval - this.minEventInterval);
  }

  /**
   * Trigger a random event
   */
  triggerRandomEvent() {
    const availableEvents = Object.keys(this.eventTypes).filter(type => {
      // Don't repeat the same event type
      return !this.activeEvents.some(event => event.type === type);
    });
    
    if (availableEvents.length === 0) return;
    
    // Weighted random selection
    let totalProbability = 0;
    const weights = availableEvents.map(type => {
      totalProbability += this.eventTypes[type].probability;
      return { type, weight: totalProbability };
    });
    
    const random = Math.random() * totalProbability;
    const selectedEvent = weights.find(w => random <= w.weight);
    
    if (selectedEvent) {
      this.startEventWarning(selectedEvent.type);
    }
  }

  /**
   * Start event warning phase
   * @param {string} eventType - Type of event to warn about
   */
  startEventWarning(eventType) {
    const eventConfig = this.eventTypes[eventType];
    
    this.warningEvents.push({
      type: eventType,
      config: eventConfig,
      warningTimeLeft: this.eventWarningTime,
      startTime: Date.now()
    });
    
    console.log(`⚠️ WARNING: ${eventConfig.name} incoming in 3 seconds!`);
  }

  /**
   * Actually start an event after warning
   * @param {string} eventType - Type of event to start
   */
  startEvent(eventType) {
    const eventConfig = this.eventTypes[eventType];
    
    const event = {
      type: eventType,
      config: eventConfig,
      duration: eventConfig.duration,
      timeLeft: eventConfig.duration,
      startTime: Date.now(),
      data: this.initializeEventData(eventType)
    };
    
    this.activeEvents.push(event);
    
    console.log(`🎭 ${eventConfig.icon} ${eventConfig.name} started!`);
    
    // Apply immediate effects
    this.applyEventEffects(event);
  }

  /**
   * Initialize event-specific data
   * @param {string} eventType - Type of event
   * @returns {Object}
   */
  initializeEventData(eventType) {
    switch (eventType) {
      case 'earthquake':
        return { 
          shakeIntensity: 15,
          blockDropTimer: 0,
          blockDropInterval: 2000 
        };
      
      case 'meteor_shower':
        return { 
          meteorTimer: 0,
          meteorInterval: 800,
          meteors: [] 
        };
      
      case 'speed_zone':
        return { 
          originalSpeeds: new Map(),
          speedMultiplier: 1.5 
        };
      
      case 'gravity_shift':
        return { 
          originalGravity: this.game.world ? this.game.world.gravity : 0.5,
          newGravity: -0.3 
        };
      
      case 'fog_of_war':
        return { 
          fogOpacity: 0.7,
          visibilityRadius: 100 
        };
      
      case 'healing_rain':
        return { 
          healAmount: 2,
          healInterval: 500,
          lastHealTime: 0,
          rainDrops: [] 
        };
      
      case 'portal_storm':
        return { 
          portals: [],
          portalSpawnTimer: 0,
          portalSpawnInterval: 3000 
        };
      
      case 'time_warp':
        return { 
          timeMultiplier: 0.5,
          originalTimeScale: 1 
        };
      
      default:
        return {};
    }
  }

  /**
   * Apply event effects
   * @param {Object} event - Event to apply
   */
  applyEventEffects(event) {
    switch (event.type) {
      case 'earthquake':
        this.screenShake.intensity = event.data.shakeIntensity;
        break;
      
      case 'speed_zone':
        this.applySpeedZone(event);
        break;
      
      case 'gravity_shift':
        if (this.game.world) {
          this.game.world.gravity = event.data.newGravity;
        }
        break;
      
      case 'time_warp':
        // This would need to be integrated with the game's time scaling
        break;
    }
  }

  /**
   * Apply speed zone effects
   * @param {Object} event - Speed zone event
   */
  applySpeedZone(event) {
    // Speed up player
    if (this.game.player && !event.data.originalSpeeds.has('player')) {
      event.data.originalSpeeds.set('player', this.game.player.speed);
      this.game.player.speed *= event.data.speedMultiplier;
    }
    
    // Speed up mobs
    if (this.game.mobs) {
      this.game.mobs.forEach((mob, index) => {
        if (!event.data.originalSpeeds.has(`mob_${index}`)) {
          event.data.originalSpeeds.set(`mob_${index}`, mob.speed);
          mob.speed *= event.data.speedMultiplier;
        }
      });
    }
  }

  /**
   * Update active events
   * @param {number} delta - Time delta
   */
  updateActiveEvents(delta) {
    this.activeEvents = this.activeEvents.filter(event => {
      event.timeLeft -= delta;
      
      // Update event-specific logic
      this.updateEventLogic(event, delta);
      
      if (event.timeLeft <= 0) {
        this.endEvent(event);
        return false;
      }
      
      return true;
    });
  }

  /**
   * Update warning events
   * @param {number} delta - Time delta
   */
  updateWarningEvents(delta) {
    this.warningEvents = this.warningEvents.filter(warning => {
      warning.warningTimeLeft -= delta;
      
      if (warning.warningTimeLeft <= 0) {
        this.startEvent(warning.type);
        return false;
      }
      
      return true;
    });
  }

  /**
   * Update event-specific logic
   * @param {Object} event - Event to update
   * @param {number} delta - Time delta
   */
  updateEventLogic(event, delta) {
    switch (event.type) {
      case 'earthquake':
        this.updateEarthquake(event, delta);
        break;
      
      case 'meteor_shower':
        this.updateMeteorShower(event, delta);
        break;
      
      case 'healing_rain':
        this.updateHealingRain(event, delta);
        break;
      
      case 'portal_storm':
        this.updatePortalStorm(event, delta);
        break;
    }
  }

  /**
   * Update earthquake event
   * @param {Object} event - Earthquake event
   * @param {number} delta - Time delta
   */
  updateEarthquake(event, delta) {
    // Random screen shake
    this.screenShake.x = (Math.random() - 0.5) * event.data.shakeIntensity;
    this.screenShake.y = (Math.random() - 0.5) * event.data.shakeIntensity;
    
    // Drop blocks periodically
    event.data.blockDropTimer += delta;
    if (event.data.blockDropTimer >= event.data.blockDropInterval) {
      this.dropRandomBlocks();
      event.data.blockDropTimer = 0;
    }
  }

  /**
   * Update meteor shower event
   * @param {Object} event - Meteor shower event
   * @param {number} delta - Time delta
   */
  updateMeteorShower(event, delta) {
    event.data.meteorTimer += delta;
    
    if (event.data.meteorTimer >= event.data.meteorInterval) {
      this.spawnMeteor(event);
      event.data.meteorTimer = 0;
    }
    
    // Update existing meteors
    event.data.meteors = event.data.meteors.filter(meteor => {
      meteor.y += meteor.speed * delta / 1000;
      
      // Check collision with ground or entities
      if (meteor.y >= this.game.canvas.height - 50) {
        this.createMeteorExplosion(meteor);
        return false;
      }
      
      return true;
    });
  }

  /**
   * Update healing rain event
   * @param {Object} event - Healing rain event
   * @param {number} delta - Time delta
   */
  updateHealingRain(event, delta) {
    const now = Date.now();
    
    if (now - event.data.lastHealTime >= event.data.healInterval) {
      // Heal player
      if (this.game.player && this.game.player.health < this.game.player.maxHealth) {
        this.game.player.health = Math.min(
          this.game.player.maxHealth,
          this.game.player.health + event.data.healAmount
        );
      }
      
      event.data.lastHealTime = now;
    }
    
    // Create rain particles
    this.createRainParticles();
  }

  /**
   * Update portal storm event
   * @param {Object} event - Portal storm event
   * @param {number} delta - Time delta
   */
  updatePortalStorm(event, delta) {
    event.data.portalSpawnTimer += delta;
    
    if (event.data.portalSpawnTimer >= event.data.portalSpawnInterval) {
      this.spawnPortal(event);
      event.data.portalSpawnTimer = 0;
    }
    
    // Update existing portals
    event.data.portals.forEach(portal => {
      portal.rotation += delta * 0.005;
      
      // Check if player is near portal
      if (this.game.player) {
        const distance = Math.sqrt(
          Math.pow(this.game.player.x - portal.x, 2) +
          Math.pow(this.game.player.y - portal.y, 2)
        );
        
        if (distance < 30 && !portal.recentlyUsed) {
          this.teleportPlayer(portal);
          portal.recentlyUsed = true;
          setTimeout(() => portal.recentlyUsed = false, 2000);
        }
      }
    });
  }

  /**
   * Drop random blocks during earthquake
   */
  dropRandomBlocks() {
    if (!this.game.world) return;
    
    const canvas = this.game.canvas;
    const numBlocks = 3 + Math.floor(Math.random() * 3);
    
    for (let i = 0; i < numBlocks; i++) {
      const x = Math.random() * canvas.width;
      const y = -50;
      
      // Add falling block (if game has block system)
      if (this.game.addFallingBlock) {
        this.game.addFallingBlock(x, y);
      }
    }
  }

  /**
   * Spawn a meteor
   * @param {Object} event - Meteor shower event
   */
  spawnMeteor(event) {
    const canvas = this.game.canvas;
    
    const meteor = {
      x: Math.random() * canvas.width,
      y: -30,
      speed: 200 + Math.random() * 100,
      size: 10 + Math.random() * 15,
      rotation: 0,
      trail: []
    };
    
    event.data.meteors.push(meteor);
  }

  /**
   * Create meteor explosion
   * @param {Object} meteor - Meteor that exploded
   */
  createMeteorExplosion(meteor) {
    const explosionRadius = 60;
    const explosionDamage = 25;
    
    // Damage nearby entities
    if (this.game.mobs) {
      this.game.mobs.forEach(mob => {
        const distance = Math.sqrt(
          Math.pow(mob.x - meteor.x, 2) + Math.pow(mob.y - meteor.y, 2)
        );
        
        if (distance <= explosionRadius) {
          const damage = Math.floor(explosionDamage * (1 - distance / explosionRadius));
          mob.takeDamage(damage);
        }
      });
    }
    
    // Damage player
    if (this.game.player) {
      const distance = Math.sqrt(
        Math.pow(this.game.player.x - meteor.x, 2) + 
        Math.pow(this.game.player.y - meteor.y, 2)
      );
      
      if (distance <= explosionRadius) {
        const damage = Math.floor(explosionDamage * (1 - distance / explosionRadius));
        this.game.player.takeDamage(damage);
      }
    }
    
    // Create explosion particles
    this.createExplosionParticles(meteor.x, meteor.y);
  }

  /**
   * Spawn a portal
   * @param {Object} event - Portal storm event
   */
  spawnPortal(event) {
    const canvas = this.game.canvas;
    
    const portal = {
      x: 50 + Math.random() * (canvas.width - 100),
      y: 50 + Math.random() * (canvas.height - 100),
      size: 40,
      rotation: 0,
      life: 8000, // 8 seconds
      recentlyUsed: false
    };
    
    event.data.portals.push(portal);
    
    // Remove old portals
    setTimeout(() => {
      const index = event.data.portals.indexOf(portal);
      if (index > -1) {
        event.data.portals.splice(index, 1);
      }
    }, portal.life);
  }

  /**
   * Teleport player through portal
   * @param {Object} portal - Portal used for teleportation
   */
  teleportPlayer(portal) {
    if (!this.game.player) return;
    
    const canvas = this.game.canvas;
    
    // Find a safe teleport location
    let attempts = 0;
    let newX, newY;
    
    do {
      newX = 50 + Math.random() * (canvas.width - 100);
      newY = 50 + Math.random() * (canvas.height - 100);
      attempts++;
    } while (attempts < 10); // Prevent infinite loop
    
    // Teleport player
    this.game.player.x = newX;
    this.game.player.y = newY;
    
    // Create teleport effect
    this.createTeleportEffect(portal.x, portal.y, newX, newY);
    
    console.log('🌪️ Player teleported!');
  }

  /**
   * End an event and clean up
   * @param {Object} event - Event to end
   */
  endEvent(event) {
    console.log(`🎭 ${event.config.name} ended!`);
    
    switch (event.type) {
      case 'earthquake':
        this.screenShake.intensity = 0;
        break;
      
      case 'speed_zone':
        this.revertSpeedZone(event);
        break;
      
      case 'gravity_shift':
        if (this.game.world) {
          this.game.world.gravity = event.data.originalGravity;
        }
        break;
    }
  }

  /**
   * Revert speed zone effects
   * @param {Object} event - Speed zone event
   */
  revertSpeedZone(event) {
    // Revert player speed
    if (this.game.player && event.data.originalSpeeds.has('player')) {
      this.game.player.speed = event.data.originalSpeeds.get('player');
    }
    
    // Revert mob speeds
    if (this.game.mobs) {
      this.game.mobs.forEach((mob, index) => {
        if (event.data.originalSpeeds.has(`mob_${index}`)) {
          mob.speed = event.data.originalSpeeds.get(`mob_${index}`);
        }
      });
    }
  }

  /**
   * Update screen shake
   * @param {number} delta - Time delta
   */
  updateScreenShake(delta) {
    if (this.screenShake.intensity > 0) {
      this.screenShake.intensity *= 0.95; // Decay
      if (this.screenShake.intensity < 0.1) {
        this.screenShake.intensity = 0;
        this.screenShake.x = 0;
        this.screenShake.y = 0;
      }
    }
  }

  /**
   * Update particles
   * @param {number} delta - Time delta
   */
  updateParticles(delta) {
    this.particles = this.particles.filter(particle => {
      particle.x += particle.vx * delta / 1000;
      particle.y += particle.vy * delta / 1000;
      particle.life -= delta;
      particle.size *= 0.99;
      return particle.life > 0 && particle.size > 0.5;
    });
  }

  /**
   * Create various particle effects
   */
  createRainParticles() {
    const canvas = this.game.canvas;
    
    for (let i = 0; i < 3; i++) {
      this.particles.push({
        x: Math.random() * canvas.width,
        y: -10,
        vx: 0,
        vy: 300,
        life: 2000,
        size: 2,
        color: '#4FC3F7',
        type: 'rain'
      });
    }
  }

  createExplosionParticles(x, y) {
    for (let i = 0; i < 15; i++) {
      const angle = (Math.PI * 2 * i) / 15;
      const speed = 100 + Math.random() * 100;
      
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1000 + Math.random() * 1000,
        size: 5 + Math.random() * 5,
        color: ['#FF4500', '#FF6B35', '#FFD700'][Math.floor(Math.random() * 3)],
        type: 'explosion'
      });
    }
  }

  createTeleportEffect(x1, y1, x2, y2) {
    // Create particles at both locations
    [{ x: x1, y: y1 }, { x: x2, y: y2 }].forEach(pos => {
      for (let i = 0; i < 10; i++) {
        this.particles.push({
          x: pos.x,
          y: pos.y,
          vx: (Math.random() - 0.5) * 200,
          vy: (Math.random() - 0.5) * 200,
          life: 800,
          size: 3 + Math.random() * 4,
          color: '#9C27B0',
          type: 'teleport'
        });
      }
    });
  }

  /**
   * Draw events and effects
   * @param {CanvasRenderingContext2D} ctx 
   */
  draw(ctx) {
    if (!ctx) return;
    
    ctx.save();
    
    // Apply screen shake
    if (this.screenShake.intensity > 0) {
      ctx.translate(this.screenShake.x, this.screenShake.y);
    }
    
    // Draw active events
    this.activeEvents.forEach(event => {
      this.drawEvent(ctx, event);
    });
    
    // Draw particles
    this.drawParticles(ctx);
    
    // Draw event UI
    this.drawEventUI(ctx);
    
    ctx.restore();
  }

  /**
   * Draw specific event effects
   * @param {CanvasRenderingContext2D} ctx 
   * @param {Object} event - Event to draw
   */
  drawEvent(ctx, event) {
    switch (event.type) {
      case 'meteor_shower':
        this.drawMeteors(ctx, event);
        break;
      
      case 'fog_of_war':
        this.drawFog(ctx, event);
        break;
      
      case 'portal_storm':
        this.drawPortals(ctx, event);
        break;
    }
  }

  /**
   * Draw meteors
   * @param {CanvasRenderingContext2D} ctx 
   * @param {Object} event - Meteor shower event
   */
  drawMeteors(ctx, event) {
    event.data.meteors.forEach(meteor => {
      ctx.save();
      ctx.translate(meteor.x, meteor.y);
      ctx.rotate(meteor.rotation);
      
      // Draw meteor trail
      ctx.strokeStyle = 'rgba(255, 100, 0, 0.6)';
      ctx.lineWidth = meteor.size / 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -20);
      ctx.stroke();
      
      // Draw meteor
      ctx.fillStyle = '#FF4500';
      ctx.beginPath();
      ctx.arc(0, 0, meteor.size, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();
    });
  }

  /**
   * Draw fog effect
   * @param {CanvasRenderingContext2D} ctx 
   * @param {Object} event - Fog event
   */
  drawFog(ctx, event) {
    const canvas = this.game.canvas;
    
    ctx.save();
    ctx.fillStyle = `rgba(200, 200, 200, ${event.data.fogOpacity})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Clear area around player
    if (this.game.player) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(this.game.player.x, this.game.player.y, event.data.visibilityRadius, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.restore();
  }

  /**
   * Draw portals
   * @param {CanvasRenderingContext2D} ctx 
   * @param {Object} event - Portal storm event
   */
  drawPortals(ctx, event) {
    event.data.portals.forEach(portal => {
      ctx.save();
      ctx.translate(portal.x, portal.y);
      ctx.rotate(portal.rotation);
      
      // Draw portal rings
      for (let i = 0; i < 3; i++) {
        ctx.strokeStyle = `rgba(156, 39, 176, ${0.8 - i * 0.2})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, portal.size - i * 10, 0, Math.PI * 2);
        ctx.stroke();
      }
      
      // Draw portal center
      ctx.fillStyle = 'rgba(156, 39, 176, 0.5)';
      ctx.beginPath();
      ctx.arc(0, 0, portal.size / 2, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();
    });
  }

  /**
   * Draw particles
   * @param {CanvasRenderingContext2D} ctx 
   */
  drawParticles(ctx) {
    this.particles.forEach(particle => {
      const alpha = particle.life / 2000;
      
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  /**
   * Draw event UI
   * @param {CanvasRenderingContext2D} ctx 
   */
  drawEventUI(ctx) {
    const canvas = this.game.canvas;
    let yOffset = 120;
    
    // Draw active events
    this.activeEvents.forEach(event => {
      const timeLeft = Math.ceil(event.timeLeft / 1000);
      
      ctx.font = '14px Arial';
      ctx.fillStyle = '#FFD700';
      ctx.textAlign = 'left';
      ctx.fillText(`${event.config.icon} ${event.config.name}: ${timeLeft}s`, 20, yOffset);
      
      yOffset += 20;
    });
    
    // Draw warnings
    this.warningEvents.forEach(warning => {
      const timeLeft = Math.ceil(warning.warningTimeLeft / 1000);
      
      ctx.font = 'bold 18px Arial';
      ctx.fillStyle = '#FF4444';
      ctx.textAlign = 'center';
      ctx.fillText(`⚠️ ${warning.config.name} in ${timeLeft}s!`, canvas.width / 2, 150);
    });
  }

  /**
   * Get current events summary
   * @returns {Array}
   */
  getCurrentEvents() {
    return this.activeEvents.map(event => ({
      type: event.type,
      name: event.config.name,
      timeLeft: Math.ceil(event.timeLeft / 1000)
    }));
  }

  /**
   * Reset events system
   */
  reset() {
    this.activeEvents = [];
    this.warningEvents = [];
    this.particles = [];
    this.eventTimer = 0;
    this.nextEventTime = this.getRandomEventTime();
    this.screenShake = { x: 0, y: 0, intensity: 0 };
    
    console.log('🔄 Map Events system reset');
  }
}
