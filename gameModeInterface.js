// gameModeInterface.js - JavaScript interface for gamemode.py

/**
 * JavaScript interface for the Python gamemode system
 * Provides a bridge between the JavaScript game and Python gamemode logic
 */

class GameModeInterface {
  constructor() {
    this.currentMode = null;
    this.modeStats = {
      kills: 0,
      score: 0,
      damageDealt: 0,
      damageTaken: 0,
      powerUpsCollected: 0,
      bossesDefeated: 0
    };
    this.startTime = null;
    this.endTime = null;
    this.isActive = false;
    this.callbacks = new Map();
    this.selectedModeType = 'time_based'; // Default mode
    this.timeWarnings = new Set();
  }

  /**
   * Get available game modes
   * @returns {Object} Available game modes with descriptions
   */  getAvailableModes() {
    return {
      'time_based': {
        name: 'Time Attack',
        description: 'Score as many points as possible in 3 minutes! Kill mobs and other players to earn points.',
        duration: 180, // 3 minutes
        icon: '⏱️',
        features: [
          'Time limit: 3 minutes',
          'Increased mob spawn rate',
          '20% score bonus',
          'Performance ratings'
        ]
      },
      'team_battle': {
        name: 'Team Battle',
        description: 'Lead your team to victory against the opposing team in intense 1-minute battles!',
        duration: 60, // 1 minute
        icon: '⚔️',
        features: [
          'Time limit: 1 minute',
          '3v3 team battles',
          'Team-based scoring',
          'Victory conditions'
        ]
      },
      'placeholder': {
        name: 'Coming Soon',
        description: 'This game mode is under development. Stay tuned for exciting new gameplay features!',
        duration: null,
        icon: '🚧',
        features: [
          'New gameplay mechanics',
          'Special challenges',
          'Unique rewards',
          'More coming soon!'
        ]
      }
    };
  }

  /**
   * Select a game mode
   * @param {string} modeType - Type of game mode ('time_based' or 'placeholder')
   * @param {Object} options - Additional options for the mode
   */
  selectMode(modeType, options = {}) {
    const availableModes = this.getAvailableModes();
    
    if (!availableModes[modeType]) {
      throw new Error(`Unknown game mode: ${modeType}`);
    }    this.selectedModeType = modeType;
    
    // Configure mode based on type
    if (modeType === 'time_based') {
      this.currentMode = {
        type: 'time_based',
        name: 'Time Attack',
        duration: options.duration || 180, // 3 minutes default
        scoringMultiplier: 1.2,
        mobSpawnRate: 1.3,
        difficultyMultiplier: 1.0,
        specialRules: {
          timeLimit: options.duration || 180,
          scoreDecay: false,
          bonusScoring: true,
          rushMode: true,
          replenishMobs: true // Always maintain mob count for time attack mode
        }
      };
    } else if (modeType === 'team_battle') {
      this.currentMode = {
        type: 'team_battle',
        name: 'Team Battle',
        duration: options.duration || 60, // 1 minute default
        scoringMultiplier: 1.0,
        mobSpawnRate: 0.5, // Reduced mob spawn for team focus
        difficultyMultiplier: 1.2,
        specialRules: {
          timeLimit: options.duration || 60,
          teamSize: 3,
          teamBased: true,
          teamScoring: true,
          victoryConditions: ['team_elimination', 'time_victory']
        },
        teams: {
          playerTeam: {
            id: 'blue',
            name: 'Blue Team',
            color: '#3B82F6',
            members: [],
            score: 0,
            kills: 0
          },
          enemyTeam: {
            id: 'red',
            name: 'Red Team',
            color: '#EF4444',
            members: [],
            score: 0,
            kills: 0
          }
        }
      };
    } else if (modeType === 'placeholder') {
      this.currentMode = {
        type: 'placeholder',
        name: 'Coming Soon',
        duration: null,
        scoringMultiplier: 1.0,
        mobSpawnRate: 1.0,
        difficultyMultiplier: 1.0,
        specialRules: {
          placeholder: true,
          developmentMode: true
        }
      };
    }

    this.triggerCallback('mode_selected', this.currentMode);
    return this.currentMode;
  }

