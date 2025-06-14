// characterData.js

export const characters = [
  {
    id: 0,
    name: 'Gizmo',
    sprite: null, // No image for Gizmo
    rarity: 'common'
  },
  {
    id: 1,
    name: 'Gothor',
    sprite: null, // No image for Gothor
    rarity: 'common'
  },
  {
    id: 2,
    name: 'Chef',
    sprite: 'assets/player/chef.png',
    rarity: 'rare'
  },
  {
    id: 3,
    name: 'Ninjo',
    sprite: null, // No image for Ninjo (moved to Gary)
    rarity: 'rare'
  },
  {
    id: 4,
    name: 'Gary',
    sprite: 'assets/player/magic.png', // Using magic sprite for Gary (moved from Ninjo)
    rarity: 'epic'
  },
  {
    id: 5,
    name: 'Jo',
    sprite: null, // No image for Jo
    rarity: 'epic'
  },  {
    id: 6,
    name: 'Kraco',
    sprite: 'assets/player/kraco.png', // Pirate octopus character
    rarity: 'epic'
  },
  {
    id: 7,
    name: 'Nugget',
    sprite: 'assets/player/bear.png',
    rarity: 'super'
  },
  {
    id: 8,
    name: 'Wus', // Robot
    sprite: 'assets/player/robot.png',
    rarity: 'mythic'
  },
  {
    id: 9,
    name: 'Rivalking',
    sprite: null, // No image for Rivalking
    rarity: 'mythic'
  },
  {
    id: 10,
    name: 'Skory',
    sprite: 'assets/player/skory.png',
    rarity: 'mythic'
  },
  {
    id: 11,
    name: 'Tracy',
    sprite: 'assets/player/chef.png', // Using chef sprite for Tracy
    rarity: 'legendary'
  }
  // Example for adding a new character:
  // {
  //   id: 10, // Ensure unique ID
  //   name: 'Nova',
  //   sprite: 'assets/player/nova.png' // Ensure this asset exists
  // }
];

// Developer sanity check for unique IDs (runs once on module load)
const idSet = new Set();
characters.forEach(char => { //
  if (idSet.has(char.id)) { //
    console.error(`CRITICAL: Duplicate character ID ${char.id} for character "${char.name}" in characterData.js. IDs must be unique.`); //
  }
  idSet.add(char.id); //
});
if (characters.length !== idSet.size) { //
    // This secondary check is redundant if the loop above catches specifics, but good for a general count mismatch.
    console.error("CRITICAL: Total character count does not match unique ID count. Review characterData.js for duplicate IDs.");
}