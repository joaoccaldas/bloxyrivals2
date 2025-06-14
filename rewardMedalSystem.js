// Enhanced Medal Rewards System with Persistent Memory and Difficulty Scaling
// Replaces traditional point system with medal-based progression

export class RewardMedalSystem {
    constructor() {
        // Persistent data storage
        this.playerLevel = 1;
        this.totalMedalsCollected = 0;
        this.lifetimeMedals = {
            bronze: 0,
            silver: 0,
            gold: 0,
            platinum: 0,
            diamond: 0,
            legendary: 0
        };
        
        // Current session medals
        this.sessionMedals = [];
        this.activeMedals = [];
        
        // Medal tier definitions with progression values
        this.medalTiers = {
            BRONZE: {
                name: 'Bronze Medal',
                points: 50,
                levelValue: 1,
                color: '#CD7F32',
                glowColor: '#FFB347',
                size: 20,
                rarity: 'common',
                spawnWeight: 50
            },
            SILVER: {
                name: 'Silver Medal',
                points: 100,
                levelValue: 2,
                color: '#C0C0C0',
                glowColor: '#E5E5E5',
                size: 24,
                rarity: 'uncommon',
                spawnWeight: 30
            },
            GOLD: {
                name: 'Gold Medal',
                points: 200,
                levelValue: 4,
                color: '#FFD700',
                glowColor: '#FFFF99',
                size: 28,
                rarity: 'rare',
                spawnWeight: 15
            },
            PLATINUM: {
                name: 'Platinum Medal',
                points: 500,
                levelValue: 8,
                color: '#E5E4E2',
                glowColor: '#F0F8FF',
                size: 32,
                rarity: 'epic',
                spawnWeight: 4
            },
            DIAMOND: {
                name: 'Diamond Medal',
                points: 1000,
                levelValue: 15,
                color: '#B9F2FF',
                glowColor: '#E0FFFF',
                size: 36,
                rarity: 'legendary',
                spawnWeight: 1
            },
            LEGENDARY: {
                name: 'Legendary Medal',
                points: 2500,
                levelValue: 30,
                color: '#FF6B35',
                glowColor: '#FFD700',
                size: 40,
                rarity: 'mythic',
                spawnWeight: 0.1
            }
        };
        
        // Level-based difficulty scaling
        this.difficultyScaling = {
            1: { mobSpeedMultiplier: 1.0, mobHealthMultiplier: 1.0, spawnRateMultiplier: 1.0 },
            5: { mobSpeedMultiplier: 1.2, mobHealthMultiplier: 1.3, spawnRateMultiplier: 1.2 },
            10: { mobSpeedMultiplier: 1.4, mobHealthMultiplier: 1.6, spawnRateMultiplier: 1.4 },
            15: { mobSpeedMultiplier: 1.6, mobHealthMultiplier: 2.0, spawnRateMultiplier: 1.6 },
            20: { mobSpeedMultiplier: 1.8, mobHealthMultiplier: 2.5, spawnRateMultiplier: 1.8 },
            25: { mobSpeedMultiplier: 2.0, mobHealthMultiplier: 3.0, spawnRateMultiplier: 2.0 },
            30: { mobSpeedMultiplier: 2.3, mobHealthMultiplier: 3.5, spawnRateMultiplier: 2.2 },
            40: { mobSpeedMultiplier: 2.6, mobHealthMultiplier: 4.0, spawnRateMultiplier: 2.4 },
            50: { mobSpeedMultiplier: 3.0, mobHealthMultiplier: 5.0, spawnRateMultiplier: 2.6 }
        };
        
        // Rewards and unlocks system
        this.rewards = {
            levelRewards: {
                5: { type: 'character', value: 'veteran', name: 'Veteran Character Unlocked' },
                10: { type: 'ability', value: 'double_jump', name: 'Double Jump Ability' },
                15: { type: 'powerup', value: 'shield_boost', name: 'Enhanced Shield Power-up' },
                20: { type: 'character', value: 'elite', name: 'Elite Character Unlocked' },
                25: { type: 'mode', value: 'nightmare', name: 'Nightmare Mode Unlocked' },
                30: { type: 'character', value: 'legendary', name: 'Legendary Character Unlocked' },
                40: { type: 'prestige', value: 'prestige_1', name: 'Prestige Level 1' },
                50: { type: 'master', value: 'master_rank', name: 'Master Rank Achieved' }
            },
            medalMilestones: {
                100: { reward: 'Bronze Collector', bonus: 'x1.1 medal spawn rate' },
                250: { reward: 'Silver Seeker', bonus: 'x1.2 medal spawn rate' },
                500: { reward: 'Gold Hunter', bonus: 'x1.3 medal spawn rate' },
                1000: { reward: 'Platinum Master', bonus: 'x1.5 medal spawn rate' },
                2000: { reward: 'Diamond Lord', bonus: 'x2.0 medal spawn rate' },
                5000: { reward: 'Legendary Collector', bonus: 'x3.0 medal spawn rate' }
            }
        };
        
        // Visual effects and animations
        this.collectionEffects = [];
        this.levelUpEffects = [];
        this.spawnTimer = 0;
        this.spawnInterval = 3000; // 3 seconds base spawn rate
        this.maxMedalsOnScreen = 8;
        
        // Statistics tracking
        this.statistics = {
            sessionStartTime: Date.now(),
            bestStreak: 0,
            currentStreak: 0,
            medalsCombined: 0,
            rareFinds: 0,
            perfectCollections: 0
        };
        
        // Load persistent data
        this.loadPersistentData();
        
        console.log('🏅 Enhanced Medal Rewards System initialized');
        console.log(`📊 Player Level: ${this.playerLevel}, Total Medals: ${this.totalMedalsCollected}`);
    }
    
