// buttons.js - Button asset paths and configurations

export const buttonAssets = {
  shop: 'assets/buttons/shop.png',
  rivals: 'assets/buttons/rivals.png',
  skin: 'assets/buttons/skin.png',
  
  /**
   * Draw a button with the given parameters
   * @param {CanvasRenderingContext2D} ctx
   * @param {string} buttonName
   * @param {number} x
   * @param {number} y
   * @param {number} w
   * @param {number} h
   * @param {boolean} isHovered
   * @param {number} scale
   * @returns {Object} Button info object
   */
  drawButton(ctx, buttonName, x, y, w, h, isHovered = false, scale = 1) {
    // Button colors
    const normalColor = '#2563EB';
    const hoverColor = '#3B82F6';
    const textColor = '#FFFFFF';
    
    // Apply hover effect
    const bgColor = isHovered ? hoverColor : normalColor;
    
    // Draw button background
    ctx.fillStyle = bgColor;
    ctx.fillRect(x, y, w, h);
    
    // Draw button border
    ctx.strokeStyle = '#1E40AF';
    ctx.lineWidth = 2 * scale;
    ctx.strokeRect(x, y, w, h);
    
    // Draw button text
    ctx.fillStyle = textColor;
    ctx.font = `${Math.max(12, 16 * scale)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Convert button name to display text
    const buttonText = this.getButtonText(buttonName);
    ctx.fillText(buttonText, x + w/2, y + h/2);
    
    // Return button info for click detection
    return {
      x: x,
      y: y,
      w: w,
      h: h,
      name: buttonName
    };
  },
  
  /**
   * Get display text for button name
   * @param {string} buttonName
   * @returns {string}
   */
  getButtonText(buttonName) {
    const textMap = {
      'resume': 'Resume',
      'save': 'Save Game',
      'shop': 'Shop',
      'gamemode': 'Game Mode',
      'quit': 'Quit',
      'back': 'Back',
      'start': 'Start',
      'rivals': 'Rivals'
    };
    return textMap[buttonName] || buttonName.charAt(0).toUpperCase() + buttonName.slice(1);
  }
};

export const buttonConfig = {
  defaultWidth: 128,
  defaultHeight: 64,
  hoverScale: 1.1,
  clickScale: 0.95
};