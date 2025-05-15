/**
 * Gallery Editor - Video Thumbnail Generator
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('Gallery Editor loaded');
    
    // Find the generate thumbnail button
    const generateThumbnailBtn = document.getElementById('generate-thumbnail-btn');
    if (generateThumbnailBtn) {
        console.log('Generate thumbnail button found');
        generateThumbnailBtn.addEventListener('click', function() {
            console.log('Generate thumbnail button clicked');
            generateThumbnailFromVideo();
        });
    } else {
        console.error('Generate thumbnail button not found');
    }
    
    // Function to generate thumbnail from video
    function generateThumbnailFromVideo() {
        console.log('Generating thumbnail from video');
        
        // Get elements
        const videoUrlInput = document.getElementById('gallery-video-url');
        const imageInput = document.getElementById('gallery-image');
        const previewImage = document.querySelector('.image-preview img');
        const thumbnailStatus = document.getElementById('thumbnail-status');
        
        // Show status
        if (thumbnailStatus) {
            thumbnailStatus.textContent = 'Generating thumbnail...';
            thumbnailStatus.style.display = 'block';
            thumbnailStatus.style.color = '#d4a373';
        }
        
        if (!videoUrlInput || !videoUrlInput.value) {
            console.error('No video URL provided');
            alert('Please enter a video URL first');
            if (thumbnailStatus) {
                thumbnailStatus.textContent = 'Failed: No video URL provided';
                thumbnailStatus.style.color = '#dc3545';
            }
            return;
        }
        
        console.log('Video URL:', videoUrlInput.value);
        
        // Create a temporary video element
        const video = document.createElement('video');
        video.crossOrigin = 'anonymous'; // Try to avoid CORS issues
        
        // Fix URL if needed
        let videoUrl = videoUrlInput.value;
        if (videoUrl.startsWith('//')) {
            videoUrl = 'https:' + videoUrl;
        }
        
        video.src = videoUrl;
        console.log('Video element created with src:', video.src);
        
        // When video metadata is loaded, capture a frame
        video.addEventListener('loadedmetadata', function() {
            console.log('Video metadata loaded');
            // Set video to a specific time (e.g., 1 second in)
            video.currentTime = 1;
        });
        
        // When the time updates (after seeking), capture the frame
        video.addEventListener('timeupdate', function() {
            console.log('Video time updated, capturing frame');
            // Create a canvas to capture the frame
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            
            console.log('Canvas created with dimensions:', canvas.width, 'x', canvas.height);
            
            // Draw the video frame to the canvas
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            try {
                // Convert canvas to data URL
                const dataUrl = canvas.toDataURL('image/jpeg');
                console.log('Thumbnail generated successfully');
                
                // Update the image preview
                if (previewImage) {
                    previewImage.src = dataUrl;
                    previewImage.style.display = 'block'; // Make sure the preview is visible
                    console.log('Preview image updated');
                }
                
                // Update the hidden image input with the data URL
                if (imageInput) {
                    imageInput.value = dataUrl;
                    console.log('Image input value set');
                }
                
                // Update status
                if (thumbnailStatus) {
                    thumbnailStatus.textContent = 'Thumbnail generated successfully!';
                    thumbnailStatus.style.color = '#28a745';
                }
                
                // Show success message
                alert('Thumbnail generated successfully!');
            } catch (error) {
                console.error('Error generating thumbnail:', error);
                alert('Error generating thumbnail. The video might be from a different domain (CORS error).');
                
                // Update status
                if (thumbnailStatus) {
                    thumbnailStatus.textContent = 'Error: ' + error.message;
                    thumbnailStatus.style.color = '#dc3545';
                }
            }
            
            // Clean up
            video.pause();
            video.removeAttribute('src');
            video.load();
        });
        
        // Handle errors
        video.addEventListener('error', function() {
            console.error('Video error:', video.error);
            alert('Error loading video. Please check the URL and try again.');
            
            // Update status
            if (thumbnailStatus) {
                thumbnailStatus.textContent = 'Error loading video. Please check the URL.';
                thumbnailStatus.style.color = '#dc3545';
            }
        });
        
        // Start loading the video
        video.load();
        console.log('Video loading started');
    }
    
    // Function to preview selected image
    function previewImage(input) {
        if (input.files && input.files[0]) {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                const preview = document.querySelector('.image-preview img');
                if (preview) {
                    preview.src = e.target.result;
                    preview.style.display = 'block'; // Make sure the preview is visible
                }
            };
            
            reader.readAsDataURL(input.files[0]);
        }
    }
    
    // Add event listener for image input change
    const imageFileInput = document.querySelector('input[type="file"][accept="image/*"]');
    if (imageFileInput) {
        imageFileInput.addEventListener('change', function() {
            previewImage(this);
        });
    }
    
    // Add event listener for video preview
    const videoUrlInput = document.getElementById('gallery-video-url');
    if (videoUrlInput) {
        videoUrlInput.addEventListener('change', function() {
            const videoPreview = document.getElementById('video-preview');
            if (videoPreview && this.value) {
                const source = videoPreview.querySelector('source');
                if (source) {
                    source.src = this.value;
                    videoPreview.load();
                    document.querySelector('.video-preview').style.display = 'block';
                }
            }
        });
    }
}); 