/**
 * Achievement & Badge System
 * Tracks player accomplishments and unlocks rewards
 */

export class AchievementSystem {
  constructor(game) {
    this.game = game;
    this.achievements = new Map();
    this.unlockedAchievements = new Set();
    this.pendingNotifications = [];
    this.notificationTimer = 0;
    this.currentNotification = null;
    
    // Achievement definitions
    this.initializeAchievements();
    
    // Load saved progress
    this.loadProgress();
    
    console.log('🏆 Achievement System initialized with', this.achievements.size, 'achievements');
  }

  initializeAchievements() {
    const achievements = [
      // Kill-based achievements
      {
        id: 'first_blood',
        name: 'First Blood',
        description: 'Kill your first enemy',
        icon: '🩸',
        type: 'kills',
        target: 1,
        reward: { type: 'badge', value: 'rookie' }
      },
      {
        id: 'killer',
        name: 'Killer',
        description: 'Kill 50 enemies',
        icon: '⚔️',
        type: 'kills',
        target: 50,
        reward: { type: 'character', value: 'warrior' }
      },
      {
        id: 'mass_destroyer',
        name: 'Mass Destroyer',
        description: 'Kill 500 enemies',
        icon: '💀',
        type: 'kills',
        target: 500,
        reward: { type: 'skin', value: 'legendary' }
      },
      
      // Survival achievements
      {
        id: 'survivor',
        name: 'Survivor',
        description: 'Survive for 5 minutes',
        icon: '⏰',
        type: 'survival',
        target: 300, // 5 minutes in seconds
        reward: { type: 'badge', value: 'survivor' }
      },
      {
        id: 'endurance_master',
        name: 'Endurance Master',
        description: 'Survive for 15 minutes',
        icon: '🛡️',
        type: 'survival',
        target: 900,
        reward: { type: 'ability', value: 'shield_bubble' }
      },
      
      // Score achievements
      {
        id: 'high_scorer',
        name: 'High Scorer',
        description: 'Score 10,000 points',
        icon: '🎯',
        type: 'score',
        target: 10000,
        reward: { type: 'badge', value: 'scorer' }
      },
      {
        id: 'legend',
        name: 'Legend',
        description: 'Score 100,000 points',
        icon: '👑',
        type: 'score',
        target: 100000,
        reward: { type: 'character', value: 'legend' }
      },
      
      // Combo achievements
      {
        id: 'combo_starter',
        name: 'Combo Starter',
        description: 'Get a 10-kill combo',
        icon: '🔥',
        type: 'combo',
        target: 10,
        reward: { type: 'effect', value: 'fire_trail' }
      },
      {
        id: 'combo_master',
        name: 'Combo Master',
        description: 'Get a 25-kill combo',
        icon: '⚡',
        type: 'combo',
        target: 25,
        reward: { type: 'ability', value: 'lightning_strike' }
      },
      
      // Power-up achievements
      {
        id: 'collector',
        name: 'Collector',
        description: 'Collect 50 power-ups',
        icon: '💎',
        type: 'powerups',
        target: 50,
        reward: { type: 'badge', value: 'collector' }
      },
      
      // Special achievements
      {
        id: 'untouchable',
        name: 'Untouchable',
        description: 'Survive 3 minutes without taking damage',
        icon: '🌟',
        type: 'special',
        target: 180,
        reward: { type: 'skin', value: 'golden' }
      },
      {
        id: 'speedster',
        name: 'Speedster',
        description: 'Kill 10 enemies in 10 seconds',
        icon: '💨',
        type: 'special',
        target: 10,
        reward: { type: 'ability', value: 'dash_attack' }
      }
    ];

    achievements.forEach(achievement => {
      this.achievements.set(achievement.id, {
        ...achievement,
        progress: 0,
        unlocked: false
      });
    });
  }

  /**
   * Update achievement progress
   * @param {string} type - Type of achievement to update
   * @param {number} value - Value to add to progress
   * @param {Object} context - Additional context for special achievements
   */
  updateProgress(type, value = 1, context = {}) {
    for (const [id, achievement] of this.achievements) {
      if (achievement.type === type && !achievement.unlocked) {
        achievement.progress += value;
        
        // Check for unlock
        if (achievement.progress >= achievement.target) {
          this.unlockAchievement(id);
        }
      }
    }

    // Handle special achievements
    this.checkSpecialAchievements(type, value, context);
  }

  /**
   * Check special achievement conditions
   */
  checkSpecialAchievements(type, value, context) {
    // Untouchable - no damage for 3 minutes
    if (type === 'damage_taken' && value > 0) {
      // Reset untouchable progress if player takes damage
      const untouchable = this.achievements.get('untouchable');
      if (untouchable && !untouchable.unlocked) {
        untouchable.progress = 0;
      }
    }

    // Speedster - 10 kills in 10 seconds
    if (type === 'speedster_kill') {
      const speedster = this.achievements.get('speedster');
      if (speedster && !speedster.unlocked) {
        if (!speedster.killTimes) speedster.killTimes = [];
        
        const now = Date.now();
        speedster.killTimes.push(now);
        
        // Remove kills older than 10 seconds
        speedster.killTimes = speedster.killTimes.filter(time => now - time <= 10000);
        
        speedster.progress = speedster.killTimes.length;
        
        if (speedster.progress >= speedster.target) {
          this.unlockAchievement('speedster');
        }
      }
    }
  }

