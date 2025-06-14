// src/entities/PowerUp.js

export const PowerUpType = {
  SPEED_BOOST: 'SPEED_BOOST',
  SCORE_MULTIPLIER: 'SCORE_MULTIPLIER',
  // Future: SHIELD, DAMAGE_BOOST, etc.
};

export class PowerUp {
  constructor(x, y, type, duration = 5000) { // Default duration 5 seconds
    this.x = x;
    this.y = y;
    this.width = 32; // Standard size
    this.height = 32;
    this.type = type;
    this.duration = duration; // How long the effect lasts on the player
    this.spawnTime = Date.now();
    this.lifetime = 20000; // How long it stays on the ground before despawning (20 seconds)
    this.isActive = true; // Active on the map

    // Visual representation (simple colored square for now)
    switch (type) {
      case PowerUpType.SPEED_BOOST:
        this.color = 'rgba(0, 255, 255, 0.8)'; // Cyan
        break;
      case PowerUpType.SCORE_MULTIPLIER:
        this.color = 'rgba(255, 215, 0, 0.8)'; // Gold
        break;
      default:
        this.color = 'rgba(200, 200, 200, 0.8)'; // Grey
    }
  }

  update(delta) {
    // Check if the power-up should despawn
    if (Date.now() - this.spawnTime > this.lifetime) {
      this.isActive = false;
    }
  }

  draw(ctx) {
    if (!this.isActive) return;

    ctx.save();
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.width, this.height);
    // Add a simple icon/letter
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    let letter = '?';
    if (this.type === PowerUpType.SPEED_BOOST) letter = 'S';
    if (this.type === PowerUpType.SCORE_MULTIPLIER) letter = 'P';
    ctx.fillText(letter, this.x + this.width / 2, this.y + this.height / 2 + 2);
    ctx.restore();
  }

  getAABB() {
    return {
      left: this.x,
      top: this.y,
      right: this.x + this.width,
      bottom: this.y + this.height,
    };
  }

  // Called when collected by player
  applyEffect(player) {
    this.isActive = false; // No longer on map
    console.log(`Power-up ${this.type} collected by player.`);
    // Effect logic will be in Player.js or managed by PowerUpSystem
  }
}