    /**
     * Load persistent player data from localStorage
     */
    loadPersistentData() {
        try {
            const savedData = localStorage.getItem('bloxyRivalsRewardMedals');
            if (savedData) {
                const data = JSON.parse(savedData);
                this.playerLevel = data.playerLevel || 1;
                this.totalMedalsCollected = data.totalMedalsCollected || 0;
                this.lifetimeMedals = { ...this.lifetimeMedals, ...data.lifetimeMedals };
                
                // Recalculate level based on medals
                this.recalculateLevel();
                
                console.log(`📚 Loaded player data - Level: ${this.playerLevel}, Medals: ${this.totalMedalsCollected}`);
            }
        } catch (error) {
            console.warn('Could not load medal data:', error);
        }
    }
    
    /**
     * Save persistent player data to localStorage
     */
    savePersistentData() {
        try {
            const saveData = {
                playerLevel: this.playerLevel,
                totalMedalsCollected: this.totalMedalsCollected,
                lifetimeMedals: this.lifetimeMedals,
                lastSaved: Date.now()
            };
            localStorage.setItem('bloxyRivalsRewardMedals', JSON.stringify(saveData));
        } catch (error) {
            console.warn('Could not save medal data:', error);
        }
    }
    
    /**
     * Recalculate player level based on collected medals
     */
    recalculateLevel() {
        let totalLevelValue = 0;
        
        // Calculate total level value from all lifetime medals
        Object.keys(this.lifetimeMedals).forEach(tier => {
            const tierKey = tier.toUpperCase();
            if (this.medalTiers[tierKey]) {
                totalLevelValue += this.lifetimeMedals[tier] * this.medalTiers[tierKey].levelValue;
            }
        });
        
        // Convert total value to level (every 100 points = 1 level)
        const newLevel = Math.max(1, Math.floor(totalLevelValue / 100) + 1);
        
        if (newLevel > this.playerLevel) {
            const oldLevel = this.playerLevel;
            this.playerLevel = newLevel;
            this.onLevelUp(oldLevel, newLevel);
        }
    }
    
    /**
     * Handle level up event
     */
    onLevelUp(oldLevel, newLevel) {
        console.log(`🎊 LEVEL UP! ${oldLevel} → ${newLevel}`);
        
        // Create level up effect
        this.levelUpEffects.push({
            text: `LEVEL ${newLevel}!`,
            startTime: Date.now(),
            duration: 3000,
            scale: 2.0,
            opacity: 1.0
        });
        
        // Check for level rewards
        if (this.rewards.levelRewards[newLevel]) {
            const reward = this.rewards.levelRewards[newLevel];
            console.log(`🎁 Level ${newLevel} Reward: ${reward.name}`);
            this.showRewardNotification(reward);
        }
        
        // Trigger callback if set
        if (this.onLevelUpCallback) {
            this.onLevelUpCallback(oldLevel, newLevel);
        }
    }
    
