// gameModeSelector.js - Game Mode Selection UI

// MODIFIED: Import buttonAssets directly
import { gameModeInterface } from '../systems/gameModeInterface.js';
import { buttonAssets } from './buttons.js'; // Import the object

/**
 * Game Mode Selection UI
 * Allows players to choose between different game modes before starting
 */
export class GameModeSelector {
  constructor(canvas, onModeSelected, onBack, selectedCharacterId = 0) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.onModeSelected = onModeSelected || (() => {});
    this.onBack = onBack || (() => {});
    
    this.availableModes = gameModeInterface.getAvailableModes();
    this.selectedMode = 'time_based'; // Default selection
    this.hoveredMode = null;
    this.buttons = [];
    this.hoveredButton = null;
    
    // Character preview properties
    this.selectedCharacterId = selectedCharacterId;
    this.characterSprite = null;
    this.characterData = null;
    this.battlePose = 0; // Animation for battle ready pose
    
    // Scroll properties for mode selection
    this.scrollOffset = 0;
    this.maxScroll = 0;
    this.scrollSensitivity = 0.3;
      // Animation properties
    this.animationOffset = 0;
    this.animationSpeed = 0.08; // Increased for more visible effects

    // MODIFIED: Assign imported buttonAssets directly
    this.buttonAssets = buttonAssets;

    // Bind event handlers
    this._clickHandler = this.handleClick.bind(this);
    this._mouseMoveHandler = this.handleMouseMove.bind(this);
    this._keyHandler = this.handleKey.bind(this);
    this._resizeHandler = this.handleResize.bind(this);
    this._wheelHandler = this.handleWheel.bind(this);
    
    // Add event listeners
    this.canvas.addEventListener('click', this._clickHandler);
    this.canvas.addEventListener('mousemove', this._mouseMoveHandler);
    this.canvas.addEventListener('wheel', this._wheelHandler);
    window.addEventListener('keydown', this._keyHandler);
    window.addEventListener('resize', this._resizeHandler);
      // Start animation loop after ensuring buttonAssets is loaded
    this.animate = this.animate.bind(this);
    // MODIFIED: No need to await a custom initializer for buttonAssets anymore
    
    // Initialize character preview
    this.initializeCharacterPreview();
    
