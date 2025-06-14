// rivals.js

import { characters } from '../data/characterData.js';

/**
 * Draws a rounded rectangle path on the given context.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x
 * @param {number} y
 * @param {number} w
 * @param {number} h
 * @param {number} r
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

/**
 * Rivals selection UI: displays all characters in a grid.
 * Calls onSelect(id) when a character is clicked.
 * Optionally onCancel() when Escape is pressed.
 */
export class Rivals {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {Function} onSelect - callback(charId)
   * @param {Function} [onCancel] - optional callback for cancel
   */  constructor(canvas, onSelect, onCancel = () => {}) {
    this.canvas     = canvas;
    if (!canvas) throw new Error('Rivals requires a canvas element');
    this.ctx        = canvas.getContext('2d');
    this.onSelect   = onSelect;
    this.onCancel   = onCancel;
    this.buttons    = [];
    
    // Character preview state
    this.previewMode = false;
    this.selectedCharacter = null;
    this.previewFadeIn = 0;
    this.previewStartTime = 0;
    
    // Add home button
    this.homeButton = {
      x: 20,
      y: 20,
      w: 100,
      h: 40,
      type: 'home'
    };    // Background image with better error handling
    this.backgroundImage = new Image();
    this.backgroundImage.src = 'assets/Scene/background_rivals.jpg';
    this.backgroundImage.onload = () => {
      console.log('✅ Rivals background image loaded successfully');
    };
    this.backgroundImage.onerror = (error) => {
      console.warn('Failed to load Rivals background image, using fallback gradient. Error:', error);
      console.warn('Attempted to load:', this.backgroundImage.src);
      this.backgroundImage = null;
    };

    // Grass terrain image for character preview
    this.grassTerrainImage = new Image();
    this.grassTerrainImage.src = 'assets/Scene/scene1.png';
    this.grassTerrainImage.onload = () => {
      console.log('✅ Grass terrain image loaded successfully');
    };
    this.grassTerrainImage.onerror = () => {
      console.warn('Failed to load grass terrain image, using fallback color');
      this.grassTerrainImage = null;
    };// Preload character sprites with better error handling
    this.spriteMap = new Map();
    this.spriteLoadStatus = new Map();
    
    characters.forEach(ch => {
      if (ch.sprite === null || ch.sprite === undefined) {
        // Character has no sprite - set status to indicate no image
        this.spriteLoadStatus.set(ch.id, 'no-image');
        this.spriteMap.set(ch.id, null);
        console.log(`🚫 No sprite defined for ${ch.name}`);
        return;
      }
      
      const img = new Image();
      img.src = ch.sprite;
      
      img.onload = () => {
        console.log(`✅ Loaded sprite for ${ch.name}: ${ch.sprite}`);
        this.spriteLoadStatus.set(ch.id, 'loaded');
      };
      
      img.onerror = () => {
        console.warn(`❌ Failed to load sprite for ${ch.name}: ${ch.sprite}`);
        this.spriteLoadStatus.set(ch.id, 'error');
      };
      
      this.spriteMap.set(ch.id, img);
      this.spriteLoadStatus.set(ch.id, 'loading');
    });

    // Bind handlers
    this._clickHandler = this.handleClick.bind(this);
    this._keyHandler   = this.handleKey.bind(this);
    canvas.addEventListener('click', this._clickHandler);
    window.addEventListener('keydown', this._keyHandler);

    this.animate = this.animate.bind(this);
    this._frame = requestAnimationFrame(this.animate);
  }
  /** Main animation loop */
  animate() {
    // Update preview fade-in animation
    if (this.previewMode && this.previewFadeIn < 1) {
      const elapsed = Date.now() - this.previewStartTime;
      this.previewFadeIn = Math.min(1, elapsed / 800); // 800ms fade-in
    }
    
    this.draw();
    this._frame = requestAnimationFrame(this.animate);
  }
  /** Draw the character grid */
  draw() {
    const ctx = this.ctx;
    const W = this.canvas.width;
    const H = this.canvas.height;
    ctx.clearRect(0, 0, W, H);

    if (this.previewMode) {
      this.drawCharacterPreview(ctx, W, H);
    } else {
      this.drawCharacterGrid(ctx, W, H);
    }
  }

