// camera.js

/**
 * Manages viewport panning, zooming, and screen shake centered on a player.
 * @param {HTMLCanvasElement} canvas       - Canvas to render into
 * @param {number} worldWidth             - Width of the game world in pixels
 * @param {number} worldHeight            - Height of the game world in pixels
 * @param {{x:number,y:number,width:number,height:number}} player - Player object with x,y,dimensions
 */
export class Camera {
  constructor(canvas, worldWidth, worldHeight, player) {
    if (!canvas) throw new Error('Camera requires a canvas element');
    this.canvas      = canvas;
    this.worldWidth  = worldWidth;
    this.worldHeight = worldHeight;
    this.player      = player;

    // Viewport position in world coords
    this.x = 0;
    this.y = 0;

    // Zoom parameters
    this.zoom       = 1;
    this.minZoom    = 0.5;
    this.maxZoom    = 2;

    // Screen shake state
    this.shakeIntensity = 0;
    this.shakeDuration  = 0;
    this.shakeStart     = 0;
  }

  /** Clamp zoom between min and max */
  setZoom(zoom) {
    this.zoom = Math.min(this.maxZoom, Math.max(this.minZoom, zoom));
  }

  /** Increase zoom by a factor */
  zoomIn(factor = 1.1) {
    this.setZoom(this.zoom * factor);
  }

  /** Decrease zoom by a factor */
  zoomOut(factor = 1.1) {
    this.setZoom(this.zoom / factor);
  }

  /** Trigger a screen shake effect
   * @param {number} intensity - Maximum pixel offset
   * @param {number} duration  - Duration in ms
   */
  shake(intensity, duration) {
    this.shakeIntensity = intensity;
    this.shakeDuration  = duration;
    this.shakeStart     = Date.now();
  }

  /** Begin camera transform for drawing
   * Must be paired with end(ctx) when done drawing world
   */
  begin(ctx) {
    ctx.save();

    // Calculate viewport center on player
    const canvasW = this.canvas.width;
    const canvasH = this.canvas.height;
    const halfW   = canvasW / (2 * this.zoom);
    const halfH   = canvasH / (2 * this.zoom);

    // Center the camera on the player's center point
    const targetX = this.player.x + this.player.width / 2;
    const targetY = this.player.y + this.player.height / 2;

    this.x = targetX - halfW;
    this.y = targetY - halfH;

    // Clamp within world bounds
    this.x = Math.max(0, Math.min(this.x, this.worldWidth  - canvasW / this.zoom));
    this.y = Math.max(0, Math.min(this.y, this.worldHeight - canvasH / this.zoom));

    // Compute shake offset if active
    let offsetX = 0;
    let offsetY = 0;
    const elapsed = Date.now() - this.shakeStart;
    if (elapsed < this.shakeDuration) {
      offsetX = (Math.random() * 2 - 1) * this.shakeIntensity;
      offsetY = (Math.random() * 2 - 1) * this.shakeIntensity;
    }

    // Apply transforms: scale, then translate world into view
    ctx.scale(this.zoom, this.zoom);
    ctx.translate(-this.x + offsetX, -this.y + offsetY);
  }

  /** Restore transform state after drawing
   * @param {CanvasRenderingContext2D} ctx
   */
  end(ctx) {
    ctx.restore();
  }

  /** Convert world coordinates to screen coordinates
   * @param {number} wx - World X
   * @param {number} wy - World Y
   * @returns {{x:number,y:number}}
   */
  worldToScreen(wx, wy) {
    const sx = (wx - this.x) * this.zoom;
    const sy = (wy - this.y) * this.zoom;
    return { x: Math.round(sx), y: Math.round(sy) };
  }

  /** Convert screen coordinates to world coordinates
   * @param {number} sx - Screen X
   * @param {number} sy - Screen Y
   * @returns {{x:number,y:number}}
   */
  screenToWorld(sx, sy) {
    const wx = sx / this.zoom + this.x;
    const wy = sy / this.zoom + this.y;
    return { x: Math.round(wx), y: Math.round(wy) };
  }
}
