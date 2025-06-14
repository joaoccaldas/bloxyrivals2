/**
 * Game Over Screen UI - Complete game over interface with player info and controls
 */

import { characters } from '../data/characterData.js';
import { BarrelRewardSystem } from './barrelRewardSystem.js';

export class GameOverScreen {
  /**
   * @param {HTMLCanvasElement} canvas - Game canvas
   * @param {Object} options - Configuration options
   * @param {string} options.playerName - Player's name
   * @param {number} options.characterId - Selected character ID
   * @param {number} options.finalScore - Final game score
   * @param {number} options.kills - Total kills
   * @param {number} options.timeSurvived - Time survived in seconds
   * @param {Object} options.gameMode - Game mode information
   * @param {Function} options.onRestart - Callback for restart button
   * @param {Function} options.onExit - Callback for exit button
   * @param {boolean} options.playerWon - Whether the player won the battle
   * @param {Function} options.onCollectReward - Callback for when a reward is collected
   */
  constructor(canvas, {
    playerName = 'Player',
    characterId = 0,
    finalScore = 0,
    kills = 0,
    timeSurvived = 0,
    gameMode = null,
    onRestart = () => {},
    onExit = () => {},
    playerWon = false,
    onCollectReward = () => {}
  }) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.playerName = playerName;
    this.characterId = characterId;
    this.finalScore = finalScore;
    this.kills = kills;    this.timeSurvived = timeSurvived;
    this.gameMode = gameMode;
    this.onRestart = onRestart;
    this.onExit = onExit;
    this.playerWon = playerWon;
    this.onCollectReward = onCollectReward;
    
    // Get character data
    this.character = characters.find(c => c.id === characterId) || characters[0];
    
    // Animation properties
    this.fadeIn = 0;
    this.pulseTimer = 0;
    this.sparkles = [];
    
    // Button definitions
    this.buttons = [];
    this.hoveredButton = null;
    
    // Barrel reward system
    this.barrelReward = null;
    this.showingBarrelReward = false;
    
    // Track collected rewards
    this.collectedRewards = {
      coins: 0,
      rivals: [],
      items: []
    };
    
