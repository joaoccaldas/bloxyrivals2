export class DamageNumber {
  constructor(x, y, damage, color = '#ff0000') {
    this.x = x;
    this.y = y;
    this.startY = y;
    this.damage = damage;
    this.color = color;
    this.life = 1500; // 1.5 seconds for better visibility
    this.maxLife = 1500;
    this.fontSize = 16;
  }

  update(deltaTime) {
    this.life -= deltaTime;
    this.y = this.startY - (1 - this.life / this.maxLife) * 40; // Float upward more
    return this.life > 0;
  }

  draw(ctx) {
    if (this.life <= 0) return;
    
    const alpha = Math.min(this.life / this.maxLife, 1.0);
    
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = `bold ${this.fontSize}px Arial`;
    ctx.fillStyle = this.color;
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    
    // Handle both numeric and string damage values
    const text = typeof this.damage === 'string' ? this.damage : `-${this.damage}`;
    const textWidth = ctx.measureText(text).width;
    
    // Draw outline for better visibility
    ctx.strokeText(text, this.x - textWidth / 2, this.y);
    // Draw text
    ctx.fillText(text, this.x - textWidth / 2, this.y);
    
    ctx.restore();
  }
}