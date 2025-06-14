// shopSystem.js - Shop interface with daily rewards
import { CoinDisplay } from './coinIcon.js';

export class ShopSystem {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      onClose: () => {},
      onPurchase: () => {},
      initialCoins: 0,
      ...options
    };
    
    // Shop elements
    this.shopScreen = document.getElementById('shopScreen');
    this.closeButton = document.getElementById('closeShop');
    this.dailyRewardStatus = document.getElementById('dailyRewardStatus');
    this.claimButton = document.getElementById('claimDailyReward');
    this.offersContainer = document.getElementById('shopOffers');
    
    // Player data
    this.coins = this.loadCoins() || this.options.initialCoins;
    
    // Daily reward settings
    this.lastClaimedDate = this.loadLastClaimedDate();
    
    this.init();
  }
    init() {
    // Set up event listeners
    this.closeButton.addEventListener('click', () => this.close());
    this.claimButton.addEventListener('click', () => this.claimDailyReward());
    
    // Create coin display in shop header
    this.createCoinDisplay();
    
    // Generate sample offers
    this.generateOffers();
    
    // Check daily reward status
    this.updateDailyRewardStatus();
  }
    createCoinDisplay() {
    // Create header coin display
    const shopHeader = this.shopScreen.querySelector('.shop-header');
    if (shopHeader) {
      // Create coin balance display
      const coinBalanceContainer = document.createElement('div');
      coinBalanceContainer.className = 'coin-balance-container';
      
      // Create coin display using our CoinDisplay component
      this.coinDisplay = new CoinDisplay({
        amount: this.coins,
        size: 'large',
        animated: true
      });
      
      coinBalanceContainer.appendChild(this.coinDisplay.getElement());
      
      // Insert at the beginning of the header (before the title)
      shopHeader.insertBefore(coinBalanceContainer, shopHeader.firstChild);
    }
    
    // Create global coin display if it doesn't exist yet
    if (!document.querySelector('.player-coins')) {
      const playerCoins = document.createElement('div');
      playerCoins.className = 'player-coins';
      
      this.globalCoinDisplay = new CoinDisplay({
        amount: this.coins,
        size: 'small',
        animated: false
      });
      
      playerCoins.appendChild(this.globalCoinDisplay.getElement());
      document.body.appendChild(playerCoins);
      
      // Hide initially, will show when needed
      playerCoins.style.display = 'none';
    }
  }
    show() {
    // Show the shop screen
    this.shopScreen.classList.remove('hidden');
    setTimeout(() => {
      this.shopScreen.classList.add('visible');
    }, 10);
    
    // Update coin displays
    this.updateCoinDisplays();
    
    // Update daily reward status when showing shop
    this.updateDailyRewardStatus();
    
    // Hide global coin display while in shop
    this.hideGlobalCoinDisplay();
  }
  
  close() {
    // Hide the shop screen
    this.shopScreen.classList.remove('visible');
    setTimeout(() => {
      this.shopScreen.classList.add('hidden');
      
      // Show global coin display if player has coins
      if (this.coins > 0) {
        this.showGlobalCoinDisplay();
      }
      
      this.options.onClose();
    }, 300); // Match the CSS transition time
  }
  
  updateDailyRewardStatus() {
    const today = new Date().toDateString();
    const lastClaimed = this.lastClaimedDate;
    
    if (lastClaimed === today) {
      // Already claimed today
      this.dailyRewardStatus.textContent = 'You have already claimed your daily reward today!';
      this.dailyRewardStatus.style.color = 'var(--accent-info)';
      this.claimButton.disabled = true;
      this.claimButton.textContent = 'Claimed';
    } else {
      // Available to claim
      const nextReward = this.getNextReward();
      this.dailyRewardStatus.innerHTML = `Your daily reward is ready: <strong>${nextReward.description}</strong>`;
      this.dailyRewardStatus.style.color = 'var(--accent-success)';
      this.claimButton.disabled = false;
      this.claimButton.textContent = 'Claim';
    }
  }
  
  claimDailyReward() {
    const today = new Date().toDateString();
    const reward = this.getNextReward();
    
    // Save the claim date
    this.lastClaimedDate = today;
    localStorage.setItem('lastDailyRewardClaim', today);
    
    // Apply the reward
    this.applyReward(reward);
    
    // Update UI
    this.claimButton.disabled = true;
    this.claimButton.textContent = 'Claimed';
    this.claimButton.classList.add('reward-claimed');
    
    this.dailyRewardStatus.innerHTML = `<span style="color: var(--accent-success)">✓</span> Reward claimed: <strong>${reward.description}</strong>`;
    
    // Remove animation class after animation completes
    setTimeout(() => {
      this.claimButton.classList.remove('reward-claimed');
    }, 500);
  }
    getNextReward() {
    // Sample rewards - would be expanded in full implementation
    const rewards = [
      { type: 'coins', amount: 100, description: '100 Coins' },
      { type: 'powerup', id: 'speed_boost', description: 'Speed Boost PowerUp' },
      { type: 'coins', amount: 200, description: '200 Coins' },
      { type: 'skin', id: 'rare_skin', description: 'Random Rare Skin Fragment' },
      { type: 'coins', amount: 150, description: '150 Coins' },
      { type: 'powerup', id: 'shield', description: 'Shield PowerUp' },
      { type: 'coins', amount: 300, description: '300 Coins' }
    ];
    
    // Determine which day of the week it is (0-6)
    const dayOfWeek = new Date().getDay();
    
    // Return the reward for today
    return rewards[dayOfWeek];
  }
  
  applyReward(reward) {
    console.log(`Applying reward: ${reward.description}`);
    
    // Apply the reward based on type
    if (reward.type === 'coins') {
      // Add coins to player balance
      this.addCoins(reward.amount);
      alert(`🎁 Daily Reward Claimed!\n\nYou received: ${reward.amount} coins\n\nYour new balance: ${this.coins} coins`);
    } else {
      // For other reward types, just show a notification
      alert(`🎁 Daily Reward Claimed!\n\nYou received: ${reward.description}`);
    }
    
    // Call the onPurchase callback with the reward info
    this.options.onPurchase({
      type: 'daily_reward',
      item: reward
    });
    
    // Show the global coin display if it's a coin reward
    if (reward.type === 'coins') {
      this.showGlobalCoinDisplay();
    }
  }
    loadLastClaimedDate() {
    return localStorage.getItem('lastDailyRewardClaim') || '';
  }
  
  loadCoins() {
    const savedCoins = localStorage.getItem('playerCoins');
    return savedCoins ? parseInt(savedCoins, 10) : 0;
  }
  
  saveCoins() {
    localStorage.setItem('playerCoins', this.coins.toString());
  }
  
  addCoins(amount) {
    this.coins += amount;
    this.saveCoins();
    this.updateCoinDisplays();
  }
  
  spendCoins(amount) {
    if (this.coins >= amount) {
      this.coins -= amount;
      this.saveCoins();
      this.updateCoinDisplays();
      return true;
    }
    return false;
  }
  
  updateCoinDisplays() {
    // Update shop coin display
    if (this.coinDisplay) {
      this.coinDisplay.updateAmount(this.coins);
    }
    
    // Update global coin display
    if (this.globalCoinDisplay) {
      this.globalCoinDisplay.updateAmount(this.coins);
    }
  }
  
  showGlobalCoinDisplay() {
    const playerCoins = document.querySelector('.player-coins');
    if (playerCoins) {
      playerCoins.style.display = 'flex';
    }
  }
  
  hideGlobalCoinDisplay() {
    const playerCoins = document.querySelector('.player-coins');
    if (playerCoins) {
      playerCoins.style.display = 'none';
    }
  }
  
  generateOffers() {
    // Sample offers - would come from a server in a real implementation
    const offers = [
      {
        id: 'speed_boost_pack',
        title: 'Speed Boost Pack',
        image: '../assets/buttons/shop.png',
        price: 200,
        description: 'Get 3 Speed Boost PowerUps'
      },      {
        id: 'shield_pack',
        title: 'Shield Pack',
        image: '../assets/buttons/shop.png',
        price: 250,
        description: 'Get 2 Shield PowerUps'
      },
      {
        id: 'coin_doubler',
        title: 'Coin Doubler',
        image: '../assets/buttons/shop.png',
        price: 500,
        description: 'Double coin rewards for 3 games'
      },
      {
        id: 'starter_bundle',
        title: 'Starter Bundle',
        image: '../assets/buttons/shop.png',
        price: 400,
        description: 'Get 2 Speed Boosts, 1 Shield, and 1 Coin Doubler'
      }
    ];
    
    // Clear existing offers
    this.offersContainer.innerHTML = '';
      // Add offers to the container
    offers.forEach(offer => {
      const offerElement = document.createElement('div');
      offerElement.className = 'offer-item';
      
      // Create basic structure
      offerElement.innerHTML = `
        <img class="offer-image" src="${offer.image}" alt="${offer.title}">
        <div class="offer-title">${offer.title}</div>
        <button class="buy-button" data-id="${offer.id}">Buy</button>
      `;
      
      // Create price display with coin icon
      const priceDisplay = document.createElement('div');
      priceDisplay.className = 'offer-price';
      
      // Create coin icon for price
      const coinIcon = new CoinDisplay({
        amount: offer.price,
        size: 'small',
        animated: false
      });
      
      priceDisplay.appendChild(coinIcon.getElement());
      offerElement.insertBefore(priceDisplay, offerElement.querySelector('.buy-button'));
      
      // Add click listener to the buy button
      const buyButton = offerElement.querySelector('.buy-button');
      buyButton.addEventListener('click', () => this.handlePurchase(offer));
      
      this.offersContainer.appendChild(offerElement);
    });
  }  handlePurchase(offer) {
    console.log(`Purchase attempt: ${offer.title} for ${offer.price} coins`);
    
    // Check if player has enough coins
    if (this.coins >= offer.price) {
      // Show custom confirmation dialog
      this.showConfirmationDialog(offer);
    } else {
      // Not enough coins
      alert(`❌ Not enough coins!\n\n${offer.title} costs ${offer.price} coins.\nYour balance: ${this.coins} coins`);
    }
  }
  
  showConfirmationDialog(offer) {
    // Get the dialog elements
    const dialog = document.getElementById('confirmationDialog');
    const itemName = document.getElementById('confirmItemName');
    const itemPrice = document.getElementById('confirmItemPrice');
    const itemImg = document.getElementById('confirmItemImg');
    const confirmBtn = dialog.querySelector('.confirm-btn');
    const cancelBtn = dialog.querySelector('.cancel-btn');
    const closeBtn = dialog.querySelector('.close-btn');
    
    // Set the offer details
    itemName.textContent = offer.title;
    itemPrice.textContent = offer.price;
    if (offer.image) {
      itemImg.src = offer.image;
    } else {
      // Default image if no specific image is provided
      itemImg.src = "assets/player/bear.png";
    }
    
    // Show the dialog
    dialog.style.display = 'flex';
    
    // Handle button clicks
    const handleConfirm = () => {
      dialog.style.display = 'none';
      
      // Process the purchase
      const success = this.spendCoins(offer.price);
      if (success) {
        // Purchase successful
        alert(`🛒 Purchase Successful!\n\nYou bought: ${offer.title}\nCost: ${offer.price} coins\n\nYour new balance: ${this.coins} coins`);
        
        // Call the onPurchase callback with the offer info
        this.options.onPurchase({
          type: 'shop_purchase',
          item: offer,
          price: offer.price
        });
      }
      
      // Remove event listeners
      confirmBtn.removeEventListener('click', handleConfirm);
      cancelBtn.removeEventListener('click', handleCancel);
      closeBtn.removeEventListener('click', handleCancel);
    };
    
    const handleCancel = () => {
      dialog.style.display = 'none';
      console.log(`Purchase of ${offer.title} cancelled by user`);
      
      // Remove event listeners
      confirmBtn.removeEventListener('click', handleConfirm);
      cancelBtn.removeEventListener('click', handleCancel);
      closeBtn.removeEventListener('click', handleCancel);
    };
    
    // Add event listeners
    confirmBtn.addEventListener('click', handleConfirm);
    cancelBtn.addEventListener('click', handleCancel);
    closeBtn.addEventListener('click', handleCancel);
  }
  cleanup() {
    // Remove event listeners
    this.closeButton.removeEventListener('click', () => this.close());
    this.claimButton.removeEventListener('click', () => this.claimDailyReward());
    
    // Hide confirmation dialog if visible
    const dialog = document.getElementById('confirmationDialog');
    if (dialog) {
      dialog.style.display = 'none';
    }
    
    // Remove offer buy button listeners
    const buyButtons = this.offersContainer.querySelectorAll('.buy-button');
    buyButtons.forEach(button => {
      button.replaceWith(button.cloneNode(true));
    });
    
    // Remove global coin display
    const playerCoins = document.querySelector('.player-coins');
    if (playerCoins) {
      playerCoins.remove();
    }
  }
}