    /**
     * Update medal system
     */
    update(deltaTime, player, gameArea) {
        // Update spawn timer
        this.spawnTimer += deltaTime;
        
        // Calculate spawn rate based on player level and milestones
        const spawnRate = this.calculateSpawnRate();
        
        // Spawn new medals
        if (this.spawnTimer >= spawnRate && this.activeMedals.length < this.maxMedalsOnScreen) {
            this.spawnMedal(gameArea);
            this.spawnTimer = 0;
        }
        
        // Update existing medals
        this.activeMedals.forEach(medal => {
            this.updateMedal(medal, deltaTime);
        });
        
        // Check for medal collection
        this.checkMedalCollection(player);
        
        // Update visual effects
        this.updateEffects(deltaTime);
        
        // Clean up expired medals
        this.cleanupExpiredMedals();
    }
    
    /**
     * Calculate spawn rate based on player progression
     */
    calculateSpawnRate() {
        let baseRate = this.spawnInterval;
        
        // Apply milestone bonuses
        Object.keys(this.rewards.medalMilestones).forEach(milestone => {
            if (this.totalMedalsCollected >= parseInt(milestone)) {
                const bonus = this.rewards.medalMilestones[milestone].bonus;
                if (bonus.includes('spawn rate')) {
                    const multiplier = parseFloat(bonus.match(/x([\d.]+)/)[1]);
                    baseRate = baseRate / multiplier;
                }
            }
        });
        
        return Math.max(1000, baseRate); // Minimum 1 second spawn rate
    }
    
    /**
     * Spawn a new medal in the game area
     */
    spawnMedal(gameArea) {
        const medalType = this.selectMedalType();
        const medal = {
            id: Date.now() + Math.random(),
            type: medalType,
            x: Math.random() * (gameArea.width - 40) + 20,
            y: Math.random() * (gameArea.height - 40) + 20,
            collected: false,
            spawnTime: Date.now(),
            lifespan: 15000, // 15 seconds
            pulse: 0,
            rotation: 0,
            floatOffset: Math.random() * Math.PI * 2
        };
        
        this.activeMedals.push(medal);
        console.log(`🏅 Spawned ${this.medalTiers[medalType].name} at (${medal.x}, ${medal.y})`);
    }
    
    /**
     * Select medal type based on rarity weights and player level
     */
    selectMedalType() {
        let weights = {};
        
        // Base weights
        Object.keys(this.medalTiers).forEach(type => {
            weights[type] = this.medalTiers[type].spawnWeight;
        });
        
        // Increase rare medal chances at higher levels
        if (this.playerLevel >= 10) weights.GOLD *= 2;
        if (this.playerLevel >= 20) weights.PLATINUM *= 3;
        if (this.playerLevel >= 30) weights.DIAMOND *= 4;
        if (this.playerLevel >= 40) weights.LEGENDARY *= 5;
        
        // Weighted random selection
        const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
        let random = Math.random() * totalWeight;
        
        for (const [type, weight] of Object.entries(weights)) {
            random -= weight;
            if (random <= 0) {
                return type;
            }
        }
        
        return 'BRONZE'; // Fallback
    }
    
    /**
     * Update individual medal
     */
    updateMedal(medal, deltaTime) {
        // Floating animation
        medal.floatOffset += deltaTime * 0.002;
        medal.y += Math.sin(medal.floatOffset) * 0.3;
        
        // Rotation
        medal.rotation += deltaTime * 0.001;
        
        // Pulsing glow
        medal.pulse += deltaTime * 0.003;
        
        // Check expiration
        if (Date.now() - medal.spawnTime > medal.lifespan) {
            medal.expired = true;
        }
    }
    
    /**
     * Check for medal collection by player
     */
    checkMedalCollection(player) {
        this.activeMedals.forEach(medal => {
            if (medal.collected || medal.expired) return;
            
            const distance = Math.sqrt(
                Math.pow(medal.x - (player.x + player.width/2), 2) +
                Math.pow(medal.y - (player.y + player.height/2), 2)
            );
            
            if (distance < 30) {
                this.collectMedal(medal, player);
            }
        });
    }
    
