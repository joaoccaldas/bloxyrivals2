// Medal Reward and Points System
// Handles medal collection, rewards, and point calculations

export class MedalSystem {
    constructor() {
        this.medals = [];
        this.collectedMedals = [];
        this.totalPoints = 0;
        this.medalTypes = {
            BRONZE: {
                name: 'Bronze Medal',
                points: 50,
                color: '#CD7F32',
                glowColor: '#FFB347',
                size: 20,
                rarity: 'common'
            },
            SILVER: {
                name: 'Silver Medal',
                points: 100,
                color: '#C0C0C0',
                glowColor: '#E5E5E5',
                size: 24,
                rarity: 'uncommon'
            },
            GOLD: {
                name: 'Gold Medal',
                points: 200,
                color: '#FFD700',
                glowColor: '#FFFF99',
                size: 28,
                rarity: 'rare'
            },
            PLATINUM: {
                name: 'Platinum Medal',
                points: 500,
                color: '#E5E4E2',
                glowColor: '#F0F8FF',
                size: 32,
                rarity: 'epic'
            },
            DIAMOND: {
                name: 'Diamond Medal',
                points: 1000,
                color: '#B9F2FF',
                glowColor: '#E0FFFF',
                size: 36,
                rarity: 'legendary'
            }
        };
        
        this.achievements = [];
        this.multipliers = {
            streak: 1,
            combo: 1,
            time: 1
        };
        
        this.streakCount = 0;
        this.maxStreak = 0;
        this.comboTimer = 0;
        this.comboTimeLimit = 3000; // 3 seconds
        
        this.spawnTimer = 0;
        this.spawnInterval = 5000; // 5 seconds base interval
        this.maxMedalsOnScreen = 10;
        
        this.particleEffects = [];
        this.collectionEffects = [];
        
        this.statistics = {
            medalsCollected: {
                bronze: 0,
                silver: 0,
                gold: 0,
                platinum: 0,
                diamond: 0
            },
            totalMedalsCollected: 0,
            totalPointsEarned: 0,
            longestStreak: 0,
            bestCombo: 0,
            rareMedalsFound: 0
        };
        
        // Initialize achievement system
        this.initializeAchievements();
        
        console.log('🏅 Medal System initialized');
    }
    
    /**
     * Initialize achievement definitions
     */
    initializeAchievements() {
        this.achievementDefinitions = [
            {
                id: 'first_medal',
                name: 'First Steps',
                description: 'Collect your first medal',
                condition: () => this.statistics.totalMedalsCollected >= 1,
                reward: 100,
                unlocked: false
            },
            {
                id: 'medal_collector',
                name: 'Medal Collector',
                description: 'Collect 10 medals',
                condition: () => this.statistics.totalMedalsCollected >= 10,
                reward: 250,
                unlocked: false
            },
            {
                id: 'bronze_hunter',
                name: 'Bronze Hunter',
                description: 'Collect 25 bronze medals',
                condition: () => this.statistics.medalsCollected.bronze >= 25,
                reward: 300,
                unlocked: false
            },
            {
                id: 'silver_seeker',
                name: 'Silver Seeker',
                description: 'Collect 15 silver medals',
                condition: () => this.statistics.medalsCollected.silver >= 15,
                reward: 500,
                unlocked: false
            },
            {
                id: 'gold_rush',
                name: 'Gold Rush',
                description: 'Collect 10 gold medals',
                condition: () => this.statistics.medalsCollected.gold >= 10,
                reward: 750,
                unlocked: false
            },
            {
                id: 'platinum_prestige',
                name: 'Platinum Prestige',
                description: 'Collect 5 platinum medals',
                condition: () => this.statistics.medalsCollected.platinum >= 5,
                reward: 1000,
                unlocked: false
            },
            {
                id: 'diamond_dynasty',
                name: 'Diamond Dynasty',
                description: 'Collect a diamond medal',
                condition: () => this.statistics.medalsCollected.diamond >= 1,
                reward: 2000,
                unlocked: false
            },
            {
                id: 'streak_master',
                name: 'Streak Master',
                description: 'Achieve a 10 medal collection streak',
                condition: () => this.statistics.longestStreak >= 10,
                reward: 1500,
                unlocked: false
            },
            {
                id: 'combo_king',
                name: 'Combo King',
                description: 'Collect 5 medals in quick succession',
                condition: () => this.statistics.bestCombo >= 5,
                reward: 800,
                unlocked: false
            },
            {
                id: 'point_millionaire',
                name: 'Point Millionaire',
                description: 'Earn 10,000 total points from medals',
                condition: () => this.statistics.totalPointsEarned >= 10000,
                reward: 5000,
                unlocked: false
            }
        ];
    }
    
