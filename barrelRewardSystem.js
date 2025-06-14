/**
 * Barrel Reward System - Handles the barrel opening animation and rewards
 * Rewards include: Rivals, coins, and other items
 */

export class BarrelRewardSystem {
  /**
   * @param {HTMLCanvasElement} canvas - Game canvas
   * @param {Object} options - Configuration options
   * @param {Function} options.onComplete - Callback when barrel animation is complete
   * @param {Function} options.onCollectReward - Callback when player collects a reward
   */
  constructor(canvas, {
    onComplete = () => {},
    onCollectReward = () => {}
  }) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.onComplete = onComplete;
    this.onCollectReward = onCollectReward;
    
    // Animation properties
    this.isPlaying = false;
    this.animationStep = 0;
    this.animationTimer = 0;
    this.rewards = [];
    this.collectedRewards = [];
    this.barrelOpened = false;
    
    // Barrel properties
    this.barrelImg = new Image();
    this.barrelImg.src = 'assets/reward/barrel_closed.png';
    this.barrelOpenImg = new Image();
    this.barrelOpenImg.src = 'assets/reward/barrel_open.png';
    
    // Reward item images
    this.coinImg = new Image();
    this.coinImg.src = 'assets/reward/coin.png';
    this.rivalImg = new Image();
    this.rivalImg.src = 'assets/reward/rival.png';
    this.itemImg = new Image();
    this.itemImg.src = 'assets/reward/item.png';
    
