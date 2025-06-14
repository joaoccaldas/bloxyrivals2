// ScoreManager.js
// Manages scoring, statistics, and achievements

export class ScoreManager {
  constructor() {
    this.score = 0;
    this.kills = 0;
    this.startTime = Date.now();
    this.totalPlayTime = 0;
    this.highScore = this._loadHighScore();
    
    // Medal system integration
    this.medalSystemRef = null;
    
    // Statistics tracking
    this.stats = {
      damageDealt: 0,
      damageTaken: 0,
      mobsKilled: 0,
      gamesPlayed: 0,
      totalScore: 0,
      medalPoints: 0,
      achievementPoints: 0
    };

    // Load existing stats
    this._loadStats();
  }

  /**
   * Add points to the score
   * @param {number} points - Points to add
   * @param {string} reason - Reason for scoring (optional)
   */
  addScore(points, reason = '') {
    this.score += points;
    this.stats.totalScore += points;
    
    // Check for new high score
    if (this.score > this.highScore) {
      this.highScore = this.score;
      this._saveHighScore();
    }

    console.log(`Score +${points} ${reason ? `(${reason})` : ''} - Total: ${this.score}`);
  }

  /**
   * Add a kill to the counter
   * @param {Object} mob - The mob that was killed (optional)
   */
  addKill(mob = null) {
    this.kills++;
    this.stats.mobsKilled++;
    
    // Different point values based on mob type/difficulty
    let points = 100;
    if (mob) {
      points = this._calculateKillPoints(mob);
    }
    
    this.addScore(points, 'mob kill');
  }

  /**
   * Calculate points for killing a mob
   * @private
   * @param {Object} mob - The mob that was killed
   * @returns {number} Points to award
   */
  _calculateKillPoints(mob) {
    let basePoints = 100;
    
    // Bonus for high-health mobs
    if (mob.maxHealth > 100) {
      basePoints += Math.floor(mob.maxHealth / 10);
    }
    
    // Bonus for fast mobs
    if (mob.speed > 80) {
      basePoints += 50;
    }
    
    // Time-based multiplier (longer survival = higher multiplier)
    const survivalMinutes = this.getPlayTimeMinutes();
    const timeMultiplier = Math.min(1 + (survivalMinutes * 0.1), 3.0);
    
    return Math.floor(basePoints * timeMultiplier);
  }

  /**
   * Record damage dealt by player
   * @param {number} damage - Amount of damage dealt
   */
  addDamageDealt(damage) {
    this.stats.damageDealt += damage;
  }

  /**
   * Record damage taken by player
   * @param {number} damage - Amount of damage taken
   */
  addDamageTaken(damage) {
    this.stats.damageTaken += damage;
  }

  /**
   * Get current score
   * @returns {number} Current score
   */
  getScore() {
    return this.score;
  }

  /**
   * Get current kill count
   * @returns {number} Current kills
   */
  getKills() {
    return this.kills;
  }

  /**
   * Get high score
   * @returns {number} High score
   */
  getHighScore() {
    return this.highScore;
  }

  /**
   * Get current play time in seconds
   * @returns {number} Play time in seconds
   */
  getPlayTimeSeconds() {
    return Math.floor((Date.now() - this.startTime) / 1000) + this.totalPlayTime;
  }

  /**
   * Get current play time in minutes
   * @returns {number} Play time in minutes
   */
  getPlayTimeMinutes() {
    return Math.floor(this.getPlayTimeSeconds() / 60);
  }

