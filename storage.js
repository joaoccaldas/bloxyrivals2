// storage.js

export class Storage {
  /**
   * @param {string} key – the localStorage key under which to store game data
   */
  constructor(key = 'bloxyRivalsSave') {
    this.key = key;
  }

  /**
   * Save serialized game data.
   * @param {Object} data – should come from world.serialize() & player.serialize()
   */
  save(data) {
    try {
      const json = JSON.stringify(data);
      localStorage.setItem(this.key, json);
    } catch (err) {
      console.error('Storage.save failed:', err);
    }
  }

  /**
   * Load saved game data.
   * @returns {Object|null} – parsed data or null if nothing was saved
   */
  load() {
    try {
      const json = localStorage.getItem(this.key);
      return json ? JSON.parse(json) : null;
    } catch (err) {
      console.error('Storage.load failed:', err);
      return null;
    }
  }

  /**
   * Clear saved data.
   */
  clear() {
    localStorage.removeItem(this.key);
  }
}
