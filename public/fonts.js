// Handle Google Fonts loading failure gracefully
(function() {
  // Check if the fonts have already been loaded
  if (document.fonts && document.fonts.check) {
    // Set a timeout to check if the fonts have loaded
    setTimeout(function() {
      const fontLoaded = document.fonts.check('1em Poppins') && document.fonts.check('1em Work Sans');
      
      // If the fonts haven't loaded, apply fallback fonts
      if (!fontLoaded) {
        console.log('Applying font fallbacks due to loading failure');
        
        // Apply system fonts as fallbacks
        document.documentElement.style.setProperty('--font-heading', 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif');
        document.documentElement.style.setProperty('--font-sans', 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif');
      }
    }, 3000); // Check after 3 seconds
  }
})(); 