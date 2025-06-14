// landingPage.js - Simple button handler without complex imports
console.log('🚀 Simple landing page script loading...');

document.addEventListener('DOMContentLoaded', () => {
  console.log('🎮 Setting up simple button handlers...');
  
  // Get button elements
  const btnStart = document.getElementById('btnStart');
  const btnLoad = document.getElementById('btnLoad');
  const btnRivals = document.getElementById('btnRivals');
  const btnShop = document.getElementById('btnShop');
  const btnGameMode = document.getElementById('btnGameMode');
  const inputName = document.getElementById('playerName');

  console.log('Button elements check:', {
    btnStart: btnStart ? '✓' : '✗',
    btnLoad: btnLoad ? '✓' : '✗',
    btnRivals: btnRivals ? '✓' : '✗',
    btnShop: btnShop ? '✓' : '✗',
    btnGameMode: btnGameMode ? '✓' : '✗',
    inputName: inputName ? '✓' : '✗'
  });

  // Simple button handlers
  if (btnStart) {
    btnStart.addEventListener('click', () => {
      console.log('✅ Start Game clicked!');
      const playerName = inputName ? inputName.value.trim() || 'Player' : 'Player';
      alert(`🎮 Starting new game for ${playerName}!\n\nThis will launch the game with the full module system.`);
      
      // TODO: Implement actual game start
      // For now, just show the canvas
      const canvas = document.getElementById('gameCanvas');
      const landing = document.getElementById('landingScreen');
      if (canvas && landing) {
        landing.style.display = 'none';
        canvas.style.display = 'block';
        
        // Draw a simple message on canvas
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#2563EB';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'white';
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Game Starting...', canvas.width/2, canvas.height/2);
        ctx.font = '24px Arial';
        ctx.fillText('Press ESC to return to menu', canvas.width/2, canvas.height/2 + 60);
        
        // Allow ESC to return to menu
        const handleEscape = (e) => {
          if (e.key === 'Escape') {
            landing.style.display = 'flex';
            canvas.style.display = 'none';
            window.removeEventListener('keydown', handleEscape);
          }
        };
        window.addEventListener('keydown', handleEscape);
      }
    });
  }

  if (btnLoad) {
    btnLoad.addEventListener('click', () => {
      console.log('✅ Load Game clicked!');
      alert('💾 Load saved game functionality coming soon!\n\nThis will allow you to restore your previous progress.');
    });
  }

  if (btnRivals) {
    btnRivals.addEventListener('click', () => {
      console.log('✅ Rivals (Character Selection) clicked!');
      alert('👥 Character selection screen coming soon!\n\nChoose from:\n• Bear\n• Fire\n• Joao\n• Robot');
    });
  }

  if (btnShop) {
    btnShop.addEventListener('click', () => {
      console.log('✅ Shop clicked!');
      alert('🛒 Welcome to the Shop!\n\nShop features coming soon:\n• Character skins\n• Weapons\n• Power-ups\n• Special abilities');
    });
  }

  if (btnGameMode) {
    btnGameMode.addEventListener('click', () => {
      console.log('✅ Game Mode clicked!');
      alert('🎯 Game mode selection coming soon!\n\nModes will include:\n• Time-based survival\n• Boss rush\n• Endless mode\n• Tournament');
    });
  }

  console.log('🎮 Button event listeners attached successfully!');
});

// Listen for the landing screen ready event from video loader
document.addEventListener('landingScreenReady', () => {
  console.log('🎬 Landing screen is ready and visible!');
});
