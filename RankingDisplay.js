// RankingDisplay.js - UI component for displaying rankings

export class RankingDisplay {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      throw new Error(`Container with ID '${containerId}' not found`);
    }
    this.rankingSystem = null;
    this.currentGameMode = 'time_based';
  }

  /**
   * Set the ranking system instance
   * @param {RankingSystem} rankingSystem - The ranking system instance
   */
  setRankingSystem(rankingSystem) {
    this.rankingSystem = rankingSystem;
  }

  /**
   * Display the ranking screen
   * @param {Object} results - Game results from ranking system
   */
  displayResults(results) {
    if (!this.rankingSystem) {
      console.error('❌ Ranking system not set');
      return;
    }

    this.container.innerHTML = this._generateRankingHTML(results);
    this._attachEventListeners();
    this._animateEntrance();
  }

  /**
   * Generate the ranking HTML
   * @private
   * @param {Object} results - Game results
   * @returns {string} HTML string
   */
  _generateRankingHTML(results) {
    const { entry, rankings, rank } = results;
    const stats = this.rankingSystem.getStats(this.currentGameMode);

    return `
      <div class="ranking-overlay">
        <div class="ranking-modal">          <div class="ranking-header">
            <h1>🏆 Time Attack Results</h1>
            <button class="close-btn" onclick="closeRanking()">&times;</button>
          </div>
          
          <div class="ranking-content">
            <!-- Current Game Results -->
            <div class="current-results">
              <div class="rank-display">
                <div class="rank-number">#${rank}</div>
                <div class="rank-label">Your Rank</div>
              </div>
              
              <div class="performance-grid">
                <div class="performance-item">
                  <span class="performance-value">${entry.score.toLocaleString()}</span>
                  <span class="performance-label">Score</span>
                </div>
                <div class="performance-item">
                  <span class="performance-value">${entry.kills}</span>
                  <span class="performance-label">Kills</span>
                </div>
                <div class="performance-item">
                  <span class="performance-value">${this.rankingSystem.formatTime(entry.timeSurvived)}</span>
                  <span class="performance-label">Survival Time</span>
                </div>
                <div class="performance-item">
                  <span class="performance-value">${entry.performance.efficiencyRating}</span>
                  <span class="performance-label">Rating</span>
                </div>
              </div>
              
              <div class="detailed-stats">
                <div class="stat-row">
                  <span>Points/Minute:</span>
                  <span>${entry.performance.pointsPerMinute}</span>
                </div>
                <div class="stat-row">
                  <span>Kills/Minute:</span>
                  <span>${entry.performance.killsPerMinute}</span>
                </div>
                <div class="stat-row">
                  <span>Damage Dealt:</span>
                  <span>${entry.damageDealt}</span>
                </div>
                <div class="stat-row">
                  <span>Damage Taken:</span>
                  <span>${entry.damageTaken}</span>
                </div>
              </div>
            </div>

            <!-- Leaderboard -->
            <div class="leaderboard">
              <h3>🥇 Top ${rankings.length} Players</h3>
              <div class="ranking-list">
                ${rankings.map(r => this._generateRankingEntry(r, r.id === entry.id)).join('')}
              </div>
            </div>

            <!-- Statistics -->
            <div class="statistics">
              <h3>📊 Your Statistics</h3>
              <div class="stats-grid">
                <div class="stat-card">
                  <div class="stat-number">${stats.totalGames}</div>
                  <div class="stat-label">Games Played</div>
                </div>
                <div class="stat-card">
                  <div class="stat-number">${stats.averageScore}</div>
                  <div class="stat-label">Avg Score</div>
                </div>
                <div class="stat-card">
                  <div class="stat-number">${stats.averageKills}</div>
                  <div class="stat-label">Avg Kills</div>
                </div>
                <div class="stat-card">
                  <div class="stat-number">${this.rankingSystem.formatTime(stats.averageSurvivalTime)}</div>
                  <div class="stat-label">Avg Survival</div>
                </div>
              </div>
            </div>
          </div>
            <div class="ranking-actions">
            <button class="action-btn primary" onclick="playAgain()">
              🔄 Play Again
            </button>
            <button class="action-btn secondary" onclick="backToMenu()">
              🏠 Back to Menu
            </button>
            <button class="action-btn tertiary" onclick="shareResults()">
              📤 Share Results
            </button>
          </div>
        </div>
      </div>
      
      <style>
        .ranking-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0, 0, 0, 0.9);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 10000;
          animation: fadeIn 0.5s ease-out;
        }

        .ranking-modal {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 20px;
          padding: 30px;
          max-width: 900px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
          color: white;
          animation: slideUp 0.5s ease-out;
        }

        .ranking-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          border-bottom: 2px solid rgba(255, 255, 255, 0.2);
          padding-bottom: 20px;
        }

        .ranking-header h1 {
          margin: 0;
          font-size: 2.5em;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
        }

        .close-btn {
          background: none;
          border: none;
          color: white;
          font-size: 2em;
          cursor: pointer;
          padding: 5px 10px;
          border-radius: 50%;
          transition: background 0.3s;
        }

        .close-btn:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        .ranking-content {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
          margin-bottom: 30px;
        }

        .current-results {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 15px;
          padding: 25px;
          backdrop-filter: blur(10px);
        }

        .rank-display {
          text-align: center;
          margin-bottom: 25px;
        }

        .rank-number {
          font-size: 4em;
          font-weight: bold;
          color: #ffd700;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
          margin-bottom: 10px;
        }

        .rank-label {
          font-size: 1.2em;
          opacity: 0.9;
        }

        .performance-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 25px;
        }

        .performance-item {
          text-align: center;
          background: rgba(255, 255, 255, 0.1);
          padding: 15px;
          border-radius: 10px;
        }

        .performance-value {
          display: block;
          font-size: 1.8em;
          font-weight: bold;
          color: #00ff88;
          margin-bottom: 5px;
        }

        .performance-label {
          font-size: 0.9em;
          opacity: 0.8;
        }

        .detailed-stats {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 10px;
          padding: 15px;
        }

        .stat-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .stat-row:last-child {
          border-bottom: none;
        }

        .leaderboard, .statistics {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 15px;
          padding: 25px;
          backdrop-filter: blur(10px);
        }

        .leaderboard h3, .statistics h3 {
          margin: 0 0 20px 0;
          font-size: 1.5em;
          text-align: center;
        }

        .ranking-list {
          max-height: 300px;
          overflow-y: auto;
        }

        .ranking-entry {
          display: flex;
          align-items: center;
          padding: 12px;
          margin-bottom: 8px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          transition: all 0.3s;
        }

        .ranking-entry.current {
          background: rgba(255, 215, 0, 0.3);
          border: 2px solid #ffd700;
          box-shadow: 0 0 15px rgba(255, 215, 0, 0.3);
        }

        .ranking-entry:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: translateY(-2px);
        }

        .entry-rank {
          font-size: 1.2em;
          font-weight: bold;
          margin-right: 15px;
          min-width: 30px;
        }

        .entry-details {
          flex: 1;
        }

        .entry-score {
          font-size: 1.1em;
          font-weight: bold;
          color: #00ff88;
        }

        .entry-meta {
          font-size: 0.9em;
          opacity: 0.8;
          margin-top: 3px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 15px;
        }

        .stat-card {
          text-align: center;
          background: rgba(255, 255, 255, 0.1);
          padding: 20px;
          border-radius: 10px;
        }

        .stat-number {
          font-size: 2em;
          font-weight: bold;
          color: #00ff88;
          margin-bottom: 8px;
        }

        .stat-label {
          font-size: 0.9em;
          opacity: 0.8;
        }

        .ranking-actions {
          display: flex;
          justify-content: center;
          gap: 15px;
          flex-wrap: wrap;
        }

        .action-btn {
          padding: 15px 30px;
          border: none;
          border-radius: 25px;
          font-size: 1.1em;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.3s;
          min-width: 150px;
        }

        .action-btn.primary {
          background: linear-gradient(45deg, #00ff88, #00cc6a);
          color: white;
        }

        .action-btn.secondary {
          background: linear-gradient(45deg, #ff6b6b, #ee5a52);
          color: white;
        }

        .action-btn.tertiary {
          background: linear-gradient(45deg, #4ecdc4, #44a08d);
          color: white;
        }

        .action-btn:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3);
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideUp {
          from { 
            opacity: 0;
            transform: translateY(50px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 768px) {
          .ranking-modal {
            margin: 20px;
            padding: 20px;
            max-width: none;
          }

          .ranking-content {
            grid-template-columns: 1fr;
          }

          .performance-grid {
            grid-template-columns: 1fr;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .ranking-actions {
            flex-direction: column;
          }
        }
      </style>
    `;
  }

  /**
   * Generate HTML for a single ranking entry
   * @private
   * @param {Object} entry - Ranking entry
   * @param {boolean} isCurrent - Whether this is the current player
   * @returns {string} HTML string
   */
  _generateRankingEntry(entry, isCurrent = false) {
    const rankIcon = entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : '';
    
    return `
      <div class="ranking-entry ${isCurrent ? 'current' : ''}">
        <div class="entry-rank">${rankIcon}${entry.rank}</div>
        <div class="entry-details">
          <div class="entry-score">${entry.score.toLocaleString()} pts</div>
          <div class="entry-meta">
            ${entry.kills} kills • ${this.rankingSystem.formatTime(entry.timeSurvived)} • ${entry.performance.efficiencyRating}
          </div>
        </div>
        <div class="entry-date">${entry.date}</div>
      </div>
    `;
  }

  /**
   * Attach event listeners
   * @private
   */
  _attachEventListeners() {
    // Make methods available globally for button clicks
    window.closeRanking = () => this.close();
    window.playAgain = () => this.playAgain();
    window.backToMenu = () => this.backToMenu();
    window.shareResults = () => this.shareResults();
  }

  /**
   * Animate entrance
   * @private
   */
  _animateEntrance() {
    // Add staggered animations to ranking entries
    const entries = this.container.querySelectorAll('.ranking-entry');
    entries.forEach((entry, index) => {
      entry.style.animationDelay = `${index * 0.1}s`;
      entry.style.animation = 'slideUp 0.5s ease-out forwards';
    });
  }

  /**
   * Close the ranking display
   */
  close() {
    if (this.container) {
      this.container.innerHTML = '';
    }
  }

  /**
   * Handle play again button
   */
  playAgain() {
    this.close();
    // Dispatch custom event for play again
    window.dispatchEvent(new CustomEvent('ranking:playAgain', {
      detail: { gameMode: this.currentGameMode }
    }));
  }

  /**
   * Handle back to menu button
   */
  backToMenu() {
    this.close();
    // Dispatch custom event for back to menu
    window.dispatchEvent(new CustomEvent('ranking:backToMenu'));
  }

  /**
   * Handle share results button
   */
  shareResults() {
    if (navigator.share) {
      navigator.share({
        title: 'Bloxy Rivals - Time Attack Results',
        text: `I just scored ${this.lastResults?.entry?.score || 0} points in Bloxy Rivals Time Attack mode!`,
        url: window.location.href
      });
    } else {
      // Fallback: copy to clipboard
      const text = `I just scored ${this.lastResults?.entry?.score || 0} points in Bloxy Rivals Time Attack mode! Play at ${window.location.href}`;
      navigator.clipboard.writeText(text).then(() => {
        alert('Results copied to clipboard!');
      }).catch(() => {
        alert('Share functionality not available');
      });
    }
  }

  /**
   * Set the current game mode
   * @param {string} gameMode - Game mode
   */
  setGameMode(gameMode) {
    this.currentGameMode = gameMode;
  }
}
