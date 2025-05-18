document.addEventListener('DOMContentLoaded', function() {
  // Mobile menu toggle with improved animation
  const menuToggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.nav');
  const body = document.body;
  
  if (menuToggle) {
    menuToggle.addEventListener('click', function() {
      nav.classList.toggle('active');
      menuToggle.classList.toggle('active');
      body.classList.toggle('menu-open');
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', function(e) {
      if (nav.classList.contains('active') && 
          !nav.contains(e.target) && 
          !menuToggle.contains(e.target)) {
        nav.classList.remove('active');
        menuToggle.classList.remove('active');
        body.classList.remove('menu-open');
      }
    });
  }
  
  // Header scroll effect
  const header = document.querySelector('.header');
  let lastScrollTop = 0;
  
  window.addEventListener('scroll', function() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    // Add scrolled class when scrolling down
    if (scrollTop > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
    
    lastScrollTop = scrollTop;
  });
  
  // Reveal animations on scroll
  const revealElements = document.querySelectorAll('.service-card, .gallery-item, .section h2, .booking-form, .contact-info');
  
  function applyAnimations() {
    revealElements.forEach(element => {
      // Apply slide-up animation to these elements
      element.classList.add('animate-slide-up');
      
      // Set opacity to 0 initially
      element.style.opacity = '0';
    });
  }
  
  function revealOnScroll() {
    const windowHeight = window.innerHeight;
    const revealPoint = 150;
    
    revealElements.forEach(element => {
      const elementTop = element.getBoundingClientRect().top;
      
      if (elementTop < windowHeight - revealPoint) {
        element.style.opacity = '1';
      }
    });
  }
  
  // Apply animations
  applyAnimations();
  
  // Run reveal on scroll initially and on each scroll
  revealOnScroll();
  window.addEventListener('scroll', revealOnScroll);
  
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
        
        // Show all items if "All" is selected, otherwise filter
        galleryItems.forEach(item => {
          if (category === 'All' || item.getAttribute('data-category') === category) {
            item.style.display = 'block';
            setTimeout(() => {
              item.style.opacity = '1';
              item.style.transform = 'translateY(0)';
            }, 50);
          } else {
            item.style.opacity = '0';
            item.style.transform = 'translateY(20px)';
            setTimeout(() => {
              item.style.display = 'none';
            }, 300);
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
            modal.classList.add('closing');
            setTimeout(() => {
              document.body.removeChild(modal);
            }, 300);
          });
          
          const video = document.createElement('video');
          video.src = videoSrc;
          video.controls = true;
          video.autoplay = true;
          
          videoContainer.appendChild(video);
          videoContainer.appendChild(closeButton);
          modal.appendChild(videoContainer);
          document.body.appendChild(modal);
          
          // Add enter animation
          setTimeout(() => {
            modal.classList.add('visible');
          }, 10);
          
          // Close modal when clicking outside the video
          modal.addEventListener('click', function(e) {
            if (e.target === modal) {
              modal.classList.add('closing');
              setTimeout(() => {
                document.body.removeChild(modal);
              }, 300);
            }
          });
        }
      });
    });
  }
  
  // Form validation with enhanced UI feedback
  const contactForm = document.getElementById('contact-form');
  
  if (contactForm) {
    const requiredFields = contactForm.querySelectorAll('[required]');
    
    // Add form input animations
    requiredFields.forEach(field => {
      field.addEventListener('focus', function() {
        this.parentElement.classList.add('focused');
      });
      
      field.addEventListener('blur', function() {
        if (!this.value) {
          this.parentElement.classList.remove('focused');
        }
      });
    });
    
    contactForm.addEventListener('submit', function(e) {
      let isValid = true;
      
      requiredFields.forEach(field => {
        if (!field.value.trim()) {
          isValid = false;
          field.classList.add('error');
          
          // Add shake animation to invalid fields
          field.classList.add('shake');
          setTimeout(() => {
            field.classList.remove('shake');
          }, 600);
          
        } else {
          field.classList.remove('error');
        }
      });
      
      if (!isValid) {
        e.preventDefault();
        
        // Scroll to the first error field
        const firstError = contactForm.querySelector('.error');
        if (firstError) {
          firstError.focus();
        }
      }
    });
  }
  
  // Add button animation for direction button
  const directionsBtn = document.querySelector('.get-directions-btn');
  if (directionsBtn) {
    directionsBtn.addEventListener('mouseenter', function() {
      const icon = this.querySelector('svg');
      if (icon) {
        icon.classList.add('animate-pulse');
      }
    });
    
    directionsBtn.addEventListener('mouseleave', function() {
      const icon = this.querySelector('svg');
      if (icon) {
        icon.classList.remove('animate-pulse');
      }
    });
  }
  
  // Add smooth scroll for internal links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      
      const targetElement = document.querySelector(targetId);
      
      if (targetElement) {
        e.preventDefault();
        window.scrollTo({
          top: targetElement.offsetTop - 100,
          behavior: 'smooth'
        });
      }
    });
  });
}); 