// RankingSystem.js - Modular ranking and leaderboard system

export class RankingSystem {
  constructor() {
    this.rankings = this._loadRankings();
    this.currentSession = null;
  }

  /**
   * Start a new ranking session
   * @param {string} gameMode - Game mode type
   * @param {Object} config - Game mode configuration
   */
  startSession(gameMode = 'time_based', config = {}) {
    this.currentSession = {
      gameMode,
      config,
      startTime: Date.now(),
      endTime: null,
      stats: {
        score: 0,
        kills: 0,
        damageDealt: 0,
        damageTaken: 0,
        timeSurvived: 0,
        powerUpsCollected: 0,
        bossesDefeated: 0
      },
      performance: {
        pointsPerMinute: 0,
        killsPerMinute: 0,
        efficiencyRating: 'Rookie',
        survivalTime: 0
      }
    };
    
    console.log(`🏆 Ranking session started for mode: ${gameMode}`);
  }

  /**
   * Update session stats
   * @param {Object} stats - Updated statistics
   */
  updateStats(stats) {
    if (!this.currentSession) {
      console.warn('⚠️ No active ranking session to update');
      return;
    }

    this.currentSession.stats = { ...this.currentSession.stats, ...stats };
  }

  /**
   * End the current ranking session
   * @param {Object} finalStats - Final game statistics
   * @returns {Object} Ranking results
   */
  endSession(finalStats = {}) {
    if (!this.currentSession) {
      console.warn('⚠️ No active ranking session to end');
      return null;
    }

    this.currentSession.endTime = Date.now();
    this.currentSession.stats = { ...this.currentSession.stats, ...finalStats };
    
    // Calculate performance metrics
    this._calculatePerformance();
    
    // Add to rankings
    const rankingEntry = this._createRankingEntry();
    this._addToRankings(rankingEntry);
    
    // Save rankings
    this._saveRankings();
    
    const results = {
      entry: rankingEntry,
      rankings: this.getRankings(this.currentSession.gameMode),
      rank: this._getCurrentRank(rankingEntry)
    };
    
    console.log(`🏁 Ranking session ended with rank: ${results.rank}`);
    
    // Clear current session
    this.currentSession = null;
    
    return results;
  }

  /**
   * Calculate performance metrics for current session
   * @private
   */
  _calculatePerformance() {
    const session = this.currentSession;
    const timeSurvived = (session.endTime - session.startTime) / 1000; // seconds
    const timeMinutes = timeSurvived / 60;
    
    session.stats.timeSurvived = timeSurvived;
    
    // Calculate performance metrics
    session.performance = {
      pointsPerMinute: timeMinutes > 0 ? Math.round((session.stats.score / timeMinutes) * 100) / 100 : 0,
      killsPerMinute: timeMinutes > 0 ? Math.round((session.stats.kills / timeMinutes) * 100) / 100 : 0,
      efficiencyRating: this._calculateEfficiencyRating(session.stats),
      survivalTime: timeSurvived
    };
  }

  /**
   * Calculate efficiency rating based on performance
   * @private
   * @param {Object} stats - Game statistics
   * @returns {string} Efficiency rating
   */
  _calculateEfficiencyRating(stats) {
    if (stats.kills === 0) {
      return 'Rookie';
    }

    const damageEfficiency = stats.damageDealt / Math.max(stats.damageTaken, 1);
    const pointsPerKill = stats.score / stats.kills;
    const survivalMinutes = stats.timeSurvived / 60;

    // Advanced rating system
    if (damageEfficiency > 4 && pointsPerKill > 200 && survivalMinutes > 2.5) {
      return 'Legendary';
    } else if (damageEfficiency > 3 && pointsPerKill > 150 && survivalMinutes > 2) {
      return 'Master';
    } else if (damageEfficiency > 2 && pointsPerKill > 120 && survivalMinutes > 1.5) {
      return 'Expert';
    } else if (damageEfficiency > 1.5 && pointsPerKill > 100 && survivalMinutes > 1) {
      return 'Skilled';
    } else if (damageEfficiency > 1 && pointsPerKill > 80) {
      return 'Apprentice';
    } else {
      return 'Rookie';
    }
  }

  /**
   * Create a ranking entry from current session
   * @private
   * @returns {Object} Ranking entry
   */
  _createRankingEntry() {
    const session = this.currentSession;
    return {
      id: Date.now().toString(),
      timestamp: session.endTime,
      gameMode: session.gameMode,
      score: session.stats.score,
      kills: session.stats.kills,
      timeSurvived: session.stats.timeSurvived,
      damageDealt: session.stats.damageDealt,
      damageTaken: session.stats.damageTaken,
      powerUpsCollected: session.stats.powerUpsCollected,
      bossesDefeated: session.stats.bossesDefeated,
      performance: session.performance,
      date: new Date(session.endTime).toLocaleDateString(),
      time: new Date(session.endTime).toLocaleTimeString()
    };
  }

