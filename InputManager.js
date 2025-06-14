// InputManager.js
// Manages all input handling with advanced features

export class InputManager {
  constructor() {
    this.keys = new Map();
    this.keyBindings = new Map();
    this.callbacks = new Map();
    this.gamepadIndex = null;
    this.gamepadState = {
      buttons: [],
      axes: []
    };
    
    // Input configuration
    this.config = {
      deadzone: 0.2,
      enableGamepad: true,
      enableKeyboard: true,
      enableMouse: true,
      enableTouch: true
    };
    
    // Bind methods
    this._handleKeyDown = this._handleKeyDown.bind(this);
    this._handleKeyUp = this._handleKeyUp.bind(this);
    this._handleGamepadConnected = this._handleGamepadConnected.bind(this);
    this._handleGamepadDisconnected = this._handleGamepadDisconnected.bind(this);
    
    this.initialize();
  }

  /**
   * Initialize the input manager
   */
  initialize() {
    if (this.config.enableKeyboard) {
      window.addEventListener('keydown', this._handleKeyDown);
      window.addEventListener('keyup', this._handleKeyUp);
    }
    
    if (this.config.enableGamepad) {
      window.addEventListener('gamepadconnected', this._handleGamepadConnected);
      window.addEventListener('gamepaddisconnected', this._handleGamepadDisconnected);
    }
    
    // Set up default key bindings
    this.setDefaultBindings();
  }

  /**
   * Set up default key bindings
   */
  setDefaultBindings() {
    this.bindKey('KeyW', 'moveUp');
    this.bindKey('KeyA', 'moveLeft');
    this.bindKey('KeyS', 'moveDown');
    this.bindKey('KeyD', 'moveRight');
    this.bindKey('ArrowUp', 'moveUp');
    this.bindKey('ArrowLeft', 'moveLeft');
    this.bindKey('ArrowDown', 'moveDown');
    this.bindKey('ArrowRight', 'moveRight');
    this.bindKey('Space', 'attack');
    this.bindKey('Escape', 'pause');
    this.bindKey('KeyE', 'interact');
    this.bindKey('KeyQ', 'special');
  }

  /**
   * Bind a key to an action
   * @param {string} keyCode - Key code (e.g., 'KeyW', 'Space')
   * @param {string} action - Action name
   */
  bindKey(keyCode, action) {
    this.keyBindings.set(keyCode, action);
  }

  /**
   * Register a callback for an action
   * @param {string} action - Action name
   * @param {Function} callback - Callback function
   */
  onAction(action, callback) {
    if (!this.callbacks.has(action)) {
      this.callbacks.set(action, []);
    }
    this.callbacks.get(action).push(callback);
  }

