// GameRefactored.js
// Refactored Game class using modular manager system

import { characters } from '../data/characterData.js';
import { Player } from '../entities/player.js';
import { Controls } from '../systems/controls.js';
import { World } from '../core/world.js';
import { Camera } from '../core/camera.js';
import { WeatherSystem } from '../systems/weather.js';
import { MedalSystem } from '../systems/medalSystem.js';
import { SpriteManager } from '../systems/SpriteManager.js';

// Import managers
import { GameStateManager } from '../../managers/GameStateManager.js';
import { EntityManager } from '../../managers/EntityManager.js';
import { ScoreManager } from '../../managers/ScoreManager.js';
import { RenderManager } from '../../managers/RenderManager.js';
import { SaveManager } from '../../managers/SaveManager.js';

export class GameRefactored {
  constructor(canvasId, selectedCharacterId = 0, pauseCallback = () => {}, gameOverCallback = () => {}) {
    // Initialize canvas
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) throw new Error(`Canvas "${canvasId}" not found.`);
    this.ctx = this.canvas.getContext('2d');
    this.canvas.width = 1000;
    this.canvas.height = 800;

    // Store callbacks
    this.pauseCallback = pauseCallback;
    this.gameOverCallback = gameOverCallback;    // Initialize character and player
    const character = characters.find(c => c.id === selectedCharacterId) || characters[0];
    this.selectedCharacterId = character.id;

    // Initialize sprite manager
    this.spriteManager = new SpriteManager();

    // Initialize core game objects
    this.player = new Player(100, 100, 64, 64, character.sprite, () => this.onPlayerDeath(), this.spriteManager, character.id);
    this.world = new World();
    this.camera = new Camera(this.canvas, this.world.width, this.world.height, this.player);
    this.weatherSystem = new WeatherSystem(this.canvas, this.world);

    // Initialize managers
    this._initializeManagers();

    // Initialize controls
    this.controls = new Controls(
      this.player, 
      this.canvas, 
      this.entityManager.getMobs(), 
      (mob, damage, x, y) => this.entityManager.onMobDamaged(mob, damage, x, y), 
      this.camera
    );

