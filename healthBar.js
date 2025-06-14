export class HealthBar {
  constructor() {
    this.width = 40;
    this.height = 6;
    this.visible = false;
    this.fadeTimer = 0;
    this.isPlayerHealthBar = false; // Flag to identify player health bars
  }  update(mobX, mobY, currentHealth, maxHealth, deltaTime) {
    // Validate input parameters
    if (!isFinite(mobX) || !isFinite(mobY) || !isFinite(currentHealth) || !isFinite(maxHealth) || maxHealth <= 0) {
      console.warn('HealthBar: Invalid parameters in update, using defaults');
      this.x = 0;
      this.y = 0;
      this.currentHealth = 0;
      this.maxHealth = 1;
      this.visible = false;
      return;
    }
    
    this.x = mobX - this.width / 2;
    this.y = mobY - 25;
    this.currentHealth = Math.max(0, currentHealth);
    this.maxHealth = Math.max(1, maxHealth);
    
    // Always show player health bar, show mob health bar when damaged
    if (this.isPlayerHealthBar || (this.currentHealth < this.maxHealth && this.currentHealth > 0)) {
      this.visible = true;
      // Reset fade timer to keep it visible
      this.fadeTimer = 1000; // Keep visible for 1 second after last damage
    }
    
    // Only start fading if mob is at full health (not applicable to player)
    if (!this.isPlayerHealthBar && this.currentHealth >= this.maxHealth && this.fadeTimer > 0) {
      this.fadeTimer -= deltaTime;
      if (this.fadeTimer <= 0) this.visible = false;
    }
  }draw(ctx) {
    if (!this.visible || this.currentHealth <= 0) return;
    
    // Validate coordinates are finite numbers
    if (!isFinite(this.x) || !isFinite(this.y) || !isFinite(this.width) || !isFinite(this.height)) {
      console.warn('HealthBar: Invalid coordinates detected, skipping draw');
      return;
    }
    
    const healthPercent = Math.max(0, Math.min(1, this.currentHealth / this.maxHealth));
    
    // Enhanced styling with shadow and gradient effect
    ctx.save();
    
    // Drop shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(this.x + 1, this.y + 1, this.width, this.height);
    
    // Background (dark red)
    ctx.fillStyle = '#4a0000';
    ctx.fillRect(this.x, this.y, this.width, this.height);
    
    // Health bar (color based on health percentage)
    let healthColor;
    if (healthPercent > 0.6) {
      healthColor = '#22c55e'; // Green
    } else if (healthPercent > 0.3) {
      healthColor = '#eab308'; // Yellow
    } else {
      healthColor = '#ef4444'; // Red
    }
    
    ctx.fillStyle = healthColor;
    const healthBarWidth = this.width * healthPercent;
    if (healthBarWidth > 0) {
      ctx.fillRect(this.x, this.y, healthBarWidth, this.height);
    }
    
    // Glossy effect - top highlight (only if we have a valid health bar)
    if (healthBarWidth > 0) {
      const gradientStartY = this.y;
      const gradientEndY = this.y + this.height;
      
      // Additional validation for gradient coordinates
      if (isFinite(gradientStartY) && isFinite(gradientEndY) && gradientEndY > gradientStartY) {
        try {
          const gradient = ctx.createLinearGradient(this.x, gradientStartY, this.x, gradientEndY);
          gradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
          gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
          gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
          ctx.fillStyle = gradient;
          ctx.fillRect(this.x, this.y, healthBarWidth, this.height);
        } catch (error) {
          console.warn('HealthBar: Failed to create gradient, using solid color fallback');
          ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
          ctx.fillRect(this.x, this.y, healthBarWidth, this.height);
        }
      }
    }
    
    // Border
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.strokeRect(this.x, this.y, this.width, this.height);
    
    // Health text for player health bars
    if (this.isPlayerHealthBar && this.width > 50) {
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 10px Arial';
      ctx.textAlign = 'center';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.strokeText(`${Math.round(this.currentHealth)}`, this.x + this.width / 2, this.y + this.height + 12);
      ctx.fillText(`${Math.round(this.currentHealth)}`, this.x + this.width / 2, this.y + this.height + 12);
    }
    
    ctx.restore();
  }
}