    // Bind event handlers
    this.handleClick = this.handleClick.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    
    this.init();
  }
    init() {
    // Add event listeners
    this.canvas.addEventListener('click', this.handleClick);
    this.canvas.addEventListener('mousemove', this.handleMouseMove);
    window.addEventListener('keydown', this.handleKeyDown);
    
    // Setup buttons
    this.setupButtons();
    
    // Generate sparkles for visual appeal
    this.generateSparkles();
    
    // If player won, show barrel reward after a short delay
    if (this.playerWon) {
      // Add a "Claim Rewards" button
      this.addClaimRewardsButton();
    }
    
    // Start render loop
    this.render();
  }
  
  /**
   * Add a "Claim Rewards" button when player wins
   */
  addClaimRewardsButton() {
    const centerX = this.canvas.width / 2;
    const buttonY = this.canvas.height - 220; // Position above other buttons
    const buttonWidth = 220;
    const buttonHeight = 60;
    
    this.buttons.unshift({
      x: centerX - buttonWidth / 2,
      y: buttonY,
      width: buttonWidth,
      height: buttonHeight,
      text: '🎁 Claim Rewards',
      action: 'claim_rewards',
      color: '#FFD700', // Gold color for reward button
      hoverColor: '#FFC107'
    });
  }
  
  /**
   * Initiate barrel reward system
   */
  showBarrelReward() {
    // Only show barrel if player won and not already showing
    if (!this.playerWon || this.showingBarrelReward) return;
    
    this.showingBarrelReward = true;
    
    // Create barrel reward system
    this.barrelReward = new BarrelRewardSystem(this.canvas, {
      onComplete: (collectedRewards) => {
        console.log('Barrel rewards complete:', collectedRewards);
        this.showingBarrelReward = false;
        
        // Resume normal game over screen
        this.render();
      },
      onCollectReward: (reward) => {
        console.log('Reward collected:', reward);
        
        // Track collected rewards
        if (reward.type === 'coin') {
          this.collectedRewards.coins += reward.value;
        } else if (reward.type === 'rival') {
          this.collectedRewards.rivals.push(reward);
        } else if (reward.type === 'item') {
          this.collectedRewards.items.push(reward);
        }
        
        // Call the external callback
        this.onCollectReward(reward);
      }
    });
    
    // Determine number of rewards based on kills (more kills = more rewards)
    const numRewards = Math.min(Math.max(5, Math.floor(this.kills * 1.5)), 22);
    
    // Start the barrel animation with the calculated number of rewards
    this.barrelReward.start(numRewards);
  }
  
  setupButtons() {
    const centerX = this.canvas.width / 2;
    const buttonY = this.canvas.height - 150;
    const buttonWidth = 180;
    const buttonHeight = 50;
    const buttonSpacing = 200;
    
    this.buttons = [
      {
        x: centerX - buttonSpacing / 2 - buttonWidth / 2,
        y: buttonY,
        width: buttonWidth,
        height: buttonHeight,
        text: '🔄 Restart',
        action: 'restart',
        color: '#4CAF50',
        hoverColor: '#66BB6A'
      },
      {
        x: centerX + buttonSpacing / 2 - buttonWidth / 2,
        y: buttonY,
        width: buttonWidth,
        height: buttonHeight,
        text: '🚪 Exit',
        action: 'exit',
        color: '#F44336',
        hoverColor: '#EF5350'
      }
    ];
  }
  
  generateSparkles() {
    this.sparkles = [];
    for (let i = 0; i < 20; i++) {
      this.sparkles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        size: Math.random() * 3 + 1,
        speed: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.5 + 0.3,
        twinkle: Math.random() * Math.PI * 2
      });
    }
  }
  
  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
    render() {
    if (!this.canvas || !this.ctx) return;
    
    // Skip rendering if barrel reward is active
    if (this.showingBarrelReward) return;
    
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Update animation values
    this.fadeIn = Math.min(this.fadeIn + 0.02, 1);
    this.pulseTimer += 0.1;
    
    // Background gradient
    this.drawBackground();
    
    // Update and draw sparkles
    this.updateSparkles();
    this.drawSparkles();
    
    // Main content
    this.drawGameOverTitle();
    this.drawCharacterSprite();
    this.drawPlayerInfo();
    this.drawGameStats();
    this.drawButtons();
    
    // Draw reward summary if player won and rewards were collected
    if (this.playerWon && 
        (this.collectedRewards.coins > 0 || 
         this.collectedRewards.rivals.length > 0 || 
         this.collectedRewards.items.length > 0)) {
      this.drawRewardSummary();
    }
    
    // Continue animation
    requestAnimationFrame(() => this.render());
  }
  
  drawBackground() {
    const gradient = this.ctx.createRadialGradient(
      this.canvas.width / 2, this.canvas.height / 2, 0,
      this.canvas.width / 2, this.canvas.height / 2, Math.max(this.canvas.width, this.canvas.height) / 2
    );
    gradient.addColorStop(0, `rgba(25, 25, 50, ${0.9 * this.fadeIn})`);
    gradient.addColorStop(1, `rgba(10, 10, 30, ${0.95 * this.fadeIn})`);
    
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }
  
  updateSparkles() {
    this.sparkles.forEach(sparkle => {
      sparkle.y -= sparkle.speed;
      sparkle.twinkle += 0.1;
      
      if (sparkle.y < -10) {
        sparkle.y = this.canvas.height + 10;
        sparkle.x = Math.random() * this.canvas.width;
      }
    });
  }
  
  drawSparkles() {
    this.ctx.save();
    this.sparkles.forEach(sparkle => {
      const twinkleOpacity = (Math.sin(sparkle.twinkle) + 1) / 2;
      this.ctx.globalAlpha = sparkle.opacity * twinkleOpacity * this.fadeIn;
      this.ctx.fillStyle = '#FFD700';
      this.ctx.beginPath();
      this.ctx.arc(sparkle.x, sparkle.y, sparkle.size, 0, Math.PI * 2);
      this.ctx.fill();
    });
    this.ctx.restore();
  }
  
  drawGameOverTitle() {
    this.ctx.save();
    this.ctx.globalAlpha = this.fadeIn;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    
    // Main title with glow effect
    const pulse = Math.sin(this.pulseTimer) * 0.1 + 1;
    this.ctx.font = `bold ${48 * pulse}px Arial`;
    this.ctx.fillStyle = '#FF4444';
    this.ctx.strokeStyle = '#FFFFFF';
    this.ctx.lineWidth = 3;
    this.ctx.strokeText('GAME OVER', this.canvas.width / 2, 80);
    this.ctx.fillText('GAME OVER', this.canvas.width / 2, 80);
    
    this.ctx.restore();
  }
  
  drawCharacterSprite() {
    this.ctx.save();
    this.ctx.globalAlpha = this.fadeIn;
    
    const spriteSize = 120;
    const spriteX = this.canvas.width / 2 - spriteSize / 2;
    const spriteY = 120;
    
    // Character sprite background circle
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    this.ctx.beginPath();
    this.ctx.arc(this.canvas.width / 2, spriteY + spriteSize / 2, spriteSize / 2 + 10, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Load and draw character sprite
    const img = new Image();
    img.onload = () => {
      this.ctx.drawImage(img, spriteX, spriteY, spriteSize, spriteSize);
    };
    img.src = this.character.sprite;
    
    // Character name
    this.ctx.font = 'bold 24px Arial';
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(this.character.name, this.canvas.width / 2, spriteY + spriteSize + 30);
    
    this.ctx.restore();
  }
  
  drawPlayerInfo() {
    this.ctx.save();
    this.ctx.globalAlpha = this.fadeIn;
    this.ctx.textAlign = 'center';
    this.ctx.fillStyle = '#CCCCCC';
    this.ctx.font = '20px Arial';
    
    const y = 290;
    this.ctx.fillText(`Player: ${this.playerName}`, this.canvas.width / 2, y);
    
    this.ctx.restore();
  }
  
  drawGameStats() {
    this.ctx.save();
    this.ctx.globalAlpha = this.fadeIn;
    this.ctx.textAlign = 'center';
    
    const centerX = this.canvas.width / 2;
    let y = 340;
    
    // Game mode info
    if (this.gameMode) {
      this.ctx.font = 'bold 22px Arial';
      this.ctx.fillStyle = '#FFD700';
      this.ctx.fillText(`Mode: ${this.gameMode.name || 'Unknown'}`, centerX, y);
      y += 35;
    }
    
    // Stats background
    const statsWidth = 400;
    const statsHeight = 120;
    const statsX = centerX - statsWidth / 2;
    const statsY = y - 10;
    
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    this.ctx.fillRect(statsX, statsY, statsWidth, statsHeight);
    this.ctx.strokeStyle = '#444444';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(statsX, statsY, statsWidth, statsHeight);
    
    // Final Score
    this.ctx.font = 'bold 28px Arial';
    this.ctx.fillStyle = '#00FF00';
    this.ctx.fillText(`Final Score: ${this.finalScore.toLocaleString()}`, centerX, y + 25);
    
    // Secondary stats
    this.ctx.font = '18px Arial';
    this.ctx.fillStyle = '#FFFFFF';
    y += 55;
    
    // Left column
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`💀 Kills: ${this.kills}`, centerX - 180, y);
    this.ctx.fillText(`⏱️ Time: ${this.formatTime(this.timeSurvived)}`, centerX - 180, y + 25);
    
    // Right column
    this.ctx.textAlign = 'right';
    const averageKillTime = this.kills > 0 ? this.timeSurvived / this.kills : 0;
    const pointsPerKill = this.kills > 0 ? this.finalScore / this.kills : 0;
    this.ctx.fillText(`⚡ Avg Kill Time: ${averageKillTime.toFixed(1)}s`, centerX + 180, y);
    this.ctx.fillText(`💰 Points/Kill: ${pointsPerKill.toFixed(0)}`, centerX + 180, y + 25);
    
    this.ctx.restore();
  }
  
  drawButtons() {
    this.ctx.save();
    this.ctx.globalAlpha = this.fadeIn;
    
    this.buttons.forEach(button => {
      const isHovered = this.hoveredButton === button;
      const color = isHovered ? button.hoverColor : button.color;
      
      // Button background
      this.ctx.fillStyle = color;
      this.ctx.fillRect(button.x, button.y, button.width, button.height);
      
      // Button border
      this.ctx.strokeStyle = isHovered ? '#FFFFFF' : '#CCCCCC';
      this.ctx.lineWidth = isHovered ? 3 : 2;
      this.ctx.strokeRect(button.x, button.y, button.width, button.height);
      
      // Button text
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.font = 'bold 18px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(
        button.text,
        button.x + button.width / 2,
        button.y + button.height / 2
      );
      
      // Hover glow effect
      if (isHovered) {
        this.ctx.shadowColor = color;
        this.ctx.shadowBlur = 10;
        this.ctx.strokeRect(button.x, button.y, button.width, button.height);
        this.ctx.shadowBlur = 0;
      }
    });
    
    // Instructions
    this.ctx.font = '14px Arial';
    this.ctx.fillStyle = '#AAAAAA';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('Press SPACE to restart, ESC to exit', this.canvas.width / 2, this.canvas.height - 50);
    
    this.ctx.restore();
  }
  
  handleClick(e) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    for (const button of this.buttons) {
      if (x >= button.x && x <= button.x + button.width &&
          y >= button.y && y <= button.y + button.height) {
        
        if (button.action === 'restart') {
          this.onRestart();
        } else if (button.action === 'exit') {
          this.onExit();
        }
        
        this.cleanup();
        return;
      }
    }
  }
  
  handleMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    this.hoveredButton = null;
    
    for (const button of this.buttons) {
      if (x >= button.x && x <= button.x + button.width &&
          y >= button.y && y <= button.y + button.height) {
        this.hoveredButton = button;
        this.canvas.style.cursor = 'pointer';
        return;
      }
    }
    
    this.canvas.style.cursor = 'default';
  }
  
  handleKeyDown(e) {
    switch(e.key) {
      case ' ':
      case 'Enter':
        this.onRestart();
        this.cleanup();
        break;
      case 'Escape':
        this.onExit();
        this.cleanup();
        break;
    }
  }
  
  cleanup() {
    this.canvas.removeEventListener('click', this.handleClick);
    this.canvas.removeEventListener('mousemove', this.handleMouseMove);
    window.removeEventListener('keydown', this.handleKeyDown);
    this.canvas.style.cursor = 'default';
  }
}
