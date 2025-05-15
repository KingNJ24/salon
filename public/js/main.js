document.addEventListener('DOMContentLoaded', function() {
  // Mobile menu toggle
  const menuToggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.nav');
  
  if (menuToggle) {
    menuToggle.addEventListener('click', function() {
      nav.classList.toggle('active');
      
      // Toggle menu icon
      const spans = menuToggle.querySelectorAll('span');
      spans.forEach(span => {
        span.classList.toggle('active');
      });
    });
  }
  
  // Gallery filtering (if on lookbook page)
  const categoryFilters = document.querySelectorAll('.category-filter');
  const galleryItems = document.querySelectorAll('.gallery-item');
  
  if (categoryFilters.length > 0) {
    categoryFilters.forEach(filter => {
      filter.addEventListener('click', function() {
        // Remove active class from all filters
        categoryFilters.forEach(f => f.classList.remove('active'));
        
        // Add active class to clicked filter
        this.classList.add('active');
        
        const category = this.getAttribute('data-category');
        console.log('Filtering by category:', category);
        
        // Show all items if "All" is selected, otherwise filter
        galleryItems.forEach(item => {
          if (category === 'All' || item.getAttribute('data-category') === category) {
            item.style.display = 'block';
          } else {
            item.style.display = 'none';
          }
        });
      });
    });
  }
  
  // Video handling for video gallery items
  const videoThumbnails = document.querySelectorAll('.video-thumbnail');
  
  if (videoThumbnails.length > 0) {
    videoThumbnails.forEach(thumbnail => {
      thumbnail.addEventListener('click', function() {
        const videoSrc = this.getAttribute('data-video-src');
        if (videoSrc) {
          // Create modal with video player
          const modal = document.createElement('div');
          modal.className = 'video-modal';
          
          const videoContainer = document.createElement('div');
          videoContainer.className = 'video-container';
          
          const closeButton = document.createElement('button');
          closeButton.className = 'close-modal';
          closeButton.innerHTML = '&times;';
          closeButton.addEventListener('click', () => {
            document.body.removeChild(modal);
          });
          
          const video = document.createElement('video');
          video.src = videoSrc;
          video.controls = true;
          video.autoplay = true;
          
          videoContainer.appendChild(video);
          videoContainer.appendChild(closeButton);
          modal.appendChild(videoContainer);
          document.body.appendChild(modal);
          
          // Close modal when clicking outside the video
          modal.addEventListener('click', function(e) {
            if (e.target === modal) {
              document.body.removeChild(modal);
            }
          });
        }
      });
    });
  }
  
  // Form validation for booking form
  const bookingForm = document.getElementById('booking-form');
  
  if (bookingForm) {
    bookingForm.addEventListener('submit', function(e) {
      let isValid = true;
      const requiredFields = bookingForm.querySelectorAll('[required]');
      
      requiredFields.forEach(field => {
        if (!field.value.trim()) {
          isValid = false;
          field.classList.add('error');
        } else {
          field.classList.remove('error');
        }
      });
      
      if (!isValid) {
        e.preventDefault();
        alert('Please fill in all required fields.');
      }
    });
  }
}); 