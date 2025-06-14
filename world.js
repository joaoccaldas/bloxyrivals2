// world.js

const terrainImage = new Image();
terrainImage.src = 'assets/Scene/scene1.png';

export class World {  /**
   * @param {number} tileSize - Size of one tile in pixels (unused for drawing but preserved for layout)
   * @param {number} cols     - Number of columns (defines world width)
   * @param {number} rows     - Number of rows (defines world height)
   */
  constructor(tileSize = 64, cols = 50, rows = 40) {
    this.tileSize = tileSize;
    this.width = cols * tileSize;
    this.height = rows * tileSize;
  }
  update(delta) {
    // Nothing dynamic in the world terrain yet
  }
  /**
   * Draw terrain
   * @param {CanvasRenderingContext2D} ctx
   */
  draw(ctx) {
    ctx.save();
    
    // Always draw a base background color first to ensure full coverage
    ctx.fillStyle = '#2D5A27'; // Dark green grass-like color
    ctx.fillRect(0, 0, this.width, this.height);
    
    // Overlay terrain pattern if available
    if (terrainImage.complete && terrainImage.naturalWidth) {
      const pattern = ctx.createPattern(terrainImage, 'repeat');
      if (pattern) {
        ctx.fillStyle = pattern;
        ctx.fillRect(0, 0, this.width, this.height);
      }
    }
    
    ctx.restore();
  }
  
  /** Serialize world state */
  serialize() {
    return {
      tileSize: this.tileSize,
      width: this.width,
      height: this.height
    };
  }

  /** Load world state */
  load(data) {
    this.tileSize = data.tileSize ?? this.tileSize;
    this.width = data.width ?? this.width;
    this.height = data.height ?? this.height;
  }
}