  /**
   * Start the selected game mode
   */
  startMode() {
    if (!this.currentMode) {
      throw new Error('No game mode selected');
    }

    this.startTime = Date.now();
    this.isActive = true;
    this.modeStats = {
      kills: 0,
      score: 0,
      damageDealt: 0,
      damageTaken: 0,
      powerUpsCollected: 0,
      bossesDefeated: 0
    };
    this.timeWarnings.clear();
    // Mode-specific initialization
    if (this.currentMode.type === 'time_based') {
      this.triggerCallback('mode_start', {
        message: `Time Attack mode started! ${Math.floor(this.currentMode.duration / 60)} minutes to score maximum points!`,
        duration: this.currentMode.duration
      });
    } else if (this.currentMode.type === 'team_battle') {
      this.triggerCallback('mode_start', {
        message: `Team Battle started! Defeat the enemy team in ${this.currentMode.duration} seconds!`,
        duration: this.currentMode.duration,
        teams: this.currentMode.teams
      });
      this.initializeTeamBattle(); // Ensure teams are populated
    } else if (this.currentMode.type === 'placeholder') {
      this.triggerCallback('mode_start', {
        message: 'This mode is coming soon! For now, enjoy the regular game.',
        placeholder: true
      });
    }

    return true;
  }

  /**
   * Update the game mode (called every frame)
   * @param {number} deltaTime - Time since last update (in seconds)
   * @returns {boolean} True if mode should continue, false if it should end
   */
  update(deltaTime) {
    if (!this.isActive || !this.currentMode) {
      return false;
    }    // Time-based mode logic
    if (this.currentMode.type === 'time_based') {
      const timeRemaining = this.getTimeRemaining();
      
      // Check for time warnings
      const warningTimes = [60, 30, 10, 5]; // Warning times in seconds
      for (const warningTime of warningTimes) {
        if (!this.timeWarnings.has(warningTime) && 
            timeRemaining <= warningTime && timeRemaining > 0) {
          this.timeWarnings.add(warningTime);
          this.triggerCallback('time_warning', warningTime);
        }
      }

      // Check if time is up
      if (timeRemaining <= 0) {
        this.triggerCallback('time_up');
        return false; // End the mode
      }
    }
    
    // Team battle mode logic
    if (this.currentMode.type === 'team_battle') {
      const timeRemaining = this.getTimeRemaining();
      
      // Check for time warnings
      const warningTimes = [30, 15, 10, 5]; // Warning times in seconds for 1-minute battle
      for (const warningTime of warningTimes) {
        if (!this.timeWarnings.has(warningTime) && 
            timeRemaining <= warningTime && timeRemaining > 0) {
          this.timeWarnings.add(warningTime);
          this.triggerCallback('time_warning', warningTime);
        }
      }

      // Check victory conditions
      const playerTeam = this.currentMode.teams.playerTeam;
      const enemyTeam = this.currentMode.teams.enemyTeam;
      
      // Team elimination victory
      if (enemyTeam.members.length === 0) {
        this.triggerCallback('team_victory', { winner: playerTeam, reason: 'elimination' });
        return false;
      }
      
      if (playerTeam.members.length === 0) {
        this.triggerCallback('team_defeat', { winner: enemyTeam, reason: 'elimination' });
        return false;
      }

      // Check if time is up - determine winner by score/kills
      if (timeRemaining <= 0) {
        if (playerTeam.score > enemyTeam.score || 
           (playerTeam.score === enemyTeam.score && playerTeam.kills > enemyTeam.kills)) {
          this.triggerCallback('team_victory', { winner: playerTeam, reason: 'score' });
        } else if (enemyTeam.score > playerTeam.score) {
          this.triggerCallback('team_defeat', { winner: enemyTeam, reason: 'score' });
        } else {
          this.triggerCallback('team_draw', { reason: 'time' });
        }
        return false; // End the mode
      }
    }

    return true;
  }

