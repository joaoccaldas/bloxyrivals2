// menuSystem.js

import { characters } from '../data/characterData.js';
import { buttonAssets } from './buttons.js';

/**
 * Draws a rounded rectangle path on the given context.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x
 * @param {number} y
 * @param {number} w
 * @param {number} h
 * @param {number} r - corner radius
 */
function drawRoundedRect(ctx, x, y, w, h, r) {
  if (r > w / 2) r = w / 2;
  if (r > h / 2) r = h / 2;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y,     x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x,     y + h, r);
  ctx.arcTo(x,     y + h, x,     y,     r);
  ctx.arcTo(x,     y,     x + w, y,     r);
  ctx.closePath();
}

export class MenuSystem {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {Object} options
   * @param {string} options.playerName        - Name to display top-right
   * @param {number} options.currentCharId     - Character ID for sprite
   * @param {Function} options.onResumeGame    - Callback when Resume clicked or ESC
   * @param {Function} options.onSaveGame      - Callback when Save clicked
   * @param {Function} options.onExitGame      - Callback when Quit clicked
   * @param {Function} options.onShop          - Callback when Shop clicked
   * @param {Function} options.onGameMode      - Callback when Game Mode clicked
   */
  constructor(canvas, {
    playerName    = 'Player',
    currentCharId = 0,
    onResumeGame  = () => {},
    onSaveGame    = () => {},
    onExitGame    = () => {},
    onShop        = () => {},
    onGameMode    = () => {}
  }) {    this.canvas       = canvas;
    if (!canvas) throw new Error('MenuSystem requires a valid canvas element');
    this.ctx          = canvas.getContext('2d');
    this.playerName  = playerName;
    this.currentCharId = currentCharId;
    this.callbacks    = { onResumeGame, onSaveGame, onExitGame, onShop, onGameMode };
    this.buttons      = [];
    this.hoveredButton = null; // Track hovered button for visual feedback

    // Preload sprites
    this.spriteMap = new Map();
    characters.forEach(ch => {
      const img = new Image();
      img.src = ch.sprite;
      this.spriteMap.set(ch.id, img);
    });    this._clickHandler = this.handleClick.bind(this);
    this._keyHandler   = this.handleKey.bind(this);
    this._mouseMoveHandler = this.handleMouseMove.bind(this);
    this._resizeHandler = this.handleResize.bind(this);
    
    canvas.addEventListener('click', this._clickHandler);
    canvas.addEventListener('mousemove', this._mouseMoveHandler);
    window.addEventListener('keydown', this._keyHandler);
    window.addEventListener('resize', this._resizeHandler);    this.animate = this.animate.bind(this);
    this._frame = requestAnimationFrame(this.animate);
  }
  
  /**
   * Helper method to get CSS custom property values
   * @private
   */
  _getCSSProperty(property) {
    return getComputedStyle(document.documentElement)
      .getPropertyValue(property)
      .trim() || '#2563EB'; // fallback
  }

  /** Main loop */
  animate() {
    this.draw();
    this._frame = requestAnimationFrame(this.animate);
  }  /** Draw pause menu */
  draw() {
    const ctx = this.ctx;
    const W = this.canvas.width;
    const H = this.canvas.height;
    this.buttons = [];

    // Calculate responsive scaling factors based on actual viewport
    const viewportScale = Math.min(
      window.innerWidth / 1920,   // Reference width
      window.innerHeight / 1080   // Reference height
    );
    
    // Canvas scale relative to its actual display size
    const canvasRect = this.canvas.getBoundingClientRect();
    const canvasScale = Math.min(
      canvasRect.width / 800,    // Reference canvas width
      canvasRect.height / 600    // Reference canvas height
    );
    
    // Combine both scales with bounds
    const combinedScale = Math.min(viewportScale, canvasScale);    const scale = Math.max(0.3, Math.min(1.5, combinedScale));    
    
    // Background using design system colors
    const bgColor = this._getCSSProperty('--primary-dark');
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, W, H);

    // Light panel behind sprite - responsive sizing
    const baseSize = Math.min(W, H) * 0.25; // Even smaller for better fit
    const panelPadding = Math.max(20, 30 * scale);
    const panelW = baseSize + panelPadding;
    const panelH = baseSize + panelPadding;
    const panelX = (W - panelW) / 2;
    const panelY = (H - panelH) / 2 - (15 * scale);

