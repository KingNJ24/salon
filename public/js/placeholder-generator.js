// Create a canvas element to generate placeholder images
document.addEventListener('DOMContentLoaded', function() {
  const canvas = document.createElement('canvas');
  canvas.width = 300;
  canvas.height = 300;
  const ctx = canvas.getContext('2d');
  
  // Fill background
  ctx.fillStyle = '#f0f0f0';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Add a styled text
  ctx.fillStyle = '#9c8370';
  ctx.font = 'bold 40px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('No Image', canvas.width/2, canvas.height/2);
  
  // Convert to base64 image
  const placeholderImage = canvas.toDataURL('image/jpeg');
  
  // Save to localStorage for future use
  localStorage.setItem('placeholderImage', placeholderImage);
  
  // Replace all missing images with our placeholder
  const imgs = document.querySelectorAll('img');
  imgs.forEach(img => {
    img.addEventListener('error', function() {
      this.src = placeholderImage;
    });
    
    // Check if image is already broken
    if (img.naturalWidth === 0 && img.naturalHeight === 0) {
      img.src = placeholderImage;
    }
  });
}); 