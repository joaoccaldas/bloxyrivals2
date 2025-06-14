// landingPage.js - Main entry point for the game (Debug Version)

console.log('🚀 Landing page script loading...');

// Global variables
let game = null;
let menu = null;
let rivalsUI = null;
let gameModeSelector = null;
let selectedCharacterId = 0;
let selectedGameMode = 'time_based'; // Default game mode

// Variables for DOM elements - defined globally
let canvasId, canvas, landing, btnStart, btnRivals, btnShop, btnGameMode, inputName;

// Initialize the landing page after the video loading screen is done
function initLandingPage() {
  console.log('🎮 Initializing landing page...');
  
  // Make sure landing screen is fully visible and interactive
  const landingScreen = document.getElementById('landingScreen');
  if (landingScreen) {
    landingScreen.classList.add('visible');
    console.log('🖥️ Ensuring landing screen is visible and interactive');
  }
  
  // Test DOM elements first  canvasId   = 'gameCanvas';
  canvas     = document.getElementById(canvasId);
  landing    = document.getElementById('landingScreen');
  btnStart   = document.getElementById('btnStart');
  btnRivals  = document.getElementById('btnRivals');
  btnShop    = document.getElementById('btnShop');
  btnGameMode = document.getElementById('btnGameMode');
  inputName  = document.getElementById('playerName');

  console.log('🔍 DOM Elements check:');
  console.log('canvas:', canvas ? '✓' : '✗');
  console.log('landing:', landing ? '✓' : '✗');
  console.log('btnStart:', btnStart ? '✓' : '✗');
  console.log('btnRivals:', btnRivals ? '✓' : '✗');
  console.log('btnShop:', btnShop ? '✓' : '✗');
  console.log('btnGameMode:', btnGameMode ? '✓' : '✗');
  console.log('inputName:', inputName ? '✓' : '✗');

  if (!canvas || !landing || !btnStart || !btnRivals || !btnShop || !btnGameMode || !inputName) {
    console.error('❌ Required elements not found!');
    alert('Required elements not found! Check console for details.');
    return;
  }
  
  // Set up event listeners right after DOM elements are confirmed to exist
  setupEventListeners();
}

/** Show landing screen */
function showLanding() {
  console.log('📱 Showing landing screen');
  landing.style.display = 'flex';
  canvas.style.display  = 'none';
}

/** Show game canvas */
function showCanvas() {
  console.log('🎮 Showing game canvas');
  landing.style.display = 'none';
  canvas.style.display  = 'block';
}

/** Get player name or default */
function getPlayerName() {
  const name = inputName.value.trim();
  return name === '' ? 'Player' : name;
}

/** Start a new game */
async function startGame() {
  console.log('🎲 Starting new game...');
  try {
    // Dynamic import to avoid blocking the initial script
    console.log('📦 Loading Game module...');
    const { Game } = await import('../../src/core/game.js');
    console.log('✅ Game module loaded');
    
    if (rivalsUI)  { rivalsUI.cleanup();  rivalsUI = null; }
    if (menu)      { menu.destroy();      menu = null; }
    if (game)      { game.destroy();      game = null; }    
    showCanvas();
    console.log('🏗️ Creating game instance...');    game = new Game(
      canvasId,
      selectedCharacterId,
      startMenu, // pause callback
      (charId) => { // game over callback
        showGameOverScreen(charId);
        console.log('Game over callback');
      }
    );
    
    // Set the selected game mode
    console.log(`🎮 Setting game mode to: ${selectedGameMode}`);
    game.setGameMode(selectedGameMode);
    
    console.log('🎯 Initializing game...');
    await game.init(loadExisting);
    console.log('✅ Game started successfully!');
    
  } catch (err) {
    console.error('❌ Game start failed:', err);
    alert('Failed to start game: ' + err.message);
  }
}

/** Show rivals (character selection) UI */
async function showRivals() {
  console.log('👥 Showing rivals screen...');
  
  try {
    console.log('📦 Loading Rivals module...');
    const { Rivals } = await import('../../src/ui/rivals.js');
    console.log('✅ Rivals module loaded');
    
    if (menu)      { menu.destroy();      menu = null; }
    if (game)      { game.destroy();      game = null; }
    if (rivalsUI)  { rivalsUI.cleanup();  rivalsUI = null; }

    showCanvas();
    rivalsUI = new Rivals(
      canvas,
      (charId) => {
        selectedCharacterId = charId;
        rivalsUI.cleanup();
        rivalsUI = null;
        showLanding();
      },
      () => {
        rivalsUI.cleanup();
        rivalsUI = null;
        showLanding();
      }
    );
    console.log('✅ Rivals screen initialized');
    
  } catch (err) {
    console.error('❌ Rivals failed:', err);
    alert('Failed to load rivals: ' + err.message);
  }
}