    /**
     * Update medal system
     * @param {number} deltaTime - Time since last frame
     * @param {Object} player - Player object
     * @param {Object} gameArea - Game area boundaries
     */
    update(deltaTime, player, gameArea) {
        // Update spawn timer
        this.spawnTimer += deltaTime;
        
        // Spawn new medals
        if (this.spawnTimer >= this.spawnInterval && this.medals.length < this.maxMedalsOnScreen) {
            this.spawnMedal(gameArea);
            this.spawnTimer = 0;
        }
        
        // Update existing medals
        this.medals.forEach(medal => {
            this.updateMedal(medal, deltaTime);
        });
        
        // Check for medal collection
        this.checkMedalCollection(player);
        
        // Update combo timer
        if (this.comboTimer > 0) {
            this.comboTimer -= deltaTime;
            if (this.comboTimer <= 0) {
                this.resetCombo();
            }
        }
        
        // Update particle effects
        this.updateParticleEffects(deltaTime);
        
        // Update collection effects
        this.updateCollectionEffects(deltaTime);
        
        // Remove expired medals
        this.medals = this.medals.filter(medal => !medal.collected && medal.lifeTime > 0);
        
        // Update multipliers
        this.updateMultipliers();
    }
    
    /**
     * Spawn a new medal at random location
     * @param {Object} gameArea - Game area boundaries
     */
    spawnMedal(gameArea) {
        const medalType = this.selectRandomMedalType();
        const medal = {
            id: Date.now() + Math.random(),
            type: medalType,
            x: Math.random() * (gameArea.width - 50) + 25,
            y: Math.random() * (gameArea.height - 50) + 25,
            collected: false,
            lifeTime: 15000, // 15 seconds before despawn
            maxLifeTime: 15000,
            bobOffset: Math.random() * Math.PI * 2,
            bobSpeed: 2 + Math.random(),
            glowIntensity: 0,
            glowDirection: 1,
            rotationSpeed: 1 + Math.random() * 2,
            rotation: 0,
            pulseScale: 1,
            pulseSpeed: 3 + Math.random() * 2
        };
        
        this.medals.push(medal);
        console.log(`🏅 Spawned ${medalType} medal at (${Math.round(medal.x)}, ${Math.round(medal.y)})`);
    }
    
    /**
     * Select random medal type based on rarity
     * @returns {string} Medal type
     */
    selectRandomMedalType() {
        const rand = Math.random();
        
        if (rand < 0.5) return 'BRONZE';      // 50% chance
        if (rand < 0.75) return 'SILVER';     // 25% chance
        if (rand < 0.9) return 'GOLD';        // 15% chance
        if (rand < 0.98) return 'PLATINUM';   // 8% chance
        return 'DIAMOND';                     // 2% chance
    }
    
    /**
     * Update individual medal properties
     * @param {Object} medal - Medal object
     * @param {number} deltaTime - Time since last frame
     */
    updateMedal(medal, deltaTime) {
        // Decrease lifetime
        medal.lifeTime -= deltaTime;
        
        // Bob animation
        medal.bobOffset += medal.bobSpeed * deltaTime / 1000;
        const bobY = Math.sin(medal.bobOffset) * 3;
        medal.displayY = medal.y + bobY;
        
        // Glow animation
        medal.glowIntensity += medal.glowDirection * deltaTime / 500;
        if (medal.glowIntensity >= 1) {
            medal.glowIntensity = 1;
            medal.glowDirection = -1;
        } else if (medal.glowIntensity <= 0) {
            medal.glowIntensity = 0;
            medal.glowDirection = 1;
        }
        
        // Rotation animation
        medal.rotation += medal.rotationSpeed * deltaTime / 1000;
        
        // Pulse animation
        medal.pulseScale = 1 + Math.sin(Date.now() * medal.pulseSpeed / 1000) * 0.1;
        
        // Despawn warning (flashing when time is low)
        if (medal.lifeTime < 3000) {
            medal.isFlashing = Math.floor(Date.now() / 200) % 2 === 0;
        }
    }
    