  /**
   * End the current game mode
   * @returns {Object} Final results
   */
  endMode() {
    if (!this.isActive) {
      return this.getResults();
    }

    this.endTime = Date.now();
    this.isActive = false;

    const results = this.getResults();
      // Calculate performance metrics for time-based mode
    if (this.currentMode.type === 'time_based') {
      const timeSurvived = this.getElapsedTime();
      results.performance = {
        pointsPerMinute: timeSurvived > 0 ? Math.round((results.stats.score / (timeSurvived / 60)) * 100) / 100 : 0,
        killsPerMinute: timeSurvived > 0 ? Math.round((results.stats.kills / (timeSurvived / 60)) * 100) / 100 : 0,
        efficiencyRating: this.calculateEfficiencyRating(results.stats)
      };
    }
    
    // Calculate performance metrics for team battle mode
    if (this.currentMode.type === 'team_battle') {
      const teamData = this.getAllTeams();
      results.teamBattle = {
        playerTeam: teamData.playerTeam,
        enemyTeam: teamData.enemyTeam,
        winner: teamData.playerTeam && teamData.enemyTeam && teamData.playerTeam.score > teamData.enemyTeam.score ? 'player' : 'enemy',
        // Add a check for calculateTeamworkRating method existence
        teamworkRating: typeof this.calculateTeamworkRating === 'function' ? this.calculateTeamworkRating(teamData) : 'N/A'
      };
    }

    this.triggerCallback('mode_end', results);
    return results;
  }

  /**
   * Add a kill to the stats
   * @param {string} mobType - Type of mob killed
   * @param {number} points - Base points for the kill
   */
  addKill(mobType = 'basic', points = 100) {
    if (!this.isActive) return;

    this.modeStats.kills++;
    const bonusPoints = Math.floor(points * (this.currentMode?.scoringMultiplier || 1.0));
    this.modeStats.score += bonusPoints;
    
    this.triggerCallback('kill_registered', { mobType, points: bonusPoints });
  }

  /**
   * Add damage dealt to stats
   * @param {number} damage - Amount of damage dealt
   */
  addDamageDealt(damage) {
    if (!this.isActive) return;
    this.modeStats.damageDealt += damage;
  }

  /**
   * Add damage taken to stats
   * @param {number} damage - Amount of damage taken
   */
  addDamageTaken(damage) {
    if (!this.isActive) return;
    this.modeStats.damageTaken += damage;
  }

  /**
   * Add power-up collected to stats
   */
  addPowerUp() {
    if (!this.isActive) return;
    this.modeStats.powerUpsCollected++;
  }

  /**
   * Record boss defeat
   * @param {string} bossType - Type of boss defeated
   */
  defeatBoss(bossType = 'basic') {
    if (!this.isActive) return;
    
    this.modeStats.bossesDefeated++;
    const bonusPoints = Math.floor(1000 * (this.currentMode?.scoringMultiplier || 1.0));
    this.modeStats.score += bonusPoints;
    
    this.triggerCallback('boss_defeated', { bossType, bonus: bonusPoints });
  }

  /**
   * Get time remaining in the mode (if time-limited)
   * @returns {number} Time remaining in seconds
   */
  getTimeRemaining() {
    if (!this.currentMode?.duration || !this.startTime) {
      return Infinity;
    }
    
    const elapsed = (Date.now() - this.startTime) / 1000;
    return Math.max(0, this.currentMode.duration - elapsed);
  }

  /**
   * Get elapsed time since mode started
   * @returns {number} Elapsed time in seconds
   */
  getElapsedTime() {
    if (!this.startTime) return 0;
    const endTime = this.endTime || Date.now();
    return (endTime - this.startTime) / 1000;
  }

  /**
   * Get current/final results
   * @returns {Object} Current results
   */
  getResults() {
    return {
      mode: this.currentMode?.name || 'Unknown',
      type: this.currentMode?.type || 'unknown',
      stats: {
        kills: this.modeStats.kills,
        score: this.modeStats.score,
        damageDealt: this.modeStats.damageDealt,
        damageTaken: this.modeStats.damageTaken,
        timeSurvived: this.getElapsedTime(),
        powerUpsCollected: this.modeStats.powerUpsCollected,
        bossesDefeated: this.modeStats.bossesDefeated
      },
      config: {
        name: this.currentMode?.name || 'Unknown',
        description: this.getAvailableModes()[this.selectedModeType]?.description || '',
        duration: this.currentMode?.duration,
        scoringMultiplier: this.currentMode?.scoringMultiplier || 1.0
      }
    };
  }

