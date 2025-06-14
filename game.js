// game.js (Clean version without shards and boss mechanics)

import { characters } from '../data/characterData.js';
import { Player } from '../entities/player.js';
import { Controls } from '../systems/controls.js';
import { World } from './world.js';
import { Camera } from './camera.js';
import { Storage } from '../systems/storage.js';
import { Mob } from '../entities/mobs.js';
import { DamageNumber } from '../entities/damageNumber.js';
import { WeatherSystem } from '../systems/weather.js';
import { SpriteManager } from '../systems/SpriteManager.js';
import { RewardMedalSystem } from '../systems/rewardMedalSystem.js';
import { GameModeInterface } from '../systems/gameModeInterface.js';
import { PowerUpSystem } from '../systems/PowerUpSystem.js';
import { PowerUpType } from '../entities/PowerUp.js'; // Corrected import for PowerUpType
import { MobType, getMobConfigByType, getRandomMobConfig } from '../data/mobData.js'; // Import mob data
import { RankingSystem } from '../systems/RankingSystem.js'; // Corrected import path casing
import { RankingDisplay } from '../ui/RankingDisplay.js'; // Corrected import path casing
import { BattleStatUI } from '../ui/battleStatUI.js'; // Import BattleStatUI for player count
// NEW IMPROVEMENT SYSTEMS
import { ComboSystem } from '../systems/comboSystem.js';
import { MapEventsSystem } from '../systems/mapEventsSystem.js';

