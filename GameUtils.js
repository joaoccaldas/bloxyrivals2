// utils/GameUtils.js
// Common utility functions and patterns used throughout the game

/**
 * Mathematical utilities
 */
export const MathUtils = {
  /**
   * Clamp a value between min and max
   * @param {number} value - Value to clamp
   * @param {number} min - Minimum value
   * @param {number} max - Maximum value
   * @returns {number} Clamped value
   */
  clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  },

  /**
   * Linear interpolation between two values
   * @param {number} a - Start value
   * @param {number} b - End value
   * @param {number} t - Interpolation factor (0-1)
   * @returns {number} Interpolated value
   */
  lerp(a, b, t) {
    return a + (b - a) * this.clamp(t, 0, 1);
  },

  /**
   * Calculate distance between two points
   * @param {number} x1 - First point X
   * @param {number} y1 - First point Y
   * @param {number} x2 - Second point X
   * @param {number} y2 - Second point Y
   * @returns {number} Distance
   */
  distance(x1, y1, x2, y2) {
    return Math.hypot(x2 - x1, y2 - y1);
  },

  /**
   * Calculate angle between two points
   * @param {number} x1 - First point X
   * @param {number} y1 - First point Y
   * @param {number} x2 - Second point X
   * @param {number} y2 - Second point Y
   * @returns {number} Angle in radians
   */
  angle(x1, y1, x2, y2) {
    return Math.atan2(y2 - y1, x2 - x1);
  },

  /**
   * Generate random number between min and max
   * @param {number} min - Minimum value
   * @param {number} max - Maximum value
   * @returns {number} Random number
   */
  random(min, max) {
    return Math.random() * (max - min) + min;
  },

  /**
   * Generate random integer between min and max (inclusive)
   * @param {number} min - Minimum value
   * @param {number} max - Maximum value
   * @returns {number} Random integer
   */
  randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  /**
   * Normalize angle to 0-2π range
   * @param {number} angle - Angle in radians
   * @returns {number} Normalized angle
   */
  normalizeAngle(angle) {
    while (angle < 0) angle += Math.PI * 2;
    while (angle >= Math.PI * 2) angle -= Math.PI * 2;
    return angle;
  }
};

/**
 * Color utilities
 */
export const ColorUtils = {
  /**
   * Convert RGB to hex
   * @param {number} r - Red (0-255)
   * @param {number} g - Green (0-255)
   * @param {number} b - Blue (0-255)
   * @returns {string} Hex color string
   */
  rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  },

  /**
   * Convert hex to RGB
   * @param {string} hex - Hex color string
   * @returns {{r: number, g: number, b: number}} RGB object
   */
  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  },

  /**
   * Create RGBA color string
   * @param {number} r - Red (0-255)
   * @param {number} g - Green (0-255)
   * @param {number} b - Blue (0-255)
   * @param {number} a - Alpha (0-1)
   * @returns {string} RGBA color string
   */
  rgba(r, g, b, a) {
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  },

  /**
   * Create HSL color string
   * @param {number} h - Hue (0-360)
   * @param {number} s - Saturation (0-100)
   * @param {number} l - Lightness (0-100)
   * @returns {string} HSL color string
   */
  hsl(h, s, l) {
    return `hsl(${h}, ${s}%, ${l}%)`;
  },

  /**
   * Interpolate between two colors
   * @param {string} color1 - Start color (hex)
   * @param {string} color2 - End color (hex)
   * @param {number} t - Interpolation factor (0-1)
   * @returns {string} Interpolated color (hex)
   */
  lerpColor(color1, color2, t) {
    const c1 = this.hexToRgb(color1);
    const c2 = this.hexToRgb(color2);
    if (!c1 || !c2) return color1;

    const r = Math.round(MathUtils.lerp(c1.r, c2.r, t));
    const g = Math.round(MathUtils.lerp(c1.g, c2.g, t));
    const b = Math.round(MathUtils.lerp(c1.b, c2.b, t));

    return this.rgbToHex(r, g, b);
  }
};

/**
 * Animation utilities
 */
export const AnimUtils = {
  /**
   * Easing functions
   */
  easing: {
    linear: t => t,
    easeIn: t => t * t,
    easeOut: t => t * (2 - t),
    easeInOut: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
    bounce: t => {
      if (t < 1/2.75) return 7.5625 * t * t;
      if (t < 2/2.75) return 7.5625 * (t -= 1.5/2.75) * t + 0.75;
      if (t < 2.5/2.75) return 7.5625 * (t -= 2.25/2.75) * t + 0.9375;
      return 7.5625 * (t -= 2.625/2.75) * t + 0.984375;
    }
  },

  /**
   * Create an animation tween
   * @param {number} from - Start value
   * @param {number} to - End value
   * @param {number} duration - Duration in milliseconds
   * @param {Function} easingFn - Easing function
   * @returns {Object} Animation object
   */
  createTween(from, to, duration, easingFn = this.easing.linear) {
    return {
      from,
      to,
      duration,
      easingFn,
      startTime: performance.now(),
      getValue() {
        const elapsed = performance.now() - this.startTime;
        const progress = Math.min(elapsed / this.duration, 1);
        const easedProgress = this.easingFn(progress);
        return MathUtils.lerp(this.from, this.to, easedProgress);
      },
      isComplete() {
        return performance.now() - this.startTime >= this.duration;
      }
    };
  }
};

/**
 * Canvas utilities
 */
