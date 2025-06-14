// pointSystem.js

export class PointSystem {
  constructor(config = {}) {
    this.points = 0;
    this.kills = 0;
    this.multiplier = 1; // Overall multiplier (e.g., from game mode)
    this.pointsPerMob = config.pointsPerMob || 100; // Default points per mob
    this.onPointUpdate = config.onPointUpdate || function() {};
  }

  /**
   * Set the scoring multiplier (e.g., from game modes)
   * @param {number} multiplier - The multiplier to apply to points
   */
  setMultiplier(multiplier) {
    this.multiplier = multiplier;
  }

  /**
   * Call this when a mob is eliminated
   * @param {number} count - Number of mobs eliminated at once (default is 1)
   */
  addKill(count = 1, basePointsPerKill = this.pointsPerMob) {
    this.kills += count;
    const earnedPoints = Math.floor(basePointsPerKill * this.multiplier * count);
    this.points += earnedPoints;

    // Notify any listeners
    this.onPointUpdate(this.points, this.kills, earnedPoints);
    
    return earnedPoints; // Return actual points earned for display
  }

  /**
   * Get current points
   * @returns {number}
   */
  getPoints() {
    return this.points;
  }

  /**
   * Get total number of kills
   * @returns {number}
   */
  getKills() {
    return this.kills;
  }

  /**
   * Get current multiplier
   * @returns {number}
   */
  getMultiplier() {
    return this.multiplier;
  }

  /**
   * Add points directly (used by combo system and other systems)
   * @param {number} points - Points to add
   */
  addPoints(points) {
    this.points += Math.floor(points);
    this.onPointUpdate(this.points, this.kills, points);
  }

  /**
   * Reset the point system (e.g., on game restart)
   */
  reset() {
    this.points = 0;
    this.kills = 0;
    this.multiplier = 1.0;
    this.onPointUpdate(this.points, this.kills);
  }
}