    ctx.fillStyle = this._getCSSProperty('--primary-light');
    drawRoundedRect(ctx, panelX, panelY, panelW, panelH, Math.max(10, 15 * scale));
    ctx.fill();

    // Sprite - maintain aspect ratio and scale properly
    const sprite = this.spriteMap.get(this.currentCharId) || new Image();
    if (sprite.complete && sprite.naturalWidth) {
      const { naturalWidth: nw, naturalHeight: nh } = sprite;
      
      // Calculate scale to fit within baseSize while maintaining aspect ratio
      const spriteScale = Math.min(baseSize / nw, baseSize / nh);
      
      const drawW = nw * spriteScale;
      const drawH = nh * spriteScale;
      const drawX = (W - drawW) / 2;
      const drawY = (H - drawH) / 2 - (15 * scale);
      
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(sprite, drawX, drawY, drawW, drawH);    }

    // Player name top-right - responsive font size and positioning
    ctx.fillStyle = this._getCSSProperty('--text-primary');
    ctx.font = `bold ${Math.max(12, Math.min(32, 20 * scale))}px sans-serif`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText(this.playerName, W - Math.max(15, 15 * scale), Math.max(15, 15 * scale));

    // Buttons top-left - responsive sizing with better scaling
    const btnW = Math.max(100, Math.min(200, 140 * scale));
    const btnH = Math.max(25, Math.min(50, 35 * scale));
    const margin = Math.max(10, 15 * scale);
    const buttonSpacing = Math.max(5, 8 * scale);
    let x = margin;
    let y = margin;    this._addButton('resume', x, y, btnW, btnH, 'resume', scale);
    y += btnH + buttonSpacing;
    this._addButton('save', x, y, btnW, btnH, 'save', scale);
    y += btnH + buttonSpacing;
    this._addButton('gamemode', x, y, btnW, btnH, 'gamemode', scale);
    y += btnH + buttonSpacing;
    this._addButton('shop', x, y, btnW, btnH, 'shop', scale);
    y += btnH + buttonSpacing;
    this._addButton('quit', x, y, btnW, btnH, 'quit', scale);
  }/** Draws and registers a button using the button assets system */
  _addButton(buttonName, x, y, w, h, action, scale = 1) {
    const isHovered = this.hoveredButton === action;
    const buttonInfo = buttonAssets.drawButton(this.ctx, buttonName, x, y, w, h, isHovered, scale);
    buttonInfo.action = action; // Override action if different from buttonName
    this.buttons.push(buttonInfo);
  }
  /** Mouse move handler for button hover effects */
  handleMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (this.canvas.width / rect.width);
    const my = (e.clientY - rect.top)  * (this.canvas.height / rect.height);

    let hoveredAction = null;
    for (const btn of this.buttons) {
      if (mx >= btn.x && mx <= btn.x + btn.w && my >= btn.y && my <= btn.y + btn.h) {
        hoveredAction = btn.action;
        break;
      }
    }

    if (this.hoveredButton !== hoveredAction) {
      this.hoveredButton = hoveredAction;
      // Redraw to update hover state
      this.draw();
    }
  }
  /** Click handler */
  handleClick(e) {
    const rect = this.canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (this.canvas.width / rect.width);
    const my = (e.clientY - rect.top)  * (this.canvas.height / rect.height);

    for (const btn of this.buttons) {
      if (mx >= btn.x && mx <= btn.x + btn.w && my >= btn.y && my <= btn.y + btn.h) {
        if (btn.action === 'resume') this.callbacks.onResumeGame();
        else if (btn.action === 'save') this.callbacks.onSaveGame();
        else if (btn.action === 'shop') this.callbacks.onShop();
        else if (btn.action === 'gamemode') this.callbacks.onGameMode();
        else if (btn.action === 'quit') this.callbacks.onExitGame();
        return;
      }
    }
  }
  /** ESC resumes */
  handleKey(e) {
    if (e.key === 'Escape') this.callbacks.onResumeGame();
  }
  /** Handle window resize */
  handleResize() {
    // Redraw on resize to recalculate scaling
    setTimeout(() => {
      this.draw();
    }, 100); // Small delay to ensure canvas has updated its size
  }
  /** Cleanup */
  destroy() {
    cancelAnimationFrame(this._frame);
    this.canvas.removeEventListener('click', this._clickHandler);
    this.canvas.removeEventListener('mousemove', this._mouseMoveHandler);    window.removeEventListener('keydown', this._keyHandler);
    window.removeEventListener('resize', this._resizeHandler);
  }
}
