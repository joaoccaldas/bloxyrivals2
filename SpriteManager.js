// SpriteManager.js
// Manages directional sprite loading and fallback system

export class SpriteManager {
  constructor() {
    this.spriteCache = new Map();
    this.directionalSprites = new Map(); // Maps base sprite names to { left, right, base }
    this.fallbackSprites = new Map(); // Fallback sprites when directional variants don't exist
    this.loadingPromises = new Map(); // Track loading states
    
    // Rate limiting for warnings to prevent console spam
    this.warningCooldowns = new Map();
    this.WARNING_COOLDOWN_MS = 5000; // 5 seconds between same warnings
  }  /**
   * Create a fallback sprite canvas for characters without sprites
   * @private
   * @param {string} characterName - Name of the character
   * @param {string} color - Color for the fallback sprite
   * @returns {HTMLCanvasElement} Canvas element with generated sprite
   */
  _createFallbackSprite(characterName, color = '#FF6B6B') {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    
    // Draw simple colored rectangle
    ctx.fillStyle = color;
    ctx.fillRect(8, 8, 48, 48);
    
    // Add character initial
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(characterName.charAt(0).toUpperCase(), 32, 32);
    
    // Add border
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.strokeRect(8, 8, 48, 48);
    
    return canvas;
  }

  /**
   * Get or create a fallback sprite for a character
   * @private
   * @param {string} spriteName - Sprite name/ID
   * @returns {HTMLCanvasElement|null} Fallback sprite or null
   */
  _getFallbackSprite(spriteName) {
    if (this.fallbackSprites.has(spriteName)) {
      return this.fallbackSprites.get(spriteName);
    }
    
    // Try to find character data
    const characters = window.characters || [];
    const character = characters.find(c => c.id.toString() === spriteName);
    
    if (character) {
      const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#FF9FF3'];
      const color = colors[parseInt(spriteName) % colors.length];
      const fallbackSprite = this._createFallbackSprite(character.name, color);
      
      this.fallbackSprites.set(spriteName, fallbackSprite);
      console.log(`Created fallback sprite for ${character.name} (ID: ${spriteName})`);
      return fallbackSprite;
    }
    
    return null;
  }

  /**
   * Rate-limited warning to prevent console spam
   * @private
   * @param {string} message - Warning message
   * @param {string} key - Unique key for this warning type
   */
  _rateLimitedWarn(message, key) {
    const now = Date.now();
    const lastWarning = this.warningCooldowns.get(key);
    
    if (!lastWarning || (now - lastWarning) > this.WARNING_COOLDOWN_MS) {
      console.warn(message);
      this.warningCooldowns.set(key, now);
    }
  }

  /**
   * Load a sprite with directional variants
   * @param {string} basePath - Base path to sprite (e.g., 'assets/player/bear.png')
   * @param {string} spriteName - Name identifier for the sprite
   * @returns {Promise} Promise that resolves when all variants are loaded
   */
  async loadSpriteWithDirections(basePath, spriteName) {
    if (this.directionalSprites.has(spriteName)) {
      return this.directionalSprites.get(spriteName);
    }

    // Validate input parameters
    if (!basePath || basePath === 'null' || basePath === null) {
      console.warn(`Cannot load sprite '${spriteName}': basePath is null or invalid`);
      // Return empty sprite set to prevent crashes
      const emptySprite = {
        base: null,
        left: null,
        right: null
      };
      this.directionalSprites.set(spriteName, emptySprite);
      return emptySprite;
    }

    // Extract base name and extension
    const pathParts = basePath.split('/');
    const fileName = pathParts[pathParts.length - 1];
    const baseName = fileName.split('.')[0];
    const extension = fileName.split('.')[1] || 'png';
    const basePath_ = pathParts.slice(0, -1).join('/');

    // Define sprite variants
    const variants = {
      base: basePath,
      left: `${basePath_}/${baseName}_left.${extension}`,
      right: `${basePath_}/${baseName}_right.${extension}`
    };

    // Load all variants
    const loadingPromises = Object.entries(variants).map(async ([direction, path]) => {
      try {
        const img = await this._loadImage(path);
        return { direction, img, path, loaded: true };
      } catch (error) {
        console.warn(`Failed to load ${direction} sprite: ${path}`, error);
        return { direction, img: null, path, loaded: false };
      }
    });

    const results = await Promise.all(loadingPromises);
    
    // Create sprite object with fallbacks
    const spriteSet = {
      base: null,
      left: null,
      right: null
    };

    // Process results and set up fallbacks
    let baseSprite = null;
    for (const result of results) {
      if (result.loaded) {
        spriteSet[result.direction] = result.img;
        if (result.direction === 'base') {
          baseSprite = result.img;
        }
      }
    }

    // Set up fallbacks - use base sprite if directional variants are missing
    if (baseSprite) {
      if (!spriteSet.left) {
        spriteSet.left = baseSprite;
        console.log(`Using base sprite as fallback for left direction: ${spriteName}`);
      }
      if (!spriteSet.right) {
        spriteSet.right = baseSprite;
        console.log(`Using base sprite as fallback for right direction: ${spriteName}`);
      }
    }

    this.directionalSprites.set(spriteName, spriteSet);
    return spriteSet;
  }

