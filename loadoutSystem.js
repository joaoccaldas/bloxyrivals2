/**
 * Customizable Loadouts & Equipment System
 * Allows players to customize their character with different weapons, armor, and accessories
 */

export class LoadoutSystem {
  constructor(game) {
    this.game = game;
    this.currentLoadout = null;
    this.savedLoadouts = new Map();
    this.equipment = new Map();
    this.inventory = new Map();
    
    // UI elements
    this.loadoutMenu = null;
    this.equipmentSlots = new Map();
    
    // Initialize equipment database
    this.initializeEquipment();
    
    // Load saved data
    this.loadSavedData();
    
    // Create default loadout if none exists
    if (this.savedLoadouts.size === 0) {
      this.createDefaultLoadout();
    }
    
    console.log('🌟 Loadout System initialized with', this.equipment.size, 'equipment items');
  }

  initializeEquipment() {
    const equipmentData = [
      // Weapons
      {
        id: 'basic_blaster',
        name: 'Basic Blaster',
        type: 'weapon',
        rarity: 'common',
        stats: { damage: 10, fireRate: 300, range: 200, spread: 0 },
        description: 'Standard energy blaster',
        icon: '🔫',
        color: '#808080',
        unlocked: true
      },
      {
        id: 'rapid_fire',
        name: 'Rapid Fire',
        type: 'weapon',
        rarity: 'uncommon',
        stats: { damage: 8, fireRate: 150, range: 180, spread: 0.1 },
        description: 'High rate of fire with reduced damage',
        icon: '🔫',
        color: '#00FF00',
        unlocked: false
      },
      {
        id: 'heavy_cannon',
        name: 'Heavy Cannon',
        type: 'weapon',
        rarity: 'rare',
        stats: { damage: 25, fireRate: 800, range: 250, spread: 0 },
        description: 'Slow but devastating weapon',
        icon: '💥',
        color: '#FF4500',
        unlocked: false
      },
      {
        id: 'plasma_rifle',
        name: 'Plasma Rifle',
        type: 'weapon',
        rarity: 'epic',
        stats: { damage: 18, fireRate: 200, range: 300, spread: 0, piercing: true },
        description: 'Energy weapon that pierces through enemies',
        icon: '⚡',
        color: '#9932CC',
        unlocked: false
      },
      {
        id: 'quantum_destroyer',
        name: 'Quantum Destroyer',
        type: 'weapon',
        rarity: 'legendary',
        stats: { damage: 35, fireRate: 250, range: 350, spread: 0, explosive: true },
        description: 'Legendary weapon with explosive rounds',
        icon: '🌟',
        color: '#FFD700',
        unlocked: false
      },
      
      // Armor
      {
        id: 'basic_vest',
        name: 'Basic Vest',
        type: 'armor',
        rarity: 'common',
        stats: { health: 100, defense: 5, speed: 1.0 },
        description: 'Light protective gear',
        icon: '🦺',
        color: '#808080',
        unlocked: true
      },
      {
        id: 'combat_armor',
        name: 'Combat Armor',
        type: 'armor',
        rarity: 'uncommon',
        stats: { health: 120, defense: 10, speed: 0.9 },
        description: 'Military-grade protection',
        icon: '🛡️',
        color: '#00FF00',
        unlocked: false
      },
      {
        id: 'energy_shield',
        name: 'Energy Shield',
        type: 'armor',
        rarity: 'rare',
        stats: { health: 100, defense: 15, speed: 1.1, energyRegen: true },
        description: 'High-tech energy protection',
        icon: '⚡',
        color: '#FF4500',
        unlocked: false
      },
      {
        id: 'power_suit',
        name: 'Power Suit',
        type: 'armor',
        rarity: 'epic',
        stats: { health: 150, defense: 20, speed: 1.0, abilities: ['jump_boost'] },
        description: 'Powered exoskeleton armor',
        icon: '🤖',
        color: '#9932CC',
        unlocked: false
      },
      {
        id: 'nano_armor',
        name: 'Nano Armor',
        type: 'armor',
        rarity: 'legendary',
        stats: { health: 180, defense: 25, speed: 1.2, selfRepair: true },
        description: 'Self-repairing nanotechnology armor',
        icon: '🌟',
        color: '#FFD700',
        unlocked: false
      },
      
      // Accessories
      {
        id: 'basic_boots',
        name: 'Basic Boots',
        type: 'accessory',
        rarity: 'common',
        stats: { speed: 1.0 },
        description: 'Standard movement boots',
        icon: '👢',
        color: '#808080',
        unlocked: true
      },
      {
        id: 'speed_boots',
        name: 'Speed Boots',
        type: 'accessory',
        rarity: 'uncommon',
        stats: { speed: 1.3 },
        description: 'Enhanced movement speed',
        icon: '👟',
        color: '#00FF00',
        unlocked: false
      },
      {
        id: 'jump_boots',
        name: 'Jump Boots',
        type: 'accessory',
        rarity: 'rare',
        stats: { speed: 1.1, jumpHeight: 2.0 },
        description: 'Allows double jumping',
        icon: '🥾',
        color: '#FF4500',
        unlocked: false
      },
      {
        id: 'phase_boots',
        name: 'Phase Boots',
        type: 'accessory',
        rarity: 'epic',
        stats: { speed: 1.2, phaseWalk: true },
        description: 'Walk through walls briefly',
        icon: '👻',
        color: '#9932CC',
        unlocked: false
      },
      {
        id: 'gravity_boots',
        name: 'Gravity Boots',
        type: 'accessory',
        rarity: 'legendary',
        stats: { speed: 1.4, wallWalk: true, gravityControl: true },
        description: 'Control gravity and walk on walls',
        icon: '🌟',
        color: '#FFD700',
        unlocked: false
      }
    ];

    equipmentData.forEach(item => {
      this.equipment.set(item.id, item);
      if (item.unlocked) {
        this.inventory.set(item.id, 1);
      }
    });
  }

