/**
 * Profile System for Bloxy Rivals
 * 
 * This class manages the player profile including name changes
 * and player statistics.
 */
import { ShopSystem } from './shopSystem.js';

export class ProfileSystem {
  /**
   * Create a profile system
   * @param {HTMLElement} container - The container element
   * @param {Object} options - Configuration options
   * @param {Function} options.onClose - Callback when profile is closed
   * @param {Function} options.onNameChange - Callback when name is changed
   * @param {String} options.initialName - Initial player name
   */
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      onClose: () => {},
      onNameChange: () => {},
      initialName: 'Player',
      ...options
    };
      // Profile elements
    this.profileScreen = document.getElementById('profileScreen');
    this.closeButton = document.getElementById('closeProfile');
    this.currentNameEl = document.getElementById('currentPlayerName');
    
    // Player stats elements
    this.gamesPlayedEl = document.getElementById('gamesPlayed');
    this.highestScoreEl = document.getElementById('highestScore');
    this.totalKillsEl = document.getElementById('totalKills');
      // Player data
    this.playerName = this.loadPlayerName() || this.options.initialName;
    this.playerStats = this.loadPlayerStats() || {
      gamesPlayed: 0,
      highestScore: 0,
      totalKills: 0
    };
    
    this.init();
  }
  
  /**
   * Initialize the profile system
   */  init() {
    // Set up event listeners
    this.closeButton.addEventListener('click', () => this.close());
    
    // Update displayed name
    this.updateNameDisplay();
    
    // Update stats display
    this.updateStatsDisplay();
  }
  
  /**
   * Show the profile screen
   */
  show() {
    // Show the profile screen with animation
    this.profileScreen.classList.remove('hidden');
    setTimeout(() => {
      this.profileScreen.classList.add('visible');
    }, 10);
    
    // Update name and stats before showing
    this.updateNameDisplay();
    this.updateStatsDisplay();
  }
  
  /**
   * Close the profile screen
   */
  close() {
    // Hide the profile screen with animation
    this.profileScreen.classList.remove('visible');
    setTimeout(() => {
      this.profileScreen.classList.add('hidden');
      this.options.onClose();
    }, 300); // Match CSS transition timing
  }
    // Name change functionality has been removed
  
  /**
   * Update the displayed player name
   */
  updateNameDisplay() {
    if (this.currentNameEl) {
      this.currentNameEl.textContent = this.playerName;
    }
  }
  
  /**
   * Update the displayed player stats
   */
  updateStatsDisplay() {
    if (this.gamesPlayedEl) {
      this.gamesPlayedEl.textContent = this.playerStats.gamesPlayed;
    }
    if (this.highestScoreEl) {
      this.highestScoreEl.textContent = this.playerStats.highestScore;
    }
    if (this.totalKillsEl) {
      this.totalKillsEl.textContent = this.playerStats.totalKills;
    }
  }
  
  /**
   * Update player statistics
   * @param {Object} stats - Stats to update
   */
  updateStats(stats = {}) {
    const { score = 0, kills = 0 } = stats;
    
    // Update games played
    this.playerStats.gamesPlayed++;
    
    // Update highest score if higher
    if (score > this.playerStats.highestScore) {
      this.playerStats.highestScore = score;
    }
    
    // Update total kills
    this.playerStats.totalKills += kills;
    
    // Save stats
    this.savePlayerStats();
    
    // Update display if visible
    this.updateStatsDisplay();
  }
  
  /**
   * Load player name from localStorage
   * @returns {String|null} The saved player name or null
   */
  loadPlayerName() {
    return localStorage.getItem('playerName');
  }
  
  /**
   * Save player name to localStorage
   */
  savePlayerName() {
    localStorage.setItem('playerName', this.playerName);
  }
  
  /**
   * Load player stats from localStorage
   * @returns {Object|null} The saved player stats or null
   */
  loadPlayerStats() {
    const savedStats = localStorage.getItem('playerStats');
    return savedStats ? JSON.parse(savedStats) : null;
  }
  
  /**
   * Save player stats to localStorage
   */
  savePlayerStats() {
    localStorage.setItem('playerStats', JSON.stringify(this.playerStats));
  }
  
  /**
   * Get the current player name
   * @returns {String} The current player name
   */
  getPlayerName() {
    return this.playerName;
  }
}