/** Show shop interface */
function showShop() {
  console.log('🛒 Shop button clicked!');
  console.log('%c SHOP BUTTON CLICKED SUCCESSFULLY! ', 'background: green; color: white; font-size: 16px;');
  
  // Log any DOM events to confirm interface is responsive
  document.getElementById('landingScreen').classList.add('button-debug');
  
  alert('Welcome to the Shop!\n\nShop features coming soon:\n• Character skins\n• Weapons\n• Power-ups\n• Special abilities');
}

/** Show game mode selection */
async function showGameMode() {
  console.log('🎮 Showing game mode selection...');
  
  try {
    console.log('📦 Loading GameModeSelector module...');
    const { GameModeSelector } = await import('../../src/ui/gameModeSelector.js');
    console.log('✅ GameModeSelector module loaded');
    
    if (menu) { menu.destroy(); menu = null; }
    if (game) { game.destroy(); game = null; }
    if (rivalsUI) { rivalsUI.cleanup(); rivalsUI = null; }
    if (gameModeSelector) { gameModeSelector.cleanup(); gameModeSelector = null; }

    showCanvas();    
    gameModeSelector = new GameModeSelector(
      canvas,
      (selectedMode) => {
        console.log(`🎯 Mode selected: ${selectedMode}`);
        selectedGameMode = selectedMode; // Store the selected mode
        gameModeSelector.cleanup();
        gameModeSelector = null;
        showLanding();
      },
      () => {
        console.log('🔙 Back from game mode selection');
        gameModeSelector.cleanup();
        gameModeSelector = null;
        showLanding();
      }
    );
    console.log('✅ Game mode selector initialized');
    
  } catch (err) {
    console.error('❌ Game mode selector failed:', err);
    alert('Failed to load game mode selector: ' + err.message);
  }
}

// Function to set up event listeners after DOM elements are confirmed to exist
function setupEventListeners() {
  console.log('🔗 Setting up event listeners...');
  
  // Add direct click event listeners to all buttons
  btnStart.addEventListener('click', function(e) {
    console.log('🎮 Start button clicked!');
    e.preventDefault();
    e.stopPropagation();
    startGame();
  });
  
  btnRivals.addEventListener('click', function(e) {
    console.log('👥 Rivals button clicked!');
    e.preventDefault();
    e.stopPropagation();
    showRivals();
  });
  
  btnShop.addEventListener('click', function(e) {
    console.log('🛒 Shop button clicked!');
    e.preventDefault();
    e.stopPropagation();
    showShop();
  });
  
  btnGameMode.addEventListener('click', function(e) {
    console.log('🎮 Game Mode button clicked!');
    e.preventDefault();
    e.stopPropagation();
    showGameMode();
  });
  
  console.log('✅ All event listeners have been set up successfully!');
}

/** Pause menu overlay */
async function startMenu() {
  if (menu) {
    menu.destroy();
    menu = null;
    return;
  }
  
  try {
    console.log('📦 Loading MenuSystem module...');
    const { MenuSystem } = await import('../../src/ui/menuSystem.js');
    console.log('✅ MenuSystem module loaded');
    
    menu = new MenuSystem(canvas, {
      playerName: getPlayerName(),
      currentCharId: selectedCharacterId,
      onResumeGame: () => {
        console.log('▶️ Resuming game...');
        menu.destroy();
        menu = null;
        if (game && typeof game.resume === 'function') {
          game.resume();
        }
      },
      onSaveGame: () => {
        console.log('💾 Saving game...');
        if (game) game.save();
      },
      onShop: () => {
        console.log('🛒 Shop from pause menu...');
        showShop();
      },
      onGameMode: () => {
        console.log('🎮 Game Mode from pause menu...');
        menu.destroy();
        menu = null;
        showGameMode();
      },      onExitGame: () => {
        console.log('🚪 Exiting to main menu...');
        menu.destroy();
        menu = null;
        if (game) {
          game.exitToMenu();
        } else {
          // Fallback if game is not available
          showLanding();
        }
      }
    });
    console.log('✅ Pause menu created');
  } catch (err) {
    console.error('❌ Failed to create pause menu:', err);
    alert('Failed to create pause menu: ' + err.message);
  }
}