    // Bind main loop
    this.loop = this.loop.bind(this);
  }
  /**
   * Initialize all manager instances
   * @private
   */
  _initializeManagers() {
    // Game State Manager
    this.stateManager = new GameStateManager({
      onStateChange: (oldState, newState) => this._onStateChange(oldState, newState),
      onPause: () => this._onPause(),
      onResume: () => this._onResume(),
      onGameOver: () => this._onGameOver()
    });

    // Medal System
    this.medalSystem = new MedalSystem();    // Entity Manager
    this.entityManager = new EntityManager(this.world, this.player, this.spriteManager);
    this.entityManager.setCallbacks({
      onMobKilled: (mob, points) => this._onMobKilled(mob, points),
      onPlayerDamaged: (damage) => this._onPlayerDamaged(damage),
      onMobDamaged: (mob, damage, x, y) => this._onMobDamaged(mob, damage, x, y)
    });

    // Score Manager
    this.scoreManager = new ScoreManager();
    this.scoreManager.setMedalSystemRef(this.medalSystem);

    // Render Manager
    this.renderManager = new RenderManager(this.canvas, this.ctx);

    // Save Manager
    this.saveManager = new SaveManager();
    this.saveManager.enableAutoSave(() => this._collectSaveData());
  }  /**
   * Initialize the game
   * @param {boolean} loadExisting - Whether to load existing save data
   */
  async init(loadExisting = false) {
    this.stateManager.initialize();

    // Preload character sprites with directional variants
    try {
      await this.spriteManager.preloadCharacterSprites(characters);
      console.log('All character sprites loaded successfully');
    } catch (error) {
      console.warn('Some character sprites failed to load, continuing with fallbacks:', error);
    }

    // Preload mob sprites
    try {
      await this.spriteManager.loadSpriteWithDirections('assets/mobs/boss.png', 'boss');
      console.log('Mob sprites loaded successfully');
    } catch (error) {
      console.warn('Some mob sprites failed to load, continuing with fallbacks:', error);
    }

    if (loadExisting) {
      this._loadGame();
    }

    // Initialize entities
    this.entityManager.initialize();

    // Setup camera
    this.camera.worldWidth = this.world.width;
    this.camera.worldHeight = this.world.height;

    // Start the game
    this.stateManager.enableKeyboardHandling();
    this.stateManager.start();
    this.scoreManager.startNewGame();
    
    requestAnimationFrame(this.loop);
  }

  /**
   * Main game loop
   * @param {number} timestamp - Current timestamp
   */
  loop(timestamp) {
    if (!this.stateManager.isInState('playing')) return;

    const delta = this.stateManager.updateTime(timestamp);

    // Update game logic
    this._updateGame(delta);

    // Render everything
    this._renderGame(delta);

    // Continue loop
    requestAnimationFrame(this.loop);
  }
  /**
   * Update game logic
   * @private
   * @param {number} delta - Time delta
   */
  _updateGame(delta) {
    const updateStart = performance.now();
    
    // Check for player damage flash
    if (this.player.health < this.prevHealth) {
      this.renderManager.triggerDamageFlash();
      this.scoreManager.addDamageTaken(this.prevHealth - this.player.health);
    }
    this.prevHealth = this.player.health;

    // Update controls
    this.controls.update();

    // Update entities
    this.entityManager.update(delta);    // Update weather system
    this.weatherSystem.update(delta, this.player, this.entityManager.getMobs());

    // Update medal system
    this.medalSystem.update(delta, this.player, { 
      width: this.canvas.width, 
      height: this.canvas.height 
    });

    // Update world
    this.world.update(delta);

    // Update controls with current mobs
    this.controls.mobs = this.entityManager.getMobs();
    
    // Record update timing
    this.renderManager.recordUpdateTime(updateStart);
  }
  /**
   * Render the game
   * @private
   * @param {number} delta - Time delta
   */
  _renderGame(delta) {
    const renderStart = performance.now();    // Render main game
    this.renderManager.renderGame({
      world: this.world,
      entities: this.entityManager,
      camera: this.camera,
      weatherSystem: this.weatherSystem,
      controls: this.controls,
      medalSystem: this.medalSystem,
      spriteManager: this.spriteManager
    });

    // Render UI
    this.renderManager.renderUI({
      scoreManager: this.scoreManager,
      player: this.player,
      controls: this.controls,
      entities: this.entityManager,
      medalSystem: this.medalSystem
    }, delta);
    
    // Record render timing
    this.renderManager.recordRenderTime(renderStart);
  }

  /**
   * Pause the game
   */
  pause() {
    this.stateManager.pause();
  }

  /**
   * Resume the game
   */
  resume() {
    this.stateManager.resume();
  }

  /**
   * Save the game
   * @returns {boolean} Success status
   */
  save() {
    const data = this._collectSaveData();
    return this.saveManager.saveGame(data);
  }

  /**
   * Exit to menu
   */
  exitToMenu() {
    this.save();
    this.destroy();
    window.location.reload();
  }

  /**
   * Destroy the game instance
   */
  destroy() {
    this.stateManager.destroy();
    this.saveManager.destroy();
    this.scoreManager.endGame();
    
    if (this.controls) {
      this.controls.destroy();
    }
  }

  /**
   * Handle state changes
   * @private
   */
  _onStateChange(oldState, newState) {
    console.log(`Game state: ${oldState} -> ${newState}`);
  }

  /**
   * Handle pause event
   * @private
   */
  _onPause() {
    if (this.controls) {
      this.controls.destroy();
    }
    this.pauseCallback(this.selectedCharacterId);
  }

  /**
   * Handle resume event
   * @private
   */
  _onResume() {
    this.controls = new Controls(
      this.player, 
      this.canvas, 
      this.entityManager.getMobs(), 
      (mob, damage, x, y) => this.entityManager.onMobDamaged(mob, damage, x, y), 
      this.camera
    );
    this.stateManager.enableKeyboardHandling();
    requestAnimationFrame(this.loop);
  }

  /**
   * Handle game over event
   * @private
   */
  _onGameOver() {
    if (this.controls) {
      this.controls.destroy();
    }
    this.scoreManager.endGame();
    this.gameOverCallback(this.selectedCharacterId);
  }

  /**
   * Handle player death
   * @private
   */
  onPlayerDeath() {
    this.stateManager.gameOver();
  }

  /**
   * Handle mob being killed
   * @private
   */
  _onMobKilled(mob, points) {
    this.scoreManager.addKill(mob);
  }

  /**
   * Handle player taking damage
   * @private
   */
  _onPlayerDamaged(damage) {
    this.renderManager.triggerDamageFlash();
    this.scoreManager.addDamageTaken(damage);
  }

  /**
   * Handle mob taking damage
   * @private
   */
  _onMobDamaged(mob, damage, x, y) {
    this.scoreManager.addDamageDealt(damage);
  }
  /**
   * Load game from save data
   * @private
   */
  _loadGame() {
    const saveData = this.saveManager.loadGame();
    if (!saveData) return;

    try {
      if (saveData.world) {
        this.world.load(saveData.world);
      }
      
      if (saveData.entities) {
        this.entityManager.load(saveData.entities);
      }
      
      if (saveData.score) {
        this.scoreManager.load(saveData.score);
      }
      
      if (saveData.medalSystem) {
        this.medalSystem.load(saveData.medalSystem);
      }
      
      console.log('Game loaded successfully');
    } catch (error) {
      console.error('Error loading game:', error);
    }
  }
  /**
   * Collect data for saving
   * @private
   * @returns {Object} Save data
   */
  _collectSaveData() {
    return {
      world: this.world,
      player: this.player,
      entities: this.entityManager,
      scoreManager: this.scoreManager,
      medalSystem: this.medalSystem,
      settings: {
        selectedCharacterId: this.selectedCharacterId,
        renderOptions: this.renderManager.options
      }
    };
  }

  /**
   * Get game statistics
   * @returns {Object} Current game statistics
   */
  getStats() {
    return this.scoreManager.getStats();
  }

  /**
   * Get save metadata
   * @returns {Object|null} Save metadata
   */
  getSaveMetadata() {
    return this.saveManager.getSaveMetadata();
  }

  /**
   * Enable debug mode
   * @param {boolean} enabled - Whether to enable debug mode
   */
  setDebugMode(enabled) {
    this.renderManager.setDebugMode(enabled);
  }

  // Store previous health for damage detection
  prevHealth = this.player?.health || 100;
}