  /**
   * Load a simple sprite (backwards compatibility)
   * @param {string} path - Path to sprite
   * @param {string} spriteName - Name identifier
   * @returns {Promise<Image>} Promise that resolves to loaded image
   */
  async loadSprite(path, spriteName) {
    if (this.spriteCache.has(spriteName)) {
      return this.spriteCache.get(spriteName);
    }

    try {
      const img = await this._loadImage(path);
      this.spriteCache.set(spriteName, img);
      return img;
    } catch (error) {
      console.error(`Failed to load sprite: ${path}`, error);
      return null;
    }
  }
  /**
   * Get sprite for a specific direction
   * @param {string} spriteName - Name of the sprite set
   * @param {string} direction - Direction ('left', 'right', or 'base')
   * @returns {Image|null} The sprite image or null if not found
   */  getDirectionalSprite(spriteName, direction = 'base') {
    try {
      if (!spriteName || typeof spriteName !== 'string') {
        this._rateLimitedWarn(`Invalid spriteName provided to getDirectionalSprite: ${spriteName}`, `invalid-sprite-${spriteName}`);
        return null;
      }

      const spriteSet = this.directionalSprites.get(spriteName);
      if (!spriteSet) {
        // Fallback to simple sprite cache
        const fallbackSprite = this.spriteCache.get(spriteName);
        if (!fallbackSprite) {
          // Try to get or create a fallback sprite
          const generatedFallback = this._getFallbackSprite(spriteName);
          if (generatedFallback) {
            return generatedFallback;
          }
          
          this._rateLimitedWarn(`No sprite found for: ${spriteName}`, `missing-sprite-${spriteName}`);
        }
        return fallbackSprite || null;
      }

      const sprite = spriteSet[direction] || spriteSet.base || null;
      if (!sprite) {
        // Try fallback sprite as last resort
        const generatedFallback = this._getFallbackSprite(spriteName);
        if (generatedFallback) {
          return generatedFallback;
        }
        
        this._rateLimitedWarn(`No sprite found for direction '${direction}' in sprite set '${spriteName}'`, `missing-direction-${spriteName}-${direction}`);
      }
      return sprite;
    } catch (error) {
      console.error('Error in getDirectionalSprite:', error);
      return null;
    }
  }

  /**
   * Get the best sprite based on movement direction
   * @param {string} spriteName - Name of the sprite set
   * @param {number} dx - Horizontal movement delta
   * @param {number} dy - Vertical movement delta
   * @returns {Image|null} The appropriate directional sprite
   */
  getSpriteForMovement(spriteName, dx, dy) {
    // Determine direction based on movement
    let direction = 'base';
    
    if (Math.abs(dx) > Math.abs(dy)) {
      // Horizontal movement is stronger
      direction = dx > 0 ? 'right' : 'left';
    }
    // For vertical movement or no movement, use base sprite

    return this.getDirectionalSprite(spriteName, direction);
  }

  /**
   * Check if a sprite set has directional variants
   * @param {string} spriteName - Name of the sprite set
   * @returns {boolean} True if directional variants exist
   */
  hasDirectionalSprites(spriteName) {
    const spriteSet = this.directionalSprites.get(spriteName);
    if (!spriteSet) return false;
    
    return (spriteSet.left !== spriteSet.base) || (spriteSet.right !== spriteSet.base);
  }
  /**
   * Pre-load all character sprites with directional variants
   * @param {Array} characters - Array of character data
   * @returns {Promise} Promise that resolves when all sprites are loaded
   */  async preloadCharacterSprites(characters) {
    // Filter out characters with null sprites
    const charactersWithSprites = characters.filter(character => character.sprite && character.sprite !== null);
    
    console.log(`Loading sprites for ${charactersWithSprites.length} of ${characters.length} characters (${characters.length - charactersWithSprites.length} have no sprites)`);
    
    const loadPromises = charactersWithSprites.map(async (character) => {
      try {
        await this.loadSpriteWithDirections(character.sprite, character.id.toString());
        console.log(`Loaded character sprites for: ${character.name} (ID: ${character.id})`);
      } catch (error) {
        console.error(`Failed to load character sprites for ${character.name} (ID: ${character.id}):`, error);
        // Load as simple sprite fallback
        try {
          await this.loadSprite(character.sprite, character.id.toString());
          console.log(`Loaded fallback sprite for: ${character.name} (ID: ${character.id})`);
        } catch (fallbackError) {
          console.error(`Failed to load fallback sprite for ${character.name} (ID: ${character.id}):`, fallbackError);
        }
      }
    });

    await Promise.all(loadPromises);
    console.log('All available character sprites loaded');
  }

  /**
   * Helper method to load an image
   * @private
   * @param {string} src - Image source path
   * @returns {Promise<Image>} Promise that resolves to loaded image
   */
  _loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }
  /**
   * Clear all cached sprites
   */
  clearCache() {
    this.spriteCache.clear();
    this.directionalSprites.clear();
    this.fallbackSprites.clear();
    this.loadingPromises.clear();
    this.warningCooldowns.clear();
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache statistics
   */
  getCacheStats() {
    return {
      simpleSprites: this.spriteCache.size,
      directionalSprites: this.directionalSprites.size,
      totalSprites: this.spriteCache.size + this.directionalSprites.size
    };
  }
  /**
   * Debug method to list all loaded sprites
   */
  debugListSprites() {
    console.group('SpriteManager Debug Info');
    console.log('Simple sprites:', Array.from(this.spriteCache.keys()));
    console.log('Directional sprites:', Array.from(this.directionalSprites.keys()));
    console.log('Fallback sprites:', Array.from(this.fallbackSprites.keys()));
    
    this.directionalSprites.forEach((spriteSet, name) => {
      console.log(`${name}:`, {
        hasLeft: spriteSet.left !== spriteSet.base,
        hasRight: spriteSet.right !== spriteSet.base,
        hasBase: !!spriteSet.base
      });
    });
    console.groupEnd();
  }
}
