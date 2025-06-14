import { HealthBar } from './healthBar.js';
import { DamageNumber } from './damageNumber.js';

export class Mob {
  constructor(x, y, maxHealth = 100) {
    this.x = x;
    this.y = y;
    this.width = 32;
    this.height = 32;
    this.maxHealth = maxHealth;
    this.currentHealth = maxHealth;
    this.healthBar = new HealthBar(x, y - 20);
    this.alive = true;
  }

  update(deltaTime) {
    if (!this.alive) return;
    
    // Update health bar position and state
    this.healthBar.update(
      this.x + this.width / 2, 
      this.y, 
      this.currentHealth, 
      this.maxHealth, 
      deltaTime
    );
    
    // Your existing mob update logic here...
  }

  draw(ctx) {
    if (!this.alive) return;
    
    // Draw mob sprite/rectangle
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(this.x, this.y, this.width, this.height);
    
    // Draw health bar
    this.healthBar.draw(ctx);
  }

  takeDamage(damage) {
    if (!this.alive) return 0;
    
    const actualDamage = Math.min(damage, this.currentHealth);
    this.currentHealth -= actualDamage;
    this.healthBar.takeDamage(actualDamage);
    
    if (this.currentHealth <= 0) {
      this.alive = false;
    }
    
    return actualDamage;
  }

  isAlive() {
    return this.alive && this.currentHealth > 0;
  }
}

class Game {
  constructor() {
    // ...existing code...
    this.damageNumbers = [];
  }

  update(deltaTime) {
    // ...existing code...
    
    // Update damage numbers
    this.damageNumbers = this.damageNumbers.filter(dmgNum => 
      dmgNum.update(deltaTime)
    );
    
    // Update mobs
    this.mobs.forEach(mob => mob.update(deltaTime));
  }

  draw(ctx) {
    // ...existing code...
    
    // Draw mobs (includes health bars)
    this.mobs.forEach(mob => mob.draw(ctx));
    
    // Draw damage numbers
    this.damageNumbers.forEach(dmgNum => dmgNum.draw(ctx));
  }

  // Call this when dealing damage to a mob
  dealDamageToMob(mob, damage) {
    const actualDamage = mob.takeDamage(damage);
    
    if (actualDamage > 0) {
      // Create floating damage number
      this.damageNumbers.push(new DamageNumber(
        mob.x + mob.width / 2,
        mob.y,
        actualDamage,
        '#ff0000'
      ));
    }
    
    return actualDamage;
  }
}