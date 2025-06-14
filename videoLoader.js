// videoLoader.js - Handles the video loading screen and transition to the landing page

// Global flag to prevent multiple initializations
if (window.videoLoaderInitialized) {
  // Video loader already initialized, skipping...
} else {
  window.videoLoaderInitialized = true;
  
document.addEventListener('DOMContentLoaded', () => {
  const videoLoadingScreen = document.getElementById('videoLoadingScreen');
  const landingScreen = document.getElementById('landingScreen');
  const loadingVideo = document.getElementById('loadingVideo');
  const loadingBar = document.getElementById('loadingBar');
  const skipButton = document.getElementById('skipButton');

  // Initialize variables
  let videoEnded = false;
  let assetsLoaded = false;
  let transitionTriggered = false;
  // Function to show the landing screen
  function showLandingScreen() {
    // Prevent multiple transitions
    if (transitionTriggered) {
      return;
    }
    transitionTriggered = true;
    
    console.log('🎬 Video intro completed, transitioning to landing screen');
    
    // Add a fade-out effect
    videoLoadingScreen.style.opacity = '0';
    
    // After fade-out completes, hide video screen and show landing screen
    setTimeout(() => {
      videoLoadingScreen.classList.add('hidden');
      landingScreen.classList.remove('hidden');
      
      // Need to force a repaint before adding the visible class
      void landingScreen.offsetWidth;
      
      // Add visible class to trigger CSS transition
      landingScreen.classList.add('visible');
      
      // Dispatch a custom event to notify that the landing page is visible
      const landingReadyEvent = new Event('landingScreenReady');
      document.dispatchEvent(landingReadyEvent);
      
      console.log('✅ Landing screen is now visible');
    }, 500); // Match this with the CSS transition time
  }
  // Event listeners for the loading video
  loadingVideo.addEventListener('timeupdate', () => {
    // Update the loading bar based on video progress
    if (loadingVideo.duration) {
      const progressPercent = (loadingVideo.currentTime / loadingVideo.duration) * 100;
      loadingBar.style.width = `${progressPercent}%`;
    }
  });
  
  // Special handling for mobile devices
  loadingVideo.addEventListener('touchend', () => {
    // On many mobile browsers, video play only works after user interaction
    loadingVideo.play().catch(error => {
      console.warn('Mobile video play attempt failed:', error);
    });
  });
  loadingVideo.addEventListener('ended', () => {
    console.log('🎥 Video playback ended');
    videoEnded = true;
    
    // If assets are already loaded, show landing screen
    if (assetsLoaded) {
      showLandingScreen();
    }
  });
  // Skip button functionality
  skipButton.addEventListener('click', () => {
    loadingVideo.pause();
    showLandingScreen();
  });
    // Failsafe: If something goes wrong, ensure the landing screen appears after a maximum wait time
  const maxWaitTime = 10000; // 10 seconds maximum wait time
  setTimeout(() => {
    if (!transitionTriggered) {
      console.warn('⚠️ Maximum wait time exceeded, forcing transition to landing screen');
      showLandingScreen();
    }
  }, maxWaitTime);  // Function to handle preloading assets
  function preloadGameAssets() {
    return new Promise((resolve) => {      // Preload critical images
      const imagesToPreload = [
        'assets/Scene/landingpage.png',
        'assets/buttons/shop.png',
        'assets/player/bear.png',
        'assets/player/fire.png',
        'assets/player/joao.png',
        'assets/player/robot.png'
      ];
      
      let imagesLoaded = 0;
      
      // Function to update progress bar based on loaded assets
      function updateProgress() {
        const totalAssets = imagesToPreload.length;
        const progressPercent = ((imagesLoaded / totalAssets) * 100);
        
        // Only update if the video is still playing (otherwise the video progress takes precedence)
        if (!videoEnded) {
          loadingBar.style.width = `${progressPercent}%`;
        }
        
        if (imagesLoaded >= totalAssets) {
          console.log('🖼️ All images preloaded successfully');
          resolve();
        }
      }
      
      // Load each image
      imagesToPreload.forEach(src => {
        const img = new Image();
        img.onload = () => {
          imagesLoaded++;
          updateProgress();
        };
        img.onerror = () => {
          console.warn(`Failed to preload image: ${src}`);
          imagesLoaded++;
          updateProgress();
        };
        img.src = src;
      });
    });
  }
  // Start video playback and asset preloading
  try {
    // Start the video with a slight delay to ensure DOM is ready
    setTimeout(() => {
      loadingVideo.play().catch(error => {
        console.error('Video playback failed:', error);
        // If video fails to play, show landing screen
        showLandingScreen();
      });
        // Start preloading assets in parallel
      preloadGameAssets().then(() => {
        console.log('🎮 Game assets preloaded successfully');
        assetsLoaded = true;
        
        // If video has already ended, show landing screen
        if (videoEnded) {
          showLandingScreen();
        }
      }).catch(error => {
        console.error('❌ Asset preloading failed:', error);
        assetsLoaded = true; // Mark as done anyway to not block the game
        
        // If video has already ended, proceed despite the error
        if (videoEnded) {
          showLandingScreen();
        }
      });
    }, 100);
  } catch (error) {
    console.error('Error during video initialization:', error);
    showLandingScreen();
  }
});

} // End of videoLoaderInitialized guard
