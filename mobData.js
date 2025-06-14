export const MobType = {
  GRUNT: 'GRUNT',
  BRUTE: 'BRUTE',
  RANGER: 'RANGER',
  // Add more types as needed
};

export const mobConfig = {  [MobType.GRUNT]: {
    namePrefix: 'Grunt',
    health: 35, // Reduced health
    speed: 60, // Reduced speed
    damage: 7, // Reduced damage
    width: 48,
    height: 48,
    behavior: 'MELEE_AGGRESSIVE', // Simple chase and attack
    // spriteId: 'grunt_sprite', // Placeholder - map to an existing character ID or new specific mob sprite
    points: 50,
    attackCooldown: 1000, // ms
    // visual: { color: 'green', ... } // For simple drawing if no sprite
  },  [MobType.BRUTE]: {
    namePrefix: 'Brute',
    health: 100, // Reduced health
    speed: 35, // Reduced speed
    damage: 18, // Reduced damage
    width: 64,
    height: 64,
    behavior: 'MELEE_AGGRESSIVE',
    // spriteId: 'brute_sprite',
    points: 150,
    attackCooldown: 1500,
    // visual: { color: 'red', ... }
  },  [MobType.RANGER]: {
    namePrefix: 'Ranger',
    health: 45, // Reduced health
    speed: 50, // Reduced speed
    damage: 10, // Damage per projectile (reduced)
    width: 48,
    height: 48,
    behavior: 'RANGED_KITE',
    attackRange: 250, // Reduced attack range
    projectileSpeed: 180, // Reduced projectile speed
    projectileDamage: 10, // Reduced projectile damage
    // spriteId: 'ranger_sprite',
    points: 100,
    attackCooldown: 2000, // Time between shots
    // visual: { color: 'blue', ... }
  }
};

// Function to get a random mob type configuration
export function getRandomMobConfig() {
  const types = Object.keys(mobConfig);
  const randomType = types[Math.floor(Math.random() * types.length)];
  return mobConfig[randomType];
}

// Function to get a specific mob configuration by type
export function getMobConfigByType(type) {
  return mobConfig[type] || mobConfig[MobType.GRUNT]; // Default to GRUNT if type not found
}