    /**
     * Check if player collects any medals
     * @param {Object} player - Player object
     */
    checkMedalCollection(player) {
        this.medals.forEach(medal => {
            if (medal.collected) return;
            
            const distance = Math.sqrt(
                Math.pow(player.x - medal.x, 2) + 
                Math.pow(player.y - medal.y, 2)
            );
            
            const collectionRadius = 30;
            if (distance < collectionRadius) {
                this.collectMedal(medal, player);
            }
        });
    }
    
    /**
     * Collect a medal and award points
     * @param {Object} medal - Medal object
     * @param {Object} player - Player object
     */
    collectMedal(medal, player) {
        medal.collected = true;
        
        const medalInfo = this.medalTypes[medal.type];
        let points = medalInfo.points;
        
        // Apply multipliers
        points *= this.multipliers.streak;
        points *= this.multipliers.combo;
        points *= this.multipliers.time;
        points = Math.round(points);
        
        // Update statistics
        this.statistics.medalsCollected[medal.type.toLowerCase()]++;
        this.statistics.totalMedalsCollected++;
        this.statistics.totalPointsEarned += points;
        
        // Update streak
        this.streakCount++;
        if (this.streakCount > this.statistics.longestStreak) {
            this.statistics.longestStreak = this.streakCount;
        }
        
        // Update combo
        this.comboTimer = this.comboTimeLimit;
        const currentCombo = this.getCurrentCombo();
        if (currentCombo > this.statistics.bestCombo) {
            this.statistics.bestCombo = currentCombo;
        }
        
        // Add to total points
        this.totalPoints += points;
        
        // Create collection effect
        this.createCollectionEffect(medal, points);
        
        // Create particle effect
        this.createParticleEffect(medal);
        
        // Add to collected medals history
        this.collectedMedals.push({
            type: medal.type,
            points: points,
            timestamp: Date.now(),
            x: medal.x,
            y: medal.y
        });
        
        // Check for achievements
        this.checkAchievements();
        
        console.log(`🏅 Collected ${medalInfo.name} for ${points} points! Total: ${this.totalPoints}`);
        
        // Trigger collection callback if set
        if (this.onMedalCollected) {
            this.onMedalCollected(medal.type, points, this.totalPoints);
        }
    }
    
    /**
     * Create visual effect for medal collection
     * @param {Object} medal - Medal object
     * @param {number} points - Points awarded
     */
    createCollectionEffect(medal, points) {
        const effect = {
            x: medal.x,
            y: medal.y,
            points: points,
            opacity: 1,
            scale: 1,
            yOffset: 0,
            duration: 1500,
            timeLeft: 1500,
            color: this.medalTypes[medal.type].color
        };
        
        this.collectionEffects.push(effect);
    }
    