  /**
   * Unlock an achievement
   * @param {string} achievementId - ID of achievement to unlock
   */
  unlockAchievement(achievementId) {
    const achievement = this.achievements.get(achievementId);
    if (!achievement || achievement.unlocked) return;

    achievement.unlocked = true;
    achievement.progress = achievement.target;
    this.unlockedAchievements.add(achievementId);

    // Add notification
    this.pendingNotifications.push({
      achievement,
      timestamp: Date.now()
    });

    // Apply reward
    this.applyReward(achievement.reward);

    // Save progress
    this.saveProgress();

    console.log(`🏆 Achievement unlocked: ${achievement.name}`);
  }

  /**
   * Apply achievement reward
   * @param {Object} reward - Reward object
   */
  applyReward(reward) {
    switch (reward.type) {
      case 'badge':
        // Add badge to player profile
        this.addBadge(reward.value);
        break;
      case 'character':
        // Unlock new character
        this.unlockCharacter(reward.value);
        break;
      case 'skin':
        // Unlock new skin
        this.unlockSkin(reward.value);
        break;
      case 'ability':
        // Unlock special ability
        this.unlockAbility(reward.value);
        break;
      case 'effect':
        // Unlock visual effect
        this.unlockEffect(reward.value);
        break;
    }
  }

  /**
   * Add badge to collection
   */
  addBadge(badgeId) {
    if (!this.badges) this.badges = new Set();
    this.badges.add(badgeId);
  }

  /**
   * Unlock character
   */
  unlockCharacter(characterId) {
    if (!this.unlockedCharacters) this.unlockedCharacters = new Set();
    this.unlockedCharacters.add(characterId);
  }

  /**
   * Unlock skin
   */
  unlockSkin(skinId) {
    if (!this.unlockedSkins) this.unlockedSkins = new Set();
    this.unlockedSkins.add(skinId);
  }

  /**
   * Unlock ability
   */
  unlockAbility(abilityId) {
    if (!this.unlockedAbilities) this.unlockedAbilities = new Set();
    this.unlockedAbilities.add(abilityId);
    
    // Notify ability system
    if (this.game.abilitySystem) {
      this.game.abilitySystem.unlockAbility(abilityId);
    }
  }

  /**
   * Unlock effect
   */
  unlockEffect(effectId) {
    if (!this.unlockedEffects) this.unlockedEffects = new Set();
    this.unlockedEffects.add(effectId);
  }

  /**
   * Update system
   * @param {number} delta - Time delta
   */
  update(delta) {
    // Update notification timer
    if (this.currentNotification) {
      this.notificationTimer += delta;
      if (this.notificationTimer >= 4000) { // Show for 4 seconds
        this.currentNotification = null;
        this.notificationTimer = 0;
      }
    }

    // Show next notification if available
    if (!this.currentNotification && this.pendingNotifications.length > 0) {
      this.currentNotification = this.pendingNotifications.shift();
      this.notificationTimer = 0;
    }
  }

  /**
   * Draw achievement UI
   * @param {CanvasRenderingContext2D} ctx 
   */
  draw(ctx) {
    this.drawNotification(ctx);
    this.drawProgress(ctx);
  }

  /**
   * Draw achievement notification
   */
  drawNotification(ctx) {
    if (!this.currentNotification) return;

    const notification = this.currentNotification;
    const achievement = notification.achievement;
    
    // Calculate animation progress
    const animProgress = Math.min(this.notificationTimer / 500, 1); // 0.5 second animation
    const fadeOut = this.notificationTimer > 3500 ? (4000 - this.notificationTimer) / 500 : 1;
    const alpha = animProgress * fadeOut;

    if (alpha <= 0) return;

    ctx.save();
    ctx.globalAlpha = alpha;

    // Notification background
    const x = ctx.canvas.width - 320;
    const y = 20 + (1 - animProgress) * -100; // Slide down animation
    const width = 300;
    const height = 80;

    // Background with glow effect
    ctx.fillStyle = 'rgba(255, 215, 0, 0.9)';
    ctx.fillRect(x, y, width, height);
    
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, height);

    // Achievement icon
    ctx.font = '24px Arial';
    ctx.fillStyle = '#000';
    ctx.fillText(achievement.icon, x + 10, y + 35);

    // Achievement text
    ctx.font = 'bold 16px Arial';
    ctx.fillStyle = '#000';
    ctx.fillText('Achievement Unlocked!', x + 50, y + 25);
    
    ctx.font = '14px Arial';
    ctx.fillText(achievement.name, x + 50, y + 45);
    
