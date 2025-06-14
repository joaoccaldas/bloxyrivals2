// GameStateManager.js
// Manages game states, transitions, and core game lifecycle

export class GameStateManager {
  constructor(callbacks = {}) {
    this.state = 'loading';
    this.lastTime = 0;
    this.callbacks = {
      onStateChange: callbacks.onStateChange || (() => {}),
      onPause: callbacks.onPause || (() => {}),
      onResume: callbacks.onResume || (() => {}),
      onGameOver: callbacks.onGameOver || (() => {}),
      ...callbacks
    };
    
    // Bind methods for event handling
    this._handleKeyDown = this._handleKeyDown.bind(this);
  }

  /**
   * Get current game state
   * @returns {string} Current state
   */
  getCurrentState() {
    return this.state;
  }

  /**
   * Check if game is in a specific state
   * @param {string} state - State to check
   * @returns {boolean}
   */
  isInState(state) {
    return this.state === state;
  }

  /**
   * Transition to a new state
   * @param {string} newState - New state to transition to
   * @param {Object} data - Optional data to pass with transition
   */
  setState(newState, data = {}) {
    const oldState = this.state;
    this.state = newState;
    
    // Trigger state change callback
    this.callbacks.onStateChange(oldState, newState, data);
    
    // Handle specific state transitions
    this._handleStateTransition(oldState, newState, data);
  }

  /**
   * Handle keyboard input for state management
   * @param {KeyboardEvent} e - Keyboard event
   */
  _handleKeyDown(e) {
    if (e.key === 'Escape' && this.state === 'playing') {
      this.pause();
    }
  }

  /**
   * Pause the game
   */
  pause() {
    if (this.state !== 'playing') return;
    this.setState('paused');
    this.callbacks.onPause();
  }

  /**
   * Resume the game
   */
  resume() {
    if (this.state !== 'paused') return;
    this.lastTime = performance.now();
    this.setState('playing');
    this.callbacks.onResume();
  }

  /**
   * Initialize the game state
   */
  initialize() {
    this.setState('initializing');
  }

  /**
   * Start the game
   */
  start() {
    this.lastTime = performance.now();
    this.setState('playing');
  }

  /**
   * Trigger game over
   */
  gameOver() {
    if (this.state === 'gameover') return;
    this.setState('gameover');
    this.callbacks.onGameOver();
  }

  /**
   * Destroy the state manager
   */
  destroy() {
    this.setState('destroyed');
    window.removeEventListener('keydown', this._handleKeyDown);
  }

  /**
   * Enable keyboard handling
   */
  enableKeyboardHandling() {
    window.addEventListener('keydown', this._handleKeyDown);
  }

  /**
   * Disable keyboard handling
   */
  disableKeyboardHandling() {
    window.removeEventListener('keydown', this._handleKeyDown);
  }

  /**
   * Update time tracking
   * @param {number} timestamp - Current timestamp
   * @returns {number} Delta time since last update
   */
  updateTime(timestamp) {
    const delta = Math.min(timestamp - this.lastTime, 50);
    this.lastTime = timestamp;
    return delta;
  }

  /**
   * Handle state-specific transitions
   * @private
   */
  _handleStateTransition(oldState, newState, data) {
    switch (newState) {
      case 'playing':
        console.log('Game started/resumed');
        break;
      case 'paused':
        console.log('Game paused');
        break;
      case 'gameover':
        console.log('Game over');
        break;
      case 'destroyed':
        console.log('Game destroyed');
        break;
    }
  }
}
