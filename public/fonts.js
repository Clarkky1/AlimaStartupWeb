// Font loading fallback script
(function() {
  // Function to check if Google Fonts loaded
  function checkGoogleFontsLoaded() {
    const fontFamily = window.getComputedStyle(document.body).fontFamily;
    return fontFamily.includes('Poppins') || fontFamily.includes('Work Sans');
  }

  // Check after a delay to allow fonts to load
  setTimeout(function() {
    // If Google Fonts failed to load, add the fallback CSS
    if (!checkGoogleFontsLoaded()) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = '/fallback-fonts.css';
      document.head.appendChild(link);
      console.log('Applied font fallbacks due to Google Fonts loading failure');
    }
  }, 2000); // 2 second timeout
})(); 