  createDefaultLoadout() {
    const defaultLoadout = {
      id: 'default',
      name: 'Default',
      weapon: 'basic_blaster',
      armor: 'basic_vest',
      accessory: 'basic_boots',
      stats: this.calculateLoadoutStats(['basic_blaster', 'basic_vest', 'basic_boots'])
    };
    
    this.savedLoadouts.set('default', defaultLoadout);
    this.currentLoadout = defaultLoadout;
    this.applyLoadout(defaultLoadout);
  }

  calculateLoadoutStats(itemIds) {
    const stats = {
      health: 100,
      damage: 10,
      defense: 0,
      speed: 1.0,
      fireRate: 300,
      range: 200,
      spread: 0,
      abilities: []
    };

    itemIds.forEach(itemId => {
      const item = this.equipment.get(itemId);
      if (!item) return;

      // Merge stats
      Object.keys(item.stats).forEach(statKey => {
        if (statKey === 'abilities') {
          stats.abilities = [...stats.abilities, ...item.stats.abilities];
        } else if (typeof item.stats[statKey] === 'number') {
          if (statKey === 'speed') {
            stats[statKey] *= item.stats[statKey]; // Multiplicative for speed
          } else {
            stats[statKey] += item.stats[statKey]; // Additive for most stats
          }
        } else {
          stats[statKey] = item.stats[statKey]; // Boolean/special properties
        }
      });
    });

    return stats;
  }

  createLoadout(name, weaponId, armorId, accessoryId) {
    // Validate items are owned
    if (!this.inventory.has(weaponId) || !this.inventory.has(armorId) || !this.inventory.has(accessoryId)) {
      console.warn('Cannot create loadout: missing required items');
      return false;
    }

    const loadout = {
      id: Date.now().toString(),
      name: name,
      weapon: weaponId,
      armor: armorId,
      accessory: accessoryId,
      stats: this.calculateLoadoutStats([weaponId, armorId, accessoryId]),
      created: Date.now()
    };

    this.savedLoadouts.set(loadout.id, loadout);
    this.saveData();
    
    console.log(`🌟 Created loadout: ${name}`);
    return loadout.id;
  }

  equipLoadout(loadoutId) {
    const loadout = this.savedLoadouts.get(loadoutId);
    if (!loadout) return false;

    this.currentLoadout = loadout;
    this.applyLoadout(loadout);
    this.saveData();
    
    console.log(`🌟 Equipped loadout: ${loadout.name}`);
    return true;
  }

  applyLoadout(loadout) {
    if (!this.game.player) return;

    const player = this.game.player;
    
    // Apply stats to player
    player.maxHealth = loadout.stats.health;
    player.health = Math.min(player.health, player.maxHealth);
    player.defense = loadout.stats.defense;
    player.baseSpeed = loadout.stats.speed;
    player.weaponDamage = loadout.stats.damage;
    player.weaponFireRate = loadout.stats.fireRate;
    player.weaponRange = loadout.stats.range;
    player.weaponSpread = loadout.stats.spread;
    
    // Apply special abilities
    player.abilities = loadout.stats.abilities || [];
    player.piercing = loadout.stats.piercing || false;
    player.explosive = loadout.stats.explosive || false;
    player.energyRegen = loadout.stats.energyRegen || false;
    player.selfRepair = loadout.stats.selfRepair || false;
    player.phaseWalk = loadout.stats.phaseWalk || false;
    player.wallWalk = loadout.stats.wallWalk || false;
    player.gravityControl = loadout.stats.gravityControl || false;
    
    // Visual updates
    this.updatePlayerAppearance(loadout);
  }

