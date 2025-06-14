// SaveManager.js
// Enhanced save/load functionality with versioning and error handling

import { Storage } from '../src/systems/storage.js';

export class SaveManager {
  constructor(saveKey = 'bloxyRivalsSave') {
    this.storage = new Storage(saveKey);
    this.saveVersion = '1.0';
    this.autoSaveInterval = 30000; // 30 seconds
    this.autoSaveTimer = null;
    this.lastSaveTime = 0;
    
    // Save data validation schema
    this.schema = {
      version: 'string',
      timestamp: 'number',
      world: 'object',
      player: 'object',
      entities: 'object',
      score: 'object',
      settings: 'object'
    };
  }

  /**
   * Enable automatic saving
   * @param {Function} collectDataFn - Function that returns data to save
   * @param {number} interval - Auto-save interval in milliseconds
   */
  enableAutoSave(collectDataFn, interval = this.autoSaveInterval) {
    this.disableAutoSave(); // Clear any existing timer
    
    this.autoSaveTimer = setInterval(() => {
      try {
        const data = collectDataFn();
        this.saveGame(data, true); // true = isAutoSave
      } catch (error) {
        console.warn('Auto-save failed:', error);
      }
    }, interval);
    
    console.log(`Auto-save enabled with ${interval / 1000}s interval`);
  }

  /**
   * Disable automatic saving
   */
  disableAutoSave() {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
      console.log('Auto-save disabled');
    }
  }

  /**
   * Save game data
   * @param {Object} gameData - Game data to save
   * @param {boolean} isAutoSave - Whether this is an automatic save
   * @returns {boolean} Success status
   */
  saveGame(gameData, isAutoSave = false) {
    try {
      const saveData = this._prepareSaveData(gameData);
      
      // Validate data before saving
      if (!this._validateSaveData(saveData)) {
        throw new Error('Save data validation failed');
      }

      this.storage.save(saveData);
      this.lastSaveTime = Date.now();
      
      if (!isAutoSave) {
        console.log('Game saved successfully');
      }
      
      return true;
    } catch (error) {
      console.error('Failed to save game:', error);
      return false;
    }
  }

  /**
   * Load game data
   * @returns {Object|null} Loaded game data or null if failed/not found
   */
  loadGame() {
    try {
      const saveData = this.storage.load();
      
      if (!saveData) {
        console.log('No save data found');
        return null;
      }

      // Validate loaded data
      if (!this._validateSaveData(saveData)) {
        console.warn('Save data validation failed, data may be corrupted');
        return null;
      }

      // Check version compatibility
      if (!this._isVersionCompatible(saveData.version)) {
        console.warn('Save data version incompatible, migration may be needed');
        saveData = this._migrateSaveData(saveData);
      }

      console.log('Game loaded successfully');
      return saveData;
    } catch (error) {
      console.error('Failed to load game:', error);
      return null;
    }
  }

  /**
   * Create a backup of current save data
   * @returns {boolean} Success status
   */
  createBackup() {
    try {
      const currentData = this.storage.load();
      if (!currentData) {
        console.warn('No data to backup');
        return false;
      }

      const backupKey = `${this.storage.key}_backup_${Date.now()}`;
      const backupStorage = new Storage(backupKey);
      backupStorage.save(currentData);
      
      console.log('Backup created:', backupKey);
      return true;
    } catch (error) {
      console.error('Failed to create backup:', error);
      return false;
    }
  }

  /**
   * Check if save data exists
   * @returns {boolean} Whether save data exists
   */
  hasSaveData() {
    const data = this.storage.load();
    return data !== null && Object.keys(data).length > 0;
  }

  /**
   * Get save data metadata
   * @returns {Object|null} Save metadata or null if no save exists
   */
  getSaveMetadata() {
    const data = this.storage.load();
    if (!data) return null;

    return {
      version: data.version || 'unknown',
      timestamp: data.timestamp || 0,
      lastModified: new Date(data.timestamp || 0).toLocaleString(),
      sizeEstimate: JSON.stringify(data).length,
      hasWorld: !!data.world,
      hasPlayer: !!data.player,
      hasEntities: !!data.entities,
      hasScore: !!data.score
    };
  }

  /**
   * Clear all save data
   * @returns {boolean} Success status
   */
  clearSaveData() {
    try {
      this.storage.clear();
      console.log('Save data cleared');
      return true;
    } catch (error) {
      console.error('Failed to clear save data:', error);
      return false;
    }
  }

  /**
   * Export save data as JSON string
   * @returns {string|null} JSON string or null if failed
   */
  exportSaveData() {
    try {
      const data = this.storage.load();
      if (!data) return null;
      
      return JSON.stringify(data, null, 2);
    } catch (error) {
      console.error('Failed to export save data:', error);
      return null;
    }
  }

  /**
   * Import save data from JSON string
   * @param {string} jsonData - JSON string containing save data
   * @returns {boolean} Success status
   */
  importSaveData(jsonData) {
    try {
      const data = JSON.parse(jsonData);
      
      if (!this._validateSaveData(data)) {
        throw new Error('Invalid save data format');
      }

      this.storage.save(data);
      console.log('Save data imported successfully');
      return true;
    } catch (error) {
      console.error('Failed to import save data:', error);
      return false;
    }
  }

  /**
   * Prepare game data for saving
   * @private
   * @param {Object} gameData - Raw game data
   * @returns {Object} Prepared save data
   */
  _prepareSaveData(gameData) {
    return {
      version: this.saveVersion,
      timestamp: Date.now(),
      world: gameData.world?.serialize() || null,
      player: gameData.player?.serialize() || null,
      entities: gameData.entities?.serialize() || null,
      score: gameData.scoreManager?.serialize() || null,
      settings: gameData.settings || {}
    };
  }

  /**
   * Validate save data structure
   * @private
   * @param {Object} data - Data to validate
   * @returns {boolean} Whether data is valid
   */
  _validateSaveData(data) {
    if (!data || typeof data !== 'object') {
      return false;
    }

    // Check required fields
    for (const [key, expectedType] of Object.entries(this.schema)) {
      if (key === 'version' || key === 'timestamp') {
        if (!(key in data) || typeof data[key] !== expectedType) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Check if save version is compatible
   * @private
   * @param {string} version - Save data version
   * @returns {boolean} Whether version is compatible
   */
  _isVersionCompatible(version) {
    // For now, only exact matches are compatible
    return version === this.saveVersion;
  }

  /**
   * Migrate save data to current version
   * @private
   * @param {Object} saveData - Old save data
   * @returns {Object} Migrated save data
   */
  _migrateSaveData(saveData) {
    console.log(`Migrating save data from ${saveData.version} to ${this.saveVersion}`);
    
    // Add migration logic here as versions evolve
    const migrated = { ...saveData };
    migrated.version = this.saveVersion;
    migrated.timestamp = Date.now();
    
    return migrated;
  }

  /**
   * Get time since last save
   * @returns {number} Milliseconds since last save
   */
  getTimeSinceLastSave() {
    return Date.now() - this.lastSaveTime;
  }

  /**
   * Check if auto-save is enabled
   * @returns {boolean} Whether auto-save is active
   */
  isAutoSaveEnabled() {
    return this.autoSaveTimer !== null;
  }

  /**
   * Destroy the save manager
   */
  destroy() {
    this.disableAutoSave();
  }
}