    ctx.font = '12px Arial';
    ctx.fillStyle = '#333';
    ctx.fillText(achievement.description, x + 50, y + 65);

    ctx.restore();
  }

  /**
   * Draw progress indicators for near-completion achievements
   */
  drawProgress(ctx) {
    const nearComplete = Array.from(this.achievements.values())
      .filter(a => !a.unlocked && a.progress > a.target * 0.5)
      .slice(0, 3); // Show max 3

    if (nearComplete.length === 0) return;

    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(10, ctx.canvas.height - 120, 250, 100);

    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 1;
    ctx.strokeRect(10, ctx.canvas.height - 120, 250, 100);

    ctx.font = 'bold 12px Arial';
    ctx.fillStyle = '#FFD700';
    ctx.fillText('Progress:', 15, ctx.canvas.height - 105);

    nearComplete.forEach((achievement, index) => {
      const y = ctx.canvas.height - 85 + index * 20;
      const progress = Math.min(achievement.progress / achievement.target, 1);

      // Icon
      ctx.fillText(achievement.icon, 15, y);

      // Name
      ctx.font = '10px Arial';
      ctx.fillStyle = '#FFF';
      ctx.fillText(achievement.name, 35, y);

      // Progress bar
      const barX = 150;
      const barWidth = 100;
      const barHeight = 8;

      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.fillRect(barX, y - 6, barWidth, barHeight);

      ctx.fillStyle = '#FFD700';
      ctx.fillRect(barX, y - 6, barWidth * progress, barHeight);

      // Progress text
      ctx.font = '9px Arial';
      ctx.fillStyle = '#FFF';
      ctx.fillText(`${achievement.progress}/${achievement.target}`, barX + barWidth + 5, y);
    });

    ctx.restore();
  }

  /**
   * Get achievement statistics
   */
  getStatistics() {
    const total = this.achievements.size;
    const unlocked = this.unlockedAchievements.size;
    const percentage = total > 0 ? Math.round((unlocked / total) * 100) : 0;

    return {
      total,
      unlocked,
      percentage,
      badges: this.badges ? this.badges.size : 0,
      unlockedCharacters: this.unlockedCharacters ? this.unlockedCharacters.size : 0,
      unlockedSkins: this.unlockedSkins ? this.unlockedSkins.size : 0,
      unlockedAbilities: this.unlockedAbilities ? this.unlockedAbilities.size : 0
    };
  }

  /**
   * Save progress to localStorage
   */
  saveProgress() {
    const data = {
      unlockedAchievements: Array.from(this.unlockedAchievements),
      badges: this.badges ? Array.from(this.badges) : [],
      unlockedCharacters: this.unlockedCharacters ? Array.from(this.unlockedCharacters) : [],
      unlockedSkins: this.unlockedSkins ? Array.from(this.unlockedSkins) : [],
      unlockedAbilities: this.unlockedAbilities ? Array.from(this.unlockedAbilities) : [],
      unlockedEffects: this.unlockedEffects ? Array.from(this.unlockedEffects) : [],
      achievementProgress: {}
    };

    // Save individual achievement progress
    for (const [id, achievement] of this.achievements) {
      data.achievementProgress[id] = {
        progress: achievement.progress,
        unlocked: achievement.unlocked
      };
    }

    localStorage.setItem('bloxyRivals_achievements', JSON.stringify(data));
  }

  /**
   * Load progress from localStorage
   */
  loadProgress() {
    try {
      const data = JSON.parse(localStorage.getItem('bloxyRivals_achievements') || '{}');
      
      this.unlockedAchievements = new Set(data.unlockedAchievements || []);
      this.badges = new Set(data.badges || []);
      this.unlockedCharacters = new Set(data.unlockedCharacters || []);
      this.unlockedSkins = new Set(data.unlockedSkins || []);
      this.unlockedAbilities = new Set(data.unlockedAbilities || []);
      this.unlockedEffects = new Set(data.unlockedEffects || []);

      // Load individual achievement progress
      if (data.achievementProgress) {
        for (const [id, progress] of Object.entries(data.achievementProgress)) {
          const achievement = this.achievements.get(id);
          if (achievement) {
            achievement.progress = progress.progress || 0;
            achievement.unlocked = progress.unlocked || false;
          }
        }
      }
    } catch (error) {
      console.warn('Failed to load achievement progress:', error);
    }
  }

  /**
   * Reset all achievements (for testing)
   */
  reset() {
    this.unlockedAchievements.clear();
    this.badges?.clear();
    this.unlockedCharacters?.clear();
    this.unlockedSkins?.clear();
    this.unlockedAbilities?.clear();
    this.unlockedEffects?.clear();
    this.pendingNotifications = [];
    this.currentNotification = null;
    this.notificationTimer = 0;

    // Reset achievement progress
    for (const achievement of this.achievements.values()) {
      achievement.progress = 0;
      achievement.unlocked = false;
      if (achievement.killTimes) achievement.killTimes = [];
    }

    this.saveProgress();
    console.log('🏆 Achievement system reset');
  }
}
