/**
 * Boss Battle System
 * Spawns epic boss enemies with unique mechanics and phases
 */

export class BossBattleSystem {
  constructor(game) {
    this.game = game;
    this.activeBoss = null;
    this.bossTemplates = new Map();
    this.bossSpawnTimer = 0;
    this.bossSpawnInterval = 120000; // 2 minutes
    this.phaseTransitionEffects = [];
    
    // Boss UI elements
    this.bossHealthBar = null;
    this.bossNameplate = null;
    this.warningOverlay = null;
    
    // Initialize boss templates
    this.initializeBossTemplates();
    
    console.log('🎪 Boss Battle System initialized with', this.bossTemplates.size, 'boss types');
  }

  initializeBossTemplates() {
    const bossTemplates = [
      {
        id: 'flame_titan',
        name: 'Flame Titan',
        description: 'A massive fire-breathing behemoth',
        icon: '🔥',
        health: 500,
        maxHealth: 500,
        size: 60,
        speed: 0.5,
        damage: 25,
        color: '#FF4500',
        phases: [
          {
            healthThreshold: 1.0,
            abilities: ['fire_breath', 'charge_attack'],
            attackInterval: 3000
          },
          {
            healthThreshold: 0.6,
            abilities: ['fire_breath', 'charge_attack', 'flame_ring'],
            attackInterval: 2500
          },
          {
            healthThreshold: 0.3,
            abilities: ['fire_breath', 'charge_attack', 'flame_ring', 'meteor_shower'],
            attackInterval: 2000
          }
        ],
        rewards: {
          score: 1000,
          specialLoot: ['fire_weapon', 'flame_shield'],
          achievement: 'flame_slayer'
        }
      },
      {
        id: 'ice_queen',
        name: 'Ice Queen',
        description: 'Ruler of the frozen wastes',
        icon: '❄️',
        health: 400,
        maxHealth: 400,
        size: 50,
        speed: 0.7,
        damage: 20,
        color: '#00BFFF',
        phases: [
          {
            healthThreshold: 1.0,
            abilities: ['ice_shard', 'freeze_pulse'],
            attackInterval: 2800
          },
          {
            healthThreshold: 0.5,
            abilities: ['ice_shard', 'freeze_pulse', 'blizzard'],
            attackInterval: 2300
          },
          {
            healthThreshold: 0.2,
            abilities: ['ice_shard', 'freeze_pulse', 'blizzard', 'ice_prison'],
            attackInterval: 1800
          }
        ],
        rewards: {
          score: 1200,
          specialLoot: ['ice_weapon', 'frost_armor'],
          achievement: 'ice_breaker'
        }
      },
      {
        id: 'shadow_lord',
        name: 'Shadow Lord',
        description: 'Master of darkness and illusion',
        icon: '👤',
        health: 350,
        maxHealth: 350,
        size: 45,
        speed: 1.2,
        damage: 30,
        color: '#4B0082',
        phases: [
          {
            healthThreshold: 1.0,
            abilities: ['shadow_strike', 'dark_orb'],
            attackInterval: 2500
          },
          {
            healthThreshold: 0.7,
            abilities: ['shadow_strike', 'dark_orb', 'teleport_attack'],
            attackInterval: 2000
          },
          {
            healthThreshold: 0.4,
            abilities: ['shadow_strike', 'dark_orb', 'teleport_attack', 'shadow_clone'],
            attackInterval: 1500
          }
        ],
        rewards: {
          score: 1500,
          specialLoot: ['shadow_blade', 'void_cloak'],
          achievement: 'shadow_hunter'
        }
      },
      {
        id: 'mech_destroyer',
        name: 'Mech Destroyer',
        description: 'Heavily armored war machine',
        icon: '🤖',
        health: 800,
        maxHealth: 800,
        size: 70,
        speed: 0.3,
        damage: 35,
        color: '#708090',
        phases: [
          {
            healthThreshold: 1.0,
            abilities: ['laser_beam', 'missile_barrage'],
            attackInterval: 3500
          },
          {
            healthThreshold: 0.6,
            abilities: ['laser_beam', 'missile_barrage', 'shield_mode'],
            attackInterval: 3000
          },
          {
            healthThreshold: 0.3,
            abilities: ['laser_beam', 'missile_barrage', 'shield_mode', 'overload'],
            attackInterval: 2000
          }
        ],
        rewards: {
          score: 2000,
          specialLoot: ['plasma_cannon', 'power_armor'],
          achievement: 'machine_slayer'
        }
      }
    ];

    bossTemplates.forEach(template => {
      this.bossTemplates.set(template.id, template);
    });
  }

