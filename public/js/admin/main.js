document.addEventListener('DOMContentLoaded', function() {
  // Initialize status update handlers
  initStatusUpdates();
  
  // Initialize form submission handlers
  initFormSubmissions();
  
  // Initialize delete confirmation
  initDeleteConfirmation();
  
  // Initialize mobile menu toggle
  initMobileMenu();
  
  // Initialize image upload
  initImageUpload();
});

// Handle updating booking statuses
function initStatusUpdates() {
  const statusSelects = document.querySelectorAll('.status-select');
  
  statusSelects.forEach(select => {
    select.addEventListener('change', function() {
      const bookingId = this.getAttribute('data-id');
      const status = this.value;
      
      fetch(`/api/booking/update/${bookingId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          // Update badge
          const badge = this.closest('tr').querySelector('.badge');
          badge.className = `badge badge-${status.toLowerCase()}`;
          badge.textContent = status;
          
          // Show success message
          showNotification('Status updated successfully', 'success');
        } else {
          showNotification('Failed to update status', 'error');
        }
      })
      .catch(error => {
        console.error('Error:', error);
        showNotification('An error occurred', 'error');
      });
    });
  });
}

// Handle form submissions
function initFormSubmissions() {
  const adminForms = document.querySelectorAll('.admin-form');
  
  adminForms.forEach(form => {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const formData = new FormData(form);
      const data = {};
      
      formData.forEach((value, key) => {
        // For nested objects like hours.monday
        if (key.includes('.')) {
          const [parent, child] = key.split('.');
          if (!data[parent]) data[parent] = {};
          data[parent][child] = value;
        } else {
          data[key] = value;
        }
      });
      
      const endpoint = form.getAttribute('data-endpoint');
      
      fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          showNotification('Saved successfully', 'success');
          
          // If redirect specified, go there
          const redirect = form.getAttribute('data-redirect');
          if (redirect) {
            window.location.href = redirect;
          }
        } else {
          showNotification('Failed to save changes', 'error');
        }
      })
      .catch(error => {
        console.error('Error:', error);
        showNotification('An error occurred', 'error');
      });
    });
  });
}

// Handle delete confirmations
function initDeleteConfirmation() {
  const deleteButtons = document.querySelectorAll('.delete-btn');
  
  deleteButtons.forEach(button => {
    button.addEventListener('click', function(e) {
      e.preventDefault();
      
      const confirmMessage = this.getAttribute('data-confirm') || 'Are you sure you want to delete this item?';
      
      if (confirm(confirmMessage)) {
        const endpoint = this.getAttribute('data-endpoint');
        
        fetch(endpoint, {
          method: 'POST',
        })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            // Remove the item from DOM
            const itemRow = this.closest('tr') || this.closest('.card');
            if (itemRow) {
              itemRow.remove();
            }
            
            showNotification('Item deleted successfully', 'success');
          } else {
            showNotification('Failed to delete', 'error');
          }
        })
        .catch(error => {
          console.error('Error:', error);
          showNotification('An error occurred', 'error');
        });
      }
    });
  });
}

// Initialize file uploads (images and videos)
function initImageUpload() {
  const imageUploaders = document.querySelectorAll('.image-upload');
  
  imageUploaders.forEach(uploader => {
    const fileInput = uploader.querySelector('input[type="file"]');
    const urlInput = uploader.querySelector('.image-url-input');
    const previewImg = uploader.querySelector('.image-preview img');
    const uploadBtn = uploader.querySelector('.upload-btn');
    const videoUrlInput = document.getElementById('gallery-video-url');
    const fileTypeInput = document.getElementById('gallery-type');
    
    // Show preview for the URL
    if (urlInput && urlInput.value) {
      previewImg.src = urlInput.value;
      previewImg.style.display = 'block';
    }
    
    // Handle file selection
    if (fileInput) {
      fileInput.addEventListener('change', function() {
        if (this.files && this.files[0]) {
          const file = this.files[0];
          const reader = new FileReader();
          
          // Check if it's a video file
          const isVideo = file.type.startsWith('video/');
          
          reader.onload = function(e) {
            if (previewImg) {
              previewImg.src = e.target.result;
              previewImg.style.display = 'block';
            }
          };
          
          reader.readAsDataURL(file);
        }
      });
    }
    
    // Handle uploads
    if (uploadBtn && fileInput) {
      uploadBtn.addEventListener('click', async function(e) {
        e.preventDefault();
        
        if (!fileInput.files || !fileInput.files[0]) {
          showNotification('Please select a file to upload', 'error');
          return;
        }
        
        const file = fileInput.files[0];
        const isVideo = file.type.startsWith('video/');
        
        uploadBtn.disabled = true;
        uploadBtn.textContent = 'Uploading...';
        
        try {
          let response;
          
          // Choose endpoint based on file type
          if (isVideo) {
            // For videos, use the dedicated video upload endpoint with base64
            const base64Data = await readFileAsBase64(file);
            
            // Use the video upload endpoint
            response = await fetch('/api/upload-video', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ 
                file: base64Data,
                fileName: file.name,
                fileType: file.type
              })
            });
          } else {
            // For images, use the regular upload endpoint with FormData
            const formData = new FormData();
            formData.append('file', file);
            
            response = await fetch('/api/upload', {
              method: 'POST',
              body: formData,
            });
          }
          
          // Process response
          if (!response.ok) {
            throw new Error(`Server returned ${response.status}: ${response.statusText}`);
          }
          
          const data = await response.json();
          
          if (data.success) {
            showNotification('File uploaded successfully', 'success');
            if (urlInput) {
              urlInput.value = data.filePath;
            }
            if (previewImg) {
              previewImg.src = data.filePath;
              previewImg.style.display = 'block';
            }
            
            // If we're in the gallery form and this is a video upload
            if (isVideo && videoUrlInput && fileTypeInput) {
              // If this is a video thumbnail upload, keep the video type
              fileTypeInput.value = 'video';
              
              // If no video URL is set yet, set it to the uploaded file path
              if (!videoUrlInput.value && data.fileType === 'video') {
                videoUrlInput.value = data.filePath;
              }
            }
          } else {
            showNotification('Failed to upload file: ' + (data.message || 'Unknown error'), 'error');
          }
        } catch (error) {
          console.error('Error:', error);
          showNotification('An error occurred during upload: ' + error.message, 'error');
        } finally {
          uploadBtn.disabled = false;
          uploadBtn.textContent = 'Upload';
        }
      });
    }
  });
}

// Helper function to convert file to base64
function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
}

// Mobile menu toggle
function initMobileMenu() {
  const mobileToggle = document.querySelector('.mobile-toggle');
  const sidebarNav = document.querySelector('.sidebar-nav');
  
  if (mobileToggle && sidebarNav) {
    mobileToggle.addEventListener('click', function() {
      sidebarNav.classList.toggle('active');
    });
  }
}

// Show notification
function showNotification(message, type = 'info') {
  // Check if notification container exists, if not, create it
  let notificationContainer = document.querySelector('.notification-container');
  
  if (!notificationContainer) {
    notificationContainer = document.createElement('div');
    notificationContainer.className = 'notification-container';
    notificationContainer.style.position = 'fixed';
    notificationContainer.style.top = '20px';
    notificationContainer.style.right = '20px';
    notificationContainer.style.zIndex = '9999';
    document.body.appendChild(notificationContainer);
  }
  
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  notification.style.padding = '12px 20px';
  notification.style.backgroundColor = type === 'success' ? '#d4edda' : type === 'error' ? '#f8d7da' : '#cce5ff';
  notification.style.color = type === 'success' ? '#155724' : type === 'error' ? '#721c24' : '#004085';
  notification.style.borderRadius = '4px';
  notification.style.marginBottom = '10px';
  notification.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
  
  // Add to container
  notificationContainer.appendChild(notification);
  
  // Remove after 3 seconds
  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transition = 'opacity 0.3s ease';
    
    // Remove from DOM after animation
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 3000);
} 