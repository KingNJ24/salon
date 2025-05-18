/**
 * Gallery Editor - Video Thumbnail Generator
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('Gallery Editor loaded');
    
    // Default admin credentials (these will be overridden by server-provided values)
    let adminUsername = '';
    let adminPassword = '';
    
    // Try to get credentials from server
    fetch('/api/get-upload-auth')
        .then(response => response.json())
        .then(data => {
            if (data.credentials) {
                adminUsername = data.credentials.username;
                adminPassword = data.credentials.password;
            }
        })
        .catch(err => {
            console.error('Could not get upload credentials:', err);
        });
    
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
                    
                    // Try the server-side proxy approach instead
                    useServerProxyForThumbnail(videoUrl);
                    return;
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
                
                // Try server-side approach instead of just showing error
                useServerProxyForThumbnail(videoUrl);
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
            
            // Instead of just showing an error, use the server-side proxy
            console.log('Attempting server-side thumbnail generation due to timeout');
            useServerProxyForThumbnail(videoUrl);
        }, 15000); // Increase timeout from 10 to 15 seconds
        
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
            
            // Instead of showing error, try server-side proxy
            console.log('Video error occurred, attempting server-side thumbnail generation');
            useServerProxyForThumbnail(videoUrl);
            
            // Remove the timeupdate event listener if it hasn't fired yet
            video.removeEventListener('timeupdate', captureFrame);
            video.removeEventListener('loadedmetadata', onMetadataLoaded);
        });
        
        // Start loading the video
        video.load();
        console.log('Video loading started');
    }
    
    // Function to use server proxy for thumbnail generation when client-side fails
    function useServerProxyForThumbnail(videoUrl) {
        if (thumbnailStatus) {
            thumbnailStatus.textContent = 'Trying server-side thumbnail generation...';
            thumbnailStatus.style.color = '#d4a373';
        }
        
        // Make a request to the server-side endpoint that will handle the CORS issue
        fetch('/api/generate-thumbnail', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ videoUrl: videoUrl })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success && data.thumbnailUrl) {
                // Update the image preview
                if (previewImage) {
                    previewImage.src = data.thumbnailUrl;
                    previewImage.style.display = 'block';
                    console.log('Preview image updated from server proxy');
                }
                
                // Update the hidden image input with the data URL or URL
                if (imageInput) {
                    imageInput.value = data.thumbnailUrl;
                    console.log('Image input value set from server proxy');
                }
                
                if (thumbnailStatus) {
                    thumbnailStatus.textContent = 'Thumbnail generated successfully via server!';
                    thumbnailStatus.style.color = '#28a745';
                }
            } else {
                throw new Error(data.message || 'Failed to generate thumbnail');
            }
        })
        .catch(error => {
            console.error('Server proxy thumbnail error:', error);
            if (thumbnailStatus) {
                thumbnailStatus.textContent = 'Error: Could not generate thumbnail. Try uploading a thumbnail image manually.';
                thumbnailStatus.style.color = '#dc3545';
            }
        });
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
    
    // Function to detect if we're running on Vercel
    function isVercelEnvironment() {
        // Always use Cloudinary in production environments to avoid filesystem issues
        return true; // Force Vercel/cloud mode for all environments
    }

    // For Vercel deployments, we need to convert files to base64 for upload
    function readFileAsBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    }

    // Function to handle file upload with Vercel compatibility
    async function uploadFile(file, forcedVercel = null) {
        // Always use cloud storage
        console.log('Uploading file using cloud storage:', { 
            fileName: file.name, 
            fileSize: file.size, 
            fileType: file.type
        });
        
        // Get admin credentials
        const adminUsername = document.querySelector('meta[name="admin-username"]')?.content;
        const adminPassword = document.querySelector('meta[name="admin-password"]')?.content;
        
        try {
            // Convert to base64
            console.log('Using cloud upload method (base64)');
            const base64Data = await readFileAsBase64(file);
            
            // Default admin credentials if not available
            const credUsername = adminUsername || 'admin';
            const credPassword = adminPassword || 'password';
            
            // Use the Express router endpoint instead of the serverless function
            const response = await fetch('/api/express-upload', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Basic ' + btoa(credUsername + ':' + credPassword)
                },
                body: JSON.stringify({
                    file: base64Data,
                    fileName: file.name,
                    fileType: file.type
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
            }
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Upload error:', error);
            throw error;
        }
    }

    // Get references to video upload elements
    const videoUploadBtn = document.getElementById('video-upload-btn');
    const videoFileInput = document.getElementById('video-file');
    
    // Modify the video upload function
    if (videoUploadBtn) {
        videoUploadBtn.addEventListener('click', async function(e) {
            e.preventDefault();
            
            if (!videoFileInput || !videoFileInput.files || !videoFileInput.files[0]) {
                showError('Please select a video file to upload.');
                return;
            }
            
            const file = videoFileInput.files[0];
            
            // Validate file type
            const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
            if (!allowedVideoTypes.includes(file.type)) {
                showError('Please select a valid video file (MP4, WebM, or MOV).');
                return;
            }
            
            // Additional client-side validation
            const maxSize = 50 * 1024 * 1024; // 50MB in bytes
            if (file.size > maxSize) {
                showError('Video file is too large. Maximum size is 50MB.');
                return;
            }
            
            // Show upload progress
            videoUploadBtn.disabled = true;
            videoUploadBtn.textContent = 'Uploading...';
            
            // Add status message
            const statusMsg = document.createElement('p');
            statusMsg.className = 'upload-status';
            statusMsg.textContent = 'Uploading video file...';
            videoUploadBtn.parentNode.appendChild(statusMsg);
            
            try {
                // Always use base64 upload for videos
                console.log('Using Express video upload endpoint');
                const base64Data = await readFileAsBase64(file);
                
                // Default admin credentials if not available
                const credUsername = adminUsername || 'admin';
                const credPassword = adminPassword || 'password';
                
                // Use the express video upload endpoint
                const response = await fetch('/api/express-upload-video', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Basic ' + btoa(`${credUsername}:${credPassword}`)
                    },
                    body: JSON.stringify({ 
                        file: base64Data,
                        fileName: file.name,
                        fileType: file.type
                    })
                });
                
                // Handle response
                const data = await response.json();
                console.log('Video upload response:', data);
                
                if (!response.ok) {
                    throw new Error(data.message || `Server returned ${response.status}: ${response.statusText}`);
                }
                
                if (data.success) {
                    // Success handling
                    statusMsg.textContent = 'Video uploaded successfully!';
                    statusMsg.style.color = 'green';
                    
                    // Update the video URL input field
                    const videoUrlInput = document.getElementById('gallery-video-url');
                    if (videoUrlInput) {
                        videoUrlInput.value = data.filePath || data.url;
                    }
                    
                    // Update form state to indicate it's a video
                    const typeInput = document.getElementById('gallery-type');
                    if (typeInput) {
                        typeInput.value = 'video';
                    }
                    
                    // Show the container
                    document.querySelector('.video-preview').style.display = 'block';
                    
                    // Automatically generate a thumbnail after successful upload
                    const generateThumbnailBtn = document.getElementById('generate-thumbnail-btn');
                    if (generateThumbnailBtn) {
                        // Wait a moment for the video to load
                        setTimeout(() => {
                            generateThumbnailBtn.click();
                        }, 1000);
                    }
                    
                    setTimeout(() => {
                        statusMsg.remove();
                    }, 5000);
                } else {
                    throw new Error(data.message || 'Failed to upload video.');
                }
            } catch (error) {
                console.error('Error:', error);
                statusMsg.textContent = `Error: ${error.message}`;
                statusMsg.style.color = 'red';
                
                setTimeout(() => {
                    statusMsg.remove();
                }, 10000);
            } finally {
                videoUploadBtn.disabled = false;
                videoUploadBtn.textContent = 'Upload Video';
            }
        });
    }
    
    // Helper function to show errors
    function showError(message) {
        const errorElement = document.getElementById('thumbnail-status') || document.createElement('p');
        errorElement.textContent = message;
        errorElement.style.color = 'red';
        errorElement.style.display = 'block';
        
        if (!document.getElementById('thumbnail-status')) {
            // If the element doesn't exist in the DOM, add it
            const videoUrlGroup = document.querySelector('.video-url-group');
            if (videoUrlGroup) {
                videoUrlGroup.appendChild(errorElement);
                errorElement.id = 'error-message';
            }
        }
        
        // Auto-hide after 8 seconds
        setTimeout(() => {
            errorElement.style.display = 'none';
        }, 8000);
    }
}); 