    this._frame = requestAnimationFrame(this.animate);
  }
  
  /**
   * Initialize character preview data
   */
  initializeCharacterPreview() {
    // Get character data
    import('../data/characterData.js').then(({ characters }) => {
      this.characterData = characters.find(c => c.id === this.selectedCharacterId) || characters[0];
      
      if (this.characterData && this.characterData.sprite) {
        this.characterSprite = new Image();
        this.characterSprite.src = this.characterData.sprite;
        this.characterSprite.onload = () => {
          console.log(`✅ Character sprite loaded for battle preview: ${this.characterData.name}`);
        };
        this.characterSprite.onerror = () => {
          console.warn(`❌ Failed to load character sprite: ${this.characterData.sprite}`);
          this.characterSprite = null;
        };
      } else {
        console.log('Character has no sprite, will use fallback');
      }
    }).catch(error => {
      console.error('Failed to load character data:', error);
    });
  }

  /**
   * Animation loop
   */
  animate() {
    this.animationOffset += this.animationSpeed;
    if (this.animationOffset > Math.PI * 2) {
      this.animationOffset = 0;
    }
    
    this.draw();
    this._frame = requestAnimationFrame(this.animate);
  }
  /**
   * Draw the game mode selection UI
   */
  draw() {
    const ctx = this.ctx;
    const W = this.canvas.width;
    const H = this.canvas.height;
    
    this.buttons = [];
    
    // Calculate responsive scaling
    const scale = Math.min(W / 1000, H / 800);
    const responsiveScale = Math.max(0.5, Math.min(1.2, scale));
      // Enhanced background gradient with multiple layers
    const primaryGradient = ctx.createLinearGradient(0, 0, 0, H);
    primaryGradient.addColorStop(0, '#0B1426');
    primaryGradient.addColorStop(0.3, '#1E3A5F');
    primaryGradient.addColorStop(0.7, '#2D5A87');
    primaryGradient.addColorStop(1, '#1A4B73');
    ctx.fillStyle = primaryGradient;
    ctx.fillRect(0, 0, W, H);
    
    // Secondary overlay gradient
    const overlayGradient = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, Math.max(W, H));
    overlayGradient.addColorStop(0, 'rgba(64, 224, 255, 0.1)');
    overlayGradient.addColorStop(0.5, 'rgba(100, 149, 237, 0.05)');
    overlayGradient.addColorStop(1, 'rgba(25, 25, 112, 0.15)');
    ctx.fillStyle = overlayGradient;
    ctx.fillRect(0, 0, W, H);
    
    // Add animated background elements
    this.drawAnimatedBackground(ctx, W, H);    
    
    // Enhanced title with multiple effects
    const titleY = 50 * responsiveScale;
    
    // Title glow effect
    ctx.save();
    ctx.shadowColor = '#00FFFF';
    ctx.shadowBlur = 20;
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold ${Math.floor(42 * responsiveScale)}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    
    // Animated title color shift
    const titleHue = (this.animationOffset * 30) % 360;
    const titleGradient = ctx.createLinearGradient(W/2 - 200, titleY, W/2 + 200, titleY);
    titleGradient.addColorStop(0, `hsl(${titleHue}, 80%, 70%)`);
    titleGradient.addColorStop(0.5, '#FFFFFF');
    titleGradient.addColorStop(1, `hsl(${(titleHue + 60) % 360}, 80%, 70%)`);
    ctx.fillStyle = titleGradient;
    ctx.fillText('⚡ SELECT GAME MODE ⚡', W / 2, titleY);
    
    // Title underline effect
    const underlineY = titleY + 55 * responsiveScale;
    const underlineGradient = ctx.createLinearGradient(W/2 - 150, underlineY, W/2 + 150, underlineY);
    underlineGradient.addColorStop(0, 'rgba(0, 255, 255, 0)');
    underlineGradient.addColorStop(0.5, 'rgba(0, 255, 255, 0.8)');
    underlineGradient.addColorStop(1, 'rgba(0, 255, 255, 0)');
    ctx.strokeStyle = underlineGradient;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(W/2 - 150, underlineY);
    ctx.lineTo(W/2 + 150, underlineY);
    ctx.stroke();
    
    ctx.restore();
    
    // Enhanced subtitle with glow
    ctx.save();
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = 10;
    ctx.font = `${Math.floor(20 * responsiveScale)}px Arial`;
    ctx.fillStyle = '#E0E0E0';
    ctx.fillText('🎮 Choose your preferred gameplay style 🎮', W / 2, titleY + 70 * responsiveScale);
    ctx.restore();
    
    // Calculate mode card dimensions for horizontal scrolling
    const cardWidth = Math.min(320 * responsiveScale, W * 0.28);
    const cardHeight = 380 * responsiveScale;
    const spacing = 30 * responsiveScale;
    const cardY = titleY + 120 * responsiveScale;
    
    // Calculate total width and scroll bounds
    const modes = Object.entries(this.availableModes);
    const totalCardsWidth = (cardWidth * modes.length) + (spacing * (modes.length - 1));
    const viewportWidth = W - 100 * responsiveScale; // Leave some margin
    this.maxScroll = Math.max(0, totalCardsWidth - viewportWidth);
    
    // Clamp scroll offset
    this.scrollOffset = Math.max(0, Math.min(this.scrollOffset, this.maxScroll));
    
    // Draw scroll indicators if needed
    if (this.maxScroll > 0) {
      this.drawScrollIndicators(ctx, W, cardY, cardHeight, responsiveScale);
    }
    
    // Draw mode cards with scroll offset
    ctx.save();
    ctx.beginPath();
    ctx.rect(50 * responsiveScale, cardY - 10, viewportWidth, cardHeight + 20);
    ctx.clip();
    
    const startX = 50 * responsiveScale - this.scrollOffset;
    modes.forEach(([modeType, modeData], index) => {
      const cardX = startX + (index * (cardWidth + spacing));
      // Only draw if card is visible
      if (cardX + cardWidth >= 0 && cardX <= W) {
        this.drawModeCard(ctx, modeType, modeData, cardX, cardY, cardWidth, cardHeight, responsiveScale);
      }
    });
    
    ctx.restore();
    
    // Draw character preview area
    this.drawCharacterPreview(ctx, W, H, responsiveScale);
    
    // Bottom buttons
    const btnWidth = 120 * responsiveScale;
    const btnHeight = 40 * responsiveScale;
    const btnY = H - 80 * responsiveScale;
    
    // Back button
    const backX = 50 * responsiveScale;
    this.drawButton(ctx, 'back', backX, btnY, btnWidth, btnHeight, responsiveScale);
    
    // Start button
    const startBtnX = W - 50 * responsiveScale - btnWidth;
    this.drawButton(ctx, 'start', startBtnX, btnY, btnWidth, btnHeight, responsiveScale);  }
  
  /**
   * Helper method to get CSS custom property values
   * @private
   */
  _getCSSProperty(property) {
    return getComputedStyle(document.documentElement)
      .getPropertyValue(property)
      .trim() || '#2563EB'; // fallback
  }
    /**
   * Draw animated background elements
   */
  drawAnimatedBackground(ctx, W, H) {
    ctx.save();
    
    // Animated grid background
    ctx.globalAlpha = 0.05;
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1;
    const gridSize = 50;
    const offsetX = (this.animationOffset * 10) % gridSize;
    const offsetY = (this.animationOffset * 15) % gridSize;
    
    for (let x = -gridSize + offsetX; x < W + gridSize; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    for (let y = -gridSize + offsetY; y < H + gridSize; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }
    
    // Floating energy orbs
    ctx.globalAlpha = 0.3;
    for (let i = 0; i < 12; i++) {
      const x = (i * 80 + Math.sin(this.animationOffset + i * 0.7) * 60) % W;
      const y = (i * 60 + Math.cos(this.animationOffset + i * 0.5) * 40) % H;
      const size = 4 + Math.sin(this.animationOffset + i) * 2;
      const hue = (this.animationOffset * 50 + i * 30) % 360;
      
      // Glowing orb effect
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, size * 3);
      gradient.addColorStop(0, `hsla(${hue}, 80%, 60%, 0.8)`);
      gradient.addColorStop(0.5, `hsla(${hue}, 80%, 60%, 0.3)`);
      gradient.addColorStop(1, `hsla(${hue}, 80%, 60%, 0)`);
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, size * 3, 0, Math.PI * 2);
      ctx.fill();
      
      // Core orb
      ctx.fillStyle = `hsla(${hue}, 100%, 80%, 0.9)`;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Animated scanlines
    ctx.globalAlpha = 0.08;
    ctx.strokeStyle = '#00FFFF';
    ctx.lineWidth = 2;
    const scanlineSpeed = this.animationOffset * 100;
    for (let i = 0; i < 5; i++) {
      const y = ((scanlineSpeed + i * 120) % (H + 200)) - 100;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }
    
    ctx.restore();
  }
  /**
   * Draw a game mode card
   */
  drawModeCard(ctx, modeType, modeData, x, y, width, height, scale) {
    const isSelected = this.selectedMode === modeType;
    const isHovered = this.hoveredMode === modeType;
    
    ctx.save();
    
    // Enhanced card shadow with glow effect
    if (isSelected || isHovered) {
      ctx.shadowColor = isSelected ? '#FFD700' : '#00FFFF';
      ctx.shadowBlur = isSelected ? 25 : 15;
      ctx.shadowOffsetY = 0;
      ctx.globalAlpha = 0.8;
      
      // Additional glow layer for selected cards
      if (isSelected) {
        const glowGradient = ctx.createRadialGradient(
          x + width/2, y + height/2, 0,
          x + width/2, y + height/2, Math.max(width, height)
        );
        glowGradient.addColorStop(0, 'rgba(255, 215, 0, 0.3)');
        glowGradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
        ctx.fillStyle = glowGradient;
        ctx.fillRect(x - 20, y - 20, width + 40, height + 40);
      }
    } else {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetY = 5;
    }
    
    // Animated border for selected card
    if (isSelected) {
      const borderPulse = Math.sin(this.animationOffset * 3) * 0.3 + 0.7;
      ctx.globalAlpha = borderPulse;
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 6;
      this.drawRoundedRect(ctx, x - 3, y - 3, width + 6, height + 6, 18);
      ctx.stroke();
    }
    
    ctx.globalAlpha = 1;
    
    // Card background with gradient
    const cardGradient = ctx.createLinearGradient(x, y, x, y + height);
    if (isSelected) {
      cardGradient.addColorStop(0, 'rgba(255, 215, 0, 0.2)');
      cardGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.95)');
      cardGradient.addColorStop(1, 'rgba(255, 215, 0, 0.1)');
    } else if (isHovered) {
      cardGradient.addColorStop(0, 'rgba(0, 255, 255, 0.1)');
      cardGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.9)');
      cardGradient.addColorStop(1, 'rgba(0, 255, 255, 0.05)');
    } else {
      cardGradient.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
      cardGradient.addColorStop(1, 'rgba(240, 240, 240, 0.9)');
    }
    
    ctx.fillStyle = cardGradient;
    ctx.strokeStyle = isSelected ? '#FFD700' : (isHovered ? '#00FFFF' : '#CCCCCC');
    ctx.lineWidth = isSelected ? 4 : 2;
    
    this.drawRoundedRect(ctx, x, y, width, height, 15);
    ctx.fill();
    ctx.stroke();
    
    // Store click area for this card
    this.buttons.push({
      type: 'mode',
      modeType: modeType,
      x, y, w: width, h: height
    });
    
    // Enhanced mode icon with glow effect
    const iconSize = 60 * scale;
    const iconY = y + 30 * scale;
    ctx.font = `${iconSize}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    
    // Icon glow effect
    if (isSelected || isHovered) {
      ctx.shadowColor = isSelected ? '#FFD700' : '#00FFFF';
      ctx.shadowBlur = 15;
      ctx.fillStyle = isSelected ? '#FFD700' : '#00FFFF';
    } else {
      ctx.shadowBlur = 0;
      ctx.fillStyle = this._getCSSProperty('--secondary-color');
    }
    ctx.fillText(modeData.icon, x + width / 2, iconY);
    
    // Reset shadow for text
    ctx.shadowBlur = 0;
    
    // Mode name with enhanced styling
    ctx.font = `bold ${Math.floor(24 * scale)}px Arial`;
    if (isSelected) {
      // Text gradient effect for selected cards
      const textGradient = ctx.createLinearGradient(x, iconY + iconSize + 20 * scale, x, iconY + iconSize + 40 * scale);
      textGradient.addColorStop(0, '#FF6B35');
      textGradient.addColorStop(1, '#F7931E');
      ctx.fillStyle = textGradient;
    } else {
      ctx.fillStyle = isHovered ? '#0066CC' : this._getCSSProperty('--text-dark');
    }
    ctx.fillText(modeData.name, x + width / 2, iconY + iconSize + 20 * scale);
    
    // Mode description with better styling
    ctx.font = `${Math.floor(14 * scale)}px Arial`;
    ctx.fillStyle = isSelected ? '#333333' : this._getCSSProperty('--secondary-color');
    const descY = iconY + iconSize + 60 * scale;
    this.drawWrappedText(ctx, modeData.description, x + 20 * scale, descY, width - 40 * scale, 16 * scale);
    
    // Enhanced features list
    if (modeData.features) {
      ctx.font = `${Math.floor(12 * scale)}px Arial`;
      ctx.fillStyle = isSelected ? '#444444' : this._getCSSProperty('--text-dark');
      const featuresY = descY + 60 * scale;
      
      modeData.features.forEach((feature, index) => {
        const featureY = featuresY + (index * 18 * scale);
        ctx.textAlign = 'left';
        
        // Feature bullet with icon
        ctx.fillStyle = isSelected ? '#FFD700' : '#4CAF50';
        ctx.fillText('⚡', x + 20 * scale, featureY);
        
        // Feature text
        ctx.fillStyle = isSelected ? '#444444' : this._getCSSProperty('--text-dark');
        ctx.fillText(feature, x + 35 * scale, featureY);
      });
    }
    
    // Enhanced selection indicator
    if (isSelected) {
      // Animated selection badge
      const badgeX = x + width - 35 * scale;
      const badgeY = y + 25 * scale;
      const badgeSize = 12 * scale;
      const pulse = Math.sin(this.animationOffset * 4) * 0.2 + 0.8;
      
      // Badge glow
      ctx.shadowColor = '#FFD700';
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#FFD700';
      ctx.globalAlpha = pulse;
      ctx.beginPath();
      ctx.arc(badgeX, badgeY, badgeSize, 0, Math.PI * 2);
      ctx.fill();
      
      // Checkmark
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 3 * scale;
      ctx.beginPath();
      ctx.moveTo(badgeX - 6 * scale, badgeY);
      ctx.lineTo(badgeX - 2 * scale, badgeY + 4 * scale);
      ctx.lineTo(badgeX + 6 * scale, badgeY - 4 * scale);
      ctx.stroke();
    }
    
    // Hover effect border animation
    if (isHovered && !isSelected) {
      const hoverPulse = Math.sin(this.animationOffset * 2) * 0.5 + 0.5;
      ctx.globalAlpha = hoverPulse * 0.6;
      ctx.strokeStyle = '#00FFFF';
      ctx.lineWidth = 3;
      this.drawRoundedRect(ctx, x - 2, y - 2, width + 4, height + 4, 17);
      ctx.stroke();
    }
    
    ctx.restore();
  }
  /**
   * Draw a button
   */
  drawButton(ctx, buttonType, x, y, width, height, scale) {
    const isHovered = this.hoveredButton === buttonType;
    
    ctx.save();
    
    // Enhanced button shadow and glow
    if (isHovered) {
      ctx.shadowColor = buttonType === 'start' ? '#00FF00' : '#FF6B35';
      ctx.shadowBlur = 15;
      ctx.shadowOffsetY = 0;
    } else {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetY = 4;
    }
    
    // Store click area
    this.buttons.push({
      type: 'button',
      action: buttonType,
      x, y, w: width, h: height
    });
    
    // Enhanced button background
    const buttonGradient = ctx.createLinearGradient(x, y, x, y + height);
    if (buttonType === 'start') {
      if (isHovered) {
        buttonGradient.addColorStop(0, '#00FF88');
        buttonGradient.addColorStop(1, '#00CC44');
      } else {
        buttonGradient.addColorStop(0, '#4CAF50');
        buttonGradient.addColorStop(1, '#2E7D32');
      }
    } else { // back button
      if (isHovered) {
        buttonGradient.addColorStop(0, '#FF8A50');
        buttonGradient.addColorStop(1, '#FF5722');
      } else {
        buttonGradient.addColorStop(0, '#666666');
        buttonGradient.addColorStop(1, '#424242');
      }
    }
    
    ctx.fillStyle = buttonGradient;
    
    // Button border with animation
    if (isHovered) {
      const borderPulse = Math.sin(this.animationOffset * 4) * 0.3 + 0.7;
      ctx.strokeStyle = buttonType === 'start' ? '#00FF00' : '#FF6B35';
      ctx.lineWidth = 3 * borderPulse;
    } else {
      ctx.strokeStyle = '#888888';
      ctx.lineWidth = 2;
    }
    
    // Draw button with rounded corners
    this.drawRoundedRect(ctx, x, y, width, height, 8);
    ctx.fill();
    ctx.stroke();
    
    // Button text with enhanced styling
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold ${Math.floor(16 * scale)}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Button icons and text
    const centerX = x + width / 2;
    const centerY = y + height / 2;
    
    if (buttonType === 'start') {
      ctx.fillText('▶ START', centerX, centerY);
    } else if (buttonType === 'back') {
      ctx.fillText('◀ BACK', centerX, centerY);
    }
    
    // Hover effect overlay
    if (isHovered) {
      ctx.globalAlpha = 0.2;
      ctx.fillStyle = '#FFFFFF';
      this.drawRoundedRect(ctx, x, y, width, height, 8);
      ctx.fill();
    }
    
    ctx.restore();
  }

  /**
   * Draw wrapped text within a specified width
   */
  drawWrappedText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    let currentY = y;
    
    ctx.textAlign = 'left';
    
    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + ' ';
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      
      if (testWidth > maxWidth && i > 0) {
        ctx.fillText(line, x, currentY);
        line = words[i] + ' ';
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, currentY);
  }

  /**
   * Draw rounded rectangle
   */
  drawRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }
  /**
   * Draw scroll indicators
   */
  drawScrollIndicators(ctx, W, cardY, cardHeight, scale) {
    const indicatorY = cardY + cardHeight / 2;
    const arrowSize = 25 * scale;
    const pulseScale = Math.sin(this.animationOffset * 3) * 0.2 + 0.8;
    
    ctx.save();
    
    // Left scroll indicator
    if (this.scrollOffset > 0) {
      ctx.shadowColor = '#00FFFF';
      ctx.shadowBlur = 15;
      ctx.fillStyle = '#00FFFF';
      ctx.globalAlpha = pulseScale;
      
      ctx.save();
      ctx.translate(30 * scale, indicatorY);
      ctx.scale(pulseScale, pulseScale);
      
      // Animated arrow with glow
      ctx.beginPath();
      ctx.arc(0, 0, arrowSize, 0, Math.PI * 2);
      ctx.fill();
      
      // Arrow shape
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.moveTo(-5, 0);
      ctx.lineTo(5, -8);
      ctx.lineTo(5, 8);
      ctx.closePath();
      ctx.fill();
      
      ctx.restore();
    }
    
    // Right scroll indicator
    if (this.scrollOffset < this.maxScroll) {
      ctx.shadowColor = '#00FFFF';
      ctx.shadowBlur = 15;
      ctx.fillStyle = '#00FFFF';
      ctx.globalAlpha = pulseScale;
      
      ctx.save();
      ctx.translate(W - 30 * scale, indicatorY);
      ctx.scale(pulseScale, pulseScale);
      
      // Animated arrow with glow
      ctx.beginPath();
      ctx.arc(0, 0, arrowSize, 0, Math.PI * 2);
      ctx.fill();
      
      // Arrow shape
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.moveTo(5, 0);
      ctx.lineTo(-5, -8);
      ctx.lineTo(-5, 8);
      ctx.closePath();
      ctx.fill();
      
      ctx.restore();
    }
    
    ctx.restore();
  }
  /**
   * Handle mouse click
   */
  handleClick(e) {
    const rect = this.canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (this.canvas.width / rect.width);
    const my = (e.clientY - rect.top) * (this.canvas.height / rect.height);
    
    for (const btn of this.buttons) {
      if (mx >= btn.x && mx <= btn.x + btn.w && my >= btn.y && my <= btn.y + btn.h) {
        if (btn.type === 'mode') {
          // Select mode and start game directly
          this.selectedMode = btn.modeType;
          gameModeInterface.selectMode(this.selectedMode);
          this.onModeSelected(this.selectedMode);
        } else if (btn.type === 'button') {
          if (btn.action === 'back') {
            this.onBack();
          } else if (btn.action === 'start') {
            // Select the mode and start
            gameModeInterface.selectMode(this.selectedMode);
            this.onModeSelected(this.selectedMode);
          }
        }
        break;
      }
    }
  }

  /**
   * Handle mouse movement for hover effects
   */
  handleMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (this.canvas.width / rect.width);
    const my = (e.clientY - rect.top) * (this.canvas.height / rect.height);
    
    let newHoveredMode = null;
    let newHoveredButton = null;
    
    for (const btn of this.buttons) {
      if (mx >= btn.x && mx <= btn.x + btn.w && my >= btn.y && my <= btn.y + btn.h) {
        if (btn.type === 'mode') {
          newHoveredMode = btn.modeType;
        } else if (btn.type === 'button') {
          newHoveredButton = btn.action;
        }
        break;
      }
    }
    
    // Update hover states if they changed
    if (newHoveredMode !== this.hoveredMode || newHoveredButton !== this.hoveredButton) {
      this.hoveredMode = newHoveredMode;
      this.hoveredButton = newHoveredButton;
      // Redraw to show hover effects
      this.draw();
    }
  }

  /**
   * Handle keyboard input
   */
  handleKey(e) {
    switch (e.key) {
      case 'Escape':
        this.onBack();
        break;
      case 'Enter':
        gameModeInterface.selectMode(this.selectedMode);
        this.onModeSelected(this.selectedMode);
        break;
      case 'ArrowLeft':
      case 'ArrowRight':
        // Toggle between modes
        const modes = Object.keys(this.availableModes);
        const currentIndex = modes.indexOf(this.selectedMode);
        if (e.key === 'ArrowLeft') {
          this.selectedMode = modes[(currentIndex - 1 + modes.length) % modes.length];
        } else {
          this.selectedMode = modes[(currentIndex + 1) % modes.length];
        }
        this.draw();
        break;
    }
  }

  /**
   * Handle window resize
   */
  handleResize() {
    setTimeout(() => {
      this.draw();
    }, 100);
  }

  /**
   * Handle wheel events for scrolling
   */
  handleWheel(e) {
    e.preventDefault();
    const scrollAmount = e.deltaX || e.deltaY;
    this.scrollOffset += scrollAmount * this.scrollSensitivity;
    this.scrollOffset = Math.max(0, Math.min(this.scrollOffset, this.maxScroll));
  }

  /**
   * Get the currently selected mode
   */
  getSelectedMode() {
    return this.selectedMode;
  }

  /**
   * Set the selected mode programmatically
   */
  setSelectedMode(modeType) {
    if (this.availableModes[modeType]) {
      this.selectedMode = modeType;
      this.draw();
    }
  }
  /**
   * Draw character preview with grass background and golden plate
   */
  drawCharacterPreview(ctx, W, H, responsiveScale) {
    // Skip if no character data available
    if (!this.characterData) return;
    
    // Animation update
    this.battlePose += 0.05;
    
    // Preview area dimensions (bottom right corner)
    const previewWidth = 300 * responsiveScale;
    const previewHeight = 200 * responsiveScale;
    const previewX = W - previewWidth - 20 * responsiveScale;
    const previewY = H - previewHeight - 20 * responsiveScale;
    
    ctx.save();
      // Clip to preview area
    ctx.beginPath();
    this.drawRoundedRect(ctx, previewX, previewY, previewWidth, previewHeight, 15 * responsiveScale);
    ctx.clip();
    
    // Grass background
    ctx.fillStyle = '#2D5A27'; // Dark green grass color
    ctx.fillRect(previewX, previewY, previewWidth, previewHeight);
    
    // Add grass texture pattern
    ctx.fillStyle = '#3B7233';
    for (let i = 0; i < 20; i++) {
      const x = previewX + (i * 15 * responsiveScale) % previewWidth;
      const y = previewY + Math.sin(i * 0.5 + this.battlePose) * 5 * responsiveScale + previewHeight * 0.8;
      ctx.fillRect(x, y, 3 * responsiveScale, 10 * responsiveScale);
    }
    
    // Golden plate/platform
    const plateWidth = previewWidth * 0.8;
    const plateHeight = 20 * responsiveScale;
    const plateX = previewX + (previewWidth - plateWidth) / 2;
    const plateY = previewY + previewHeight * 0.7;
    
    // Plate gradient
    const plateGradient = ctx.createLinearGradient(plateX, plateY, plateX, plateY + plateHeight);
    plateGradient.addColorStop(0, '#FFD700');
    plateGradient.addColorStop(0.5, '#FFA500');
    plateGradient.addColorStop(1, '#FF8C00');
    
    ctx.fillStyle = plateGradient;
    ctx.beginPath();
    ctx.ellipse(plateX + plateWidth/2, plateY + plateHeight/2, plateWidth/2, plateHeight/2, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Plate shine effect
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.ellipse(plateX + plateWidth/2, plateY + plateHeight/3, plateWidth/3, plateHeight/4, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Character sprite
    const charSize = 80 * responsiveScale;
    const charX = previewX + (previewWidth - charSize) / 2;
    const charY = plateY - charSize - 10 * responsiveScale + Math.sin(this.battlePose) * 5 * responsiveScale;
    
    // Rarity glow effect
    const rarityColors = this.getRarityColors(this.characterData.rarity || 'common');
    ctx.shadowColor = rarityColors.glow;
    ctx.shadowBlur = 20 * responsiveScale;
    
    if (this.characterSprite && this.characterSprite.complete && this.characterSprite.naturalWidth) {
      ctx.drawImage(this.characterSprite, charX, charY, charSize, charSize);
    } else {
      // Fallback character icon
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.font = `${charSize * 0.6}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('👤', charX + charSize/2, charY + charSize/2);
    }
    
    ctx.shadowBlur = 0;
    
    // Character name
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold ${16 * responsiveScale}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    
    const nameText = this.characterData.name;
    const nameY = previewY + 10 * responsiveScale;
    ctx.strokeText(nameText, previewX + previewWidth/2, nameY);
    ctx.fillText(nameText, previewX + previewWidth/2, nameY);
    
    // "Ready for Battle!" indicator
    ctx.fillStyle = rarityColors.border;
    ctx.font = `bold ${12 * responsiveScale}px Arial`;
    const battleText = 'Ready for Battle!';
    const battleY = previewY + previewHeight - 15 * responsiveScale;
    ctx.strokeText(battleText, previewX + previewWidth/2, battleY);
    ctx.fillText(battleText, previewX + previewWidth/2, battleY);
    
    ctx.restore();
      // Preview border
    ctx.strokeStyle = rarityColors.border;
    ctx.lineWidth = 3 * responsiveScale;
    ctx.beginPath();
    this.drawRoundedRect(ctx, previewX, previewY, previewWidth, previewHeight, 15 * responsiveScale);
    ctx.stroke();
  }
  
  /**
   * Get rarity-based colors for character display
   */
  getRarityColors(rarity) {
    const colors = {
      common: {
        glow: '#90EE90',
        background: 'rgba(144, 238, 144, 0.2)',
        border: '#90EE90'
      },
      uncommon: {
        glow: '#87CEEB',
        background: 'rgba(135, 206, 235, 0.2)',
        border: '#87CEEB'
      },
      rare: {
        glow: '#4169E1',
        background: 'rgba(65, 105, 225, 0.2)',
        border: '#4169E1'
      },
      epic: {
        glow: '#9932CC',
        background: 'rgba(153, 50, 204, 0.2)',
        border: '#9932CC'
      },
      super: {
        glow: '#FF6347',
        background: 'rgba(255, 99, 71, 0.2)',
        border: '#FF6347'
      },
      legendary: {
        glow: '#FFD700',
        background: 'rgba(255, 215, 0, 0.2)',
        border: '#FFD700'
      },
      mythic: {
        glow: '#FF1493',
        background: 'rgba(255, 20, 147, 0.2)',
        border: '#FF1493'
      }
    };
    
    return colors[rarity] || colors.common;
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    cancelAnimationFrame(this._frame);
    this.canvas.removeEventListener('click', this._clickHandler);
    this.canvas.removeEventListener('mousemove', this._mouseMoveHandler);
    window.removeEventListener('keydown', this._keyHandler);
    window.removeEventListener('resize', this._resizeHandler);
  }
}
