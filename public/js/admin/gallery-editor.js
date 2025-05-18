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
    
    // Find the generate thumbnail button and ensure it exists
    const generateThumbnailBtn = document.getElementById('generate-thumbnail-btn');
    // Define these as let instead of const for global access across functions
    let videoUrlInput = document.getElementById('gallery-video-url');
    let imageInput = document.getElementById('gallery-image');
    
    if (generateThumbnailBtn) {
        console.log('Generate thumbnail button found');
        generateThumbnailBtn.addEventListener('click', function() {
            console.log('Generate thumbnail button clicked');
            generateThumbnailFromVideo();
        });
    } else {
        console.error('Generate thumbnail button not found');
    }
    
    // Auto-generate thumbnail when video URL is entered
    if (videoUrlInput) {
        videoUrlInput.addEventListener('change', function() {
            // Wait a brief moment for the video to load
            setTimeout(() => {
                // Auto-generate thumbnail if video URL is provided
                if (videoUrlInput.value && (!imageInput || !imageInput.value || imageInput.value === '')) {
                    console.log('Auto-generating thumbnail after video URL change');
                    generateThumbnailFromVideo();
                }
            }, 1500);
        });
    }
    
    // Function to generate thumbnail from video
    function generateThumbnailFromVideo() {
        console.log('Generating thumbnail from video');
        
        // Get fresh references to the elements
        videoUrlInput = document.getElementById('gallery-video-url');
        imageInput = document.getElementById('gallery-image');
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
            showError('Please enter a video URL first');
            if (thumbnailStatus) {
                thumbnailStatus.textContent = 'Failed: No video URL provided';
                thumbnailStatus.style.color = '#dc3545';
            }
            return;
        }
        
        console.log('Video URL:', videoUrlInput.value);
        
        // Create a flag to track if we've successfully generated a thumbnail
        let thumbnailGenerated = false;
        
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
                
                thumbnailGenerated = true;
                return;
            } catch (error) {
                console.error('Error capturing from existing video player:', error);
                // Continue to next method
            }
        }
        
        // Check if it's a YouTube URL and handle it specially
        if (videoUrlInput.value.includes('youtube.com') || videoUrlInput.value.includes('youtu.be')) {
            console.log('YouTube URL detected');
            
            // Get YouTube video ID
            let videoId = '';
            if (videoUrlInput.value.includes('youtube.com/watch')) {
                const url = new URL(videoUrlInput.value);
                videoId = url.searchParams.get('v');
            } else if (videoUrlInput.value.includes('youtu.be/')) {
                videoId = videoUrlInput.value.split('youtu.be/')[1].split('?')[0];
            }
            
            if (videoId) {
                // Use YouTube thumbnail API
                const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
                console.log('Using YouTube thumbnail URL:', thumbnailUrl);
                
                // Simply use the YouTube thumbnail URL directly rather than trying to process it
                if (previewImage) {
                    previewImage.src = thumbnailUrl;
                    previewImage.style.display = 'block';
                    previewImage.onerror = function() {
                        // Fallback to medium quality if high quality not available
                        previewImage.src = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
                    };
                }
                
                if (imageInput) {
                    imageInput.value = thumbnailUrl;
                }
                
                if (thumbnailStatus) {
                    thumbnailStatus.textContent = 'YouTube thumbnail generated successfully!';
                    thumbnailStatus.style.color = '#28a745';
                }
                
                thumbnailGenerated = true;
                return;
            }
        }
        
        // If we've reached here, try using the server proxy method directly
        console.log('Using server-side proxy for thumbnail generation');
        useServerProxyForThumbnail(videoUrlInput.value);
    }
    
    // Function to use server proxy for thumbnail generation when client-side fails
    function useServerProxyForThumbnail(videoUrl) {
        const previewImage = document.querySelector('.image-preview img');
        imageInput = document.getElementById('gallery-image');
        const thumbnailStatus = document.getElementById('thumbnail-status');
        
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
                console.log('Received thumbnail URL:', data.thumbnailUrl);
                
                // Validate that the URL is an image and not a video
                if (data.thumbnailUrl.endsWith('.mp4') || data.thumbnailUrl.endsWith('.webm') || data.thumbnailUrl.endsWith('.mov')) {
                    console.warn('Received video URL instead of image, applying transformation');
                    // Convert video URL to image URL using Cloudinary transformation
                    if (data.thumbnailUrl.includes('cloudinary')) {
                        data.thumbnailUrl = data.thumbnailUrl.replace('/upload/', '/upload/w_300,h_300,c_fill,f_jpg,so_0/');
                    } else {
                        // If not a Cloudinary URL, use fallback
                        data.thumbnailUrl = '/images/video-placeholder.jpg';
                    }
                }
                
                // Update the image preview
                if (previewImage) {
                    previewImage.src = data.thumbnailUrl;
                    previewImage.style.display = 'block';
                    console.log('Preview image updated from server proxy');
                    
                    // Add error handler in case the image fails to load
                    previewImage.onerror = function() {
                        console.error('Failed to load thumbnail image');
                        previewImage.src = '/images/video-placeholder.jpg';
                        if (imageInput) {
                            imageInput.value = '/images/video-placeholder.jpg';
                        }
                    };
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
                
                // Update form type to ensure it's recognized as a video
                const typeInput = document.getElementById('gallery-type');
                if (typeInput) {
                    typeInput.value = 'video';
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
            
            // Set placeholder image as fallback
            if (previewImage && imageInput) {
                previewImage.src = '/images/video-placeholder.jpg';
                previewImage.style.display = 'block';
                imageInput.value = '/images/video-placeholder.jpg';
                console.log('Using placeholder image as fallback');
                
                // Let the user know that a fallback was used but the video will still work
                if (thumbnailStatus) {
                    thumbnailStatus.textContent = 'Used placeholder image. Your video will still work!';
                    thumbnailStatus.style.color = '#ffc107';
                }
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
    // Refresh reference to videoUrlInput
    videoUrlInput = document.getElementById('gallery-video-url');
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
                    
                    // Auto-set to video type if there's a video URL
                    const typeInput = document.getElementById('gallery-type');
                    if (typeInput) {
                        typeInput.value = 'video';
                    }
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
                    // Make three attempts with increasing delays to ensure video is loaded
                    setTimeout(() => {
                        console.log('First thumbnail generation attempt');
                        generateThumbnailFromVideo();
                        
                        // Try again after another second if needed
                        setTimeout(() => {
                            // Check if we have a thumbnail already
                            const imageInput = document.getElementById('gallery-image');
                            if (!imageInput || !imageInput.value || imageInput.value === '') {
                                console.log('Second thumbnail generation attempt');
                                generateThumbnailFromVideo();
                            }
                        }, 2000);
                    }, 1000);
                    
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

    // Gallery Category Management
    const categoriesModal = document.getElementById('categories-modal');
    const manageCategoriesBtn = document.getElementById('manage-categories-btn');
    const addCategoryForm = document.getElementById('add-category-form');
    const categoriesTbody = document.getElementById('categories-tbody');
    let galleryCategories = [];
    
    // Load categories for the gallery form dropdown
    async function loadGalleryCategories() {
        try {
            const response = await fetch('/api/gallery-categories');
            const data = await response.json();
            
            if (data.success) {
                galleryCategories = data.categories;
                
                // Update select options in gallery form
                const categorySelect = document.getElementById('gallery-category');
                if (categorySelect) {
                    categorySelect.innerHTML = ''; // Clear existing options
                    
                    galleryCategories.forEach(category => {
                        const option = document.createElement('option');
                        option.value = category.name;
                        option.textContent = category.name;
                        categorySelect.appendChild(option);
                    });
                    
                    // If no categories, add default ones
                    if (galleryCategories.length === 0) {
                        const defaultCategories = ['Bridal', 'Colors', 'Cuts', 'Makeup', 'Textures'];
                        defaultCategories.forEach(category => {
                            const option = document.createElement('option');
                            option.value = category;
                            option.textContent = category;
                            categorySelect.appendChild(option);
                        });
                    }
                }
                
                // Update filter buttons
                updateCategoryFilterButtons();
            } else {
                console.error('Failed to load categories:', data.message);
                showError('Failed to load categories: ' + data.message);
            }
        } catch (error) {
            console.error('Error loading categories:', error);
            showError('Error loading categories: ' + error.message);
        }
    }
    
    // Update category filter buttons
    function updateCategoryFilterButtons() {
        const filterContainer = document.querySelector('.category-filter-container');
        if (filterContainer) {
            // Keep the "All" button
            const allButton = filterContainer.querySelector('[data-category="all"]');
            filterContainer.innerHTML = '';
            
            if (allButton) {
                filterContainer.appendChild(allButton);
            } else {
                const newAllButton = document.createElement('button');
                newAllButton.className = 'category-filter btn';
                newAllButton.setAttribute('data-category', 'all');
                newAllButton.style.backgroundColor = '#9c8370';
                newAllButton.textContent = 'All';
                filterContainer.appendChild(newAllButton);
            }
            
            // Add category buttons
            galleryCategories.forEach(category => {
                const categoryBtn = document.createElement('button');
                categoryBtn.className = 'category-filter btn';
                categoryBtn.setAttribute('data-category', category.name);
                categoryBtn.style.backgroundColor = 'transparent';
                categoryBtn.style.color = '#333';
                categoryBtn.style.border = '1px solid #ddd';
                categoryBtn.textContent = category.name;
                filterContainer.appendChild(categoryBtn);
            });
            
            // Re-attach event listeners for filter buttons
            document.querySelectorAll('.category-filter').forEach(button => {
                button.addEventListener('click', function() {
                    // Remove active class from all buttons
                    document.querySelectorAll('.category-filter').forEach(btn => {
                        btn.style.backgroundColor = 'transparent';
                        btn.style.color = '#333';
                    });
                    
                    // Add active class to clicked button
                    this.style.backgroundColor = '#9c8370';
                    this.style.color = 'white';
                    
                    // Filter gallery items
                    const category = this.getAttribute('data-category');
                    filterGalleryItems(category);
                });
            });
            
            // Set "All" as active by default
            const allBtn = document.querySelector('.category-filter[data-category="all"]');
            if (allBtn) {
                allBtn.style.backgroundColor = '#9c8370';
                allBtn.style.color = 'white';
            }
        }
    }
    
    // Filter gallery items by category
    function filterGalleryItems(category) {
        const galleryItems = document.querySelectorAll('.gallery-admin-item');
        
        galleryItems.forEach(item => {
            if (category === 'all' || item.getAttribute('data-category') === category) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
    }
    
    // Load categories on page load
    if (window.location.pathname.includes('/admin/gallery')) {
        loadGalleryCategories();
    }
    
    // Populate the categories table
    async function populateCategoriesTable() {
        try {
            const response = await fetch('/api/gallery-categories');
            const data = await response.json();
            
            if (data.success) {
                galleryCategories = data.categories;
                categoriesTbody.innerHTML = ''; // Clear the table
                
                if (galleryCategories.length === 0) {
                    categoriesTbody.innerHTML = '<tr><td colspan="4" class="text-center">No categories yet</td></tr>';
                    return;
                }
                
                galleryCategories.forEach((category, index) => {
                    const row = document.createElement('tr');
                    row.setAttribute('data-id', category._id);
                    row.innerHTML = `
                        <td>${category.displayOrder || index}</td>
                        <td>
                            <span class="category-name">${category.name}</span>
                            <input type="text" class="edit-category-name" style="display: none;" value="${category.name}">
                        </td>
                        <td>${category.isActive !== false ? 'Active' : 'Inactive'}</td>
                        <td>
                            <button class="btn btn-sm edit-category-btn" data-id="${category._id}">Edit</button>
                            <button class="btn btn-sm btn-danger delete-category-btn" data-id="${category._id}">Delete</button>
                            <button class="btn btn-sm save-category-btn" data-id="${category._id}" style="display: none; background-color: #28a745;">Save</button>
                            <button class="btn btn-sm cancel-edit-btn" style="display: none;">Cancel</button>
                        </td>
                    `;
                    categoriesTbody.appendChild(row);
                });
                
                // Add event listeners to edit buttons
                document.querySelectorAll('.edit-category-btn').forEach(button => {
                    button.addEventListener('click', function() {
                        const row = this.closest('tr');
                        const categoryName = row.querySelector('.category-name');
                        const editInput = row.querySelector('.edit-category-name');
                        const editBtn = row.querySelector('.edit-category-btn');
                        const deleteBtn = row.querySelector('.delete-category-btn');
                        const saveBtn = row.querySelector('.save-category-btn');
                        const cancelBtn = row.querySelector('.cancel-edit-btn');
                        
                        // Show/hide elements
                        categoryName.style.display = 'none';
                        editInput.style.display = 'block';
                        editBtn.style.display = 'none';
                        deleteBtn.style.display = 'none';
                        saveBtn.style.display = 'inline-block';
                        cancelBtn.style.display = 'inline-block';
                        
                        // Focus the input
                        editInput.focus();
                    });
                });
                
                // Add event listeners to cancel buttons
                document.querySelectorAll('.cancel-edit-btn').forEach(button => {
                    button.addEventListener('click', function() {
                        const row = this.closest('tr');
                        const categoryName = row.querySelector('.category-name');
                        const editInput = row.querySelector('.edit-category-name');
                        const editBtn = row.querySelector('.edit-category-btn');
                        const deleteBtn = row.querySelector('.delete-category-btn');
                        const saveBtn = row.querySelector('.save-category-btn');
                        const cancelBtn = row.querySelector('.cancel-edit-btn');
                        
                        // Reset input value
                        editInput.value = categoryName.textContent;
                        
                        // Show/hide elements
                        categoryName.style.display = 'inline';
                        editInput.style.display = 'none';
                        editBtn.style.display = 'inline-block';
                        deleteBtn.style.display = 'inline-block';
                        saveBtn.style.display = 'none';
                        cancelBtn.style.display = 'none';
                    });
                });
                
                // Add event listeners to save buttons
                document.querySelectorAll('.save-category-btn').forEach(button => {
                    button.addEventListener('click', async function() {
                        const row = this.closest('tr');
                        const categoryId = this.getAttribute('data-id');
                        const editInput = row.querySelector('.edit-category-name');
                        const categoryName = row.querySelector('.category-name');
                        const newName = editInput.value.trim();
                        
                        if (!newName) {
                            showError('Category name cannot be empty');
                            return;
                        }
                        
                        try {
                            const response = await fetch(`/api/gallery-category/update/${categoryId}`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({ 
                                    name: newName,
                                    isActive: true 
                                })
                            });
                            
                            const data = await response.json();
                            
                            if (data.success) {
                                // Update the display and toggle back to view mode
                                categoryName.textContent = newName;
                                
                                // Toggle edit/view mode
                                categoryName.style.display = 'inline';
                                editInput.style.display = 'none';
                                row.querySelector('.edit-category-btn').style.display = 'inline-block';
                                row.querySelector('.delete-category-btn').style.display = 'inline-block';
                                row.querySelector('.save-category-btn').style.display = 'none';
                                row.querySelector('.cancel-edit-btn').style.display = 'none';
                                
                                showSuccess('Category updated successfully');
                                // Refresh data
                                populateCategoriesTable();
                                loadGalleryCategories();
                            } else {
                                throw new Error(data.message || 'Failed to update category');
                            }
                        } catch (error) {
                            console.error('Error updating category:', error);
                            showError(`Error: ${error.message}`);
                        }
                    });
                });
                
                // Add event listeners to delete buttons
                document.querySelectorAll('.delete-category-btn').forEach(button => {
                    button.addEventListener('click', async function() {
                        const categoryId = this.getAttribute('data-id');
                        const row = this.closest('tr');
                        const categoryName = row.querySelector('.category-name').textContent;
                        
                        // Use confirm dialog to prevent accidental deletion
                        if (!confirm(`Are you sure you want to delete the category "${categoryName}"? This may affect existing gallery items.`)) {
                            return; // User canceled
                        }
                        
                        try {
                            // Show loading indicator
                            row.classList.add('deleting');
                            this.textContent = 'Deleting...';
                            this.disabled = true;
                            
                            const response = await fetch(`/api/gallery-category/delete/${categoryId}`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                }
                            });
                            
                            const data = await response.json();
                            
                            if (data.success) {
                                showSuccess(`Category "${categoryName}" deleted successfully`);
                                // Remove the row from the table
                                row.remove();
                                // Refresh data
                                populateCategoriesTable();
                                loadGalleryCategories();
                            } else {
                                throw new Error(data.message || 'Failed to delete category');
                            }
                        } catch (error) {
                            console.error('Error deleting category:', error);
                            showError(`Error: ${error.message}`);
                            // Reset the button
                            row.classList.remove('deleting');
                            this.textContent = 'Delete';
                            this.disabled = false;
                        }
                    });
                });
            } else {
                throw new Error(data.message || 'Failed to fetch categories');
            }
        } catch (error) {
            console.error('Error populating categories table:', error);
            categoriesTbody.innerHTML = `<tr><td colspan="4" class="text-center">Error loading categories: ${error.message}</td></tr>`;
        }
    }
    
    // Open categories modal
    if (manageCategoriesBtn) {
        manageCategoriesBtn.addEventListener('click', function() {
            categoriesModal.style.display = 'block';
            populateCategoriesTable();
        });
    }
    
    // Add new category
    if (addCategoryForm) {
        addCategoryForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const newCategoryName = document.getElementById('new-category-name').value.trim();
            
            if (!newCategoryName) {
                showError('Category name cannot be empty');
                return;
            }
            
            try {
                const response = await fetch('/api/gallery-category/create', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ 
                        name: newCategoryName,
                        displayOrder: galleryCategories.length
                    })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    document.getElementById('new-category-name').value = '';
                    showSuccess('Category added successfully');
                    populateCategoriesTable();
                    loadGalleryCategories();
                } else {
                    throw new Error(data.message || 'Failed to add category');
                }
            } catch (error) {
                console.error('Error adding category:', error);
                showError(`Error: ${error.message}`);
            }
        });
    }
    
    // Close categories modal when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === categoriesModal) {
            categoriesModal.style.display = 'none';
        }
    });
    
    // Close categories modal when clicking close button
    if (categoriesModal) {
        categoriesModal.querySelectorAll('.close, .close-modal').forEach(closeBtn => {
            closeBtn.addEventListener('click', function() {
                categoriesModal.style.display = 'none';
            });
        });
    }
    
    // Helper function to show success message
    function showSuccess(message) {
        const notification = document.createElement('div');
        notification.className = 'notification success';
        notification.textContent = message;
        notification.style.position = 'fixed';
        notification.style.top = '20px';
        notification.style.right = '20px';
        notification.style.backgroundColor = '#d4edda';
        notification.style.color = '#155724';
        notification.style.padding = '10px 20px';
        notification.style.borderRadius = '4px';
        notification.style.zIndex = '9999';
        document.body.appendChild(notification);
        
        setTimeout(function() {
            notification.remove();
        }, 3000);
    }
}); 