    /**
     * Collect a medal and award rewards
     */
    collectMedal(medal, player) {
        medal.collected = true;
        
        const tierData = this.medalTiers[medal.type];
        const medalName = tierData.name;
        const points = tierData.points;
        
        // Update lifetime statistics
        const tierKey = medal.type.toLowerCase();
        this.lifetimeMedals[tierKey]++;
        this.totalMedalsCollected++;
        
        // Update session statistics
        this.sessionMedals.push({
            type: medal.type,
            points: points,
            timestamp: Date.now(),
            x: medal.x,
            y: medal.y
        });
        
        // Update streak
        this.statistics.currentStreak++;
        if (this.statistics.currentStreak > this.statistics.bestStreak) {
            this.statistics.bestStreak = this.statistics.currentStreak;
        }
        
        // Create collection effect
        this.createCollectionEffect(medal, points);
        
        // Recalculate level
        this.recalculateLevel();
        
        // Save progress
        this.savePersistentData();
        
        console.log(`🏅 Collected ${medalName}! (+${points} points, Level: ${this.playerLevel})`);
        console.log(`📊 Total Medals: ${this.totalMedalsCollected}, Streak: ${this.statistics.currentStreak}`);
        
        // Trigger collection callback
        if (this.onMedalCollectedCallback) {
            this.onMedalCollectedCallback(medal, points, this.totalMedalsCollected);
        }
    }
    
    /**
     * Create visual collection effect
     */
    createCollectionEffect(medal, points) {
        this.collectionEffects.push({
            x: medal.x,
            y: medal.y,
            points: points,
            text: `+${points}`,
            medalType: medal.type,
            startTime: Date.now(),
            duration: 2000,
            scale: 1.0,
            opacity: 1.0,
            yOffset: 0
        });
    }
    
    /**
     * Update visual effects
     */
    updateEffects(deltaTime) {
        // Update collection effects
        this.collectionEffects = this.collectionEffects.filter(effect => {
            const elapsed = Date.now() - effect.startTime;
            const progress = elapsed / effect.duration;
            
            if (progress >= 1) return false;
            
            effect.yOffset = progress * -50;
            effect.opacity = 1 - progress;
            effect.scale = 1 + progress * 0.5;
            
            return true;
        });
        
        // Update level up effects
        this.levelUpEffects = this.levelUpEffects.filter(effect => {
            const elapsed = Date.now() - effect.startTime;
            const progress = elapsed / effect.duration;
            
            if (progress >= 1) return false;
            
            effect.opacity = 1 - progress;
            effect.scale = 2.0 + progress * 0.5;
            
            return true;
        });
    }
    
    /**
     * Clean up expired medals
     */
    cleanupExpiredMedals() {
        this.activeMedals = this.activeMedals.filter(medal => 
            !medal.collected && !medal.expired
        );
    }
    
    /**
     * Get current difficulty multipliers based on player level
     */
    getDifficultyMultipliers() {
        // Find the appropriate difficulty scaling
        let scaling = this.difficultyScaling[1]; // Default to level 1
        
        Object.keys(this.difficultyScaling).forEach(level => {
            if (this.playerLevel >= parseInt(level)) {
                scaling = this.difficultyScaling[level];
            }
        });
        
        return scaling;
    }
    
    /**
     * Render medals and effects
     */
    render(ctx, camera) {
        // Render active medals
        this.activeMedals.forEach(medal => {
            this.renderMedal(ctx, medal, camera);
        });
        
        // Render collection effects
        this.collectionEffects.forEach(effect => {
            this.renderCollectionEffect(ctx, effect, camera);
        });
        
        // Render level up effects
        this.levelUpEffects.forEach(effect => {
            this.renderLevelUpEffect(ctx, effect);
        });
    }
    
