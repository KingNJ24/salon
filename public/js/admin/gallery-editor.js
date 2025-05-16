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
        const videoPreview = document.getElementById('video-preview');
        
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
        
        // Try to capture from the existing video player first if it's an uploaded local video
        if (videoPreview && videoPreview.readyState >= 2) {
            try {
                console.log('Using existing video player for thumbnail');
                const canvas = document.createElement('canvas');
                canvas.width = videoPreview.videoWidth;
                canvas.height = videoPreview.videoHeight;
                
                const ctx = canvas.getContext('2d');
                ctx.drawImage(videoPreview, 0, 0, canvas.width, canvas.height);
                
                const dataUrl = canvas.toDataURL('image/jpeg');
                
                // Update the image preview
                if (previewImage) {
                    previewImage.src = dataUrl;
                    previewImage.style.display = 'block';
                    console.log('Preview image updated from existing video player');
                }
                
                // Update the hidden image input
                if (imageInput) {
                    imageInput.value = dataUrl;
                    console.log('Image input value set from existing video player');
                }
                
                if (thumbnailStatus) {
                    thumbnailStatus.textContent = 'Thumbnail generated successfully!';
                    thumbnailStatus.style.color = '#28a745';
                }
                
                return;
            } catch (error) {
                console.error('Error capturing from existing video player:', error);
                // Fall through to the normal method
            }
        }
        
        // Create a temporary video element
        const video = document.createElement('video');
        video.crossOrigin = 'anonymous'; // Try to avoid CORS issues
        
        // Fix URL if needed
        let videoUrl = videoUrlInput.value;
        if (videoUrl.startsWith('//')) {
            videoUrl = 'https:' + videoUrl;
        }
        
        // For local files, add a timestamp to bust cache
        if (videoUrl.startsWith('/')) {
            videoUrl = videoUrl + '?t=' + new Date().getTime();
        }
        
        // Check if it's a YouTube URL and handle it specially
        if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
            console.log('YouTube URL detected');
            if (thumbnailStatus) {
                thumbnailStatus.textContent = 'YouTube videos need manual thumbnails due to security restrictions';
                thumbnailStatus.style.color = '#d4a373';
            }
            
            // Get YouTube video ID
            let videoId = '';
            if (videoUrl.includes('youtube.com/watch')) {
                videoId = new URL(videoUrl).searchParams.get('v');
            } else if (videoUrl.includes('youtu.be/')) {
                videoId = videoUrl.split('youtu.be/')[1].split('?')[0];
            }
            
            if (videoId) {
                // Use YouTube thumbnail API
                const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
                console.log('Using YouTube thumbnail URL:', thumbnailUrl);
                
                // Create an image to load the YouTube thumbnail
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.onload = function() {
                    // Create canvas and draw the image
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);
                    
                    try {
                        // Get data URL
                        const dataUrl = canvas.toDataURL('image/jpeg');
                        
                        // Update preview and value
                        if (previewImage) {
                            previewImage.src = dataUrl;
                            previewImage.style.display = 'block';
                        }
                        if (imageInput) {
                            imageInput.value = dataUrl;
                        }
                        
                        if (thumbnailStatus) {
                            thumbnailStatus.textContent = 'YouTube thumbnail generated successfully!';
                            thumbnailStatus.style.color = '#28a745';
                        }
                    } catch (error) {
                        console.error('Error creating YouTube thumbnail:', error);
                        if (thumbnailStatus) {
                            thumbnailStatus.textContent = 'Error: ' + error.message;
                            thumbnailStatus.style.color = '#dc3545';
                        }
                    }
                };
                
                img.onerror = function() {
                    console.error('Error loading YouTube thumbnail');
                    if (thumbnailStatus) {
                        thumbnailStatus.textContent = 'Error loading YouTube thumbnail. Try a different video or upload manually.';
                        thumbnailStatus.style.color = '#dc3545';
                    }
                };
                
                img.src = thumbnailUrl;
                return;
            }
        }
        
        video.src = videoUrl;
        console.log('Video element created with src:', video.src);
        
        // Create a one-time timeupdate handler to avoid multiple captures
        function captureFrame() {
            console.log('Video time updated, capturing frame');
            // Remove this event listener after it runs once
            video.removeEventListener('timeupdate', captureFrame);
            
            try {
                // Create a canvas to capture the frame
                const canvas = document.createElement('canvas');
                
                // Check if video dimensions are available
                if (video.videoWidth === 0 || video.videoHeight === 0) {
                    console.error('Video dimensions not available');
                    throw new Error('Video dimensions not available. Video might not be loaded correctly.');
                }
                
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                
                console.log('Canvas created with dimensions:', canvas.width, 'x', canvas.height);
                
                // Draw the video frame to the canvas
                const ctx = canvas.getContext('2d');
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                
                // Convert canvas to data URL
                const dataUrl = canvas.toDataURL('image/jpeg');
                console.log('Thumbnail data URL generated:', dataUrl.substring(0, 50) + '...');
                
                // Update the image preview
                if (previewImage) {
                    previewImage.src = dataUrl;
                    previewImage.style.display = 'block'; // Make sure the preview is visible
                    console.log('Preview image updated');
                } else {
                    console.error('Preview image element not found');
                }
                
                // Update the hidden image input with the data URL
                if (imageInput) {
                    imageInput.value = dataUrl;
                    console.log('Image input value set');
                } else {
                    console.error('Image input element not found');
                }
                
                // Update status
                if (thumbnailStatus) {
                    thumbnailStatus.textContent = 'Thumbnail generated successfully!';
                    thumbnailStatus.style.color = '#28a745';
                }
            } catch (error) {
                console.error('Error generating thumbnail:', error);
                
                // Update status instead of showing an alert
                if (thumbnailStatus) {
                    thumbnailStatus.textContent = 'Error: ' + error.message + ' (possible CORS error)';
                    thumbnailStatus.style.color = '#dc3545';
                }
            } finally {
                // Clean up
                video.pause();
                video.removeAttribute('src');
                video.load();
            }
        }
        
        // Set timeout to handle cases where metadata never loads
        const timeoutId = setTimeout(() => {
            console.error('Timeout waiting for video metadata');
            video.removeEventListener('loadedmetadata', onMetadataLoaded);
            video.removeEventListener('timeupdate', captureFrame);
            
            if (thumbnailStatus) {
                thumbnailStatus.textContent = 'Timeout loading video. Try another URL or upload manually.';
                thumbnailStatus.style.color = '#dc3545';
            }
        }, 10000); // 10 second timeout
        
        // When video metadata is loaded, capture a frame
        function onMetadataLoaded() {
            console.log('Video metadata loaded');
            clearTimeout(timeoutId);
            // Set video to a specific time (e.g., 1 second in)
            video.currentTime = 1;
        }
        
        video.addEventListener('loadedmetadata', onMetadataLoaded);
        
        // Add the timeupdate event listener
        video.addEventListener('timeupdate', captureFrame);
        
        // Handle errors
        video.addEventListener('error', function() {
            console.error('Video error:', video.error);
            clearTimeout(timeoutId);
            
            // Update status instead of showing an alert
            if (thumbnailStatus) {
                thumbnailStatus.textContent = 'Error loading video. Please check the URL. Error code: ' + 
                    (video.error ? video.error.code : 'unknown');
                thumbnailStatus.style.color = '#dc3545';
            }
            
            // Remove the timeupdate event listener if it hasn't fired yet
            video.removeEventListener('timeupdate', captureFrame);
            video.removeEventListener('loadedmetadata', onMetadataLoaded);
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
                    let videoUrl = this.value;
                    if (videoUrl.startsWith('//')) {
                        videoUrl = 'https:' + videoUrl;
                    }
                    source.src = videoUrl;
                    videoPreview.load();
                    document.querySelector('.video-preview').style.display = 'block';
                }
            }
        });
    }
}); 