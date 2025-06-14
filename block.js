// block.js

export class Block {
  /**
   * @param {number} x      – world X position (pixels)
   * @param {number} y      – world Y position (pixels)
   * @param {number} width  – block width (pixels)
   * @param {number} height – block height (pixels)
   * @param {string} type   – e.g. 'tree'. Unknown types default to a dark gray color.
   */
  constructor(x, y, width, height, type) {
    this.x      = x;
    this.y      = y;
    this.width  = width;
    this.height = height;
    this.type   = type;    // You can later swap in images or sprites here
    this.colorMap = {
      tree:  '#228822'
    };
  }

  /** Draws the block at its world coords */
  draw(ctx) {
    ctx.save();
    // Choose fill style by type (placeholder – swap for sprites as needed)
    ctx.fillStyle = this.colorMap[this.type] || '#444'; // Fallback color
    ctx.fillRect(this.x, this.y, this.width, this.height);

    // Example: add a simple border
    ctx.strokeStyle = '#000';
    ctx.lineWidth   = 1;
    ctx.strokeRect(this.x, this.y, this.width, this.height);
    ctx.restore();
  }

  /** Returns an AABB for simple collision checks */
  getBounds() {
    return {
      left:   this.x,
      top:    this.y,
      right:  this.x + this.width,
      bottom: this.y + this.height
    };
  }
}\