    // Bind event handlers
    this.handleClick = this.handleClick.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.update = this.update.bind(this);
    this.render = this.render.bind(this);
  }
  
  /**
   * Start the barrel reward animation
   * @param {number} numRewards - Number of rewards to generate
   */
  start(numRewards = 5) {
    this.isPlaying = true;
    this.animationStep = 0;
    this.animationTimer = 0;
    this.barrelOpened = false;
    this.rewards = [];
    this.collectedRewards = [];
    
    // Generate random rewards (between 2 and 22 items)
    const rewardCount = numRewards || Math.floor(Math.random() * 21) + 2;
    
    for (let i = 0; i < rewardCount; i++) {
      this.rewards.push(this.generateRandomReward());
    }
    
    // Add event listeners
    this.canvas.addEventListener('click', this.handleClick);
    this.canvas.addEventListener('mousemove', this.handleMouseMove);
    
    // Start animation loop
    this.lastTime = performance.now();
    requestAnimationFrame(this.update);
  }
  
  /**
   * Generate a random reward item
   * @returns {Object} Reward object
   */
  generateRandomReward() {
    const rewardTypes = ['coin', 'rival', 'item'];
    const type = rewardTypes[Math.floor(Math.random() * rewardTypes.length)];
    
    // Generate random position (will be updated during animation)
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    
    let value = 1;
    if (type === 'coin') {
      // Coins can have different values (1-100)
      value = Math.floor(Math.random() * 100) + 1;
    }
    
    return {
      type,
      value,
      x: centerX,
      y: centerY,
      targetX: centerX + (Math.random() * 400) - 200,
      targetY: centerY + (Math.random() * 300) - 100,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() * 0.2) - 0.1,
      scale: 0,
      targetScale: 0.6 + Math.random() * 0.4,
      collected: false,
      hovered: false,
      bounceOffset: 0,
      bounceSpeed: 0.05 + Math.random() * 0.05,
      bounceHeight: 10 + Math.random() * 10
    };
  }
  
  /**
   * Update the animation
   * @param {number} timestamp - Current timestamp
   */
  update(timestamp) {
    const deltaTime = timestamp - (this.lastTime || timestamp);
    this.lastTime = timestamp;
    
    this.animationTimer += deltaTime;
    
    // Step 1: Barrel appearance animation
    if (this.animationStep === 0) {
      if (this.animationTimer >= 1000) {
        this.animationStep = 1;
        this.animationTimer = 0;
      }
    } 
    // Step 2: Barrel shaking animation
    else if (this.animationStep === 1) {
      if (this.animationTimer >= 2000) {
        this.animationStep = 2;
        this.animationTimer = 0;
        this.barrelOpened = true;
      }
    }
    // Step 3: Barrel opening and rewards popping out
    else if (this.animationStep === 2) {
      if (this.animationTimer >= 1500) {
        this.animationStep = 3;
        this.animationTimer = 0;
      }
    }
    
    // Update reward items
    this.rewards.forEach(reward => {
      if (this.animationStep >= 2) {
        // Scale up the rewards when barrel opens
        if (reward.scale < reward.targetScale) {
          reward.scale = Math.min(reward.scale + deltaTime * 0.003, reward.targetScale);
        }
        
        // Move rewards to their target positions
        if (this.animationStep >= 2) {
          const moveSpeed = 0.004;
          reward.x += (reward.targetX - reward.x) * moveSpeed * deltaTime;
          reward.y += (reward.targetY - reward.y) * moveSpeed * deltaTime;
        }
        
        // Add rotation
        reward.rotation += reward.rotationSpeed * deltaTime * 0.01;
        
        // Add bouncing effect for non-collected rewards
        if (!reward.collected) {
          reward.bounceOffset = Math.sin(this.animationTimer * reward.bounceSpeed * 0.01) * reward.bounceHeight;
        }
      }
    });
    
    // Check if all rewards have been collected
    const allCollected = this.rewards.every(reward => reward.collected);
    if (allCollected && this.animationStep === 3 && this.rewards.length > 0) {
      this.animationStep = 4;
      this.animationTimer = 0;
    }
    
    // End animation after a delay once all rewards are collected
    if (this.animationStep === 4 && this.animationTimer >= 2000) {
      this.stop();
      return;
    }
    
    this.render();
    
    if (this.isPlaying) {
      requestAnimationFrame(this.update);
    }
  }
  
  /**
   * Render the barrel and rewards
   */
  render() {
    // Clear canvas (transparent overlay)
    this.ctx.save();
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw title
    this.ctx.font = 'bold 48px Arial';
    this.ctx.fillStyle = '#FFD700';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('Victory Reward!', this.canvas.width / 2, 80);
    
    // Draw subtitle
    if (this.animationStep < 2) {
      this.ctx.font = 'bold 24px Arial';
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.fillText('Click the barrel to open it!', this.canvas.width / 2, 130);
    } else if (this.animationStep === 3) {
      this.ctx.font = 'bold 24px Arial';
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.fillText('Click on rewards to collect them!', this.canvas.width / 2, 130);
    } else if (this.animationStep === 4) {
      this.ctx.font = 'bold 24px Arial';
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.fillText('All rewards collected!', this.canvas.width / 2, 130);
    }
    
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    
    // Draw barrel with animation
    if (this.animationStep < 2) {
      // Draw closed barrel with shake effect
      const shakeAmount = (this.animationStep === 1) ? Math.sin(this.animationTimer * 0.02) * 5 : 0;
      
      this.ctx.save();
      this.ctx.translate(centerX + shakeAmount, centerY);
      this.ctx.drawImage(
        this.barrelImg, 
        -100, -100, 
        200, 200
      );
      this.ctx.restore();
    } else {
      // Draw open barrel
      this.ctx.save();
      this.ctx.translate(centerX, centerY);
      this.ctx.drawImage(
        this.barrelOpenImg, 
        -100, -100, 
        200, 200
      );
      this.ctx.restore();
      
      // Draw rewards
      this.rewards.forEach(reward => {
        if (!reward.collected) {
          this.ctx.save();
          
          // Apply position, rotation and scale
          this.ctx.translate(reward.x, reward.y + reward.bounceOffset);
          this.ctx.rotate(reward.rotation);
          this.ctx.scale(reward.scale, reward.scale);
          
          // Add glow effect for hovered items
          if (reward.hovered) {
            this.ctx.shadowColor = '#FFD700';
            this.ctx.shadowBlur = 20;
          }
          
          // Draw based on reward type
          let rewardImg;
          switch (reward.type) {
            case 'coin':
              rewardImg = this.coinImg;
              break;
            case 'rival':
              rewardImg = this.rivalImg;
              break;
            case 'item':
            default:
              rewardImg = this.itemImg;
              break;
          }
          
          this.ctx.drawImage(rewardImg, -30, -30, 60, 60);
          
          // Draw value for coins
          if (reward.type === 'coin') {
            this.ctx.font = 'bold 16px Arial';
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(reward.value.toString(), 0, 0);
          }
          
          this.ctx.restore();
        }
      });
      
      // Draw collected rewards counter
      const collectedCount = this.rewards.filter(r => r.collected).length;
      const totalCount = this.rewards.length;
      
      this.ctx.font = 'bold 24px Arial';
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(`${collectedCount}/${totalCount} rewards collected`, this.canvas.width / 2, this.canvas.height - 100);
    }
    
    this.ctx.restore();
  }
  
  /**
   * Handle click events
   * @param {MouseEvent} e - Click event
   */
  handleClick(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Check if barrel is clicked before opening
    if (this.animationStep < 2) {
      const centerX = this.canvas.width / 2;
      const centerY = this.canvas.height / 2;
      
      // Check if click is within barrel
      const distX = x - centerX;
      const distY = y - centerY;
      const distance = Math.sqrt(distX * distX + distY * distY);
      
      if (distance <= 100) {
        // Skip to barrel opening
        this.animationStep = 2;
        this.animationTimer = 0;
        this.barrelOpened = true;
      }
    }
    // Check if any rewards are clicked
    else if (this.animationStep === 3) {
      this.rewards.forEach(reward => {
        if (!reward.collected) {
          // Check if click is within reward
          const distX = x - reward.x;
          const distY = y - reward.y - reward.bounceOffset;
          const distance = Math.sqrt(distX * distX + distY * distY);
          const hitRadius = 30 * reward.scale;
          
          if (distance <= hitRadius) {
            reward.collected = true;
            this.collectedRewards.push(reward);
            
            // Call onCollectReward callback
            this.onCollectReward(reward);
            
            // Play collection sound
            this.playCollectionSound(reward.type);
          }
        }
      });
    }
  }
  
  /**
   * Handle mouse move events for hover effects
   * @param {MouseEvent} e - Mouse move event
   */
  handleMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Update hover state for rewards
    this.rewards.forEach(reward => {
      if (!reward.collected && this.animationStep === 3) {
        const distX = x - reward.x;
        const distY = y - reward.y - reward.bounceOffset;
        const distance = Math.sqrt(distX * distX + distY * distY);
        const hitRadius = 30 * reward.scale;
        
        reward.hovered = distance <= hitRadius;
      } else {
        reward.hovered = false;
      }
    });
  }
  
  /**
   * Play sound effect for collecting reward
   * @param {string} rewardType - Type of reward collected
   */
  playCollectionSound(rewardType) {
    let sound;
    switch (rewardType) {
      case 'coin':
        sound = new Audio('assets/sounds/coin_collect.mp3');
        break;
      case 'rival':
        sound = new Audio('assets/sounds/rival_unlock.mp3');
        break;
      case 'item':
      default:
        sound = new Audio('assets/sounds/item_collect.mp3');
        break;
    }
    
    if (sound) {
      sound.volume = 0.5;
      sound.play().catch(e => console.log('Error playing sound:', e));
    }
  }
  
  /**
   * Stop the animation and clean up
   */
  stop() {
    this.isPlaying = false;
    
    // Remove event listeners
    this.canvas.removeEventListener('click', this.handleClick);
    this.canvas.removeEventListener('mousemove', this.handleMouseMove);
    
    // Call onComplete with collected rewards
    this.onComplete(this.collectedRewards);
  }
}