  /**
   * Calculate efficiency rating based on performance
   * @param {Object} stats - Game statistics
   * @returns {string} Efficiency rating
   */
  calculateEfficiencyRating(stats) {
    if (stats.kills === 0) {
      return 'Rookie';
    }

    const damageEfficiency = stats.damageDealt / Math.max(stats.damageTaken, 1);
    const pointsPerKill = stats.score / stats.kills;

    if (damageEfficiency > 3 && pointsPerKill > 150) {
      return 'Legendary';
    } else if (damageEfficiency > 2 && pointsPerKill > 120) {
      return 'Master';
    } else if (damageEfficiency > 1.5 && pointsPerKill > 100) {
      return 'Expert';
    } else if (damageEfficiency > 1 && pointsPerKill > 80) {
      return 'Skilled';
    } else {
      return 'Rookie';
    }
  }

  /**
   * Set a callback for game mode events
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  setCallback(event, callback) {
    this.callbacks.set(event, callback);
  }

  /**
   * Register a callback for game mode events (alias for setCallback)
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  registerCallback(event, callback) {
    console.log(`Registering callback for event: ${event}`);
    this.setCallback(event, callback);
  }

  /**
   * Trigger a callback if it exists
   * @param {string} event - Event name
   * @param {*} data - Data to pass to callback
   */
  triggerCallback(event, data) {
    const callback = this.callbacks.get(event);
    if (callback && typeof callback === 'function') {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in game mode callback '${event}':`, error);
      }
    }
  }

  /**
   * Get the current game mode configuration
   * @returns {Object|null} Current mode configuration
   */
  getCurrentMode() {
    return this.currentMode;
  }

  /**
   * Check if a mode is currently active
   * @returns {boolean} True if mode is active
   */
  isActiveMode() {
    return this.isActive;
  }

  /**
   * Get formatted time string for display
   * @param {number} seconds - Time in seconds
   * @returns {string} Formatted time string (MM:SS)
   */
  formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  /**
   * Export current mode data for saving
   * @returns {Object} Serializable mode data
   */
  exportData() {
    return {
      currentMode: this.currentMode,
      stats: this.modeStats,
      startTime: this.startTime,
      endTime: this.endTime,
      isActive: this.isActive,
      selectedModeType: this.selectedModeType
    };
  }
  /**
   * Import mode data from save
   * @param {Object} data - Saved mode data
   */
  importData(data) {
    this.currentMode = data.currentMode || null;
    this.modeStats = data.stats || {
      kills: 0, score: 0, damageDealt: 0, damageTaken: 0,
      powerUpsCollected: 0, bossesDefeated: 0
    };
    this.startTime = data.startTime || null;
    this.endTime = data.endTime || null;
    this.isActive = data.isActive || false;
    this.selectedModeType = data.selectedModeType || 'time_based';
  }

  // ========== TEAM BATTLE SPECIFIC METHODS ==========

  /**
   * Add a team member to a specific team
   * @param {string} teamId - Team ID ('blue' or 'red')
   * @param {Object} member - Team member object
   */
  addTeamMember(teamId, member) {
    if (!this.currentMode?.type === 'team_battle') return;
    
    const team = this.currentMode.teams[teamId === 'blue' ? 'playerTeam' : 'enemyTeam'];
    if (team && team.members.length < 3) {
      team.members.push(member);
      this.triggerCallback('team_member_added', { teamId, member, team });
    }
  }

  /**
   * Remove a team member (when eliminated)
   * @param {string} teamId - Team ID ('blue' or 'red')
   * @param {string} memberId - Member ID to remove
   */
  removeTeamMember(teamId, memberId) {
    if (!this.currentMode?.type === 'team_battle') return;
    
    const team = this.currentMode.teams[teamId === 'blue' ? 'playerTeam' : 'enemyTeam'];
    if (team) {
      const memberIndex = team.members.findIndex(m => m.id === memberId);
      if (memberIndex !== -1) {
        const member = team.members.splice(memberIndex, 1)[0];
        this.triggerCallback('team_member_eliminated', { teamId, member, team });
      }
    }
  }

  /**
   * Add a team kill (when team member kills enemy)
   * @param {string} teamId - Team ID that made the kill
   * @param {string} victimType - Type of victim ('player' or 'mob')
   * @param {number} points - Points for the kill
   */
  addTeamKill(teamId, victimType = 'player', points = 100) {
    if (!this.currentMode?.type === 'team_battle') return;
    
    const team = this.currentMode.teams[teamId === 'blue' ? 'playerTeam' : 'enemyTeam'];
    if (team) {
      team.kills++;
      team.score += points;
      
      // Also update personal stats
      this.modeStats.kills++;
      this.modeStats.score += points;
      
      this.triggerCallback('team_kill', { teamId, victimType, points, team });
    }
  }

  /**
   * Get team statistics
   * @param {string} teamId - Team ID ('blue' or 'red')
   * @returns {Object} Team stats
   */
  getTeamStats(teamId) {
    if (!this.currentMode?.type === 'team_battle') return null;
    
    const team = this.currentMode.teams[teamId === 'blue' ? 'playerTeam' : 'enemyTeam'];
    return team ? {
      id: team.id,
      name: team.name,
      color: team.color,
      memberCount: team.members.length,
      score: team.score,
      kills: team.kills,
      members: team.members
    } : null;
  }

  /**
   * Get all teams data
   * @returns {Object} All teams data
   */
  getAllTeams() {
    if (!this.currentMode?.type === 'team_battle') return null;
    
    return {
      playerTeam: this.getTeamStats('blue'),
      enemyTeam: this.getTeamStats('red')
    };
  }

  /**
   * Initialize team battle with player and AI members
   */
  initializeTeamBattle() {
    if (!this.currentMode?.type === 'team_battle') return;
    
    // Add player to blue team
    this.addTeamMember('blue', {
      id: 'player',
      name: 'Player',
      type: 'human',
      health: 100,
      maxHealth: 100
    });
    
    // Add AI teammates to blue team
    for (let i = 1; i <= 2; i++) {
      this.addTeamMember('blue', {
        id: `ally_${i}`,
        name: `Ally ${i}`,
        type: 'ai_ally',
        health: 100,
        maxHealth: 100
      });
    }
    
    // Add AI enemies to red team
    for (let i = 1; i <= 3; i++) {
      this.addTeamMember('red', {
        id: `enemy_${i}`,
        name: `Enemy ${i}`,
        type: 'ai_enemy',
        health: 100,
        maxHealth: 100
      });
    }
    
    this.triggerCallback('teams_initialized', this.getAllTeams());
  }

  /**
   * Update team member health
   * @param {string} teamId - Team ID
   * @param {string} memberId - Member ID
   * @param {number} newHealth - New health value
   */
  updateTeamMemberHealth(teamId, memberId, newHealth) {
    if (!this.currentMode?.type === 'team_battle') return;
    
    const team = this.currentMode.teams[teamId === 'blue' ? 'playerTeam' : 'enemyTeam'];
    if (team) {
      const member = team.members.find(m => m.id === memberId);
      if (member) {
        member.health = Math.max(0, newHealth);
        
        // Remove member if health reaches 0
        if (member.health <= 0) {
          this.removeTeamMember(teamId, memberId);
        }
        
        this.triggerCallback('team_member_health_updated', { teamId, memberId, newHealth, member });
      }
    }
  }

  /**
   * Ensure calculateTeamworkRating function is defined if it's supposed to exist
   * Add a placeholder if it's missing, or implement the actual logic
   */
  calculateTeamworkRating(teamData) {
    // Placeholder implementation - replace with actual logic
    console.warn("calculateTeamworkRating is not fully implemented. Using placeholder.");
    if (!teamData || !teamData.playerTeam || !teamData.enemyTeam) {
      return 'N/A';
    }
    // Example: Simple rating based on score difference and player team kills
    const scoreDifference = teamData.playerTeam.score - teamData.enemyTeam.score;
    const playerKills = teamData.playerTeam.kills;
    if (playerKills === 0) return 'Bronze';
    if (scoreDifference > 100 && playerKills > 5) return 'Gold';
    if (scoreDifference > 50 && playerKills > 2) return 'Silver';
    return 'Bronze';
  }
}

// Create and export global instance
export const gameModeInterface = new GameModeInterface();
export { GameModeInterface };

// For testing in console
if (typeof window !== 'undefined') {
  window.gameModeInterface = gameModeInterface;
}
