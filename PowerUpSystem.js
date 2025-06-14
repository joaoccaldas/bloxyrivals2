// src/systems/PowerUpSystem.js
import { PowerUp, PowerUpType } from '../entities/PowerUp.js';
import { checkCollision } from '../core/collision.js';

export class PowerUpSystem {
  constructor(gameInstance, world) {
    this.game = gameInstance;
    this.world = world;
    this.powerUps = [];
    this.spawnInterval = 15000; // Spawn a power-up every 15 seconds
    this.lastSpawnTime = Date.now();
    this.maxPowerUps = 3; // Max active power-ups on the map
  }

  update(delta, player) {
    // Attempt to spawn new power-ups
    if (Date.now() - this.lastSpawnTime > this.spawnInterval && this.powerUps.length < this.maxPowerUps) {
      this.spawnRandomPowerUp();
      this.lastSpawnTime = Date.now();
    }

    // Update existing power-ups (e.g., for lifetime)
    this.powerUps.forEach(powerUp => powerUp.update(delta));

    // Check for player collision with power-ups
    for (let i = this.powerUps.length - 1; i >= 0; i--) {
      const powerUp = this.powerUps[i];
      if (powerUp.isActive && checkCollision(player.getAABB(), powerUp.getAABB())) {
        this.game.handlePowerUpCollection(player, powerUp);
        // powerUp.applyEffect(player); // This will be handled by Game.js to coordinate with Player.js
        // this.powerUps.splice(i, 1); // Removal will be handled by Game.js after effect is applied
      }
    }

    // Remove inactive power-ups (e.g. lifetime expired or collected)
    this.powerUps = this.powerUps.filter(powerUp => powerUp.isActive);
  }

  spawnRandomPowerUp() {
    const availableTypes = Object.values(PowerUpType);
    const randomType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
      // Ensure spawn position is not too close to player or edges
    let x, y, attempts = 0;
    const safetyMargin = 50;
    const playerSafetyDistance = 200; // Increased distance from player

    do {
        x = Math.random() * (this.world.width - safetyMargin * 2 - 32) + safetyMargin;
        y = Math.random() * (this.world.height - safetyMargin * 2 - 32) + safetyMargin;
        attempts++;
    } while (attempts < 30 && this.game.player && Math.hypot(x - this.game.player.x, y - this.game.player.y) < playerSafetyDistance);

    if (attempts < 30) { // Only spawn if a good position was found
        const newPowerUp = new PowerUp(x, y, randomType);
        this.powerUps.push(newPowerUp);
        console.log(`Spawned power-up: ${randomType} at (${x.toFixed(0)}, ${y.toFixed(0)})`);
    }
  }

  draw(ctx) {
    this.powerUps.forEach(powerUp => powerUp.draw(ctx));
  }

  reset() {
    this.powerUps = [];
    this.lastSpawnTime = Date.now();
  }
}
