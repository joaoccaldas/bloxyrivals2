// SoundManager.js
// Manages all audio including music, sound effects, and audio settings

export class SoundManager {
  constructor() {
    this.audioContext = null;
    this.masterGainNode = null;
    this.musicGainNode = null;
    this.sfxGainNode = null;
    
    // Audio settings
    this.settings = {
      masterVolume: 0.7,
      musicVolume: 0.5,
      sfxVolume: 0.8,
      muted: false
    };
    
    // Audio assets
    this.music = new Map();
    this.sounds = new Map();
    this.currentMusic = null;
    
    // Audio state
    this.isInitialized = false;
    this.loadingPromises = new Map();
    
    this.initialize();
  }

  /**
   * Initialize the audio system
   */
  async initialize() {
    try {
      // Create audio context
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Create gain nodes for volume control
      this.masterGainNode = this.audioContext.createGain();
      this.musicGainNode = this.audioContext.createGain();
      this.sfxGainNode = this.audioContext.createGain();
      
      // Connect gain nodes
      this.musicGainNode.connect(this.masterGainNode);
      this.sfxGainNode.connect(this.masterGainNode);
      this.masterGainNode.connect(this.audioContext.destination);
      
      // Set initial volumes
      this.updateVolumes();
      
      this.isInitialized = true;
      console.log('Sound manager initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize sound manager:', error);
    }
  }

  /**
   * Load an audio file
   * @param {string} name - Audio asset name
   * @param {string} url - Audio file URL
   * @param {string} type - Audio type ('music' or 'sfx')
   * @returns {Promise<void>}
   */
  async loadAudio(name, url, type = 'sfx') {
    if (this.loadingPromises.has(name)) {
      return this.loadingPromises.get(name);
    }
    
    const loadPromise = new Promise(async (resolve, reject) => {
      try {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
        
        const audioAsset = {
          buffer: audioBuffer,
          type: type,
          url: url
        };
        
        if (type === 'music') {
          this.music.set(name, audioAsset);
        } else {
          this.sounds.set(name, audioAsset);
        }
        
        console.log(`Loaded ${type}: ${name}`);
        resolve();
        
      } catch (error) {
        console.error(`Failed to load ${type} ${name}:`, error);
        reject(error);
      }
    });
    
    this.loadingPromises.set(name, loadPromise);
    return loadPromise;
  }

  /**
   * Load multiple audio files
   * @param {Array<{name: string, url: string, type: string}>} audioList - List of audio files to load
   * @returns {Promise<void>}
   */
  async loadAudioBatch(audioList) {
    const promises = audioList.map(audio => 
      this.loadAudio(audio.name, audio.url, audio.type)
    );
    
    try {
      await Promise.all(promises);
      console.log('All audio files loaded successfully');
    } catch (error) {
      console.error('Failed to load some audio files:', error);
    }
  }

  /**
   * Play a sound effect
   * @param {string} name - Sound name
   * @param {Object} options - Playback options
   * @returns {AudioBufferSourceNode|null} Audio source node
   */
  playSound(name, options = {}) {
    if (!this.isInitialized || this.settings.muted) return null;
    
    const sound = this.sounds.get(name);
    if (!sound) {
      console.warn(`Sound not found: ${name}`);
      return null;
    }
    
    try {
      const source = this.audioContext.createBufferSource();
      const gainNode = this.audioContext.createGain();
      
      source.buffer = sound.buffer;
      source.connect(gainNode);
      gainNode.connect(this.sfxGainNode);
      
      // Apply options
      const volume = options.volume !== undefined ? options.volume : 1;
      const playbackRate = options.playbackRate !== undefined ? options.playbackRate : 1;
      const loop = options.loop !== undefined ? options.loop : false;
      
      gainNode.gain.value = volume;
      source.playbackRate.value = playbackRate;
      source.loop = loop;
      
      // Start playback
      source.start(0);
      
      return source;
      
    } catch (error) {
      console.error(`Failed to play sound ${name}:`, error);
      return null;
    }
  }