  /**
   * Get formatted play time string
   * @returns {string} Formatted play time (MM:SS)
   */
  getFormattedPlayTime() {
    const totalSeconds = this.getPlayTimeSeconds();
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  /**
   * Get all statistics
   * @returns {Object} Statistics object
   */
  getStats() {
    return {
      ...this.stats,
      currentScore: this.score,
      currentKills: this.kills,
      highScore: this.highScore,
      playTime: this.getPlayTimeSeconds(),
      playTimeFormatted: this.getFormattedPlayTime()
    };
  }

  /**
   * Reset current game scores (but preserve statistics)
   */
  reset() {
    this.score = 0;
    this.kills = 0;
    this.startTime = Date.now();
  }

  /**
   * Start a new game session
   */
  startNewGame() {
    this.reset();
    this.stats.gamesPlayed++;
    this._saveStats();
  }

  /**
   * End current game session
   */
  endGame() {
    this.totalPlayTime += Math.floor((Date.now() - this.startTime) / 1000);
    this._saveStats();
  }

  /**
   * Serialize score data for saving
   * @returns {Object} Serialized score data
   */
  serialize() {
    return {
      score: this.score,
      kills: this.kills,
      totalPlayTime: this.totalPlayTime + Math.floor((Date.now() - this.startTime) / 1000),
      stats: this.stats
    };
  }

  /**
   * Load score data from serialized object
   * @param {Object} data - Serialized score data
   */
  load(data) {
    this.score = data.score || 0;
    this.kills = data.kills || 0;
    this.totalPlayTime = data.totalPlayTime || 0;
    this.startTime = Date.now();
    
    if (data.stats) {
      this.stats = { ...this.stats, ...data.stats };
    }
  }

  /**
   * Save high score to localStorage
   * @private
   */
  _saveHighScore() {
    try {
      localStorage.setItem('bloxyRivalsHighScore', this.highScore.toString());
    } catch (e) {
      console.warn('Could not save high score:', e);
    }
  }

  /**
   * Load high score from localStorage
   * @private
   * @returns {number} High score
   */
  _loadHighScore() {
    try {
      const saved = localStorage.getItem('bloxyRivalsHighScore');
      return saved ? parseInt(saved, 10) : 0;
    } catch (e) {
      console.warn('Could not load high score:', e);
      return 0;
    }
  }

  /**
   * Save statistics to localStorage
   * @private
   */
  _saveStats() {
    try {
      localStorage.setItem('bloxyRivalsStats', JSON.stringify(this.stats));
    } catch (e) {
      console.warn('Could not save statistics:', e);
    }
  }

  /**
   * Load statistics from localStorage
   * @private
   */
  _loadStats() {
    try {
      const saved = localStorage.getItem('bloxyRivalsStats');
      if (saved) {
        this.stats = { ...this.stats, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('Could not load statistics:', e);
    }
  }

  /**
   * Set reference to medal system for integration
   * @param {MedalSystem} medalSystem - Medal system instance
   */
  setMedalSystemRef(medalSystem) {
    this.medalSystemRef = medalSystem;
    
    // Set up medal collection callback
    if (medalSystem) {
      medalSystem.setMedalCollectedCallback((type, points, totalPoints) => {
        this.onMedalCollected(type, points, totalPoints);
      });
      
      medalSystem.setAchievementUnlockedCallback((achievement) => {
        this.onAchievementUnlocked(achievement);
      });
    }
  }

  /**
   * Handle medal collection event
   * @param {string} medalType - Type of medal collected
   * @param {number} points - Points earned from medal
   * @param {number} totalMedalPoints - Total points from medals
   */
  onMedalCollected(medalType, points, totalMedalPoints) {
    // Add medal points to score (separate from regular score)
    this.stats.medalPoints = totalMedalPoints;
    
    // Optional: Add portion of medal points to main score
    const scoreBonus = Math.floor(points * 0.5); // 50% of medal points go to main score
    this.addScore(scoreBonus, `Medal Collection (${medalType})`);
    
    console.log(`🏅 Medal collected: ${medalType} (+${points} medal points, +${scoreBonus} score)`);
  }

  /**
   * Handle achievement unlock event
   * @param {Object} achievement - Achievement that was unlocked
   */
  onAchievementUnlocked(achievement) {
    this.stats.achievementPoints += achievement.reward;
    
    // Add achievement points to main score
    this.addScore(achievement.reward, `Achievement: ${achievement.name}`);
    
    console.log(`🏆 Achievement unlocked: ${achievement.name} (+${achievement.reward} points)`);
  }

  /**
   * Get total points including medals and achievements
   * @returns {number} Total combined points
   */
  getTotalPoints() {
    return this.score + this.stats.medalPoints + this.stats.achievementPoints;
  }

  /**
   * Get detailed score breakdown
   * @returns {Object} Score breakdown
   */
  getScoreBreakdown() {
    return {
      gameScore: this.score,
      medalPoints: this.stats.medalPoints,
      achievementPoints: this.stats.achievementPoints,
      totalPoints: this.getTotalPoints(),
      medalSystemStats: this.medalSystemRef ? this.medalSystemRef.getStatistics() : null
    };
  }
}
