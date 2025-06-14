// config/GameConfig.js
// Centralized game configuration and constants

/**
 * Game settings and constants
 */
export const GameConfig = {
  // Canvas settings
  CANVAS: {
    WIDTH: 1000,
    HEIGHT: 800,
    DEFAULT_ID: 'gameCanvas'
  },

  // World settings
  WORLD: {
    DEFAULT_TILE_SIZE: 64,
    DEFAULT_COLS: 20,
    DEFAULT_ROWS: 15
  },

  // Player settings
  PLAYER: {
    DEFAULT_WIDTH: 64,
    DEFAULT_HEIGHT: 64,
    DEFAULT_SPEED: 200,
    DEFAULT_HEALTH: 100,
    SPAWN_X: 100,
    SPAWN_Y: 100,
    LOW_HEALTH_THRESHOLD: 0.3 // 30% health
  },

  // Entity settings
  ENTITIES: {
    MAX_MOBS: 14,
    MIN_SPAWN_DISTANCE: 150, // Minimum distance from player
    DEFAULT_MOB_HEALTH: 50,
    DEFAULT_MOB_SPEED: 60,
    DEFAULT_MOB_DAMAGE: 10,
    DEFAULT_MOB_SIZE: 48
  },

  // Scoring settings
  SCORE: {
    KILL_BASE_POINTS: 100,
    TIME_MULTIPLIER_MAX: 3.0,
    TIME_MULTIPLIER_RATE: 0.1, // Per minute
    HIGH_HEALTH_BONUS_DIVISOR: 10,
    FAST_MOB_BONUS: 50,
    FAST_MOB_THRESHOLD: 80
  },

  // Visual effects settings
  EFFECTS: {
    DAMAGE_FLASH_DURATION: 200,
    LOW_HEALTH_PULSE_SPEED: 5,
    LOW_HEALTH_PULSE_ALPHA: 0.2
  },

  // Auto-save settings
  SAVE: {
    AUTO_SAVE_INTERVAL: 30000, // 30 seconds
    SAVE_VERSION: '1.0',
    DEFAULT_SAVE_KEY: 'bloxyRivalsSave',
    BACKUP_KEY_PREFIX: 'bloxyRivalsBackup'
  },

  // Performance settings
  PERFORMANCE: {
    MAX_DELTA: 50, // Maximum frame delta in ms
    FPS_HISTORY_SIZE: 60,
    TARGET_FPS: 60
  },

  // Controls settings
  CONTROLS: {
    JOYSTICK_SIZE: 80,
    JOYSTICK_DEADZONE: 0.1,
    ATTACK_RANGE: 64
  },

  // Weather settings
  WEATHER: {
    CHANGE_INTERVAL: 30000, // 30 seconds
    EFFECTS_ENABLED: true
  },

  // UI settings
  UI: {
    SCORE_FONT: 'bold 16px Arial',
    DEBUG_FONT: '12px monospace',
    TITLE_FONT: 'bold 48px Arial',
    SUBTITLE_FONT: 'bold 20px Arial',
    MARGIN: 10,
    SCORE_POSITION: { x: 10, y: 30 },
    KILLS_POSITION: { x: 10, y: 55 },
    HIGH_SCORE_POSITION: { x: 10, y: 80 },
    TIME_POSITION: { x: 10, y: 105 }
  },

  // Colors
  COLORS: {
    BACKGROUND: '#1C7ED6',
    DAMAGE_FLASH: '#FF0000',
    LOW_HEALTH_PULSE: '#FF0000',
    SCORE_TEXT: '#FFFFFF',
    SCORE_OUTLINE: '#000000',
    DEBUG_TEXT: '#FFFF00',
    HEALTH_HIGH: '#00FF00',
    HEALTH_MEDIUM: '#FFFF00',
    HEALTH_LOW: '#FF0000',
    DAMAGE_NUMBER: '#ff0000',
    SCORE_NUMBER: '#00ff00'
  },

  // Game states
  STATES: {
    LOADING: 'loading',
    INITIALIZING: 'initializing',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAME_OVER: 'gameover',
    DESTROYED: 'destroyed'
  },

  // Audio settings (if audio is added later)
  AUDIO: {
    MASTER_VOLUME: 0.7,
    SFX_VOLUME: 0.8,
    MUSIC_VOLUME: 0.5,
    ENABLED: true
  },

  // Debug settings
  DEBUG: {
    SHOW_COLLISION_BOXES: false,
    SHOW_FPS: false,
    SHOW_ENTITY_COUNT: false,
    SHOW_PLAYER_INFO: false,
    LOG_STATE_CHANGES: true,
    LOG_SCORE_CHANGES: false
  }
};

/**
 * Game difficulty settings
 */