  updatePlayerAppearance(loadout) {
    if (!this.game.player) return;

    const weapon = this.equipment.get(loadout.weapon);
    const armor = this.equipment.get(loadout.armor);
    const accessory = this.equipment.get(loadout.accessory);

    // Update player colors based on equipment
    this.game.player.weaponColor = weapon ? weapon.color : '#808080';
    this.game.player.armorColor = armor ? armor.color : '#808080';
    this.game.player.accessoryColor = accessory ? accessory.color : '#808080';
  }

  unlockEquipment(itemId) {
    const item = this.equipment.get(itemId);
    if (!item) return false;

    item.unlocked = true;
    this.inventory.set(itemId, (this.inventory.get(itemId) || 0) + 1);
    this.saveData();
    
    console.log(`🌟 Unlocked equipment: ${item.name}`);
    return true;
  }

  showLoadoutMenu() {
    if (this.loadoutMenu) return; // Already open

    this.createLoadoutMenuUI();
  }

  createLoadoutMenuUI() {
    // Main menu container
    this.loadoutMenu = document.createElement('div');
    this.loadoutMenu.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 800px;
      height: 600px;
      background: rgba(0, 0, 0, 0.95);
      border: 3px solid #FFD700;
      border-radius: 15px;
      z-index: 4000;
      display: flex;
      flex-direction: column;
      color: white;
      font-family: Arial, sans-serif;
    `;

    // Header
    const header = document.createElement('div');
    header.style.cssText = `
      background: linear-gradient(90deg, #FFD700, #FFA500);
      color: black;
      padding: 15px;
      text-align: center;
      font-size: 24px;
      font-weight: bold;
      border-radius: 12px 12px 0 0;
    `;
    header.textContent = '🌟 LOADOUT CUSTOMIZATION 🌟';

    // Content area
    const content = document.createElement('div');
    content.style.cssText = `
      flex: 1;
      display: flex;
      padding: 20px;
      gap: 20px;
    `;

    // Equipment selection area
    const equipmentArea = document.createElement('div');
    equipmentArea.style.cssText = `
      flex: 2;
      display: flex;
      flex-direction: column;
      gap: 15px;
    `;

    // Loadout preview area
    const previewArea = document.createElement('div');
    previewArea.style.cssText = `
      flex: 1;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 10px;
      padding: 15px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    `;

    // Create equipment slots
    this.createEquipmentSlots(equipmentArea);
    this.createLoadoutPreview(previewArea);

    // Close button
    const closeButton = document.createElement('button');
    closeButton.textContent = '❌ Close';
    closeButton.style.cssText = `
      position: absolute;
      top: 10px;
      right: 10px;
      background: #FF4444;
      color: white;
      border: none;
      padding: 8px 15px;
      border-radius: 5px;
      cursor: pointer;
      font-weight: bold;
    `;
    closeButton.onclick = () => this.hideLoadoutMenu();

    content.appendChild(equipmentArea);
    content.appendChild(previewArea);
    this.loadoutMenu.appendChild(header);
    this.loadoutMenu.appendChild(content);
    this.loadoutMenu.appendChild(closeButton);

    document.body.appendChild(this.loadoutMenu);
  }

  createEquipmentSlots(container) {
    const slotTypes = [
      { type: 'weapon', name: 'Weapon', icon: '⚔️' },
      { type: 'armor', name: 'Armor', icon: '🛡️' },
      { type: 'accessory', name: 'Accessory', icon: '👢' }
    ];

    slotTypes.forEach(slotType => {
      const slotContainer = document.createElement('div');
      slotContainer.style.cssText = `
        background: rgba(255, 255, 255, 0.05);
        border-radius: 8px;
        padding: 15px;
      `;

      const slotHeader = document.createElement('div');
      slotHeader.style.cssText = `
        font-size: 18px;
        font-weight: bold;
        margin-bottom: 10px;
        color: #FFD700;
      `;
      slotHeader.innerHTML = `${slotType.icon} ${slotType.name}`;

      const itemGrid = document.createElement('div');
      itemGrid.style.cssText = `
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
        gap: 10px;
      `;

      // Add items of this type
      this.equipment.forEach((item, itemId) => {
        if (item.type !== slotType.type) return;
        if (!this.inventory.has(itemId)) return; // Only show owned items

        const itemCard = this.createItemCard(item, itemId);
        itemGrid.appendChild(itemCard);
      });

      slotContainer.appendChild(slotHeader);
      slotContainer.appendChild(itemGrid);
      container.appendChild(slotContainer);

      this.equipmentSlots.set(slotType.type, itemGrid);
    });
  }

  createItemCard(item, itemId) {
    const card = document.createElement('div');
    card.style.cssText = `
      background: ${this.getRarityColor(item.rarity)};
      border: 2px solid ${item.color};
      border-radius: 8px;
      padding: 10px;
      text-align: center;
      cursor: pointer;
      transition: all 0.2s ease;
      min-height: 80px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    `;

    const icon = document.createElement('div');
    icon.style.cssText = `
      font-size: 24px;
      margin-bottom: 5px;
    `;
    icon.textContent = item.icon;

    const name = document.createElement('div');
    name.style.cssText = `
      font-size: 12px;
      font-weight: bold;
      color: white;
      text-shadow: 1px 1px 2px black;
    `;
    name.textContent = item.name;

    card.appendChild(icon);
    card.appendChild(name);

    // Hover effects
    card.onmouseenter = () => {
      card.style.transform = 'scale(1.05)';
      card.style.boxShadow = `0 0 15px ${item.color}`;
    };
    card.onmouseleave = () => {
      card.style.transform = 'scale(1)';
      card.style.boxShadow = 'none';
    };

    // Click to equip
    card.onclick = () => {
      this.selectItemForLoadout(item.type, itemId);
      this.updateLoadoutPreview();
    };

    // Tooltip
    card.title = `${item.name}\n${item.description}\nRarity: ${item.rarity}`;

    return card;
  }

  getRarityColor(rarity) {
    const colors = {
      common: 'rgba(128, 128, 128, 0.3)',
      uncommon: 'rgba(0, 255, 0, 0.3)',
      rare: 'rgba(255, 69, 0, 0.3)',
      epic: 'rgba(153, 50, 204, 0.3)',
      legendary: 'rgba(255, 215, 0, 0.3)'
    };
    return colors[rarity] || colors.common;
  }

  selectItemForLoadout(type, itemId) {
    if (!this.selectedItems) {
      this.selectedItems = {
        weapon: this.currentLoadout?.weapon || 'basic_blaster',
        armor: this.currentLoadout?.armor || 'basic_vest',
        accessory: this.currentLoadout?.accessory || 'basic_boots'
      };
    }

    this.selectedItems[type] = itemId;
  }

  createLoadoutPreview(container) {
    const title = document.createElement('div');
    title.style.cssText = `
      font-size: 18px;
      font-weight: bold;
      color: #FFD700;
      text-align: center;
      margin-bottom: 15px;
    `;
    title.textContent = '🔧 Loadout Preview';

    this.previewContainer = document.createElement('div');
    this.previewContainer.style.cssText = `
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 10px;
    `;

    const buttonsContainer = document.createElement('div');
    buttonsContainer.style.cssText = `
      display: flex;
      gap: 10px;
      margin-top: 15px;
    `;

    const saveButton = document.createElement('button');
    saveButton.textContent = '💾 Save';
    saveButton.style.cssText = `
      flex: 1;
      background: #4CAF50;
      color: white;
      border: none;
      padding: 10px;
      border-radius: 5px;
      cursor: pointer;
      font-weight: bold;
    `;
    saveButton.onclick = () => this.saveCurrentPreview();

    const equipButton = document.createElement('button');
    equipButton.textContent = '⚡ Equip';
    equipButton.style.cssText = `
      flex: 1;
      background: #FF9800;
      color: white;
      border: none;
      padding: 10px;
      border-radius: 5px;
      cursor: pointer;
      font-weight: bold;
    `;
    equipButton.onclick = () => this.equipCurrentPreview();

    buttonsContainer.appendChild(saveButton);
    buttonsContainer.appendChild(equipButton);

    container.appendChild(title);
    container.appendChild(this.previewContainer);
    container.appendChild(buttonsContainer);

    this.updateLoadoutPreview();
  }

  updateLoadoutPreview() {
    if (!this.previewContainer) return;

    this.previewContainer.innerHTML = '';

    if (!this.selectedItems) {
      this.selectedItems = {
        weapon: this.currentLoadout?.weapon || 'basic_blaster',
        armor: this.currentLoadout?.armor || 'basic_vest',
        accessory: this.currentLoadout?.accessory || 'basic_boots'
      };
    }

    // Show selected items
    Object.entries(this.selectedItems).forEach(([type, itemId]) => {
      const item = this.equipment.get(itemId);
      if (!item) return;

      const itemPreview = document.createElement('div');
      itemPreview.style.cssText = `
        background: ${this.getRarityColor(item.rarity)};
        border: 2px solid ${item.color};
        border-radius: 8px;
        padding: 10px;
        display: flex;
        align-items: center;
        gap: 10px;
      `;

      itemPreview.innerHTML = `
        <div style="font-size: 24px;">${item.icon}</div>
        <div>
          <div style="font-weight: bold; color: ${item.color};">${item.name}</div>
          <div style="font-size: 12px; color: #ccc;">${item.description}</div>
        </div>
      `;

      this.previewContainer.appendChild(itemPreview);
    });

    // Show combined stats
    const stats = this.calculateLoadoutStats(Object.values(this.selectedItems));
    const statsPreview = document.createElement('div');
    statsPreview.style.cssText = `
      background: rgba(0, 0, 0, 0.5);
      border-radius: 8px;
      padding: 10px;
      margin-top: 10px;
    `;

    statsPreview.innerHTML = `
      <div style="font-weight: bold; color: #FFD700; margin-bottom: 8px;">📊 Stats</div>
      <div style="font-size: 12px; line-height: 1.4;">
        ❤️ Health: ${stats.health}<br>
        ⚔️ Damage: ${stats.damage}<br>
        🛡️ Defense: ${stats.defense}<br>
        🏃 Speed: ${stats.speed.toFixed(1)}x<br>
        🔥 Fire Rate: ${stats.fireRate}ms<br>
        📏 Range: ${stats.range}
      </div>
    `;

    this.previewContainer.appendChild(statsPreview);
  }

  saveCurrentPreview() {
    const name = prompt('Enter loadout name:');
    if (!name) return;

    this.createLoadout(name, this.selectedItems.weapon, this.selectedItems.armor, this.selectedItems.accessory);
    alert(`Loadout "${name}" saved!`);
  }

  equipCurrentPreview() {
    const tempLoadout = {
      id: 'temp',
      name: 'Custom',
      weapon: this.selectedItems.weapon,
      armor: this.selectedItems.armor,
      accessory: this.selectedItems.accessory,
      stats: this.calculateLoadoutStats(Object.values(this.selectedItems))
    };

    this.currentLoadout = tempLoadout;
    this.applyLoadout(tempLoadout);
    this.hideLoadoutMenu();
    
    console.log('🌟 Equipped custom loadout');
  }

  hideLoadoutMenu() {
    if (this.loadoutMenu) {
      document.body.removeChild(this.loadoutMenu);
      this.loadoutMenu = null;
      this.selectedItems = null;
    }
  }

  handleKeyPress(key) {
    if (key.toLowerCase() === 'l') {
      this.showLoadoutMenu();
    }
  }

  saveData() {
    const saveData = {
      savedLoadouts: Array.from(this.savedLoadouts.entries()),
      inventory: Array.from(this.inventory.entries()),
      currentLoadout: this.currentLoadout
    };

    localStorage.setItem('bloxyRivals_loadouts', JSON.stringify(saveData));
  }

  loadSavedData() {
    const saved = localStorage.getItem('bloxyRivals_loadouts');
    if (!saved) return;

    try {
      const data = JSON.parse(saved);
      
      if (data.savedLoadouts) {
        this.savedLoadouts = new Map(data.savedLoadouts);
      }
      
      if (data.inventory) {
        this.inventory = new Map(data.inventory);
        
        // Update equipment unlock status
        this.inventory.forEach((count, itemId) => {
          const item = this.equipment.get(itemId);
          if (item) item.unlocked = true;
        });
      }
      
      if (data.currentLoadout) {
        this.currentLoadout = data.currentLoadout;
      }
    } catch (error) {
      console.warn('Failed to load loadout data:', error);
    }
  }

  getLoadoutStats() {
    return {
      totalEquipment: this.equipment.size,
      ownedEquipment: this.inventory.size,
      savedLoadouts: this.savedLoadouts.size,
      currentLoadout: this.currentLoadout ? {
        name: this.currentLoadout.name,
        stats: this.currentLoadout.stats
      } : null
    };
  }
}
