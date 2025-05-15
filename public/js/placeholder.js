// Client-side placeholder image generator
function generatePlaceholderImage(width, height, text) {
  // Create a canvas element
  const canvas = document.createElement('canvas');
  canvas.width = width || 300;
  canvas.height = height || 200;
  
  // Get the drawing context
  const ctx = canvas.getContext('2d');
  
  // Draw background
  ctx.fillStyle = '#f0f0f0';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Add a border
  ctx.strokeStyle = '#cccccc';
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, canvas.width, canvas.height);
  
  // Add text
  const displayText = text || 'Image Placeholder';
  ctx.fillStyle = '#999999';
  ctx.font = 'bold 16px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(displayText, canvas.width / 2, canvas.height / 2);
  
  // Convert to data URL
  return canvas.toDataURL('image/png');
}

// Apply placeholder to all images on error
document.addEventListener('DOMContentLoaded', function() {
  const images = document.querySelectorAll('img');
  
  images.forEach(img => {
    img.addEventListener('error', function() {
      // Get original dimensions
      const width = this.getAttribute('width') || 300;
      const height = this.getAttribute('height') || 200;
      
      // Generate text based on alt or class
      const text = this.alt || this.className || 'Image';
      
      // Set placeholder
      this.src = generatePlaceholderImage(width, height, text);
    });
  });

  // Handle logo image errors
  const logoImg = document.querySelector('.logo-img');
  if (logoImg) {
    logoImg.addEventListener('error', function() {
      this.onerror = null;
      
      // First try to use an SVG logo
      if (this.src.endsWith('.svg')) {
        // If SVG fails, try PNG
        this.src = '/images/nandinij-logo.png';
      } else if (this.src.endsWith('.png')) {
        // If PNG fails, try a placeholder service
        this.src = 'https://via.placeholder.com/180x60/9c8370/ffffff?text=NandiniJ+Makeup+Studio';
      } else {
        // If placeholder also fails, show the text span
        this.style.display = 'none';
        const logoText = this.nextElementSibling;
        if (logoText) {
          logoText.style.display = 'inline';
        }
      }
    });
  }
}); 