  /**
   * Remove a callback for an action
   * @param {string} action - Action name
   * @param {Function} callback - Callback function to remove
   */
  offAction(action, callback) {
    if (this.callbacks.has(action)) {
      const callbacks = this.callbacks.get(action);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Check if an action is currently active
   * @param {string} action - Action name
   * @returns {boolean} True if action is active
   */
  isActionActive(action) {
    for (const [keyCode, boundAction] of this.keyBindings) {
      if (boundAction === action && this.keys.get(keyCode)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Get the strength of an action (0-1, useful for analog inputs)
   * @param {string} action - Action name
   * @returns {number} Action strength
   */
  getActionStrength(action) {
    // For keyboard, return 1 if active, 0 if not
    if (this.isActionActive(action)) {
      return 1;
    }
    
    // For gamepad, check analog inputs
    if (this.gamepadIndex !== null) {
      const gamepad = navigator.getGamepads()[this.gamepadIndex];
      if (gamepad) {
        // Map actions to gamepad inputs
        switch (action) {
          case 'moveUp':
            return Math.max(0, -gamepad.axes[1]);
          case 'moveDown':
            return Math.max(0, gamepad.axes[1]);
          case 'moveLeft':
            return Math.max(0, -gamepad.axes[0]);
          case 'moveRight':
            return Math.max(0, gamepad.axes[0]);
          case 'attack':
            return gamepad.buttons[0] ? gamepad.buttons[0].value : 0;
        }
      }
    }
    
    return 0;
  }

  /**
   * Get movement vector based on input
   * @returns {{x: number, y: number}} Normalized movement vector
   */
  getMovementVector() {
    let x = 0;
    let y = 0;
    
    // Keyboard input
    if (this.isActionActive('moveLeft')) x -= 1;
    if (this.isActionActive('moveRight')) x += 1;
    if (this.isActionActive('moveUp')) y -= 1;
    if (this.isActionActive('moveDown')) y += 1;
    
    // Gamepad input
    if (this.gamepadIndex !== null) {
      const gamepad = navigator.getGamepads()[this.gamepadIndex];
      if (gamepad) {
        const gx = Math.abs(gamepad.axes[0]) > this.config.deadzone ? gamepad.axes[0] : 0;
        const gy = Math.abs(gamepad.axes[1]) > this.config.deadzone ? gamepad.axes[1] : 0;
        
        // Use gamepad if it has stronger input
        if (Math.abs(gx) > Math.abs(x)) x = gx;
        if (Math.abs(gy) > Math.abs(y)) y = gy;
      }
    }
    
    // Normalize diagonal movement
    const length = Math.sqrt(x * x + y * y);
    if (length > 1) {
      x /= length;
      y /= length;
    }
    
    return { x, y };
  }

  /**
   * Update input manager (call each frame)
   */
  update() {
    this._updateGamepad();
  }

  /**
   * Handle key down events
   * @private
   */
  _handleKeyDown(event) {
    if (!this.config.enableKeyboard) return;
    
    this.keys.set(event.code, true);
    
    // Trigger action callbacks
    const action = this.keyBindings.get(event.code);
    if (action && this.callbacks.has(action)) {
      this.callbacks.get(action).forEach(callback => {
        callback({ type: 'press', action, event });
      });
    }
  }

  /**
   * Handle key up events
   * @private
   */
  _handleKeyUp(event) {
    if (!this.config.enableKeyboard) return;
    
    this.keys.set(event.code, false);
    
    // Trigger action callbacks
    const action = this.keyBindings.get(event.code);
    if (action && this.callbacks.has(action)) {
      this.callbacks.get(action).forEach(callback => {
        callback({ type: 'release', action, event });
      });
    }
  }

  /**
   * Handle gamepad connected
   * @private
   */
  _handleGamepadConnected(event) {
    console.log('Gamepad connected:', event.gamepad.id);
    this.gamepadIndex = event.gamepad.index;
  }

  /**
   * Handle gamepad disconnected
   * @private
   */
  _handleGamepadDisconnected(event) {
    console.log('Gamepad disconnected:', event.gamepad.id);
    if (this.gamepadIndex === event.gamepad.index) {
      this.gamepadIndex = null;
    }
  }

  /**
   * Update gamepad state
   * @private
   */
  _updateGamepad() {
    if (!this.config.enableGamepad || this.gamepadIndex === null) return;
    
    const gamepad = navigator.getGamepads()[this.gamepadIndex];
    if (!gamepad) return;
    
    // Check for button presses
    gamepad.buttons.forEach((button, index) => {
      const wasPressed = this.gamepadState.buttons[index];
      const isPressed = button.pressed;
      
      if (isPressed && !wasPressed) {
        // Button just pressed
        this._triggerGamepadAction(index, 'press');
      } else if (!isPressed && wasPressed) {
        // Button just released
        this._triggerGamepadAction(index, 'release');
      }
      
      this.gamepadState.buttons[index] = isPressed;
    });
  }

  /**
   * Trigger gamepad action
   * @private
   */
  _triggerGamepadAction(buttonIndex, type) {
    let action = null;
    
    // Map gamepad buttons to actions
    switch (buttonIndex) {
      case 0: action = 'attack'; break;      // A button
      case 1: action = 'special'; break;     // B button
      case 2: action = 'interact'; break;    // X button
      case 9: action = 'pause'; break;       // Start button
    }
    
    if (action && this.callbacks.has(action)) {
      this.callbacks.get(action).forEach(callback => {
        callback({ type, action, gamepadButton: buttonIndex });
      });
    }
  }

  /**
   * Get input configuration
   * @returns {Object} Current configuration
   */
  getConfig() {
    return { ...this.config };
  }

  /**
   * Update input configuration
   * @param {Object} newConfig - New configuration options
   */
  setConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current key bindings
   * @returns {Map<string, string>} Key bindings map
   */
  getKeyBindings() {
    return new Map(this.keyBindings);
  }

  /**
   * Clear all key bindings
   */
  clearBindings() {
    this.keyBindings.clear();
  }

  /**
   * Check if gamepad is connected
   * @returns {boolean} True if gamepad is connected
   */
  isGamepadConnected() {
    return this.gamepadIndex !== null;
  }

  /**
   * Destroy the input manager
   */
  destroy() {
    window.removeEventListener('keydown', this._handleKeyDown);
    window.removeEventListener('keyup', this._handleKeyUp);
    window.removeEventListener('gamepadconnected', this._handleGamepadConnected);
    window.removeEventListener('gamepaddisconnected', this._handleGamepadDisconnected);
    
    this.keys.clear();
    this.keyBindings.clear();
    this.callbacks.clear();
  }
}