    /**
     * Render individual medal
     */
    renderMedal(ctx, medal, camera) {
        const tierData = this.medalTiers[medal.type];
        const screenX = medal.x - camera.x;
        const screenY = medal.y - camera.y;
        
        ctx.save();
        ctx.translate(screenX, screenY);
        ctx.rotate(medal.rotation);
        
        // Glow effect
        const glowIntensity = 0.5 + Math.sin(medal.pulse) * 0.3;
        ctx.shadowColor = tierData.glowColor;
        ctx.shadowBlur = 15 * glowIntensity;
        
        // Medal circle
        ctx.fillStyle = tierData.color;
        ctx.beginPath();
        ctx.arc(0, 0, tierData.size / 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Inner highlight
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.beginPath();
        ctx.arc(-tierData.size * 0.15, -tierData.size * 0.15, tierData.size * 0.2, 0, Math.PI * 2);
        ctx.fill();
        
        // Medal text
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#000';
        ctx.font = `bold ${tierData.size * 0.3}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText('★', 0, tierData.size * 0.1);
        
        ctx.restore();
    }
    
    /**
     * Render collection effect
     */
    renderCollectionEffect(ctx, effect, camera) {
        const screenX = effect.x - camera.x;
        const screenY = effect.y - camera.y + effect.yOffset;
        
        ctx.save();
        ctx.globalAlpha = effect.opacity;
        ctx.translate(screenX, screenY);
        ctx.scale(effect.scale, effect.scale);
        
        // Text shadow
        ctx.fillStyle = '#000';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(effect.text, 2, 2);
        
        // Main text
        const tierData = this.medalTiers[effect.medalType];
        ctx.fillStyle = tierData.color;
        ctx.fillText(effect.text, 0, 0);
        
        ctx.restore();
    }
    
    /**
     * Render level up effect
     */
    renderLevelUpEffect(ctx, effect) {
        ctx.save();
        ctx.globalAlpha = effect.opacity;
        ctx.translate(ctx.canvas.width / 2, ctx.canvas.height / 2);
        ctx.scale(effect.scale, effect.scale);
        
        // Text shadow
        ctx.fillStyle = '#000';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(effect.text, 4, 4);
        
        // Main text
        ctx.fillStyle = '#FFD700';
        ctx.strokeStyle = '#FF6B35';
        ctx.lineWidth = 2;
        ctx.strokeText(effect.text, 0, 0);
        ctx.fillText(effect.text, 0, 0);
        
        ctx.restore();
    }
    
    /**
     * Show reward notification
     */
    showRewardNotification(reward) {
        // Add notification to level up effects
        this.levelUpEffects.push({
            text: reward.name,
            startTime: Date.now() + 1000, // Delay after level up
            duration: 4000,
            scale: 1.5,
            opacity: 1.0
        });
    }
    
    /**
     * Reset streak (called on player death)
     */
    resetStreak() {
        this.statistics.currentStreak = 0;
    }
    
    /**
     * Get current statistics
     */
    getStatistics() {
        return {
            playerLevel: this.playerLevel,
            totalMedalsCollected: this.totalMedalsCollected,
            lifetimeMedals: { ...this.lifetimeMedals },
            sessionMedals: this.sessionMedals.length,
            currentStreak: this.statistics.currentStreak,
            bestStreak: this.statistics.bestStreak,
            sessionTime: Date.now() - this.statistics.sessionStartTime,
            activeMedals: this.activeMedals.length,
            difficultyMultipliers: this.getDifficultyMultipliers()
        };
    }
    
    /**
     * Get save data for game save system
     */
    getSaveData() {
        return {
            playerLevel: this.playerLevel,
            totalMedalsCollected: this.totalMedalsCollected,
            lifetimeMedals: this.lifetimeMedals,
            sessionMedals: this.sessionMedals,
            statistics: this.statistics
        };
    }
    
    /**
     * Load data from game save system
     */
    loadSaveData(data) {
        if (data.playerLevel) this.playerLevel = data.playerLevel;
        if (data.totalMedalsCollected) this.totalMedalsCollected = data.totalMedalsCollected;
        if (data.lifetimeMedals) this.lifetimeMedals = { ...this.lifetimeMedals, ...data.lifetimeMedals };
        if (data.sessionMedals) this.sessionMedals = data.sessionMedals;
        if (data.statistics) this.statistics = { ...this.statistics, ...data.statistics };
    }
    
    /**
     * Set callback for medal collection events
     */
    setMedalCollectedCallback(callback) {
        this.onMedalCollectedCallback = callback;
    }
    
    /**
     * Set callback for level up events
     */
    setLevelUpCallback(callback) {
        this.onLevelUpCallback = callback;
    }
    
    /**
     * Set multiplier for medal values (for game modes)
     */
    setMultiplier(multiplier) {
        this.scoreMultiplier = multiplier || 1;
        console.log(`🏅 Medal multiplier set to: ${this.scoreMultiplier}`);
    }

    /**
     * Drop a medal at a specific location (called when mob is killed)
     */
    dropMedal(mob, position, playerLevel, multiplier = 1) {
        const medalType = this.selectMedalType();
        const medal = {
            id: Date.now() + Math.random(),
            type: medalType,
            x: position.x,
            y: position.y,
            collected: false,
            spawnTime: Date.now(),
            lifespan: 15000, // 15 seconds
            pulse: 0,
            rotation: 0,
            floatOffset: Math.random() * Math.PI * 2,
            levelValue: this.medalTiers[medalType].levelValue * multiplier
        };
        
        this.activeMedals.push(medal);
        console.log(`🏅 Dropped ${this.medalTiers[medalType].name} from mob kill`);
        return medal;
    }

    /**
     * Reset session data (but keep persistent progression)
     */
    resetSession() {
        this.sessionMedals = [];
        this.activeMedals = [];
        this.collectionEffects = [];
        this.levelUpEffects = [];
        this.statistics.currentStreak = 0;
        this.statistics.sessionStartTime = Date.now();
        console.log('🔄 Medal system session reset');
    }

    /**
     * Get session kills count
     */
    getSessionKills() {
        return this.sessionMedals.length;
    }

    /**
     * Get session medals
     */
    getSessionMedals() {
        return this.sessionMedals;
    }

    /**
     * Get total medals collected (lifetime)
     */
    getTotalMedalsCollected() {
        return this.totalMedalsCollected;
    }

    /**
     * Get current player level
     */
    getPlayerLevel() {
        return this.playerLevel;
    }

    /**
     * Get dynamic spawn rate
     */
    getDynamicSpawnRate() {
        return this.calculateSpawnRate();
    }

    /**
     * Get difficulty modifiers
     */
    getDifficultyModifiers() {
        return this.getDifficultyMultipliers();
    }

    /**
     * Serialize system state for saving
     */
    serialize() {
        return this.getSaveData();
    }

    /**
     * Convert legacy score to medals (for compatibility)
     */
    convertLegacyScore(score) {
        // Convert old score to approximate medal count
        const medalEquivalent = Math.floor(score / 100); // Every 100 points = 1 bronze medal equivalent
        if (medalEquivalent > 0) {
            this.lifetimeMedals.bronze += medalEquivalent;
            this.totalMedalsCollected += medalEquivalent;
            this.recalculateLevel();
            console.log(`🔄 Converted legacy score ${score} to ${medalEquivalent} bronze medals`);
        }
    }

    /**
     * Load progress from storage (alias for loadPersistentData)
     */
    loadProgressFromStorage() {
        this.loadPersistentData();
    }

    /**
     * Save progress to storage (alias for savePersistentData)
     */
    saveProgressToStorage() {
        this.savePersistentData();
    }

    /**
     * Draw method for rendering (alias for render)
     */
    draw(ctx, camera) {
        this.render(ctx, camera);
    }    /**
     * Reset system completely (for new game)
     */
    reset() {
        this.resetSession();
        // Note: Don't reset persistent data as medals should persist across games
    }

    /**
     * Record a kill for death reward calculations
     * @param {Object} mob - The mob that was killed
     */
    recordKill(mob) {
        // Add to session medals tracking for kill count
        this.sessionMedals.push({
            type: 'KILL_RECORD',
            timestamp: Date.now(),
            mobType: mob.type || 'basic',
            points: mob.points || 100
        });
        
        console.log(`🎯 Kill recorded: ${this.sessionMedals.length} total session kills`);
    }

    /**
     * Create a medal at a specific position and type
     * @param {string} medalType - Type of medal to create (BRONZE, SILVER, etc.)
     * @param {Object} position - Position object with x, y coordinates
     * @returns {Object} The created medal object
     */
    createMedal(medalType, position) {
        if (!this.medalTiers[medalType]) {
            console.warn(`⚠️ Unknown medal type: ${medalType}, defaulting to BRONZE`);
            medalType = 'BRONZE';
        }

        const tierData = this.medalTiers[medalType];
        const medal = {
            id: Date.now() + Math.random(),
            type: medalType,
            x: position.x,
            y: position.y,
            collected: false,
            spawnTime: Date.now(),
            lifespan: 30000, // 30 seconds for death reward medals (longer than normal)
            pulse: 0,
            rotation: 0,
            floatOffset: Math.random() * Math.PI * 2,
            levelValue: tierData.levelValue,
            points: tierData.points,
            isDeathReward: true // Mark as death reward medal
        };

        console.log(`🏅 Created ${tierData.name} at (${position.x}, ${position.y})`);
        return medal;
    }

    /**
     * Get session start time for survival calculations
     * @returns {number} Session start timestamp
     */
    get sessionStartTime() {
        return this.statistics.sessionStartTime;
    }

    /**
     * Set session start time
     * @param {number} timestamp - Start time timestamp
     */
    set sessionStartTime(timestamp) {
        this.statistics.sessionStartTime = timestamp;
    }
}
