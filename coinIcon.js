// coinIcon.js - Component for displaying the coin icon and amount

export class CoinDisplay {
  /**
   * Create a coin display component
   * @param {Object} options - Configuration options
   * @param {number} [options.amount=0] - Initial coin amount
   * @param {boolean} [options.animated=true] - Whether to animate the coin
   * @param {boolean} [options.showAmount=true] - Whether to show the amount text
   * @param {string} [options.size='medium'] - Size: 'small', 'medium', or 'large'
   */
  constructor(options = {}) {
    this.options = {
      amount: 0,
      animated: true, 
      showAmount: true,
      size: 'medium',
      ...options
    };
    
    this.element = this.createCoinElement();
  }
  
  /**
   * Create the DOM element for the coin display
   * @returns {HTMLElement} The coin display element
   */
  createCoinElement() {
    const container = document.createElement('div');
    container.className = `coin-display ${this.options.size}`;
    
    // Create the coin graphic
    const coin = document.createElement('div');
    coin.className = `coin ${this.options.animated ? 'animated' : ''}`;
    
    // Create the shine effect
    const shine = document.createElement('div');
    shine.className = 'coin-shine';
    coin.appendChild(shine);
    
    container.appendChild(coin);
    
    // Add amount display if needed
    if (this.options.showAmount) {
      const amount = document.createElement('span');
      amount.className = 'coin-amount';
      amount.textContent = this.formatNumber(this.options.amount);
      container.appendChild(amount);
      this.amountElement = amount;
    }
    
    return container;
  }
  
  /**
   * Format a number with commas for thousands
   * @param {number} num - Number to format
   * @returns {string} Formatted number
   */
  formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }
  
  /**
   * Update the coin amount
   * @param {number} amount - New amount to display
   */
  updateAmount(amount) {
    this.options.amount = amount;
    if (this.amountElement) {
      this.amountElement.textContent = this.formatNumber(amount);
    }
  }
  
  /**
   * Get the DOM element
   * @returns {HTMLElement} The coin display element
   */
  getElement() {
    return this.element;
  }
  
  /**
   * Append the coin display to a parent element
   * @param {HTMLElement} parent - Parent element to append to
   */
  appendTo(parent) {
    parent.appendChild(this.element);
  }
  
  /**
   * Create a standalone coin icon (static method)
   * @param {Object} options - Configuration options
   * @returns {HTMLElement} Coin icon element
   */
  static createIcon(options = {}) {
    const display = new CoinDisplay(options);
    return display.getElement();
  }
}