export const CanvasUtils = {
  /**
   * Draw a rounded rectangle
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} width - Width
   * @param {number} height - Height
   * @param {number} radius - Corner radius
   */
  roundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + width, y, x + width, y + height, radius);
    ctx.arcTo(x + width, y + height, x, y + height, radius);
    ctx.arcTo(x, y + height, x, y, radius);
    ctx.arcTo(x, y, x + width, y, radius);
    ctx.closePath();
  },

  /**
   * Draw text with outline
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {string} text - Text to draw
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {string} fillColor - Fill color
   * @param {string} strokeColor - Stroke color
   * @param {number} strokeWidth - Stroke width
   */
  strokeText(ctx, text, x, y, fillColor, strokeColor, strokeWidth = 2) {
    ctx.save();
    ctx.lineWidth = strokeWidth;
    ctx.strokeStyle = strokeColor;
    ctx.fillStyle = fillColor;
    ctx.strokeText(text, x, y);
    ctx.fillText(text, x, y);
    ctx.restore();
  },

  /**
   * Draw a circle
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} x - Center X
   * @param {number} y - Center Y
   * @param {number} radius - Radius
   * @param {string} color - Fill color
   */
  circle(ctx, x, y, radius, color) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  },

  /**
   * Create a gradient
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} x0 - Start X
   * @param {number} y0 - Start Y
   * @param {number} x1 - End X
   * @param {number} y1 - End Y
   * @param {Array} colors - Array of color stops [{offset, color}]
   * @returns {CanvasGradient} Gradient object
   */
  createGradient(ctx, x0, y0, x1, y1, colors) {
    const gradient = ctx.createLinearGradient(x0, y0, x1, y1);
    colors.forEach(stop => {
      gradient.addColorStop(stop.offset, stop.color);
    });
    return gradient;
  }
};

/**
 * Performance utilities
 */
export const PerfUtils = {
  /**
   * Create a performance monitor
   * @returns {Object} Performance monitor
   */
  createMonitor() {
    return {
      frameCount: 0,
      lastTime: performance.now(),
      fps: 0,
      averageFps: 0,
      fpsHistory: [],
      maxHistory: 60,

      update() {
        this.frameCount++;
        const now = performance.now();
        
        if (now - this.lastTime >= 1000) {
          this.fps = Math.round((this.frameCount * 1000) / (now - this.lastTime));
          this.fpsHistory.push(this.fps);
          
          if (this.fpsHistory.length > this.maxHistory) {
            this.fpsHistory.shift();
          }
          
          this.averageFps = Math.round(
            this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length
          );
          
          this.frameCount = 0;
          this.lastTime = now;
        }
      },

      getStats() {
        return {
          fps: this.fps,
          averageFps: this.averageFps,
          minFps: Math.min(...this.fpsHistory),
          maxFps: Math.max(...this.fpsHistory)
        };
      }
    };
  },

  /**
   * Throttle function execution
   * @param {Function} func - Function to throttle
   * @param {number} limit - Time limit in milliseconds
   * @returns {Function} Throttled function
   */
  throttle(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  /**
   * Debounce function execution
   * @param {Function} func - Function to debounce
   * @param {number} wait - Wait time in milliseconds
   * @returns {Function} Debounced function
   */
  debounce(func, wait) {
    let timeout;
    return function() {
      const context = this;
      const args = arguments;
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(context, args), wait);
    };
  }
};

/**
 * Event utilities
 */
export const EventUtils = {
  /**
   * Create a simple event emitter
   * @returns {Object} Event emitter
   */
  createEmitter() {
    const events = {};
    
    return {
      on(event, callback) {
        if (!events[event]) events[event] = [];
        events[event].push(callback);
      },

      off(event, callback) {
        if (events[event]) {
          events[event] = events[event].filter(cb => cb !== callback);
        }
      },

      emit(event, ...args) {
        if (events[event]) {
          events[event].forEach(callback => callback(...args));
        }
      },

      once(event, callback) {
        const onceCallback = (...args) => {
          callback(...args);
          this.off(event, onceCallback);
        };
        this.on(event, onceCallback);
      }
    };
  }
};

/**
 * Validation utilities
 */
export const ValidationUtils = {
  /**
   * Check if value is a number
   * @param {*} value - Value to check
   * @returns {boolean} Whether value is a number
   */
  isNumber(value) {
    return typeof value === 'number' && !isNaN(value) && isFinite(value);
  },

  /**
   * Check if value is within range
   * @param {number} value - Value to check
   * @param {number} min - Minimum value
   * @param {number} max - Maximum value
   * @returns {boolean} Whether value is in range
   */
  inRange(value, min, max) {
    return this.isNumber(value) && value >= min && value <= max;
  },

  /**
   * Validate object against schema
   * @param {Object} obj - Object to validate
   * @param {Object} schema - Schema to validate against
   * @returns {boolean} Whether object is valid
   */
  validateSchema(obj, schema) {
    for (const [key, type] of Object.entries(schema)) {
      if (!(key in obj) || typeof obj[key] !== type) {
        return false;
      }
    }
    return true;
  }
};

/**
 * Storage utilities
 */
export const StorageUtils = {
  /**
   * Safe localStorage operations
   */
  local: {
    get(key, defaultValue = null) {
      try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
      } catch (e) {
        console.warn('localStorage get failed:', e);
        return defaultValue;
      }
    },

    set(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (e) {
        console.warn('localStorage set failed:', e);
        return false;
      }
    },

    remove(key) {
      try {
        localStorage.removeItem(key);
        return true;
      } catch (e) {
        console.warn('localStorage remove failed:', e);
        return false;
      }
    }
  }
};