    /**
     * Create particle effect for medal collection
     * @param {Object} medal - Medal object
     */
    createParticleEffect(medal) {
        const particleCount = 8;
        const medalInfo = this.medalTypes[medal.type];
        
        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2;
            const speed = 50 + Math.random() * 50;
            
            const particle = {
                x: medal.x,
                y: medal.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 3 + Math.random() * 3,
                color: medalInfo.glowColor,
                opacity: 1,
                life: 1000,
                maxLife: 1000,
                gravity: 50
            };
            
            this.particleEffects.push(particle);
        }
    }
    
    /**
     * Update particle effects
     * @param {number} deltaTime - Time since last frame
     */
    updateParticleEffects(deltaTime) {
        this.particleEffects = this.particleEffects.filter(particle => {
            particle.life -= deltaTime;
            particle.x += particle.vx * deltaTime / 1000;
            particle.y += particle.vy * deltaTime / 1000;
            particle.vy += particle.gravity * deltaTime / 1000;
            particle.opacity = particle.life / particle.maxLife;
            particle.size *= 0.998;
            
            return particle.life > 0 && particle.size > 0.5;
        });
    }
    
    /**
     * Update collection effects
     * @param {number} deltaTime - Time since last frame
     */
    updateCollectionEffects(deltaTime) {
        this.collectionEffects = this.collectionEffects.filter(effect => {
            effect.timeLeft -= deltaTime;
            effect.yOffset -= 30 * deltaTime / 1000;
            effect.opacity = effect.timeLeft / effect.duration;
            effect.scale = 1 + (1 - effect.opacity) * 0.5;
            
            return effect.timeLeft > 0;
        });
    }
    
    /**
     * Update multipliers based on current game state
     */
    updateMultipliers() {
        // Streak multiplier
        this.multipliers.streak = 1 + Math.min(this.streakCount * 0.1, 2);
        
        // Combo multiplier
        const comboCount = this.getCurrentCombo();
        this.multipliers.combo = 1 + Math.min(comboCount * 0.2, 3);
        
        // Time multiplier (bonus for quick collection)
        if (this.comboTimer > this.comboTimeLimit * 0.8) {
            this.multipliers.time = 1.5;
        } else if (this.comboTimer > this.comboTimeLimit * 0.5) {
            this.multipliers.time = 1.2;
        } else {
            this.multipliers.time = 1;
        }
    }
    
    /**
     * Get current combo count
     * @returns {number} Current combo count
     */
    getCurrentCombo() {
        if (this.comboTimer <= 0) return 0;
        
        const recentCollections = this.collectedMedals.filter(medal => 
            Date.now() - medal.timestamp < this.comboTimeLimit
        );
        
        return recentCollections.length;
    }
    
    /**
     * Reset combo when timer expires
     */
    resetCombo() {
        this.multipliers.combo = 1;
        console.log('🔄 Combo reset');
    }
    
    /**
     * Check and unlock achievements
     */
    checkAchievements() {
        this.achievementDefinitions.forEach(achievement => {
            if (!achievement.unlocked && achievement.condition()) {
                this.unlockAchievement(achievement);
            }
        });
    }
    
    /**
     * Unlock an achievement
     * @param {Object} achievement - Achievement to unlock
     */
    unlockAchievement(achievement) {
        achievement.unlocked = true;
        this.totalPoints += achievement.reward;
        this.achievements.push({
            ...achievement,
            unlockedAt: Date.now()
        });
        
        console.log(`🏆 Achievement Unlocked: ${achievement.name} (+${achievement.reward} points)`);
        
        // Trigger achievement callback if set
        if (this.onAchievementUnlocked) {
            this.onAchievementUnlocked(achievement);
        }
    }
    
    /**
     * Render all medal system elements
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {Object} camera - Camera object for offset calculations
     */
    render(ctx, camera = { x: 0, y: 0 }) {
        // Render medals
        this.medals.forEach(medal => {
            this.renderMedal(ctx, medal, camera);
        });
        
        // Render particle effects
        this.particleEffects.forEach(particle => {
            this.renderParticle(ctx, particle, camera);
        });
        
        // Render collection effects
        this.collectionEffects.forEach(effect => {
            this.renderCollectionEffect(ctx, effect, camera);
        });
    }
    
    /**
     * Render individual medal
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {Object} medal - Medal object
     * @param {Object} camera - Camera offset
     */
    renderMedal(ctx, medal, camera) {
        if (medal.collected) return;
        
        const medalInfo = this.medalTypes[medal.type];
        const x = medal.x - camera.x;
        const y = (medal.displayY || medal.y) - camera.y;
        
        ctx.save();
        
        // Apply flashing effect for despawning medals
        if (medal.isFlashing) {
            ctx.globalAlpha = 0.5;
        }
        
        // Draw glow effect
        const glowRadius = medalInfo.size + medal.glowIntensity * 10;
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, glowRadius);
        gradient.addColorStop(0, medalInfo.glowColor + '80');
        gradient.addColorStop(1, medalInfo.glowColor + '00');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x - glowRadius, y - glowRadius, glowRadius * 2, glowRadius * 2);
        
        // Draw medal
        ctx.translate(x, y);
        ctx.rotate(medal.rotation);
        ctx.scale(medal.pulseScale, medal.pulseScale);
        
        // Draw medal background
        ctx.fillStyle = medalInfo.color;
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.arc(0, 0, medalInfo.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Draw medal center
        ctx.fillStyle = medalInfo.glowColor;
        ctx.beginPath();
        ctx.arc(0, 0, medalInfo.size * 0.6, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw medal star/emblem
        this.drawMedalEmblem(ctx, medalInfo.size * 0.4, medalInfo.color);
        
        ctx.restore();
        
        // Draw lifetime indicator
        if (medal.lifeTime < 5000) {
            this.drawLifetimeIndicator(ctx, x, y - medalInfo.size - 15, medal.lifeTime / medal.maxLifeTime);
        }
    }
    
    /**
     * Draw medal emblem (star shape)
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {number} size - Emblem size
     * @param {string} color - Emblem color
     */
    drawMedalEmblem(ctx, size, color) {
        ctx.fillStyle = color;
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        
        const spikes = 5;
        const outerRadius = size;
        const innerRadius = size * 0.4;
        
        ctx.beginPath();
        for (let i = 0; i < spikes * 2; i++) {
            const angle = (i * Math.PI) / spikes;
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }
    
    /**
     * Draw lifetime indicator bar
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} percentage - Lifetime percentage (0-1)
     */
    drawLifetimeIndicator(ctx, x, y, percentage) {
        const width = 40;
        const height = 4;
        
        ctx.fillStyle = '#333';
        ctx.fillRect(x - width / 2, y, width, height);
        
        ctx.fillStyle = percentage > 0.3 ? '#4CAF50' : '#f44336';
        ctx.fillRect(x - width / 2, y, width * percentage, height);
    }
    
    /**
     * Render particle effect
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {Object} particle - Particle object
     * @param {Object} camera - Camera offset
     */
    renderParticle(ctx, particle, camera) {
        const x = particle.x - camera.x;
        const y = particle.y - camera.y;
        
        ctx.save();
        ctx.globalAlpha = particle.opacity;
        ctx.fillStyle = particle.color;
        
        ctx.beginPath();
        ctx.arc(x, y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
    
    /**
     * Render collection effect (floating points text)
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {Object} effect - Effect object
     * @param {Object} camera - Camera offset
     */
    renderCollectionEffect(ctx, effect, camera) {
        const x = effect.x - camera.x;
        const y = effect.y + effect.yOffset - camera.y;
        
        ctx.save();
        ctx.globalAlpha = effect.opacity;
        ctx.fillStyle = effect.color;
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.font = `bold ${16 * effect.scale}px Arial`;
        ctx.textAlign = 'center';
        
        const text = `+${effect.points}`;
        ctx.strokeText(text, x, y);
        ctx.fillText(text, x, y);
        
        ctx.restore();
    }
    
    /**
     * Render UI overlay with medal statistics
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {number} x - UI X position
     * @param {number} y - UI Y position
     */
    renderUI(ctx, x = 10, y = 10) {
        ctx.save();
        
        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(x, y, 280, 120);
        
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, 280, 120);
        
        // Title
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 18px Arial';
        ctx.fillText('🏅 Medal System', x + 10, y + 25);
        
        // Points
        ctx.fillStyle = '#fff';
        ctx.font = '14px Arial';
        ctx.fillText(`Total Points: ${this.totalPoints.toLocaleString()}`, x + 10, y + 45);
        
        // Current multipliers
        const streak = this.multipliers.streak.toFixed(1);
        const combo = this.multipliers.combo.toFixed(1);
        ctx.fillText(`Streak: x${streak} | Combo: x${combo}`, x + 10, y + 65);
        
        // Statistics
        ctx.fillText(`Medals: ${this.statistics.totalMedalsCollected}`, x + 10, y + 85);
        ctx.fillText(`Best Streak: ${this.statistics.longestStreak}`, x + 10, y + 105);
        
        // Medal count by type
        ctx.fillText(`🥉${this.statistics.medalsCollected.bronze} 🥈${this.statistics.medalsCollected.silver} 🥇${this.statistics.medalsCollected.gold}`, x + 140, y + 85);
        ctx.fillText(`💎${this.statistics.medalsCollected.platinum} 💍${this.statistics.medalsCollected.diamond}`, x + 140, y + 105);
        
        ctx.restore();
    }
    
    /**
     * Get medal system statistics
     * @returns {Object} Statistics object
     */
    getStatistics() {
        return {
            ...this.statistics,
            currentPoints: this.totalPoints,
            activeMedals: this.medals.length,
            currentStreak: this.streakCount,
            currentCombo: this.getCurrentCombo(),
            multipliers: { ...this.multipliers },
            achievements: this.achievements.length,
            totalAchievements: this.achievementDefinitions.length
        };
    }
    
    /**
     * Save medal system state
     * @returns {Object} Save data
     */
    save() {
        return {
            totalPoints: this.totalPoints,
            statistics: this.statistics,
            achievements: this.achievements,
            collectedMedals: this.collectedMedals.slice(-100) // Keep last 100 for history
        };
    }
    
    /**
     * Load medal system state
     * @param {Object} saveData - Save data
     */
    load(saveData) {
        if (saveData.totalPoints !== undefined) {
            this.totalPoints = saveData.totalPoints;
        }
        
        if (saveData.statistics) {
            this.statistics = { ...this.statistics, ...saveData.statistics };
        }
        
        if (saveData.achievements) {
            this.achievements = saveData.achievements;
            // Mark achievements as unlocked
            this.achievements.forEach(achievement => {
                const def = this.achievementDefinitions.find(a => a.id === achievement.id);
                if (def) def.unlocked = true;
            });
        }
        
        if (saveData.collectedMedals) {
            this.collectedMedals = saveData.collectedMedals;
        }
        
        console.log('🏅 Medal system state loaded');
    }
    
    /**
     * Reset medal system (for new game)
     */
    reset() {
        this.medals = [];
        this.collectedMedals = [];
        this.streakCount = 0;
        this.comboTimer = 0;
        this.spawnTimer = 0;
        this.particleEffects = [];
        this.collectionEffects = [];
        
        // Reset multipliers
        this.multipliers = {
            streak: 1,
            combo: 1,
            time: 1
        };
        
        console.log('🏅 Medal system reset');
    }
    
    /**
     * Set callback for medal collection events
     * @param {Function} callback - Callback function
     */
    setMedalCollectedCallback(callback) {
        this.onMedalCollected = callback;
    }
    
    /**
     * Set callback for achievement unlock events
     * @param {Function} callback - Callback function
     */
    setAchievementUnlockedCallback(callback) {
        this.onAchievementUnlocked = callback;
    }
    
    /**
     * Force spawn a specific medal type (for testing)
     * @param {string} type - Medal type
     * @param {number} x - X position
     * @param {number} y - Y position
     */
    spawnSpecificMedal(type, x, y) {
        if (!this.medalTypes[type]) {
            console.warn(`Invalid medal type: ${type}`);
            return;
        }
        
        const medal = {
            id: Date.now() + Math.random(),
            type: type,
            x: x,
            y: y,
            collected: false,
            lifeTime: 15000,
            maxLifeTime: 15000,
            bobOffset: Math.random() * Math.PI * 2,
            bobSpeed: 2 + Math.random(),
            glowIntensity: 0,
            glowDirection: 1,
            rotationSpeed: 1 + Math.random() * 2,
            rotation: 0,
            pulseScale: 1,
            pulseSpeed: 3 + Math.random() * 2
        };
        
        this.medals.push(medal);
        console.log(`🏅 Force spawned ${type} medal at (${x}, ${y})`);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MedalSystem };
}