export const DifficultyConfig = {
  EASY: {
    name: 'Easy',
    mobSpeedMultiplier: 0.8,
    mobHealthMultiplier: 0.8,
    mobDamageMultiplier: 0.7,
    scoreMultiplier: 0.8,
    maxMobs: 8
  },
  
  NORMAL: {
    name: 'Normal',
    mobSpeedMultiplier: 1.0,
    mobHealthMultiplier: 1.0,
    mobDamageMultiplier: 1.0,
    scoreMultiplier: 1.0,
    maxMobs: 14
  },
  
  HARD: {
    name: 'Hard',
    mobSpeedMultiplier: 1.3,
    mobHealthMultiplier: 1.2,
    mobDamageMultiplier: 1.4,
    scoreMultiplier: 1.5,
    maxMobs: 20
  },
  
  NIGHTMARE: {
    name: 'Nightmare',
    mobSpeedMultiplier: 1.6,
    mobHealthMultiplier: 1.5,
    mobDamageMultiplier: 1.8,
    scoreMultiplier: 2.0,
    maxMobs: 28
  }
};

/**
 * Control schemes
 */
export const ControlConfig = {
  KEYBOARD: {
    MOVE_UP: ['KeyW', 'ArrowUp'],
    MOVE_DOWN: ['KeyS', 'ArrowDown'],
    MOVE_LEFT: ['KeyA', 'ArrowLeft'],
    MOVE_RIGHT: ['KeyD', 'ArrowRight'],
    ATTACK: ['Space', 'Enter'],
    PAUSE: ['Escape'],
    DEBUG_TOGGLE: ['F3']
  },
  
  GAMEPAD: {
    MOVE_THRESHOLD: 0.2,
    ATTACK_BUTTON: 0, // A button on Xbox controller
    PAUSE_BUTTON: 9   // Menu button on Xbox controller
  }
};

/**
 * Animation presets
 */
export const AnimationConfig = {
  DAMAGE_NUMBER: {
    DURATION: 1000,
    RISE_DISTANCE: 30,
    FADE_START: 0.7 // Start fading at 70% of duration
  },
  
  HEALTH_BAR: {
    SHOW_DURATION: 3000,
    FADE_DURATION: 500
  },
  
  MENU_TRANSITION: {
    DURATION: 300,
    EASING: 'easeInOut'
  }
};

/**
 * Responsive design breakpoints
 */
export const ResponsiveConfig = {
  MOBILE: {
    MAX_WIDTH: 768,
    SHOW_JOYSTICK: true,
    BUTTON_SIZE_MULTIPLIER: 1.2
  },
  
  TABLET: {
    MIN_WIDTH: 769,
    MAX_WIDTH: 1024,
    SHOW_JOYSTICK: true,
    BUTTON_SIZE_MULTIPLIER: 1.1
  },
  
  DESKTOP: {
    MIN_WIDTH: 1025,
    SHOW_JOYSTICK: false,
    BUTTON_SIZE_MULTIPLIER: 1.0
  }
};

/**
 * Configuration utilities
 */
export const ConfigUtils = {
  /**
   * Get current device type based on screen size
   * @returns {string} Device type ('mobile', 'tablet', 'desktop')
   */
  getDeviceType() {
    const width = window.innerWidth;
    if (width <= ResponsiveConfig.MOBILE.MAX_WIDTH) return 'mobile';
    if (width <= ResponsiveConfig.TABLET.MAX_WIDTH) return 'tablet';
    return 'desktop';
  },

  /**
   * Get responsive config for current device
   * @returns {Object} Responsive configuration
   */
  getResponsiveConfig() {
    const deviceType = this.getDeviceType();
    return ResponsiveConfig[deviceType.toUpperCase()];
  },

  /**
   * Merge user config with defaults
   * @param {Object} userConfig - User configuration
   * @param {Object} defaultConfig - Default configuration
   * @returns {Object} Merged configuration
   */
  mergeConfig(userConfig, defaultConfig) {
    return this.deepMerge(defaultConfig, userConfig);
  },

  /**
   * Deep merge two objects
   * @param {Object} target - Target object
   * @param {Object} source - Source object
   * @returns {Object} Merged object
   */
  deepMerge(target, source) {
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    
    return result;
  },

  /**
   * Validate configuration object
   * @param {Object} config - Configuration to validate
   * @param {Object} schema - Schema to validate against
   * @returns {boolean} Whether configuration is valid
   */
  validateConfig(config, schema) {
    for (const key in schema) {
      if (!(key in config)) {
        console.warn(`Missing config key: ${key}`);
        return false;
      }
      
      if (typeof config[key] !== typeof schema[key]) {
        console.warn(`Invalid config type for ${key}: expected ${typeof schema[key]}, got ${typeof config[key]}`);
        return false;
      }
    }
    
    return true;
  },

  /**
   * Get config value by path (e.g., 'PLAYER.DEFAULT_SPEED')
   * @param {string} path - Config path
   * @param {Object} config - Configuration object
   * @returns {*} Configuration value
   */
  getConfigValue(path, config = GameConfig) {
    return path.split('.').reduce((obj, key) => obj && obj[key], config);
  },

  /**
   * Set config value by path
   * @param {string} path - Config path
   * @param {*} value - Value to set
   * @param {Object} config - Configuration object
   */
  setConfigValue(path, value, config = GameConfig) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((obj, key) => obj[key] = obj[key] || {}, config);
    target[lastKey] = value;
  }
};