  spawnBoss(bossId = null) {
    if (this.activeBoss) return false; // Only one boss at a time
    
    // Random boss if not specified
    if (!bossId) {
      const bossIds = Array.from(this.bossTemplates.keys());
      bossId = bossIds[Math.floor(Math.random() * bossIds.length)];
    }
    
    const template = this.bossTemplates.get(bossId);
    if (!template) return false;
    
    // Show warning
    this.showBossWarning(template);
    
    setTimeout(() => {
      this.createBoss(template);
    }, 3000); // 3 second warning
    
    return true;
  }

  showBossWarning(template) {
    // Create warning overlay
    this.warningOverlay = document.createElement('div');
    this.warningOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(255, 0, 0, 0.3);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 3000;
      animation: bossWarning 3s ease-out forwards;
    `;
    
    const warningText = document.createElement('div');
    warningText.style.cssText = `
      font-size: 48px;
      color: #FF0000;
      font-weight: bold;
      text-shadow: 3px 3px 6px black;
      margin-bottom: 20px;
      animation: pulse 0.5s infinite alternate;
    `;
    warningText.textContent = 'BOSS INCOMING!';
    
    const bossName = document.createElement('div');
    bossName.style.cssText = `
      font-size: 36px;
      color: ${template.color};
      font-weight: bold;
      text-shadow: 2px 2px 4px black;
      display: flex;
      align-items: center;
      gap: 10px;
    `;
    bossName.innerHTML = `${template.icon} ${template.name} ${template.icon}`;
    
    this.warningOverlay.appendChild(warningText);
    this.warningOverlay.appendChild(bossName);
    
    // Add CSS animations
    if (!document.getElementById('boss-warning-style')) {
      const style = document.createElement('style');
      style.id = 'boss-warning-style';
      style.textContent = `
        @keyframes bossWarning {
          0% { opacity: 0; }
          50% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes pulse {
          0% { transform: scale(1); }
          100% { transform: scale(1.1); }
        }
      `;
      document.head.appendChild(style);
    }
    
    document.body.appendChild(this.warningOverlay);
    
    setTimeout(() => {
      if (this.warningOverlay) {
        document.body.removeChild(this.warningOverlay);
        this.warningOverlay = null;
      }
    }, 3000);
  }

  createBoss(template) {
    // Create boss object
    this.activeBoss = {
      ...template,
      x: this.game.canvas.width / 2,
      y: 50, // Spawn at top
      vx: 0,
      vy: 0,
      currentPhase: 0,
      lastAttack: 0,
      attackCooldown: template.phases[0].attackInterval,
      isAttacking: false,
      rotation: 0,
      projectiles: [],
      effects: [],
      spawned: Date.now()
    };
    
    // Create boss UI
    this.createBossUI(this.activeBoss);
    
    // Play boss music/sound effect (if audio system exists)
    if (this.game.audioSystem) {
      this.game.audioSystem.playBossMusic();
    }
    
    console.log(`🎪 Boss spawned: ${template.name}`);
  }

  createBossUI(boss) {
    // Boss nameplate
    this.bossNameplate = document.createElement('div');
    this.bossNameplate.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.9);
      color: ${boss.color};
      padding: 10px 20px;
      border-radius: 10px;
      border: 2px solid ${boss.color};
      font-size: 24px;
      font-weight: bold;
      text-shadow: 2px 2px 4px black;
      z-index: 2000;
      display: flex;
      align-items: center;
      gap: 10px;
    `;
    this.bossNameplate.innerHTML = `${boss.icon} ${boss.name} ${boss.icon}`;
    
    // Boss health bar
    this.bossHealthBar = document.createElement('div');
    this.bossHealthBar.style.cssText = `
      position: fixed;
      top: 70px;
      left: 50%;
      transform: translateX(-50%);
      width: 400px;
      height: 20px;
      background: rgba(0, 0, 0, 0.8);
      border: 2px solid ${boss.color};
      border-radius: 10px;
      z-index: 2000;
    `;
    
    const healthFill = document.createElement('div');
    healthFill.id = 'boss-health-fill';
    healthFill.style.cssText = `
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, #FF0000, #FFFF00, #00FF00);
      border-radius: 8px;
      transition: width 0.3s ease;
    `;
    
    this.bossHealthBar.appendChild(healthFill);
    
    document.body.appendChild(this.bossNameplate);
    document.body.appendChild(this.bossHealthBar);
  }

  updateBossUI() {
    if (!this.activeBoss || !this.bossHealthBar) return;
    
    const healthFill = document.getElementById('boss-health-fill');
    if (healthFill) {
      const healthPercent = (this.activeBoss.health / this.activeBoss.maxHealth) * 100;
      healthFill.style.width = `${healthPercent}%`;
    }
  }

  update(deltaTime) {
    // Check for boss spawn
    this.bossSpawnTimer += deltaTime;
    if (this.bossSpawnTimer >= this.bossSpawnInterval && !this.activeBoss) {
      if (Math.random() < 0.3) { // 30% chance every interval
        this.spawnBoss();
        this.bossSpawnTimer = 0;
      }
    }
    
    // Update active boss
    if (this.activeBoss) {
      this.updateBoss(deltaTime);
      this.updateBossUI();
    }
    
    // Update phase transition effects
    this.phaseTransitionEffects = this.phaseTransitionEffects.filter(effect => {
      effect.life -= deltaTime;
      return effect.life > 0;
    });
  }

  updateBoss(deltaTime) {
    const boss = this.activeBoss;
    const player = this.game.player;
    
    if (!player) return;
    
    // Check for phase transition
    this.checkPhaseTransition();
    
    // Movement AI
    this.updateBossMovement(deltaTime);
    
    // Attack logic
    const currentTime = Date.now();
    if (currentTime - boss.lastAttack >= boss.attackCooldown && !boss.isAttacking) {
      this.executeBossAttack();
      boss.lastAttack = currentTime;
    }
    
    // Update projectiles
    this.updateBossProjectiles(deltaTime);
    
    // Update effects
    boss.effects = boss.effects.filter(effect => {
      effect.life -= deltaTime;
      return effect.life > 0;
    });
  }

  updateBossMovement(deltaTime) {
    const boss = this.activeBoss;
    const player = this.game.player;
    
    // Calculate direction to player
    const dx = player.x - boss.x;
    const dy = player.y - boss.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Maintain optimal distance (not too close, not too far)
    const optimalDistance = 150;
    
    if (distance > optimalDistance + 50) {
      // Move towards player
      boss.vx = (dx / distance) * boss.speed;
      boss.vy = (dy / distance) * boss.speed;
    } else if (distance < optimalDistance - 50) {
      // Move away from player
      boss.vx = -(dx / distance) * boss.speed;
      boss.vy = -(dy / distance) * boss.speed;
    } else {
      // Circle around player
      boss.vx = -(dy / distance) * boss.speed;
      boss.vy = (dx / distance) * boss.speed;
    }
    
    // Apply movement
    boss.x += boss.vx * deltaTime * 60;
    boss.y += boss.vy * deltaTime * 60;
    
    // Keep boss on screen
    boss.x = Math.max(boss.size, Math.min(this.game.canvas.width - boss.size, boss.x));
    boss.y = Math.max(boss.size, Math.min(this.game.canvas.height - boss.size, boss.y));
    
    // Update rotation
    boss.rotation = Math.atan2(dy, dx);
  }

  checkPhaseTransition() {
    const boss = this.activeBoss;
    const healthPercent = boss.health / boss.maxHealth;
    
    // Check if we should transition to next phase
    let newPhase = boss.currentPhase;
    for (let i = boss.phases.length - 1; i >= 0; i--) {
      if (healthPercent <= boss.phases[i].healthThreshold) {
        newPhase = i;
        break;
      }
    }
    
    if (newPhase !== boss.currentPhase) {
      this.transitionToPhase(newPhase);
    }
  }

  transitionToPhase(phaseIndex) {
    const boss = this.activeBoss;
    boss.currentPhase = phaseIndex;
    boss.attackCooldown = boss.phases[phaseIndex].attackInterval;
    
    // Create phase transition effect
    this.createPhaseTransitionEffect();
    
    console.log(`🎪 ${boss.name} entered phase ${phaseIndex + 1}`);
  }

  createPhaseTransitionEffect() {
    const boss = this.activeBoss;
    
    // Screen flash effect
    const flashEffect = document.createElement('div');
    flashEffect.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: ${boss.color};
      opacity: 0.5;
      z-index: 2500;
      animation: phaseFlash 0.5s ease-out forwards;
    `;
    
    // Add CSS animation
    if (!document.getElementById('phase-transition-style')) {
      const style = document.createElement('style');
      style.id = 'phase-transition-style';
      style.textContent = `
        @keyframes phaseFlash {
          0% { opacity: 0.5; }
          50% { opacity: 0.8; }
          100% { opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }
    
    document.body.appendChild(flashEffect);
    
    setTimeout(() => {
      document.body.removeChild(flashEffect);
    }, 500);
  }

  executeBossAttack() {
    const boss = this.activeBoss;
    const phase = boss.phases[boss.currentPhase];
    
    if (!phase || !phase.abilities.length) return;
    
    // Select random ability from current phase
    const ability = phase.abilities[Math.floor(Math.random() * phase.abilities.length)];
    
    boss.isAttacking = true;
    
    switch (ability) {
      case 'fire_breath':
        this.fireBreathAttack();
        break;
      case 'charge_attack':
        this.chargeAttack();
        break;
      case 'flame_ring':
        this.flameRingAttack();
        break;
      case 'meteor_shower':
        this.meteorShowerAttack();
        break;
      case 'ice_shard':
        this.iceShardAttack();
        break;
      case 'freeze_pulse':
        this.freezePulseAttack();
        break;
      case 'blizzard':
        this.blizzardAttack();
        break;
      case 'ice_prison':
        this.icePrisonAttack();
        break;
      case 'shadow_strike':
        this.shadowStrikeAttack();
        break;
      case 'dark_orb':
        this.darkOrbAttack();
        break;
      case 'teleport_attack':
        this.teleportAttack();
        break;
      case 'shadow_clone':
        this.shadowCloneAttack();
        break;
      case 'laser_beam':
        this.laserBeamAttack();
        break;
      case 'missile_barrage':
        this.missileBarrageAttack();
        break;
      case 'shield_mode':
        this.shieldModeAttack();
        break;
      case 'overload':
        this.overloadAttack();
        break;
    }
    
    setTimeout(() => {
      boss.isAttacking = false;
    }, 1000);
  }

  // Boss Attack Implementations
  fireBreathAttack() {
    const boss = this.activeBoss;
    const player = this.game.player;
    
    for (let i = 0; i < 8; i++) {
      setTimeout(() => {
        const angle = boss.rotation + (Math.random() - 0.5) * 0.5;
        this.createBossProjectile({
          x: boss.x,
          y: boss.y,
          vx: Math.cos(angle) * 3,
          vy: Math.sin(angle) * 3,
          size: 8,
          color: '#FF4500',
          damage: 15,
          life: 2000
        });
      }, i * 100);
    }
  }

  chargeAttack() {
    const boss = this.activeBoss;
    const player = this.game.player;
    
    // Quick dash towards player
    const dx = player.x - boss.x;
    const dy = player.y - boss.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    boss.vx = (dx / distance) * 5;
    boss.vy = (dy / distance) * 5;
    
    setTimeout(() => {
      boss.vx *= 0.1;
      boss.vy *= 0.1;
    }, 500);
  }

  iceShardAttack() {
    const boss = this.activeBoss;
    
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI * 2 * i) / 6;
      this.createBossProjectile({
        x: boss.x,
        y: boss.y,
        vx: Math.cos(angle) * 2.5,
        vy: Math.sin(angle) * 2.5,
        size: 6,
        color: '#00BFFF',
        damage: 18,
        life: 3000
      });
    }
  }