  /** Draw the character selection grid */
  drawCharacterGrid(ctx, W, H) {

    // Background
    if (this.backgroundImage && this.backgroundImage.complete && this.backgroundImage.naturalWidth) {
      // Draw nice gradient overlay on top of the background image
      ctx.drawImage(this.backgroundImage, 0, 0, W, H);
      
      // Add a semi-transparent gradient overlay
      const gradient = ctx.createLinearGradient(0, 0, 0, H);
      gradient.addColorStop(0, 'rgba(25, 45, 130, 0.7)'); // Deep blue at top
      gradient.addColorStop(0.5, 'rgba(30, 58, 138, 0.5)'); // Medium blue
      gradient.addColorStop(1, 'rgba(30, 64, 175, 0.7)');  // Brighter blue at bottom
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, W, H);    } else {
      // Fallback fancy gradient if image isn't loaded
      const gradient = ctx.createLinearGradient(0, 0, 0, H);
      gradient.addColorStop(0, '#1E3A8A');    // Deep blue
      gradient.addColorStop(0.4, '#2563EB');  // Medium blue
      gradient.addColorStop(0.6, '#3B82F6');  // Lighter blue
      gradient.addColorStop(1, '#1E40AF');    // Return to deeper blue
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, W, H);
      
      // Add some decorative elements
      this.drawDecorations(ctx, W, H);
    }
    
    // Draw ambient particles
    this.drawParticles(ctx, W, H);    // Title
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('Choose Your Rival', W / 2, 20);

    // Clear buttons array before adding new ones
    this.buttons = [];

    // Home button
    this.drawHomeButton(ctx);    // Grid layout
    const count = characters.length;
    const cols = Math.min(count, 4);
    const rows = Math.ceil(count / cols);
    const boxW = 120;
    const boxH = 200; // Increased height to accommodate rarity info
    const spacingX = (W - cols * boxW) / (cols + 1);
    const spacingY = 20;
    const startY = 100;characters.forEach((ch, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const x = spacingX + col * (boxW + spacingX);
      const y = startY + row * (boxH + spacingY);

      // Get rarity colors
      const rarityColors = this.getRarityColors(ch.rarity || 'common');

      // Rarity background with glow effect
      ctx.save();
      ctx.shadowColor = rarityColors.glow;
      ctx.shadowBlur = 15;
      ctx.fillStyle = rarityColors.background;
      drawRoundedRect(ctx, x, y, boxW, boxW, 12);
      ctx.fill();
      ctx.restore();

      // Border with rarity color
      ctx.strokeStyle = rarityColors.border;
      ctx.lineWidth = 3;
      drawRoundedRect(ctx, x, y, boxW, boxW, 12);
      ctx.stroke();

      // Inner border for extra polish
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1;
      drawRoundedRect(ctx, x + 2, y + 2, boxW - 4, boxW - 4, 10);
      ctx.stroke();      // Sprite - improved positioning within the white square
      const img = this.spriteMap.get(ch.id);
      const loadStatus = this.spriteLoadStatus.get(ch.id);
      
      if (img && img.complete && img.naturalWidth && loadStatus === 'loaded') {
        // Add padding inside the card so sprite doesn't touch borders
        const padding = 12;
        const availableW = boxW - (padding * 2);
        const availableH = boxW - (padding * 2);
        
        // Scale to fit within the available area with padding
        const scale = Math.min(availableW / img.naturalWidth, availableH / img.naturalHeight);
        const imgW = img.naturalWidth * scale;
        const imgH = img.naturalHeight * scale;
        
        // Center within the padded area
        const imgX = x + padding + (availableW - imgW) / 2;
        const imgY = y + padding + (availableH - imgH) / 2;
        
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, imgX, imgY, imgW, imgH);      } else if (loadStatus === 'error') {
        // Draw fallback character icon when image failed to load
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = '48px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('👤', x + boxW/2, y + boxW/2);
        
        // Add error indicator
        ctx.fillStyle = 'rgba(255, 100, 100, 0.8)';
        ctx.font = '10px sans-serif';
        ctx.fillText('Image Error', x + boxW/2, y + boxW - 20);
      } else if (loadStatus === 'no-image') {
        // Character intentionally has no image - show clean placeholder
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.font = '64px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('👤', x + boxW/2, y + boxW/2);
      } else {
        // Loading state
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Loading...', x + boxW/2, y + boxW/2);
      }// Name
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(ch.name, x + boxW/2, y + boxW + 8);

      // Rarity label
      const rarity = (ch.rarity || 'common').toUpperCase();
      ctx.fillStyle = rarityColors.border;
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText(rarity, x + boxW/2, y + boxW + 28);      // Rarity indicator dots
      const rarityLevel = ['common', 'uncommon', 'rare', 'epic', 'super', 'legendary', 'mythic'].indexOf(ch.rarity || 'common') + 1;
      for (let i = 0; i < 5; i++) {
        ctx.fillStyle = i < rarityLevel ? rarityColors.border : 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.arc(x + boxW/2 - 20 + (i * 10), y + boxW + 45, 3, 0, Math.PI * 2);
        ctx.fill();
      }      // Register click area
      this.buttons.push({ x, y, w: boxW, h: boxW, id: ch.id });
    });
  }

  /** Draw character preview with grass background */
  drawCharacterPreview(ctx, W, H) {
    // Draw grass background
    ctx.fillStyle = '#2D5A27'; // Dark green grass-like color
    ctx.fillRect(0, 0, W, H);
    
    // Overlay terrain pattern if available
    if (this.grassTerrainImage && this.grassTerrainImage.complete && this.grassTerrainImage.naturalWidth) {
      const pattern = ctx.createPattern(this.grassTerrainImage, 'repeat');
      if (pattern) {
        ctx.fillStyle = pattern;
        ctx.fillRect(0, 0, W, H);
      }
    }

    // Apply fade-in effect
    ctx.save();
    ctx.globalAlpha = this.previewFadeIn;

    // Draw large character sprite
    const spriteSize = Math.min(W, H) * 0.4; // 40% of the smaller dimension
    const spriteX = W / 2 - spriteSize / 2;
    const spriteY = H / 2 - spriteSize / 2 - 50; // Offset up a bit

    // Character background with glow
    const rarityColors = this.getRarityColors(this.selectedCharacter.rarity || 'common');
    
    ctx.save();
    ctx.shadowColor = rarityColors.glow;
    ctx.shadowBlur = 30;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.beginPath();
    ctx.arc(W / 2, spriteY + spriteSize / 2, spriteSize / 2 + 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Draw character sprite
    const img = this.spriteMap.get(this.selectedCharacter.id);
    const loadStatus = this.spriteLoadStatus.get(this.selectedCharacter.id);
    
    if (img && img.complete && img.naturalWidth && loadStatus === 'loaded') {
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, spriteX, spriteY, spriteSize, spriteSize);
    } else if (loadStatus === 'error' || loadStatus === 'no-image') {
      // Draw fallback character icon
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.font = `${spriteSize * 0.6}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('👤', W / 2, spriteY + spriteSize / 2);
    } else {
      // Loading state
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Loading...', W / 2, spriteY + spriteSize / 2);
    }

    // Character name with fancy styling
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 48px sans-serif';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const nameY = spriteY + spriteSize + 30;
    ctx.strokeText(this.selectedCharacter.name, W / 2, nameY);
    ctx.fillText(this.selectedCharacter.name, W / 2, nameY);

    // Rarity label with enhanced styling
    const rarity = (this.selectedCharacter.rarity || 'common').toUpperCase();
    ctx.fillStyle = rarityColors.border;
    ctx.font = 'bold 24px sans-serif';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.strokeText(rarity, W / 2, nameY + 60);
    ctx.fillText(rarity, W / 2, nameY + 60);

    // Enhanced rarity indicator stars
    const rarityLevel = ['common', 'uncommon', 'rare', 'epic', 'super', 'legendary', 'mythic'].indexOf(this.selectedCharacter.rarity || 'common') + 1;
    const starSize = 15;
    const starSpacing = 35;
    const startX = W / 2 - ((Math.min(rarityLevel, 5) - 1) * starSpacing) / 2;
    
    for (let i = 0; i < Math.min(5, rarityLevel); i++) {
      const x = startX + (i * starSpacing);
      const y = nameY + 100;
      
      ctx.fillStyle = rarityColors.border;
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      
      // Draw star shape
      ctx.beginPath();
      for (let j = 0; j < 5; j++) {
        const angle = (j * Math.PI * 2) / 5 - Math.PI / 2;
        const radius = j % 2 === 0 ? starSize : starSize * 0.5;
        const starX = x + Math.cos(angle) * radius;
        const starY = y + Math.sin(angle) * radius;
        if (j === 0) ctx.moveTo(starX, starY);
        else ctx.lineTo(starX, starY);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.fill();
    }

    ctx.restore();

    // Clear buttons and add action buttons
    this.buttons = [];

    // Back button
    const backBtnW = 120;
    const backBtnH = 50;
    const backBtnX = 50;
    const backBtnY = H - 100;
    
    ctx.fillStyle = '#666666';
    this.drawRoundedRect(ctx, backBtnX, backBtnY, backBtnW, backBtnH, 10);
    ctx.fill();
    
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    this.drawRoundedRect(ctx, backBtnX, backBtnY, backBtnW, backBtnH, 10);
    ctx.stroke();
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('BACK', backBtnX + backBtnW/2, backBtnY + backBtnH/2);
    
    this.buttons.push({ x: backBtnX, y: backBtnY, w: backBtnW, h: backBtnH, type: 'back' });

    // Confirm button
    const confirmBtnW = 150;
    const confirmBtnH = 50;
    const confirmBtnX = W - confirmBtnW - 50;
    const confirmBtnY = H - 100;
    
    ctx.fillStyle = rarityColors.background;
    this.drawRoundedRect(ctx, confirmBtnX, confirmBtnY, confirmBtnW, confirmBtnH, 10);
    ctx.fill();
    
    ctx.strokeStyle = rarityColors.border;
    ctx.lineWidth = 3;
    this.drawRoundedRect(ctx, confirmBtnX, confirmBtnY, confirmBtnW, confirmBtnH, 10);
    ctx.stroke();
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('SELECT', confirmBtnX + confirmBtnW/2, confirmBtnY + confirmBtnH/2);
    
    this.buttons.push({ x: confirmBtnX, y: confirmBtnY, w: confirmBtnW, h: confirmBtnH, type: 'confirm', id: this.selectedCharacter.id });
  }
  /** Helper method to draw rounded rectangles */
  drawRoundedRect(ctx, x, y, w, h, r) {
    drawRoundedRect(ctx, x, y, w, h, r);
  }

  /** Draw ambient particles for a nice background effect */
  drawParticles(ctx, W, H) {
    try {
      // Use the current time for animation
      const time = Date.now() / 1000;
      
      // Draw 50 particles
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      for (let i = 0; i < 50; i++) {
        // Use sine waves with different frequencies for organic movement
        const x = ((i * 97) % W) + Math.sin(time * 0.5 + i * 0.3) * 20;
        const y = ((i * 61) % H) + Math.cos(time * 0.7 + i * 0.2) * 20;
        
        // Different sizes for depth effect - ensure size is always positive
        const size = Math.max(0.5, 1 + Math.sin(i + time) * 2);
        
        // Additional safety check
        if (size > 0 && isFinite(x) && isFinite(y)) {
          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } catch (error) {
      console.warn('Error drawing particles:', error);
      // Continue without particles if there's an error
    }
  }
  
  /** Draw the home button */
  drawHomeButton(ctx) {
    const btn = this.homeButton;
    
    // Button background
    ctx.fillStyle = '#3B82F6';
    drawRoundedRect(ctx, btn.x, btn.y, btn.w, btn.h, 8);
    ctx.fill();
    
    // Button border
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    drawRoundedRect(ctx, btn.x, btn.y, btn.w, btn.h, 8);
    ctx.stroke();
    
    // Button text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('HOME', btn.x + btn.w/2, btn.y + btn.h/2);
    
    // Add to clickable buttons
    this.buttons.push(btn);
  }

  /** Draw decorative elements for the background */
  drawDecorations(ctx, W, H) {
    // Draw some stars
    for (let i = 0; i < 100; i++) {
      const x = Math.random() * W;
      const y = Math.random() * H;
      const size = 0.5 + Math.random() * 2;
      const alpha = 0.3 + Math.random() * 0.7;
      
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Draw some distant nebulae
    for (let i = 0; i < 5; i++) {
      const x = Math.random() * W;
      const y = Math.random() * H;
      const size = 50 + Math.random() * 200;
      const alpha = 0.05 + Math.random() * 0.1;
      
      const colors = [
        'rgba(255, 100, 100, ' + alpha + ')',
        'rgba(100, 255, 100, ' + alpha + ')',
        'rgba(100, 100, 255, ' + alpha + ')',
        'rgba(255, 255, 100, ' + alpha + ')',
        'rgba(255, 100, 255, ' + alpha + ')'
      ];
      
      ctx.fillStyle = colors[i % colors.length];
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  /** Get rarity colors for character backgrounds */
  getRarityColors(rarity) {
    const rarityColors = {
      'common': {
        background: '#8B8B8B',    // Gray
        border: '#A0A0A0',
        glow: '#B5B5B5'
      },
      'uncommon': {
        background: '#4CAF50',    // Green
        border: '#66BB6A',
        glow: '#81C784'
      },
      'rare': {
        background: '#4CAF50',    // Green (updated for Chef)
        border: '#66BB6A',
        glow: '#81C784'
      },
      'epic': {
        background: '#9C27B0',    // Purple
        border: '#BA68C8',
        glow: '#CE93D8'
      },
      'super': {
        background: '#2196F3',    // Blue (for Nugget)
        border: '#42A5F5',
        glow: '#64B5F6'
      },      'legendary': {
        background: '#B8860B',    // Dark Yellow (for Tracy)
        border: '#DAA520',
        glow: '#FFD700'
      },
      'mythic': {
        background: '#FFEB3B',    // Light Yellow (for Skory and Wus)
        border: '#FFF176',
        glow: '#FFFF8D'
      }
    };

    return rarityColors[rarity] || rarityColors['common'];
  }
  /** Handle click to select character */
  handleClick(e) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;

    for (const btn of this.buttons) {
      if (mx >= btn.x && mx <= btn.x + btn.w && my >= btn.y && my <= btn.y + btn.h) {
        if (btn.type === 'home') {
          // Home button clicked - go back to menu
          this.onCancel();
          this.cleanup();
          return;
        } else if (btn.type === 'back') {
          // Back button in preview mode - return to character grid
          this.previewMode = false;
          this.selectedCharacter = null;
          this.previewFadeIn = 0;
          return;
        } else if (btn.type === 'confirm') {
          // Confirm button in preview mode - select character
          this.onSelect(btn.id);
          this.cleanup();
          return;
        } else if (!this.previewMode && btn.id !== undefined) {
          // Character clicked in grid mode - show preview
          this.selectedCharacter = characters.find(ch => ch.id === btn.id);
          if (this.selectedCharacter) {
            this.previewMode = true;
            this.previewFadeIn = 0;
            this.previewStartTime = Date.now();
          }
          return;
        }
      }
    }
  }
  /** Handle Escape to cancel */
  handleKey(e) {
    if (e.key === 'Escape') {
      if (this.previewMode) {
        // In preview mode, escape goes back to character grid
        this.previewMode = false;
        this.selectedCharacter = null;
        this.previewFadeIn = 0;
      } else {
        // In grid mode, escape exits to main menu
        this.onCancel();
        this.cleanup();
      }
    }
  }

  /** Remove listeners and stop animation */
  cleanup() {
    cancelAnimationFrame(this._frame);
    this.canvas.removeEventListener('click', this._clickHandler);
    window.removeEventListener('keydown', this._keyHandler);
  }
}
