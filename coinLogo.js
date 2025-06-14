/**
 * Coin logo generator for Bloxy Rivals
 * 
 * This script creates a pixel art coin logo on a canvas
 * that can be used throughout the game.
 */

// Define coin colors
const COIN_COLORS = {
  outer: '#FFD700', // Gold
  inner: '#FFC125', // Darker gold
  edge: '#B8860B',  // Dark gold edge
  shine: '#FFFFFF', // Shine effect
  shadow: '#A67C00', // Shadow
  text: '#A67C00'   // Text color
};

export class CoinLogo {
  /**
   * Create a coin logo
   * @param {Object} options - Options for the coin logo
   * @param {number} [options.size=64] - Size of the coin in pixels
   * @param {boolean} [options.withText=true] - Whether to include text on the coin
   * @param {string} [options.text="C"] - Text to display on the coin
   */
  constructor(options = {}) {
    this.options = {
      size: 64,
      withText: true,
      text: "C",
      ...options
    };
    
    // Create canvas element
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.options.size;
    this.canvas.height = this.options.size;
    this.ctx = this.canvas.getContext('2d');
    
    this.drawCoin();
  }
  
  /**
   * Draw the coin on the canvas
   */
  drawCoin() {
    const { size } = this.options;
    const ctx = this.ctx;
    const center = size / 2;
    const radius = size / 2 * 0.9; // Slightly smaller than half size
    
    // Clear canvas
    ctx.clearRect(0, 0, size, size);
    
    // Draw outer circle (main coin body)
    ctx.beginPath();
    ctx.arc(center, center, radius, 0, Math.PI * 2);
    ctx.fillStyle = COIN_COLORS.outer;
    ctx.fill();
    
    // Draw inner circle
    ctx.beginPath();
    ctx.arc(center, center, radius * 0.85, 0, Math.PI * 2);
    ctx.fillStyle = COIN_COLORS.inner;
    ctx.fill();
    
    // Draw edge highlight (top left)
    ctx.beginPath();
    ctx.arc(center, center, radius * 0.95, Math.PI * 0.5, Math.PI * 1.5);
    ctx.strokeStyle = COIN_COLORS.shine;
    ctx.lineWidth = size * 0.03;
    ctx.stroke();
    
    // Draw edge shadow (bottom right)
    ctx.beginPath();
    ctx.arc(center, center, radius * 0.95, Math.PI * 1.5, Math.PI * 0.5);
    ctx.strokeStyle = COIN_COLORS.shadow;
    ctx.lineWidth = size * 0.03;
    ctx.stroke();
    
    // Draw shine effect
    ctx.beginPath();
    ctx.arc(center * 0.7, center * 0.7, radius * 0.3, 0, Math.PI * 2);
    ctx.fillStyle = COIN_COLORS.shine;
    ctx.globalAlpha = 0.4;
    ctx.fill();
    ctx.globalAlpha = 1.0;
    
    // Draw text if needed
    if (this.options.withText) {
      const text = this.options.text;
      ctx.fillStyle = COIN_COLORS.text;
      ctx.font = `bold ${size * 0.5}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, center, center);
    }
  }
  
  /**
   * Get the coin as an image element
   * @returns {HTMLImageElement} Image element with the coin
   */
  getImage() {
    const img = new Image();
    img.src = this.canvas.toDataURL();
    return img;
  }
  
  /**
   * Get the coin as a data URL
   * @returns {string} Data URL of the coin image
   */
  getDataURL() {
    return this.canvas.toDataURL();
  }
  
  /**
   * Get the coin canvas element
   * @returns {HTMLCanvasElement} Canvas element with the coin
   */
  getCanvas() {
    return this.canvas;
  }
  
  /**
   * Append the coin to a parent element as an image
   * @param {HTMLElement} parent - Parent element to append to
   * @returns {HTMLImageElement} The appended image
   */
  appendTo(parent) {
    const img = this.getImage();
    parent.appendChild(img);
    return img;
  }
  
  /**
   * Generate a coin element for the DOM
   * @param {Object} options - Options for the coin
   * @returns {HTMLElement} DOM element with the coin
   */
  static createCoinElement(options = {}) {
    const coinLogo = new CoinLogo(options);
    const container = document.createElement('div');
    container.className = 'pixel-coin-container';
    container.appendChild(coinLogo.getImage());
    return container;
  }
}