  /**
   * Play background music
   * @param {string} name - Music name
   * @param {Object} options - Playback options
   * @returns {AudioBufferSourceNode|null} Audio source node
   */
  playMusic(name, options = {}) {
    if (!this.isInitialized || this.settings.muted) return null;
    
    // Stop current music
    this.stopMusic();
    
    const music = this.music.get(name);
    if (!music) {
      console.warn(`Music not found: ${name}`);
      return null;
    }
    
    try {
      const source = this.audioContext.createBufferSource();
      const gainNode = this.audioContext.createGain();
      
      source.buffer = music.buffer;
      source.connect(gainNode);
      gainNode.connect(this.musicGainNode);
      
      // Apply options
      const volume = options.volume !== undefined ? options.volume : 1;
      const fadeIn = options.fadeIn !== undefined ? options.fadeIn : 0;
      
      gainNode.gain.value = fadeIn > 0 ? 0 : volume;
      source.loop = true;
      
      // Fade in if requested
      if (fadeIn > 0) {
        gainNode.gain.exponentialRampToValueAtTime(
          volume, 
          this.audioContext.currentTime + fadeIn
        );
      }
      
      // Start playback
      source.start(0);
      
      this.currentMusic = {
        source: source,
        gainNode: gainNode,
        name: name
      };
      
      return source;
      
    } catch (error) {
      console.error(`Failed to play music ${name}:`, error);
      return null;
    }
  }

  /**
   * Stop current background music
   * @param {number} fadeOut - Fade out duration in seconds
   */
  stopMusic(fadeOut = 0) {
    if (!this.currentMusic) return;
    
    try {
      if (fadeOut > 0) {
        this.currentMusic.gainNode.gain.exponentialRampToValueAtTime(
          0.01, 
          this.audioContext.currentTime + fadeOut
        );
        
        setTimeout(() => {
          if (this.currentMusic) {
            this.currentMusic.source.stop();
            this.currentMusic = null;
          }
        }, fadeOut * 1000);
      } else {
        this.currentMusic.source.stop();
        this.currentMusic = null;
      }
    } catch (error) {
      console.error('Failed to stop music:', error);
      this.currentMusic = null;
    }
  }

  /**
   * Set master volume
   * @param {number} volume - Volume (0-1)
   */
  setMasterVolume(volume) {
    this.settings.masterVolume = Math.max(0, Math.min(1, volume));
    this.updateVolumes();
  }

  /**
   * Set music volume
   * @param {number} volume - Volume (0-1)
   */
  setMusicVolume(volume) {
    this.settings.musicVolume = Math.max(0, Math.min(1, volume));
    this.updateVolumes();
  }

  /**
   * Set sound effects volume
   * @param {number} volume - Volume (0-1)
   */
  setSfxVolume(volume) {
    this.settings.sfxVolume = Math.max(0, Math.min(1, volume));
    this.updateVolumes();
  }

  /**
   * Toggle mute
   * @param {boolean} muted - Mute state
   */
  setMuted(muted) {
    this.settings.muted = muted;
    this.updateVolumes();
    
    if (muted && this.currentMusic) {
      this.currentMusic.source.stop();
      this.currentMusic = null;
    }
  }

  /**
   * Update volume levels
   * @private
   */
  updateVolumes() {
    if (!this.isInitialized) return;
    
    const masterVol = this.settings.muted ? 0 : this.settings.masterVolume;
    
    this.masterGainNode.gain.value = masterVol;
    this.musicGainNode.gain.value = this.settings.musicVolume;
    this.sfxGainNode.gain.value = this.settings.sfxVolume;
  }

  /**
   * Get current audio settings
   * @returns {Object} Audio settings
   */
  getSettings() {
    return { ...this.settings };
  }

  /**
   * Check if audio is supported
   * @returns {boolean} True if audio is supported
   */
  isAudioSupported() {
    return !!(window.AudioContext || window.webkitAudioContext);
  }

  /**
   * Get loaded audio assets
   * @returns {Object} Audio assets info
   */
  getLoadedAssets() {
    return {
      music: Array.from(this.music.keys()),
      sounds: Array.from(this.sounds.keys()),
      currentMusic: this.currentMusic ? this.currentMusic.name : null
    };
  }

  /**
   * Preload common game sounds
   */
  async loadDefaultSounds() {
    const defaultSounds = [
      // Add your sound files here
      // { name: 'attack', url: 'assets/sounds/attack.mp3', type: 'sfx' },
      // { name: 'hit', url: 'assets/sounds/hit.mp3', type: 'sfx' },
      // { name: 'background', url: 'assets/music/background.mp3', type: 'music' }
    ];
    
    if (defaultSounds.length > 0) {
      await this.loadAudioBatch(defaultSounds);
    }
  }

  /**
   * Resume audio context (needed for user interaction requirement)
   */
  async resumeAudioContext() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume();
        console.log('Audio context resumed');
      } catch (error) {
        console.error('Failed to resume audio context:', error);
      }
    }
  }

  /**
   * Destroy the sound manager
   */
  destroy() {
    this.stopMusic();
    
    if (this.audioContext) {
      this.audioContext.close();
    }
    
    this.music.clear();
    this.sounds.clear();
    this.loadingPromises.clear();
    
    this.isInitialized = false;
  }
}