  /**
   * Add entry to rankings
   * @private
   * @param {Object} entry - Ranking entry to add
   */
  _addToRankings(entry) {
    const modeKey = entry.gameMode;
    
    if (!this.rankings[modeKey]) {
      this.rankings[modeKey] = [];
    }
    
    this.rankings[modeKey].push(entry);
    
    // Sort by score (highest first)
    this.rankings[modeKey].sort((a, b) => b.score - a.score);
    
    // Keep only top 50 entries per mode
    this.rankings[modeKey] = this.rankings[modeKey].slice(0, 50);
  }

  /**
   * Get current rank for an entry
   * @private
   * @param {Object} entry - Ranking entry
   * @returns {number} Current rank (1-based)
   */
  _getCurrentRank(entry) {
    const modeRankings = this.rankings[entry.gameMode] || [];
    const rank = modeRankings.findIndex(r => r.id === entry.id) + 1;
    return rank || modeRankings.length + 1;
  }

  /**
   * Get rankings for a specific game mode
   * @param {string} gameMode - Game mode to get rankings for
   * @param {number} limit - Maximum number of entries to return
   * @returns {Array} Array of ranking entries
   */
  getRankings(gameMode = 'time_based', limit = 10) {
    const modeRankings = this.rankings[gameMode] || [];
    return modeRankings.slice(0, limit).map((entry, index) => ({
      ...entry,
      rank: index + 1
    }));
  }

  /**
   * Get all rankings
   * @returns {Object} All rankings by game mode
   */
  getAllRankings() {
    return this.rankings;
  }

  /**
   * Clear all rankings
   */
  clearRankings() {
    this.rankings = {};
    this._saveRankings();
    console.log('🗑️ All rankings cleared');
  }

  /**
   * Get personal best for a game mode
   * @param {string} gameMode - Game mode
   * @returns {Object|null} Personal best entry
   */
  getPersonalBest(gameMode = 'time_based') {
    const modeRankings = this.rankings[gameMode] || [];
    return modeRankings.length > 0 ? modeRankings[0] : null;
  }

  /**
   * Get statistics for a game mode
   * @param {string} gameMode - Game mode
   * @returns {Object} Statistics summary
   */
  getStats(gameMode = 'time_based') {
    const modeRankings = this.rankings[gameMode] || [];
    
    if (modeRankings.length === 0) {
      return {
        totalGames: 0,
        averageScore: 0,
        averageKills: 0,
        averageSurvivalTime: 0,
        bestScore: 0,
        bestEfficiency: 'Rookie'
      };
    }

    const totalGames = modeRankings.length;
    const totalScore = modeRankings.reduce((sum, entry) => sum + entry.score, 0);
    const totalKills = modeRankings.reduce((sum, entry) => sum + entry.kills, 0);
    const totalSurvivalTime = modeRankings.reduce((sum, entry) => sum + entry.timeSurvived, 0);
    
    const bestEntry = modeRankings[0];
    
    return {
      totalGames,
      averageScore: Math.round(totalScore / totalGames),
      averageKills: Math.round((totalKills / totalGames) * 100) / 100,
      averageSurvivalTime: Math.round((totalSurvivalTime / totalGames) * 100) / 100,
      bestScore: bestEntry.score,
      bestEfficiency: bestEntry.performance.efficiencyRating
    };
  }

  /**
   * Load rankings from localStorage
   * @private
   * @returns {Object} Loaded rankings
   */
  _loadRankings() {
    try {
      const stored = localStorage.getItem('bloxy_rivals_rankings');
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('❌ Failed to load rankings:', error);
      return {};
    }
  }

  /**
   * Save rankings to localStorage
   * @private
   */
  _saveRankings() {
    try {
      localStorage.setItem('bloxy_rivals_rankings', JSON.stringify(this.rankings));
      console.log('💾 Rankings saved successfully');
    } catch (error) {
      console.error('❌ Failed to save rankings:', error);
    }
  }

  /**
   * Format time for display
   * @param {number} seconds - Time in seconds
   * @returns {string} Formatted time string
   */
  formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  /**
   * Export rankings data
   * @returns {string} JSON string of all rankings
   */
  exportData() {
    return JSON.stringify(this.rankings, null, 2);
  }

  /**
   * Import rankings data
   * @param {string} jsonData - JSON string of rankings data
   */
  importData(jsonData) {
    try {
      const data = JSON.parse(jsonData);
      this.rankings = data;
      this._saveRankings();
      console.log('📥 Rankings data imported successfully');
    } catch (error) {
      console.error('❌ Failed to import rankings data:', error);
    }
  }
}