  shadowStrikeAttack() {
    const boss = this.activeBoss;
    const player = this.game.player;
    
    // Teleport near player and strike
    boss.x = player.x + (Math.random() - 0.5) * 100;
    boss.y = player.y + (Math.random() - 0.5) * 100;
    
    // Create damage area
    this.createBossProjectile({
      x: boss.x,
      y: boss.y,
      vx: 0,
      vy: 0,
      size: 40,
      color: '#4B0082',
      damage: 25,
      life: 500
    });
  }

  laserBeamAttack() {
    const boss = this.activeBoss;
    const player = this.game.player;
    
    // Create laser beam towards player
    const dx = player.x - boss.x;
    const dy = player.y - boss.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    for (let i = 0; i < distance; i += 10) {
      const x = boss.x + (dx / distance) * i;
      const y = boss.y + (dy / distance) * i;
      
      this.createBossProjectile({
        x: x,
        y: y,
        vx: 0,
        vy: 0,
        size: 5,
        color: '#FF0000',
        damage: 20,
        life: 1000
      });
    }
  }

  createBossProjectile(projectile) {
    this.activeBoss.projectiles.push({
      ...projectile,
      created: Date.now()
    });
  }

  updateBossProjectiles(deltaTime) {
    const boss = this.activeBoss;
    const player = this.game.player;
    
    boss.projectiles = boss.projectiles.filter(projectile => {
      // Update position
      projectile.x += projectile.vx * deltaTime * 60;
      projectile.y += projectile.vy * deltaTime * 60;
      
      // Check collision with player
      if (player && !player.invulnerable) {
        const dx = projectile.x - player.x;
        const dy = projectile.y - player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < projectile.size + 15) {
          // Hit player
          if (this.game.damagePlayer) {
            this.game.damagePlayer(projectile.damage);
          }
          return false; // Remove projectile
        }
      }
      
      // Check lifetime
      projectile.life -= deltaTime;
      return projectile.life > 0;
    });
  }

  damageBoss(damage) {
    if (!this.activeBoss) return false;
    
    this.activeBoss.health -= damage;
    
    if (this.activeBoss.health <= 0) {
      this.defeatBoss();
      return true;
    }
    
    return false;
  }

  defeatBoss() {
    const boss = this.activeBoss;
    
    // Award rewards
    if (this.game.addScore) {
      this.game.addScore(boss.rewards.score);
    }
    
    // Unlock achievement
    if (this.game.achievementSystem) {
      this.game.achievementSystem.unlockAchievement(boss.rewards.achievement);
    }
    
    // Special loot drop
    console.log(`🎪 ${boss.name} defeated! Rewards: ${boss.rewards.specialLoot.join(', ')}`);
    
    // Clean up UI
    this.removeBossUI();
    
    // Clear boss
    this.activeBoss = null;
    this.bossSpawnTimer = 0;
  }

  removeBossUI() {
    if (this.bossNameplate) {
      document.body.removeChild(this.bossNameplate);
      this.bossNameplate = null;
    }
    
    if (this.bossHealthBar) {
      document.body.removeChild(this.bossHealthBar);
      this.bossHealthBar = null;
    }
  }

  render(ctx) {
    if (!this.activeBoss) return;
    
    const boss = this.activeBoss;
    
    // Draw boss
    ctx.save();
    ctx.translate(boss.x, boss.y);
    ctx.rotate(boss.rotation);
    
    // Boss body
    ctx.fillStyle = boss.color;
    ctx.fillRect(-boss.size/2, -boss.size/2, boss.size, boss.size);
    
    // Boss outline
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.strokeRect(-boss.size/2, -boss.size/2, boss.size, boss.size);
    
    ctx.restore();
    
    // Draw boss projectiles
    boss.projectiles.forEach(projectile => {
      ctx.fillStyle = projectile.color;
      ctx.beginPath();
      ctx.arc(projectile.x, projectile.y, projectile.size, 0, Math.PI * 2);
      ctx.fill();
    });
    
    // Draw boss name above
    ctx.fillStyle = boss.color;
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(boss.name, boss.x, boss.y - boss.size - 10);
  }

  getBossStats() {
    return {
      totalBossTypes: this.bossTemplates.size,
      activeBoss: this.activeBoss ? {
        name: this.activeBoss.name,
        health: this.activeBoss.health,
        maxHealth: this.activeBoss.maxHealth,
        phase: this.activeBoss.currentPhase + 1,
        timeAlive: Date.now() - this.activeBoss.spawned
      } : null,
      nextSpawn: this.bossSpawnInterval - this.bossSpawnTimer
    };
  }
}