export class Game {
  constructor(canvasId, selectedCharacterId = 0, pauseCallback = () => {}, gameOverCallback = () => {}) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) throw new Error(`Canvas "${canvasId}" not found.`);
    this.ctx = this.canvas.getContext('2d');
    this.canvas.width = 1000;
    this.canvas.height = 800;    // Make characters globally available for sprite fallback system
    window.characters = characters;

    // Find a valid character (prefer the selected one, but fallback to one with a sprite)
    let character = characters.find(c => c.id === selectedCharacterId);
    if (!character || !character.sprite) {
      // Fallback to first character with a valid sprite
      character = characters.find(c => c.sprite && c.sprite !== null);
      if (!character) {
        // If no characters have sprites, just use the first one (fallback sprite will be generated)
        character = characters[0];
      }
      console.warn(`Selected character ${selectedCharacterId} has no sprite, using ${character.name} (ID: ${character.id}) instead`);
    }
    this.selectedCharacterId = character.id;
    
    this.spriteManager = new SpriteManager();
    this.player = new Player(
      100, 100, 64, 64, 
      character.sprite, 
      () => this.handlePlayerDeath(),
      this.spriteManager,
      character.id.toString()
    );
    
    this.world = new World();
    this.mobs = [];
    this.camera = new Camera(this.canvas, this.world.width, this.world.height, this.player);
    // Pass a callback to controls to notify game.js about player-dealt damage
    this.controls = new Controls(
        this.player, 
        this.canvas, 
        this.mobs, 
        (mob, damage, x, y) => this.onMobDamaged(mob, damage, x, y),
        this.camera,
        (damageDealt) => this.onPlayerDealtDamage(damageDealt) // New callback for damage dealt
    );
    this.storage = new Storage();
    this.pauseCallback = pauseCallback;
    this.gameOverCallback = gameOverCallback;
    
    this.powerUpSystem = new PowerUpSystem(this, this.world);    this.rewardMedalSystem = new RewardMedalSystem();
      // Set up medal collection callback to update ranking system
    this.rewardMedalSystem.onMedalCollected = (medalType, levelUp) => {
      if (this.rankingSystem && this.rankingSystem.currentSession) {
        const currentLevel = this.rewardMedalSystem.getPlayerLevel();
        const totalMedals = this.rewardMedalSystem.getTotalMedalsCollected();
        this.rankingSystem.updateStats({ 
          score: currentLevel * 1000 + totalMedals, // Use level and medals for scoring
          kills: this.kills,
          level: currentLevel,
          medals: totalMedals
        });
      }
    };

    this.rankingSystem = new RankingSystem();
    // Ensure 'ranking-container' div exists in your main HTML file
    this.rankingDisplay = new RankingDisplay('ranking-container'); 
    this.rankingDisplay.setRankingSystem(this.rankingSystem);    this.gameModeInterface = new GameModeInterface();
    this.setupGameModeCallbacks();

    this.kills = 0;
    this.score = 0;
    this.lowHealthPulse = 0;
    this.damageNumbers = [];
      this.weatherSystem = new WeatherSystem(this.canvas, this.world);
    
    // NEW IMPROVEMENT SYSTEMS
    this.comboSystem = new ComboSystem(this);
    this.mapEventsSystem = new MapEventsSystem(this);
    
    // NEW FUN FEATURES SYSTEMS
    this.achievementSystem = null; // Will be imported and initialized later
    this.playerAbilitySystem = null;
    this.bossBattleSystem = null;
    this.loadoutSystem = null;
    this.environmentalSystem = null;
    
    // Time scale for special effects (like time dilation)
    this.timeScale = 1.0;
      // Visual effects system for the new improvements
    this.activeEffects = [];    // Battle statistics UI
    this.battleStatUI = new BattleStatUI({
      getPlayerCount: () => this.getPlayerCount(),
      onExit: () => this.exitToMenu()
    });
    
    // Initialize with the proper total players count (mobs + player)
    // Will be updated once mobs are created
    this.battleStatUI.setTotalPlayers(1); // Start with just player, mobs will be added
    
    this.lastTime = 0;
    this.state = 'loading';
    
    this.loop = this.loop.bind(this);
    this._handleKeyDown = this._handleKeyDown.bind(this);
    this.prevHealth = this.player.health;
    this.damageFlash = 0;
    
    this.gameStartTime = null;
    this.gameEndTime = null;
    this.timeRemaining = 0;
    this.lastTimeUpdate = 0;

    this.totalPlayerDamageDealtThisSession = 0; // For ranking
  }

  /**
   * Setup game mode callbacks and event handlers
   */
  setupGameModeCallbacks() {
    console.log('🎮 Setting up game mode callbacks...');
    
    this.gameModeInterface.registerCallback('mode_start', (data) => {
      console.log('🚀 Game mode started:', data);
      if (data.duration) {
        this.timeRemaining = data.duration;
        this.gameStartTime = Date.now();
        console.log(`⏰ Timer set to ${data.duration} seconds`);
      }
      // Start ranking session when game mode starts
      if (this.rankingSystem) {
        this.rankingSystem.startSession(this.gameModeInterface.currentMode.type, data);
        this.totalPlayerDamageDealtThisSession = 0; // Reset for new session
      }
    });

    this.gameModeInterface.registerCallback('time_warning', (secondsLeft) => {
      console.log(`⚠️ Time warning: ${secondsLeft} seconds remaining`);
    });

    this.gameModeInterface.registerCallback('time_up', () => {
      console.log('⏰ Time is up!');
      this.triggerGameOver();
    });

    this.gameModeInterface.registerCallback('mode_end', (results) => {
      console.log('🏁 Game mode ended with results:', results);
    });
    
    console.log('✅ Game mode callbacks setup complete');
  }

  /**  /**
   * Set the game mode (called from landing page)
   * @param {string} modeType - The type of mode to set
   */  setGameMode(modeType = 'time_based') {
    console.log(`🎮 Setting game mode to: ${modeType}`);
    try {
      this.gameModeInterface.selectMode(modeType);
        // Set medal system multiplier based on game mode
      const mode = this.gameModeInterface.currentMode;
      if (mode && mode.scoringMultiplier) {
        this.rewardMedalSystem.setMultiplier(mode.scoringMultiplier);
        console.log(`🏅 Medal multiplier set to: ${mode.scoringMultiplier}`);
      }
      
      // CRITICAL FIX: Start the game mode to activate the timer
      this.gameModeInterface.startMode();
      console.log(`⏰ Game mode timer activated`);
      
      console.log(`✅ Game mode successfully set to: ${modeType}`);
    } catch (error) {
      console.error('❌ Failed to set game mode:', error);
    }
  }
  async init(loadExisting = false) {
    this.state = 'initializing';
      // Load directional sprites for player
    const character = characters.find(c => c.id === this.selectedCharacterId) || characters[0];
    const spriteId = character.id.toString();
    
    try {
      console.log(`🎨 Loading directional sprites for ${character.name}...`);
      await this.spriteManager.loadSpriteWithDirections(character.sprite, spriteId);
      console.log(`✅ Directional sprites loaded for ${character.name}`);
    } catch (err) {
      console.warn(`⚠️ Failed to load directional sprites for ${character.name}:`, err);
      // Continue without directional sprites
    }

    if (loadExisting) {
      const saved = this.storage.load();
      if (saved) {
        try {
          if (saved.world) this.world.load(saved.world);
          if (saved.player) {
            this.player.load(saved.player);
            // Ensure player stats like totalDamageTaken are correctly loaded
          }
          if (saved.mobs) {
            this.mobs = saved.mobs.map(data => {
              const mobOptions = {
                ...data.options, // Includes type, health, spriteId
                spriteManager: this.spriteManager
              };
              // Sprites (character.sprite) are effectively the base image path or identifier
              // We need to ensure the spriteId from characterData maps to what Mob expects
              // For now, assume data.options.spriteId is sufficient if saved correctly
              // or find character by a saved ID to get its sprite path.
              // This part might need refinement based on how mob sprites are identified post-refactor.
              const characterSprite = characters.find(c => c.id.toString() === data.options.spriteId)?.sprite || characters[0].sprite;
              const mob = new Mob(data.x, data.y, characterSprite, mobOptions);
              // Restore projectiles if any
              if (data.projectiles) {
                  mob.projectiles = data.projectiles.map(p => ({
                      ...p, // x, y, dx, dy
                      speed: getMobConfigByType(mob.type).projectileSpeed, // Restore from config
                      damage: getMobConfigByType(mob.type).projectileDamage, // Restore from config
                      width: 8, height: 8, owner: mob
                  }));
              }
              return mob;
            });
          }          this.rewardMedalSystem.loadProgressFromStorage();
          if (saved.score) {
            // For compatibility, convert old score to medals if needed
            this.rewardMedalSystem.convertLegacyScore(saved.score);
          }
          this.totalPlayerDamageDealtThisSession = saved.totalPlayerDamageDealtThisSession || 0;
          // Ranking system loads its own data from localStorage
        } catch (e) {
          console.error('Error loading save:', e);
        }
      }
    } else {        // Reset player stats for a new game, if not loading
        this.player.resetState(this.player.initialX, this.player.initialY);
        this.rewardMedalSystem.reset(); // Reset medal system for a new game
        this.totalPlayerDamageDealtThisSession = 0;
        // gameModeInterface.startMode will be called by gameModeInterface callback
    }    if (!this.mobs.length) {
      console.log('🎭 Creating 13 mobs with directional sprites and types...');
      
      await this.spriteManager.preloadCharacterSprites(characters); // Ensure base sprites are loaded
      
      // Filter characters that have valid sprites
      const charactersWithSprites = characters.filter(char => char.sprite && char.sprite !== null);
      
      if (charactersWithSprites.length === 0) {
        console.error('❌ No characters with valid sprites found! Cannot create mobs.');
        return;
      }
      
      console.log(`Using ${charactersWithSprites.length} characters with valid sprites for mob creation`);
        this.mobs = Array.from({ length: 13 }, () => {
        const randomCharacter = charactersWithSprites[Math.floor(Math.random() * charactersWithSprites.length)];
        const mobSpriteId = randomCharacter.id.toString();
        const mobConfigData = getRandomMobConfig(); // Get a random mob type config
        
        // Find a safe spawn position away from player
        let x, y, attempts = 0;
        do {
          x = Math.random() * (this.world.width - mobConfigData.width) + mobConfigData.width / 2;
          y = Math.random() * (this.world.height - mobConfigData.height) + mobConfigData.height / 2;
          attempts++;
        } while (attempts < 30 && Math.hypot(x - this.player.x, y - this.player.y) < 400);
        
        return new Mob(x, y, randomCharacter.sprite, { 
          type: Object.keys(MobType).find(key => getMobConfigByType(MobType[key]) === mobConfigData), // Get the MobType key string
          spriteManager: this.spriteManager,
          spriteId: mobSpriteId // This is the character sprite ID, mobData.js might define specific mob appearance IDs later
        });      });
      console.log(`✅ Created ${this.mobs.length} mobs with types and directional sprite support`);
        // Update the total player count to include all mobs plus the player
      const totalPlayers = this.mobs.length + 1; // mobs + player
      this.battleStatUI.setTotalPlayers(totalPlayers);
      console.log(`📊 Updated player count display: ${totalPlayers} total players`);
    }
    
    this.controls.mobs = this.mobs;
    this.camera.worldWidth = this.world.width;
    this.camera.worldHeight = this.world.height;
    
    // Initialize new fun feature systems
    await this.initializeNewSystems();
    
    // Start the selected game mode
    if (this.gameModeInterface.currentMode && !this.gameModeInterface.isActive) {
      this.gameModeInterface.startMode();
    }

    window.addEventListener('keydown', this._handleKeyDown);
    this.lastTime = performance.now();
    
    // Set game start time for tracking survival time
    if (!this.gameStartTime && this.gameModeInterface.currentMode?.duration) {
      this.gameStartTime = Date.now();
    }
    
    this.state = 'playing';
    requestAnimationFrame(this.loop);
  }

  resume() {
    if (this.state !== 'paused') return;
    // Re-initialize controls with the new callback for damage dealt
    this.controls = new Controls(
        this.player, 
        this.canvas, 
        this.mobs, 
        (mob, damage, x, y) => this.onMobDamaged(mob, damage, x, y),
        this.camera,
        (damageDealt) => this.onPlayerDealtDamage(damageDealt) 
    );
    window.addEventListener('keydown', this._handleKeyDown);
    this.lastTime = performance.now();
    this.state = 'playing';
    requestAnimationFrame(this.loop);
  }

  // Callback from Controls system when player deals damage
  onPlayerDealtDamage(damageAmount) {
    this.totalPlayerDamageDealtThisSession += damageAmount;
    if (this.rankingSystem && this.rankingSystem.currentSession) {
      this.rankingSystem.updateStats({ damageDealt: this.totalPlayerDamageDealtThisSession });
    }
  }

  onMobDamaged(mob, damage, x, y) {
    this.damageNumbers.push(new DamageNumber(x, y - 10, damage, '#ff0000'));
    
    // Update ranking stats for damage dealt by player (assuming player attack calls this)
    // This needs to be more specific if mobs can damage each other and trigger this.
    // For now, assume this is player-inflicted damage.
    if (this.rankingSystem && this.rankingSystem.currentSession) {
        // This is damage *dealt by player*. The control system should pass who dealt damage.
        // For now, let's assume player is the source of damage in this context.
        // this.rankingSystem.updateStats({ damageDealt: this.rankingSystem.currentSession.stats.damageDealt + damage });
        // This is better handled in controls.js where the source of damage is clear.
    }    // Check if the mob was killed by this damage
    if (mob.health <= 0) {
      console.log('🔥 Mob killed!');
      let basePoints = mob.points || 100; // Use points from mob config, fallback to 100
        // Register kill with combo system first (it handles multipliers)
      if (this.comboSystem) {
        this.comboSystem.registerKill(mob, { x, y });
      }
      
      // Track kills for medal calculation on death (no longer drop medals here)
      this.rewardMedalSystem.recordKill(mob);
      
      // Update game mode stats
      if (this.gameModeInterface && this.gameModeInterface.isActive) {
        this.gameModeInterface.addKill('basic', basePoints);
      }
        // Update legacy tracking for compatibility
      this.kills = this.rewardMedalSystem.getSessionKills();
      this.score = this.rewardMedalSystem.getPlayerLevel() * 1000 + this.rewardMedalSystem.getTotalMedalsCollected();
        // Update battle stat UI to reflect new player count after mob is removed
      if (this.battleStatUI) {
        // The mob will be removed from the array in the next frame, but we can update now
        // since we know it's dead and will be removed
        setTimeout(() => {
          this.battleStatUI.update();
          console.log(`📊 Player count updated after player kill: ${this.getPlayerCount()} remaining`);
        }, 10);
      }
    }
  }
  _handleKeyDown(e) {
    if (e.key === 'Escape' && this.state === 'playing') {
      this.pause();
    }
    
    // Handle new systems key inputs
    if (this.state === 'playing') {
      if (this.playerAbilitySystem) {
        this.playerAbilitySystem.handleKeyPress(e.key);
      }
      if (this.loadoutSystem) {
        this.loadoutSystem.handleKeyPress(e.key);
      }
      if (this.environmentalSystem) {
        this.environmentalSystem.handleKeyPress(e.key);
      }
    }
  }
  pause() {
    if (this.state !== 'playing') return;
    this.state = 'paused';
    this.controls.destroy();
    this.pauseCallback(this.selectedCharacterId);
  }  /**
   * Handle player death - award medals and return to landing page
   */
  handlePlayerDeath() {
    if (this.state === 'gameover') return;
    
    console.log('💀 Player died - calculating medal rewards...');
    this.state = 'gameover';    // Ensure player is properly marked as dead and invisible
    this.player.isDead = true;
    this.player.isVisible = false;
    this.player.health = 0;
      // Show exit button for quick exit
    if (this.battleStatUI) {
      console.log('📱 Showing exit button for player death');
      // Small delay to ensure the UI updates properly
      setTimeout(() => {
        this.battleStatUI.showExitButton();
      }, 300);
    }

    // Calculate medal rewards based on player performance
    this.calculateDeathMedalRewards();

    // Update ranking stats for damage taken (player.getTotalDamageTaken() accumulates this)
    if (this.rankingSystem && this.rankingSystem.currentSession) {
        // This is a good place to update damageTaken for the session if player died.
        // However, damage is taken incrementally. Player.takeDamage already updates player.totalDamageTaken.
        // We should pass this cumulative stat at the end of the session.
    }
    
    // Reset streak on death
    this.rewardMedalSystem.resetStreak();
    
    // Save game state before returning to landing page
    this.saveGame();
    
    // Clean up and return to landing page after showing medal rewards
    setTimeout(() => {
      this.exitToMenu(); // This will take player back to the landing page
    }, 3000); // 3 second delay to show medal rewards
  }

  /**
   * Calculate and award medals based on player performance when they die
   */
  calculateDeathMedalRewards() {
    console.log('🏅 Calculating death medal rewards...');
    
    // Get player performance stats
    const sessionKills = this.rewardMedalSystem.getSessionKills();
    const damageTaken = this.player.getTotalDamageTaken ? this.player.getTotalDamageTaken() : 0;
    const survivalTime = Date.now() - this.rewardMedalSystem.sessionStartTime;
    const survivalMinutes = survivalTime / (1000 * 60);
    
    console.log(`📊 Player stats - Kills: ${sessionKills}, Damage taken: ${damageTaken}, Survival: ${survivalMinutes.toFixed(1)}min`);
    
    // Calculate number of medals to award (1-5 medals based on performance)
    let medalCount = 1; // Minimum 1 medal
    
    // Award extra medals based on performance
    if (sessionKills >= 5) medalCount++; // Extra medal for 5+ kills
    if (sessionKills >= 15) medalCount++; // Extra medal for 15+ kills
    if (survivalMinutes >= 2) medalCount++; // Extra medal for 2+ minutes survival
    if (damageTaken < 200) medalCount++; // Extra medal for taking less damage (skillful play)
    
    // Random factor - 25% chance for bonus medal
    if (Math.random() < 0.25) {
      medalCount++;
      console.log('🎲 Random bonus medal awarded!');
    }
    
    // Calculate medal quality based on performance
    const medalQualities = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND'];
    
    // Award medals
    const awardedMedals = [];
    for (let i = 0; i < medalCount; i++) {
      // Determine medal type based on performance and randomness
      let medalTypeIndex = 0; // Start with BRONZE
      
      // Better performance = higher chance of better medals
      const performanceScore = sessionKills + (survivalMinutes * 2) + (Math.max(0, 300 - damageTaken) / 50);
      
      if (performanceScore >= 5) medalTypeIndex = Math.min(1, medalTypeIndex + Math.floor(Math.random() * 2)); // SILVER chance
      if (performanceScore >= 15) medalTypeIndex = Math.min(2, medalTypeIndex + Math.floor(Math.random() * 2)); // GOLD chance
      if (performanceScore >= 30) medalTypeIndex = Math.min(3, medalTypeIndex + Math.floor(Math.random() * 2)); // PLATINUM chance
      if (performanceScore >= 50) medalTypeIndex = Math.min(4, medalTypeIndex + Math.floor(Math.random() * 2)); // DIAMOND chance
      
      // Random factor can upgrade medal quality
      if (Math.random() < 0.15) { // 15% chance to upgrade
        medalTypeIndex = Math.min(medalQualities.length - 1, medalTypeIndex + 1);
      }
      
      const medalType = medalQualities[medalTypeIndex];
      
      // Create medal at player position
      const medal = this.rewardMedalSystem.createMedal(medalType, {
        x: this.player.x + this.player.width / 2,
        y: this.player.y + this.player.height / 2
      });
      
      if (medal) {
        // Add medal to active medals for collection
        this.rewardMedalSystem.activeMedals.push(medal);
        awardedMedals.push(medal);
        
        // Show medal award notification
        const medalTierData = this.rewardMedalSystem.medalTiers[medal.type];
        const medalColor = medalTierData ? medalTierData.color : '#FFD700';
        
        this.damageNumbers.push(new DamageNumber(
          medal.x, 
          medal.y - 20 - (i * 15), 
          `🏅 ${medal.type}`, 
          medalColor
        ));
        
        console.log(`🏅 Awarded ${medal.type} medal (${medal.levelValue} points)`);
      }
    }
    
    // Show summary message
    const totalValue = awardedMedals.reduce((sum, medal) => sum + medal.levelValue, 0);
    this.damageNumbers.push(new DamageNumber(
      this.player.x + this.player.width / 2, 
      this.player.y - 40, 
      `💀 Death Rewards: ${medalCount} medals (+${totalValue} points)`, 
      '#FFD700'
    ));
    
    console.log(`🎉 Death rewards complete: ${medalCount} medals worth ${totalValue} total points`);
  }
  triggerGameOver() {
    if (this.state === 'gameover') return;
    
    // Check if the player is dead - if so, let handlePlayerDeath() handle the flow
    if (this.player.health <= 0 || this.player.isDead) {
      console.log('🚫 Player is dead - skipping triggerGameOver() as handlePlayerDeath() will handle the flow');
      return;
    }
    
    this.state = 'gameover';
    
    if (this.gameModeInterface && this.gameModeInterface.isActive) {
      this.gameModeInterface.endMode();
    }    // Finalize ranking session
    if (this.rankingSystem && this.rankingSystem.currentSession) {
      const finalStats = {
        score: this.rewardMedalSystem.getPlayerLevel() * 1000 + this.rewardMedalSystem.getTotalMedalsCollected(),
        kills: this.rewardMedalSystem.getSessionKills(),
        level: this.rewardMedalSystem.getPlayerLevel(),
        medals: this.rewardMedalSystem.getTotalMedalsCollected(),
        sessionMedals: this.rewardMedalSystem.getSessionMedals().length,
        damageTaken: this.player.getTotalDamageTaken(),
        damageDealt: this.totalPlayerDamageDealtThisSession,
        powerUpsCollected: this.rankingSystem.currentSession.stats.powerUpsCollected || 0,
        // bossesDefeated: 0 // Add if/when bosses are implemented
      };
      const results = this.rankingSystem.endSession(finalStats);
      if (results && this.rankingDisplay) {
        this.rankingDisplay.setGameMode(this.gameModeInterface.currentMode?.type || 'time_based');
        this.rankingDisplay.displayResults(results);
      }
    }
    
    this.controls.destroy();
    this.gameOverCallback(this.selectedCharacterId);
  }loop(timestamp) {
    if (this.state !== 'playing') return;
    const delta = Math.min(timestamp - this.lastTime, 50);
    this.lastTime = timestamp;

    // Update game mode system
    if (this.gameModeInterface.isActive) {
      const shouldContinue = this.gameModeInterface.update(delta / 1000); // Convert to seconds
      if (!shouldContinue && this.state !== 'gameover') { // Prevent double trigger if already gameover
        this.triggerGameOver();
        return;
      }
    }

    if (this.player.health < this.prevHealth) this.damageFlash = 200;
    this.prevHealth = this.player.health;

    // Update controls with current mobs array BEFORE controls update
    this.controls.mobs = this.mobs;
    
    this.controls.update(); // This is where player attacks happen
    
    // DEBUG: Log player direction before update
    if (this.player.dx !== 0 || this.player.dy !== 0) {
      console.log(`🎮 Game Loop: About to call player.update() with dx=${this.player.dx}, dy=${this.player.dy}, delta=${delta}`);
    }
    
    this.player.update(delta, this.world);

    // Update PowerUpSystem
    this.powerUpSystem.update(delta, this.player);

    this.damageNumbers = this.damageNumbers.filter(d => d.update(delta));    // Update weather system
    this.weatherSystem.update(delta, this.player, this.mobs);
    
    // Update combo and map events systems
    this.comboSystem.update(delta);
    this.mapEventsSystem.update(delta);
      // Update medal system with proper gameArea parameter
    this.rewardMedalSystem.update(delta, this.player, this.world);
    
    // Update battle statistics UI
    this.battleStatUI.update();
    
    // Update visual effects
    this.updateVisualEffects(delta);

    // Apply time scale for special effects (like time dilation)
    const scaledDelta = delta * this.timeScale;    // Only update mobs if playing (not during respawn)
    if (this.state === 'playing') {      for (let i = this.mobs.length - 1; i >= 0; i--) {
        const mob = this.mobs[i];
        mob.update(scaledDelta, this.player, this.mobs, this.world); // Use scaled delta
          // Clean up any mobs that died from non-player sources (environmental damage, etc.)
        // Player-caused deaths are handled by the controls system
        if (mob.health <= 0) {
          console.log('🔄 Removing dead mob from game loop');
          this.mobs.splice(i, 1);
          
          // Update battle stat UI to reflect new player count
          if (this.battleStatUI) {
            this.battleStatUI.update();
            console.log(`📊 Player count updated after mob death: ${this.getPlayerCount()} remaining`);
          }
        }}      // Check if we should replenish mobs based on game mode configuration
      // Default to true for backwards compatibility
      const shouldReplenishMobs = this.gameModeInterface?.currentMode?.specialRules?.replenishMobs !== false;
      // The player count will still be updated correctly when mobs die
      if (shouldReplenishMobs && this.mobs.length < 13) {
        // Filter characters that have valid sprites
        const charactersWithSprites = characters.filter(char => char.sprite && char.sprite !== null);
        
        if (charactersWithSprites.length > 0) {
          const randomCharacter = charactersWithSprites[Math.floor(Math.random() * charactersWithSprites.length)];
          const mobSpriteId = randomCharacter.id.toString();
          const mobConfigData = getRandomMobConfig();
          const mobTypeKey = Object.keys(MobType).find(key => getMobConfigByType(MobType[key]) === mobConfigData);        let x, y, attempts = 0;
          do {
            x = Math.random() * (this.world.width - mobConfigData.width) + mobConfigData.width / 2;
            y = Math.random() * (this.world.height - mobConfigData.height) + mobConfigData.height / 2;
            attempts++;
          } while (attempts < 30 && Math.hypot(x - this.player.x, y - this.player.y) < 400);
          
          const newMob = new Mob(x, y, randomCharacter.sprite, { 
            type: mobTypeKey,
            spriteManager: this.spriteManager,
            spriteId: mobSpriteId
          });
          
          this.mobs.push(newMob);
        } else {
          console.warn('⚠️ No characters with valid sprites available for mob replenishment');
        }
      }
      
      // Update new fun feature systems
      if (this.achievementSystem) {
        this.achievementSystem.update(delta);
      }
      if (this.playerAbilitySystem) {
        this.playerAbilitySystem.update(delta);
      }
      if (this.bossBattleSystem) {
        this.bossBattleSystem.update(delta);
      }
      if (this.environmentalSystem) {
        this.environmentalSystem.update(delta);
      }
    }

    this.world.update(delta);
    
    this.ctx.fillStyle = '#1C7ED6';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.camera.begin(this.ctx);
    this.world.draw(this.ctx);
    
    // Draw mobs with error handling
    this.mobs.forEach((mob, index) => {
      try {
        mob.draw(this.ctx);
      } catch (error) {      console.error(`Error drawing mob ${index}:`, error);
        // Remove problematic mob to prevent future crashes
        this.mobs.splice(index, 1);
      }
    });
    
    // Draw player
    this.player.draw(this.ctx);

    this.damageNumbers.forEach(d => d.draw(this.ctx));
    this.powerUpSystem.draw(this.ctx);    // Draw attack range indicator in world coordinates
    if (this.controls && this.controls.drawAttackRange) {
      this.controls.drawAttackRange(this.ctx);
    }
    
    // Draw weather effects before ending camera transformation
    this.weatherSystem.draw(this.ctx, this.camera);
    
    this.camera.end(this.ctx);
    
    this._drawUI(delta);
    requestAnimationFrame(this.loop);
  }

  // --- POWER-UP HANDLING ---
  handlePowerUpCollection(player, powerUp) {
    if (!powerUp.isActive) return; // Already collected or expired

    powerUp.applyEffect(player); 
    player.applyPowerUp(powerUp); 

    if (this.rankingSystem && this.rankingSystem.currentSession) {
      this.rankingSystem.updateStats({ 
        powerUpsCollected: (this.rankingSystem.currentSession.stats.powerUpsCollected || 0) + 1 
      });
    }

    console.log(`Game: Player collected ${powerUp.type}`);
  }
  // --- END POWER-UP HANDLING ---

  _drawUI(delta) {
    // UI drawing logic here
    // Example: Draw score, health bar, etc.
      // Draw medal progression instead of score
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '24px Arial';
    const playerLevel = this.rewardMedalSystem.getPlayerLevel();
    const totalMedals = this.rewardMedalSystem.getTotalMedalsCollected();
    const sessionMedals = this.rewardMedalSystem.getSessionMedals().length;
    this.ctx.fillText(`Level: ${playerLevel} | Medals: ${totalMedals} (${sessionMedals} this session)`, 20, 40);
    
    // Draw timer if in time-based mode
    if (this.gameModeInterface.currentMode && this.gameModeInterface.currentMode.type === 'time_based' && this.gameStartTime) {
      const timeElapsed = Math.floor((Date.now() - this.gameStartTime) / 1000);
      const currentRemaining = this.timeRemaining - timeElapsed;    this.ctx.fillText(`Time: ${Math.max(0, currentRemaining)}s`, 20, 80);
    }
    
    // Draw medal system UI and effects
    this.rewardMedalSystem.draw(this.ctx, this.camera);
    if (this.comboSystem) {
      this.comboSystem.draw(this.ctx);
    }
    if (this.mapEventsSystem) {
      this.mapEventsSystem.draw(this.ctx);
    }
    
    // Draw visual effects
    this.drawVisualEffects(this.ctx);
  }
  // Add methods to save and load game state including ranking if necessary
  saveGame() {
    const saveData = {
        world: this.world.serialize(),
        player: this.player.serialize(),
        mobs: this.mobs.map(mob => mob.serialize()),
        medalSystem: this.rewardMedalSystem.serialize(),
        totalPlayerDamageDealtThisSession: this.totalPlayerDamageDealtThisSession,
        // gameModeInterface state might be needed if modes have progress
        // rankingSystem data is saved via its own localStorage methods
    };
    this.storage.save(saveData);
    
    // Save medal system progress to persistent storage
    this.rewardMedalSystem.saveProgressToStorage();
    console.log('💾 Game saved including medal progression!');
  }

  loadGame() {
    // Stop current game loop before loading
    if (this.state === 'playing' || this.state === 'paused' || this.state === 'respawning') {
        this.state = 'loading'; // Prevents loop from continuing
    }
    // It's good practice to clean up event listeners before re-init
    window.removeEventListener('keydown', this._handleKeyDown);    if(this.controls) this.controls.destroy();

    this.init(true); 
    console.log('🔄 Game loaded!');
  }
  /**
   * Exit to menu - clean up and properly exit to main menu
   */  exitToMenu() {
    console.log('🚪 Exiting to menu...');
    
    // Set game state to prevent further updates
    this.state = 'exiting';
    
    try {
      // Save game state before exiting
      this.saveGame();
      
      // Clean up and destroy the game instance
      this.destroy();
      
      // Trigger a custom event that the landing page can listen for
      window.dispatchEvent(new CustomEvent('game:exitToMenu'));
      console.log('✅ Exit to menu event dispatched successfully');
    } catch (error) {
      console.error('❌ Error during exit to menu:', error);
      // Fallback - try direct navigation
      window.dispatchEvent(new CustomEvent('game:exitToMenu'));
    }
  }

  /**
   * Destroy the game instance and clean up resources
   */
  destroy() {
    console.log('🗑️ Destroying game instance...');
    this.state = 'destroyed';
    
    // Clean up event listeners
    window.removeEventListener('keydown', this._handleKeyDown);
    
    // Clean up controls
    if (this.controls) {
      this.controls.destroy();
      this.controls = null;
    }    // Clean up other systems as needed
    if (this.weatherSystem) {
      this.weatherSystem = null;
    }
    
    // Clean up battle stats UI
    if (this.battleStatUI) {
      this.battleStatUI.cleanup();
      this.battleStatUI = null;
    }
    
    // Clean up improvement systems
    if (this.comboSystem) {
      this.comboSystem.reset();
      this.comboSystem = null;
    }
    if (this.mapEventsSystem) {
      this.mapEventsSystem.reset();
      this.mapEventsSystem = null;
    }
    if (this.rewardMedalSystem) {
      // Don't reset medal system as it's persistent, just save current progress
      this.rewardMedalSystem.saveProgressToStorage();
    }
  }

  /**
   * Reset all systems for a new game
   */  resetForNewGame() {
    console.log('🔄 Resetting all systems for new game...');
    
    // Reset improvement systems
    if (this.comboSystem) {
      this.comboSystem.reset();
    }
    if (this.mapEventsSystem) {
      this.mapEventsSystem.reset();
    }
    
    // Reset other game state
    this.kills = 0;
    this.score = 0;
    this.mobs = [];
    this.damageNumbers = [];
    this.totalPlayerDamageDealtThisSession = 0;
    
    // Reset session data in medal system (but keep persistent progression)
    if (this.rewardMedalSystem) {
      this.rewardMedalSystem.resetSession();
    }
    
    console.log('✅ All systems reset for new game');
  }/**
   * Add score (used by combo system and other systems)
   * @param {number} points - Points to add (converted to medal equivalent)
   */
  addScore(points) {
    // Convert points to medal drops for compatibility with existing systems
    if (this.rewardMedalSystem) {
      // Create a virtual medal object based on points value
      const medalType = points >= 500 ? 'GOLD' : points >= 200 ? 'SILVER' : 'BRONZE';
      const virtualMedal = {
        id: Date.now() + Math.random(),
        type: medalType,
        x: this.player.x,
        y: this.player.y,
        collected: false,
        spawnTime: Date.now(),
        lifespan: 1000, // Very short lifespan for virtual medals
        pulse: 0,
        rotation: 0,
        floatOffset: 0
      };
      
      this.rewardMedalSystem.collectMedal(virtualMedal, this.player);
      this.score = this.rewardMedalSystem.getPlayerLevel() * 1000 + this.rewardMedalSystem.getTotalMedalsCollected();
    } else {
      this.score += points;
    }
  }

  /**
   * Add visual effect (used by combo and map events systems)
   * @param {string} type - Effect type
   * @param {Object} config - Effect configuration
   */
  addEffect(type, config) {
    const effect = {
      type,
      config,
      startTime: Date.now(),
      duration: config.duration || 1000
    };
    this.activeEffects.push(effect);
  }

  /**
   * Update visual effects
   * @param {number} delta - Time delta
   */
  updateVisualEffects(delta) {
    this.activeEffects = this.activeEffects.filter(effect => {
      const elapsed = Date.now() - effect.startTime;
      return elapsed < effect.duration;
    });
  }

  /**
   * Draw visual effects
   * @param {CanvasRenderingContext2D} ctx 
   */
  drawVisualEffects(ctx) {
    this.activeEffects.forEach(effect => {
      const elapsed = Date.now() - effect.startTime;
      const progress = elapsed / effect.duration;
      
      switch (effect.type) {
        case 'lightning':
          this.drawLightningEffect(ctx, effect.config, progress);
          break;
        case 'freeze':
          this.drawFreezeEffect(ctx, effect.config, progress);
          break;
        case 'fire':
          this.drawFireEffect(ctx, effect.config, progress);
          break;
        case 'explosion':
          this.drawExplosionEffect(ctx, effect.config, progress);
          break;
      }
    });
  }

  /**
   * Draw lightning effect
   */
  drawLightningEffect(ctx, config, progress) {
    if (!config.start || !config.end) return;
    
    ctx.save();
    ctx.strokeStyle = `rgba(255, 255, 100, ${1 - progress})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(config.start.x, config.start.y);
    ctx.lineTo(config.end.x, config.end.y);
    ctx.stroke();
    ctx.restore();
  }

  /**
   * Draw freeze effect
   */
  drawFreezeEffect(ctx, config, progress) {
    if (!config.position) return;
    
    ctx.save();
    ctx.fillStyle = `rgba(100, 200, 255, ${1 - progress})`;
    ctx.beginPath();
    ctx.arc(config.position.x, config.position.y, 30 * (1 + progress), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  /**
   * Draw fire effect
   */
  drawFireEffect(ctx, config, progress) {
    if (!config.position) return;
    
    ctx.save();
    ctx.fillStyle = `rgba(255, 100, 0, ${1 - progress})`;
    ctx.beginPath();
    ctx.arc(config.position.x, config.position.y, 25 * (1 + progress * 0.5), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  /**
   * Draw explosion effect
   */
  drawExplosionEffect(ctx, config, progress) {
    if (!config.position) return;
    
    ctx.save();
    ctx.strokeStyle = `rgba(255, 150, 0, ${1 - progress})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(config.position.x, config.position.y, (config.radius || 50) * progress, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  /**
   * Initialize all new fun feature systems
   */
  async initializeNewSystems() {
    try {
      console.log('🌟 Initializing new fun feature systems...');
      
      // Import and initialize Achievement System
      const { AchievementSystem } = await import('../systems/achievementSystem.js');
      this.achievementSystem = new AchievementSystem(this);
      
      // Import and initialize Player Ability System
      const { PlayerAbilitySystem } = await import('../systems/playerAbilitySystem.js');
      this.playerAbilitySystem = new PlayerAbilitySystem(this);
      
      // Import and initialize Boss Battle System
      const { BossBattleSystem } = await import('../systems/bossBattleSystem.js');
      this.bossBattleSystem = new BossBattleSystem(this);
      
      // Import and initialize Loadout System
      const { LoadoutSystem } = await import('../systems/loadoutSystem.js');
      this.loadoutSystem = new LoadoutSystem(this);
      
      // Import and initialize Environmental System
      const { EnvironmentalSystem } = await import('../systems/environmentalSystem.js');
      this.environmentalSystem = new EnvironmentalSystem(this);
      
      console.log('✅ All new fun feature systems initialized successfully!');
    } catch (error) {
      console.error('❌ Error initializing new systems:', error);
      // Continue without the systems if they fail to load
    }
  }

  /**
   * Get the current player count (player + remaining mobs)
   * @returns {number} Current player count
   */
  getPlayerCount() {
    // The player counts as 1, plus all remaining mobs
    return this.mobs.length + (this.player.isDead ? 0 : 1);
  }
}
