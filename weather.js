// weather.js - Dynamic weather system for Bloxy Rivals

export class WeatherSystem {
  constructor(canvas, world) {
    this.canvas = canvas;
    this.world = world;
    this.currentWeather = null;
    this.weatherTimer = 0;
    this.weatherDuration = 0;
    this.nextWeatherCheck = 10000; // Check for new weather every 10 seconds
    this.particles = [];
    this.lightningFlashes = [];
    
    // Weather effects data
    this.weatherTypes = {
      CLEAR: { name: 'Clear', probability: 0.4 },
      RAIN: { name: 'Rain', probability: 0.25 },
      THUNDER: { name: 'Thunder Storm', probability: 0.15 },
      TORNADO: { name: 'Tornado', probability: 0.1 },
      NIGHT: { name: 'Night', probability: 0.25 },
      METEOR: { name: 'Meteor Shower', probability: 0.1 } // Only during night
    };
    
    this.isNight = false;
    this.nightOverlay = 0; // 0-1 darkness level
    this.tornadoX = 0;
    this.tornadoY = 0;
    this.tornadoAngle = 0;
    
    // Audio context for weather sounds (optional)
    this.audioContext = null;
    this.initAudio();
  }
  
  initAudio() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.log('Audio not available');
    }
  }
  
  update(delta, player, mobs) {
    this.weatherTimer += delta;
    
    // Check for new weather
    if (this.weatherTimer >= this.nextWeatherCheck) {
      this.selectNewWeather();
      this.weatherTimer = 0;
    }
    
    // Update current weather effects
    if (this.currentWeather) {
      this.updateWeatherEffects(delta, player, mobs);
    }
    
    // Update particles
    this.updateParticles(delta);
    
    // Update lightning flashes
    this.updateLightning(delta);
  }
  
  selectNewWeather() {
    const random = Math.random();
    let cumulativeProbability = 0;
    let selectedWeather = 'CLEAR';
    
    // Special case: meteor shower can only happen at night
    const availableWeathers = { ...this.weatherTypes };
    if (!this.isNight) {
      delete availableWeathers.METEOR;
    }
    
    for (const [weather, data] of Object.entries(availableWeathers)) {
      cumulativeProbability += data.probability;
      if (random <= cumulativeProbability) {
        selectedWeather = weather;
        break;
      }
    }
    
    // Don't repeat the same weather immediately
    if (selectedWeather === this.currentWeather) {
      selectedWeather = 'CLEAR';
    }
    
    this.setWeather(selectedWeather);
  }
  
  setWeather(weatherType) {
    this.currentWeather = weatherType;
    this.weatherDuration = Math.random() * 50000 + 10000; // 10-60 seconds
    this.nextWeatherCheck = this.weatherDuration;
    this.particles = [];
    this.lightningFlashes = [];
    
    console.log(`Weather changed to: ${this.weatherTypes[weatherType]?.name || weatherType}`);
    
    // Initialize weather-specific effects
    switch (weatherType) {
      case 'RAIN':
        this.initRain();
        break;
      case 'THUNDER':
        this.initThunder();
        break;
      case 'TORNADO':
        this.initTornado();
        break;
      case 'NIGHT':
        this.initNight();
        break;
      case 'METEOR':
        this.initMeteorShower();
        break;
    }
  }
  
  initRain() {
    // Create rain particles
    for (let i = 0; i < 100; i++) {
      this.particles.push({
        x: Math.random() * this.world.width,
        y: Math.random() * this.world.height,
        vx: -2 + Math.random() * 4,
        vy: 300 + Math.random() * 200,
        type: 'rain',
        life: 1.0
      });
    }
  }
  
  initThunder() {
    this.initRain(); // Thunder includes rain
    this.scheduleNextLightning();
  }
  
  scheduleNextLightning() {
    setTimeout(() => {
      if (this.currentWeather === 'THUNDER') {
        this.createLightningFlash();
        this.scheduleNextLightning();
      }
    }, Math.random() * 3000 + 1000); // 1-4 seconds between lightning
  }
  
  createLightningFlash() {
    this.lightningFlashes.push({
      intensity: 1.0,
      duration: 200,
      timer: 0
    });
    
    // Play thunder sound (optional)
    this.playThunderSound();
  }
  
  initTornado() {
    this.tornadoX = Math.random() * this.world.width;
    this.tornadoY = Math.random() * this.world.height;
    this.tornadoAngle = 0;
    
    // Create debris particles
    for (let i = 0; i < 50; i++) {
      this.particles.push({
        x: this.tornadoX + (Math.random() - 0.5) * 100,
        y: this.tornadoY + (Math.random() - 0.5) * 100,
        vx: (Math.random() - 0.5) * 200,
        vy: (Math.random() - 0.5) * 200,
        type: 'debris',
        life: 1.0,
        size: Math.random() * 8 + 2
      });
    }
  }
  
  initNight() {
    this.isNight = true;
    this.nightOverlay = 0.7; // Dark but not completely black
  }
  
  initMeteorShower() {
    // Create meteor particles
    for (let i = 0; i < 20; i++) {
      this.particles.push({
        x: Math.random() * this.world.width,
        y: -50,
        vx: (Math.random() - 0.5) * 100,
        vy: 200 + Math.random() * 300,
        type: 'meteor',
        life: 1.0,
        size: Math.random() * 6 + 3,
        trail: []
      });
    }
  }
    updateWeatherEffects(delta, player, mobs) {
    // First reset all effects, then apply current weather
    this.resetWeatherEffects(player, mobs);
    
    switch (this.currentWeather) {
      case 'RAIN':
        this.applyRainEffects(player, mobs);
        break;
      case 'THUNDER':
        this.applyThunderEffects(player, mobs);
        break;
      case 'TORNADO':
        this.applyTornadoEffects(delta, player, mobs);
        break;
      case 'NIGHT':
        this.applyNightEffects(player, mobs);
        break;
      case 'METEOR':
        this.applyMeteorEffects(delta, player, mobs);
        break;
      case 'CLEAR':
        this.applyClearEffects();
        break;
    }
  }
  
  applyRainEffects(player, mobs) {
    // Rain reduces visibility and movement speed slightly
    player.weatherSpeedMultiplier = 0.9;
    mobs.forEach(mob => {
      mob.weatherSpeedMultiplier = 0.9;
    });
  }
  
  applyThunderEffects(player, mobs) {
    this.applyRainEffects(player, mobs);
    // Lightning can cause brief stuns
    if (this.lightningFlashes.length > 0) {
      const flashIntensity = this.lightningFlashes[0].intensity;
      if (flashIntensity > 0.8) {
        // Brief movement disruption during lightning
        player.weatherSpeedMultiplier = 0.5;
        mobs.forEach(mob => {
          mob.weatherSpeedMultiplier = 0.5;
        });
      }
    }
  }
  
  applyTornadoEffects(delta, player, mobs) {
    // Move tornado
    this.tornadoAngle += delta * 0.001;
    this.tornadoX += Math.sin(this.tornadoAngle) * 50 * delta / 1000;
    this.tornadoY += Math.cos(this.tornadoAngle) * 30 * delta / 1000;
    
    // Keep tornado in bounds
    this.tornadoX = Math.max(50, Math.min(this.world.width - 50, this.tornadoX));
    this.tornadoY = Math.max(50, Math.min(this.world.height - 50, this.tornadoY));
    
    // Check tornado effects on entities
    const tornadoRadius = 80;
    
    // Effect on player
    const playerDist = Math.hypot(player.x - this.tornadoX, player.y - this.tornadoY);
    if (playerDist < tornadoRadius) {
      const force = (tornadoRadius - playerDist) / tornadoRadius;
      const angle = Math.atan2(player.y - this.tornadoY, player.x - this.tornadoX);
      player.x += Math.cos(angle + Math.PI/2) * force * 100 * delta / 1000;
      player.y += Math.sin(angle + Math.PI/2) * force * 100 * delta / 1000;
      player.weatherSpeedMultiplier = 0.3; // Difficult to move in tornado
    }
    
    // Effect on mobs
    mobs.forEach(mob => {
      const mobDist = Math.hypot(mob.x - this.tornadoX, mob.y - this.tornadoY);
      if (mobDist < tornadoRadius) {
        const force = (tornadoRadius - mobDist) / tornadoRadius;
        const angle = Math.atan2(mob.y - this.tornadoY, mob.x - this.tornadoX);
        mob.x += Math.cos(angle + Math.PI/2) * force * 80 * delta / 1000;
        mob.y += Math.sin(angle + Math.PI/2) * force * 80 * delta / 1000;
        mob.weatherSpeedMultiplier = 0.3;
      }
    });
  }
  
  applyNightEffects(player, mobs) {
    // Reduced visibility affects accuracy and movement
    player.weatherSpeedMultiplier = 0.8;
    player.weatherVisibilityMultiplier = 0.6;
    
    mobs.forEach(mob => {
      mob.weatherSpeedMultiplier = 0.8;
      mob.weatherVisibilityMultiplier = 0.6;
    });
  }
  
  applyMeteorEffects(delta, player, mobs) {
    this.applyNightEffects(player, mobs);
    
    // Check meteor impacts
    this.particles.forEach(particle => {
      if (particle.type === 'meteor' && particle.y > this.world.height - 50) {
        // Meteor impact - create explosion effect
        this.createMeteorExplosion(particle.x, particle.y, player, mobs);
        particle.life = 0; // Remove meteor
      }
    });
  }
  
  createMeteorExplosion(x, y, player, mobs) {
    const explosionRadius = 60;
    
    // Damage player if in range
    const playerDist = Math.hypot(player.x - x, player.y - y);
    if (playerDist < explosionRadius) {
      const damage = Math.floor((explosionRadius - playerDist) / explosionRadius * 20);
      player.takeDamage(damage);
    }
    
    // Damage mobs if in range
    mobs.forEach(mob => {
      const mobDist = Math.hypot(mob.x - x, mob.y - y);
      if (mobDist < explosionRadius) {
        const damage = Math.floor((explosionRadius - mobDist) / explosionRadius * 15);
        mob.takeDamage(damage);
      }
    });
    
    // Create explosion particles
    for (let i = 0; i < 10; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 40,
        y: y + (Math.random() - 0.5) * 40,
        vx: (Math.random() - 0.5) * 200,
        vy: (Math.random() - 0.5) * 200,
        type: 'explosion',
        life: 1.0,
        size: Math.random() * 8 + 4
      });
    }
  }
  applyClearEffects() {
    this.isNight = false;
    this.nightOverlay = 0;
  }
  
  resetWeatherEffects(player, mobs) {
    // Reset all weather multipliers to normal
    player.weatherSpeedMultiplier = 1.0;
    player.weatherVisibilityMultiplier = 1.0;
    
    mobs.forEach(mob => {
      mob.weatherSpeedMultiplier = 1.0;
      mob.weatherVisibilityMultiplier = 1.0;
    });
  }
  
  updateParticles(delta) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      
      // Update position
      particle.x += particle.vx * delta / 1000;
      particle.y += particle.vy * delta / 1000;
      
      // Update particle based on type
      switch (particle.type) {
        case 'rain':
          if (particle.y > this.world.height) {
            particle.y = -10;
            particle.x = Math.random() * this.world.width;
          }
          break;
          
        case 'meteor':
          // Add trail effect
          particle.trail.push({ x: particle.x, y: particle.y, life: 0.5 });
          if (particle.trail.length > 10) particle.trail.shift();
          
          // Update trail
          particle.trail.forEach(trail => {
            trail.life -= delta / 1000;
          });
          particle.trail = particle.trail.filter(trail => trail.life > 0);
          
          if (particle.y > this.world.height + 50) {
            particle.life = 0;
          }
          break;
          
        case 'debris':
          particle.vy += 100 * delta / 1000; // Gravity
          particle.life -= delta / 2000;
          break;
          
        case 'explosion':
          particle.life -= delta / 500;
          particle.size *= 0.99;
          break;
      }
      
      // Remove dead particles
      if (particle.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }
  
  updateLightning(delta) {
    for (let i = this.lightningFlashes.length - 1; i >= 0; i--) {
      const flash = this.lightningFlashes[i];
      flash.timer += delta;
      flash.intensity = Math.max(0, 1 - flash.timer / flash.duration);
      
      if (flash.intensity <= 0) {
        this.lightningFlashes.splice(i, 1);
      }
    }
  }
    draw(ctx, camera) {
    ctx.save();
    
    // Apply camera transformation if camera is available
    if (camera && camera.begin) {
      camera.begin(ctx);
    }
    
    // Draw weather effects
    switch (this.currentWeather) {
      case 'RAIN':
      case 'THUNDER':
        this.drawRain(ctx);
        break;
      case 'TORNADO':
        this.drawTornado(ctx);
        this.drawRain(ctx);
        break;
      case 'METEOR':
        this.drawMeteors(ctx);
        break;
    }
      // Draw particles
    this.drawParticles(ctx);
    
    // End camera transformation if camera is available
    if (camera && camera.end) {
      camera.end(ctx);
    }
    
    // Draw screen effects (after camera)
    if (this.currentWeather === 'NIGHT' || this.currentWeather === 'METEOR') {
      this.drawNightOverlay(ctx);
    }
    
    if (this.lightningFlashes.length > 0) {
      this.drawLightningFlash(ctx);
    }
    
    // Draw weather UI
    this.drawWeatherUI(ctx);
    
    ctx.restore();
  }
  
  drawRain(ctx) {
    ctx.strokeStyle = 'rgba(173, 216, 230, 0.8)';
    ctx.lineWidth = 2;
    
    this.particles.forEach(particle => {
      if (particle.type === 'rain') {
        ctx.beginPath();
        ctx.moveTo(particle.x, particle.y);
        ctx.lineTo(particle.x + particle.vx * 0.1, particle.y + particle.vy * 0.1);
        ctx.stroke();
      }
    });
  }
  
  drawTornado(ctx) {
    ctx.save();
    ctx.translate(this.tornadoX, this.tornadoY);
    
    // Draw tornado spiral
    ctx.strokeStyle = 'rgba(105, 105, 105, 0.8)';
    ctx.lineWidth = 3;
    
    for (let i = 0; i < 20; i++) {
      const angle = (this.tornadoAngle + i * 0.3) % (Math.PI * 2);
      const radius = i * 4;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius - i * 2;
      
      if (i === 0) {
        ctx.beginPath();
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
    
    ctx.restore();
  }
  
  drawMeteors(ctx) {
    this.particles.forEach(particle => {
      if (particle.type === 'meteor') {
        // Draw trail
        ctx.strokeStyle = 'rgba(255, 140, 0, 0.8)';
        ctx.lineWidth = 2;
        
        if (particle.trail.length > 1) {
          ctx.beginPath();
          ctx.moveTo(particle.trail[0].x, particle.trail[0].y);
          for (let i = 1; i < particle.trail.length; i++) {
            ctx.lineTo(particle.trail[i].x, particle.trail[i].y);
          }
          ctx.stroke();
        }
        
        // Draw meteor
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }
  
  drawParticles(ctx) {
    this.particles.forEach(particle => {
      switch (particle.type) {
        case 'debris':
          ctx.fillStyle = `rgba(139, 69, 19, ${particle.life})`;
          ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
          break;
          
        case 'explosion':
          ctx.fillStyle = `rgba(255, 69, 0, ${particle.life})`;
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          ctx.fill();
          break;
      }
    });
  }
  
  drawNightOverlay(ctx) {
    ctx.fillStyle = `rgba(0, 0, 20, ${this.nightOverlay})`;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }
  
  drawLightningFlash(ctx) {
    const flash = this.lightningFlashes[0];
    if (flash && flash.intensity > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${flash.intensity * 0.3})`;
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }
  
  drawWeatherUI(ctx) {
    if (this.currentWeather && this.currentWeather !== 'CLEAR') {
      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(this.canvas.width - 150, 10, 140, 30);
      
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(
        this.weatherTypes[this.currentWeather]?.name || this.currentWeather,
        this.canvas.width - 80,
        30
      );
      ctx.restore();
    }
  }
  
  playThunderSound() {
    if (!this.audioContext) return;
    
    // Create a simple thunder sound using Web Audio API
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    oscillator.frequency.setValueAtTime(100, this.audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(30, this.audioContext.currentTime + 0.5);
    
    gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 1);
    
    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 1);
  }
  
  // Method to manually trigger weather for testing
  triggerWeather(weatherType) {
    if (this.weatherTypes[weatherType] || weatherType === 'CLEAR') {
      this.setWeather(weatherType);
    }
  }
  
  getCurrentWeather() {
    return this.currentWeather;
  }
  
  getWeatherEffectsDescription() {
    switch (this.currentWeather) {
      case 'RAIN':
        return 'Movement speed reduced by 10%';
      case 'THUNDER':
        return 'Movement speed reduced, lightning causes brief stuns';
      case 'TORNADO':
        return 'Entities pulled toward tornado, movement severely impaired nearby';
      case 'NIGHT':
        return 'Reduced visibility and movement speed';
      case 'METEOR':
        return 'Night effects + meteor impacts cause area damage';
      default:
        return 'Clear weather - no effects';
    }
  }
}