// Allow ESC to pause when playing
window.addEventListener('keydown', e => {
  if (e.key === 'Escape' && game && game.state === 'playing') {
    console.log('⏸️ ESC key pressed - pausing game');
    startMenu();
  }
});

// Listen for game exit to menu event
window.addEventListener('game:exitToMenu', () => {
  console.log('🏠 Game requested exit to menu - returning to landing page');
  // Clean up any existing menu
  if (menu) {
    menu.destroy();
    menu = null;
  }
  // Clean up game instance
  if (game) {
    game = null;
  }
  // Show landing page
  showLanding();
});

// Initial setup
console.log('🏁 Setting up initial state...');

function initializePage() {
  console.log('🎨 Initializing page...');
  showLanding();
  console.log('✅ Page initialized successfully!');
}

// Function to start the initialization process
function startInitialization() {
  console.log('🚀 Starting initialization process...');
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      // Wait for the landing screen to be ready (after video)
      document.addEventListener('landingScreenReady', initLandingPage);
      // Fallback in case video doesn't trigger the event
      setTimeout(() => {
        if (document.getElementById('landingScreen')?.classList.contains('hidden')) {
          console.log('⚠️ Landing screen still hidden after timeout, initializing anyway...');
          const landingScreen = document.getElementById('landingScreen');
          if (landingScreen) {
            landingScreen.classList.remove('hidden');
            landingScreen.classList.add('visible');
            initLandingPage();
          }
        }
      }, 8000); // 8 second fallback
    });
  } else {
    // If DOM is already loaded, just wait for landing screen
    document.addEventListener('landingScreenReady', initLandingPage);
    // Same fallback as above
    setTimeout(() => {
      if (document.getElementById('landingScreen')?.classList.contains('hidden')) {
        console.log('⚠️ Landing screen still hidden after timeout, initializing anyway...');
        const landingScreen = document.getElementById('landingScreen');
        if (landingScreen) {
          landingScreen.classList.remove('hidden');
          landingScreen.classList.add('visible');
          initLandingPage();
        }
      }
    }, 8000);
  }
}

/** Show game over screen with proper statistics */
function showGameOverScreen(selectedCharacterId) {
  if (!game) return;
  
  // Get game statistics
  const finalScore = game.pointSystem ? game.pointSystem.getPoints() : game.score || 0;
  const kills = game.pointSystem ? game.pointSystem.getKills() : game.kills || 0;
  
  // Calculate time survived
  const timeSurvived = game.gameStartTime ? 
    Math.floor((Date.now() - game.gameStartTime) / 1000) : 0;
  
  // Get game mode information
  const gameMode = game.gameModeInterface ? 
    game.gameModeInterface.getResults() : null;
  
  // Get player name from input or use default
  const playerName = inputName ? inputName.value.trim() || 'Player' : 'Player';
  
  // Create and show game over screen (assuming GameOverScreen is globally available)
  if (typeof GameOverScreen !== 'undefined') {
    const gameOverScreen = new GameOverScreen(canvas, {
      playerName,
      characterId: selectedCharacterId,
      finalScore,
      kills,
      timeSurvived,
      gameMode,
      onRestart: () => {
        // Restart with same character and settings
        startGame(false, selectedCharacterId);
      },
      onExit: () => {
        // Return to main menu
        startMenu();
      }
    });
  } else {
    // Fallback to alert if GameOverScreen is not available
    alert(`Game Over!\nScore: ${finalScore}\nKills: ${kills}\nTime Survived: ${Math.floor(timeSurvived / 60)}:${(timeSurvived % 60).toString().padStart(2, '0')}`);
    startMenu();
  }
}

// Start the initialization process
startInitialization();

// Force landing page to be properly interactive after a short delay as a final failsafe
setTimeout(() => {
  const landingScreen = document.getElementById('landingScreen');
  if (landingScreen) {
    landingScreen.classList.remove('hidden');
    landingScreen.classList.add('visible');
    console.log('🛠️ Final failsafe: Enforcing landing screen visibility and interactivity');
    
    // As a final check, ensure we initialize the landing page if it hasn't been done yet
    const btnStart = document.getElementById('btnStart');
    if (!btnStart || !btnStart._hasEventListener) {
      console.log('🔄 Final failsafe: Re-initializing landing page');
      initLandingPage();
    }
  }
}, 10000); // 10 seconds should be more than enough time for everything to load

console.log('🎉 Landing page script loaded successfully!');
