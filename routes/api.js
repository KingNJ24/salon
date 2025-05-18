const express = require('express');
const router = express.Router();
const { adminAuth } = require('../middlewares/auth');
const { upload, saveBase64Image } = require('../utils/upload');
const serviceController = require('../controllers/serviceController');
const galleryController = require('../controllers/galleryController');
const { Team, SiteInfo, Booking, ServiceCategory, GalleryCategory } = require('../models');

// File upload endpoint
router.post('/upload', adminAuth, (req, res) => {
  try {
    // ALWAYS use Cloudinary in production
    if (process.env.VERCEL === '1' || process.env.NODE_ENV === 'production') {
      console.log('PRODUCTION ENVIRONMENT: Using Cloudinary for all uploads');
      
      // If the request has base64 data already, pass directly to Cloudinary
      if (req.body && req.body.file) {
        const { cloudinary } = require('../utils/cloudinary');
      
        // Process the base64 data directly
        try {
          // Determine content type and resource type
          const fileDataParts = req.body.file.split(';base64,');
          if (fileDataParts.length !== 2) {
            return res.status(400).json({
              success: false,
              message: 'Invalid file format. Expected base64 encoded data.'
            });
          }
          
          const fileType = fileDataParts[0];
          // Check for video type
          const isVideo = fileType.includes('video/');
          
          // Upload directly to Cloudinary
          cloudinary.uploader.upload(req.body.file, {
            folder: 'salon',
            resource_type: 'auto', 
            allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
          })
          .then(result => {
            return res.json({
              success: true,
              filePath: result.secure_url,
              fileType: result.resource_type,
              originalName: req.body.fileName || result.original_filename || 'uploaded-file',
              size: result.bytes,
              url: result.secure_url
            });
          })
          .catch(error => {
            console.error('Cloudinary upload error:', error);
            return res.status(500).json({
              success: false,
              message: 'Error uploading to Cloudinary: ' + error.message
            });
          });
        } catch (error) {
          console.error('Error processing upload:', error);
          return res.status(500).json({
            success: false,
            message: 'Error processing upload: ' + error.message
          });
        }
      } else {
        // For multipart form data, use multer-storage-cloudinary
        const { cloudinaryUpload } = require('../utils/cloudinary');
        
        cloudinaryUpload.single('file')(req, res, (err) => {
          try {
            if (err) {
              console.error('Cloudinary upload error:', err);
              return res.status(400).json({ 
                success: false, 
                message: err.message || 'Error uploading file' 
              });
            }
            
            if (!req.file) {
              return res.status(400).json({ 
                success: false, 
                message: 'No file uploaded' 
              });
            }
            
            console.log('File uploaded to Cloudinary:', req.file);
            
            const isVideo = req.file.mimetype.startsWith('video/');
            
            return res.json({ 
              success: true, 
              filePath: req.file.path || req.file.secure_url,
              fileType: isVideo ? 'video' : 'image',
              originalName: req.file.originalname,
              size: req.file.size,
              url: req.file.secure_url || req.file.path
            });
          } catch (error) {
            console.error('Error in Cloudinary upload handler:', error);
            return res.status(500).json({ 
              success: false, 
              message: 'Server error: ' + error.message 
            });
          }
        });
      }
    } else {
      // In local development - use the regular file system upload
      const { upload } = require('../utils/upload');
      
      // Initialize multer with error handling
      upload.single('file')(req, res, (err) => {
        try {
          // Handle multer errors
          if (err) {
            console.error('Multer error:', err);
            if (err.code === 'LIMIT_FILE_SIZE') {
              return res.status(400).json({ 
                success: false, 
                message: 'File is too large. Maximum size is 50MB.' 
              });
            }
            if (err.code === 'INVALID_FILE_TYPE') {
              return res.status(400).json({ 
                success: false, 
                message: err.message || 'Invalid file type.' 
              });
            }
            return res.status(500).json({ 
              success: false, 
              message: 'Error uploading file: ' + err.message 
            });
          }
          
          // Check if file was uploaded
          if (!req.file) {
            return res.status(400).json({ 
              success: false, 
              message: 'No file uploaded. Please select a file.' 
            });
          }
          
          console.log('File uploaded successfully:', req.file);
          
          // Determine the file type
          const fileType = req.file.mimetype.startsWith('video/') ? 'video' : 'image';
          
          // Return the file path
          const filePath = '/' + req.file.path.split('public')[1].replace(/\\/g, '/');
          
          return res.json({ 
            success: true, 
            filePath,
            fileType,
            originalName: req.file.originalname,
            size: req.file.size
          });
        } catch (error) {
          console.error('Unexpected error in upload handler:', error);
          return res.status(500).json({ 
            success: false, 
            message: 'Server error: ' + error.message 
          });
        }
      });
    }
  } catch (error) {
    console.error('Critical error in upload route:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
});

// Debug upload route for troubleshooting upload issues
router.post('/debug-upload', adminAuth, async (req, res) => {
  try {
    console.log('Debug upload request received');
    console.log('Headers:', req.headers);
    console.log('Body type:', typeof req.body);
    console.log('Body keys:', req.body ? Object.keys(req.body) : 'none');
    
    // Check if this is a formdata or JSON request
    if (req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data')) {
      console.log('Multipart form data request detected');
      if (req.file) {
        console.log('File received:', req.file.originalname, req.file.mimetype, req.file.size);
      } else {
        console.log('No file in request');
      }
    } else if (req.headers['content-type'] && req.headers['content-type'].includes('application/json')) {
      console.log('JSON request detected');
      if (req.body && req.body.file) {
        console.log('Base64 file received, length:', req.body.file.length);
      } else {
        console.log('No file in JSON body');
      }
    }
    
    // Return success
    return res.json({
      success: true,
      message: 'Debug data logged to server console',
      received: {
        contentType: req.headers['content-type'],
        hasFile: req.file ? true : (req.body && req.body.file ? true : false)
      }
    });
  } catch (error) {
    console.error('Error in debug upload:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Add a cloud-only upload endpoint
router.post('/express-upload', adminAuth, async (req, res) => {
  console.log('EXPRESS UPLOAD ENDPOINT CALLED');
  console.log('Headers:', req.headers);
  console.log('Body type:', typeof req.body);
  console.log('Body has file:', req.body && !!req.body.file);
  
  try {
    if (!req.body || !req.body.file) {
      return res.status(400).json({
        success: false,
        message: 'No file data found in request. Send file as base64 in the "file" field of the JSON body.'
      });
    }
    
    // Get Cloudinary
    const { cloudinary } = require('../utils/cloudinary');
    
    // Validate Cloudinary config
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.error('Cloudinary configuration missing');
      return res.status(500).json({
        success: false,
        message: 'Cloudinary configuration missing. Please check environment variables.'
      });
    }
    
    // Process file
    const fileDataParts = req.body.file.split(';base64,');
    if (fileDataParts.length !== 2) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file format. Expected base64 encoded data.'
      });
    }
    
    const fileType = fileDataParts[0];
    const isVideo = fileType.includes('video/');
    
    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(req.body.file, {
      folder: 'salon',
      resource_type: isVideo ? 'video' : 'auto',
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'mov', 'webm']
    });
    
    return res.json({
      success: true,
      filePath: result.secure_url,
      fileType: result.resource_type,
      originalName: req.body.fileName || result.original_filename || 'uploaded-file',
      size: result.bytes,
      url: result.secure_url
    });
  } catch (error) {
    console.error('Error in Express upload handler:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
});

// Add a cloud-only video upload endpoint
router.post('/express-upload-video', adminAuth, async (req, res) => {
  console.log('EXPRESS VIDEO UPLOAD ENDPOINT CALLED');
  console.log('Headers:', req.headers);
  console.log('Body type:', typeof req.body);
  console.log('Body has file:', req.body && !!req.body.file);
  
  try {
    if (!req.body || !req.body.file) {
      return res.status(400).json({
        success: false,
        message: 'No file data found in request. Send file as base64 in the "file" field.'
      });
    }
    
    // Get Cloudinary
    const { cloudinary } = require('../utils/cloudinary');
    
    // Process file
    const fileDataParts = req.body.file.split(';base64,');
    if (fileDataParts.length !== 2) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file format. Expected base64 encoded data.'
      });
    }
    
    // Force video resource type
    const result = await cloudinary.uploader.upload(req.body.file, {
      folder: 'salon',
      resource_type: 'video',
      allowed_formats: ['mp4', 'mov', 'webm']
    });
    
    return res.json({
      success: true,
      filePath: result.secure_url,
      fileType: 'video',
      originalName: req.body.fileName || result.original_filename || 'uploaded-video',
      size: result.bytes,
      url: result.secure_url
    });
  } catch (error) {
    console.error('Error in Express video upload handler:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
});

// SERVICE ROUTES
router.get('/services/list', serviceController.getAllServices);
router.get('/services/visible', serviceController.getVisibleServices);
router.get('/services/:id', serviceController.getServiceById);
router.post('/service/create', adminAuth, serviceController.createService);
router.post('/service/update/:id', adminAuth, serviceController.updateService);
router.post('/service/delete/:id', adminAuth, serviceController.deleteService);
router.get('/services', serviceController.getAllServices);

// SERVICE CATEGORY ROUTES
router.get('/service-categories', async (req, res) => {
  try {
    const categories = await ServiceCategory.find().sort({ displayOrder: 1 });
    return res.json({ success: true, categories });
  } catch (error) {
    console.error('Error fetching service categories:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/service-category/create', adminAuth, async (req, res) => {
  try {
    const newCategory = new ServiceCategory(req.body);
    await newCategory.save();
    return res.json({ success: true, category: newCategory });
  } catch (error) {
    console.error('Error creating service category:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/service-category/update/:id', adminAuth, async (req, res) => {
  try {
    const updatedCategory = await ServiceCategory.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    
    if (!updatedCategory) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    
    return res.json({ success: true, category: updatedCategory });
  } catch (error) {
    console.error('Error updating service category:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/service-category/delete/:id', adminAuth, async (req, res) => {
  try {
    const result = await ServiceCategory.findByIdAndDelete(req.params.id);
    
    if (!result) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    
    return res.json({ success: true });
  } catch (error) {
    console.error('Error deleting service category:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GALLERY ROUTES
router.get('/gallery', galleryController.getAllItems);
router.get('/gallery/visible', galleryController.getVisibleItems);
router.get('/gallery/:id', galleryController.getItemById);
router.post('/gallery/create', adminAuth, galleryController.createItem);
router.post('/gallery/update/:id', adminAuth, galleryController.updateItem);
router.post('/gallery/delete/:id', adminAuth, galleryController.deleteItem);

// GALLERY CATEGORY ROUTES
router.get('/gallery-categories', async (req, res) => {
  try {
    const categories = await GalleryCategory.find().sort({ displayOrder: 1 });
    return res.json({ success: true, categories });
  } catch (error) {
    console.error('Error fetching gallery categories:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/gallery-category/create', adminAuth, async (req, res) => {
  try {
    const newCategory = new GalleryCategory(req.body);
    await newCategory.save();
    return res.json({ success: true, category: newCategory });
  } catch (error) {
    console.error('Error creating gallery category:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/gallery-category/update/:id', adminAuth, async (req, res) => {
  try {
    const updatedCategory = await GalleryCategory.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    
    if (!updatedCategory) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    
    return res.json({ success: true, category: updatedCategory });
  } catch (error) {
    console.error('Error updating gallery category:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/gallery-category/delete/:id', adminAuth, async (req, res) => {
  try {
    const result = await GalleryCategory.findByIdAndDelete(req.params.id);
    
    if (!result) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    
    return res.json({ success: true });
  } catch (error) {
    console.error('Error deleting gallery category:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// TEAM ROUTES
router.post('/team/update/:id', adminAuth, async (req, res) => {
  try {
    if (req.body.image && req.body.image.startsWith('data:image/')) {
      req.body.image = saveBase64Image(req.body.image) || req.body.image;
    }
    
    const updatedMember = await Team.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: false }
    );
    
    if (!updatedMember) {
      return res.status(404).json({ success: false, message: 'Team member not found' });
    }
    
    return res.json({ success: true, member: updatedMember });
  } catch (error) {
    console.error('Error updating team member:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/team/create', adminAuth, async (req, res) => {
  try {
    if (req.body.image && req.body.image.startsWith('data:image/')) {
      req.body.image = saveBase64Image(req.body.image) || '/images/placeholder.jpg';
    }
    
    const newMember = new Team(req.body);
    await newMember.save();
    return res.json({ success: true, member: newMember });
  } catch (error) {
    console.error('Error creating team member:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/team/delete/:id', adminAuth, async (req, res) => {
  try {
    const result = await Team.findByIdAndDelete(req.params.id);
    
    if (!result) {
      return res.status(404).json({ success: false, message: 'Team member not found' });
    }
    
    return res.json({ success: true });
  } catch (error) {
    console.error('Error deleting team member:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// SITE SETTINGS ROUTES
router.post('/settings/update', adminAuth, async (req, res) => {
  try {
    let siteInfo = await SiteInfo.findOne();
    
    if (siteInfo) {
      // Update existing settings
      Object.keys(req.body).forEach(key => {
        siteInfo[key] = req.body[key];
      });
      await siteInfo.save();
    } else {
      // Create new settings
      siteInfo = new SiteInfo(req.body);
      await siteInfo.save();
    }
    
    return res.json({ success: true, siteInfo });
  } catch (error) {
    console.error('Error updating site settings:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Add a test endpoint to the router
router.get('/test-express', (req, res) => {
  res.json({
    success: true,
    message: 'Express router API endpoint working',
    timestamp: new Date().toISOString(),
    handler: 'Express router'
  });
});

// BOOKING ROUTES
router.post('/booking/create', async (req, res) => {
  try {
    const newBooking = new Booking(req.body);
    await newBooking.save();
    return res.json({ success: true, booking: newBooking });
  } catch (error) {
    console.error('Error creating booking:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/booking/update/:id', adminAuth, async (req, res) => {
  try {
    const updatedBooking = await Booking.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    
    if (!updatedBooking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    
    return res.json({ success: true, booking: updatedBooking });
  } catch (error) {
    console.error('Error updating booking:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Add authentication endpoint for upload
router.get('/get-upload-auth', (req, res) => {
  try {
    // Check if the request is coming from an admin session
    const isAdmin = req.session && req.session.isAuthenticated === true;
    
    if (isAdmin) {
      // Only provide credentials to logged-in admin users
      return res.status(200).json({
        success: true,
        credentials: {
          username: process.env.ADMIN_USERNAME,
          password: process.env.ADMIN_PASSWORD
        }
      });
    } else {
      // Don't provide credentials to non-admin users
      return res.status(200).json({
        success: false,
        message: 'Authentication required'
      });
    }
  } catch (error) {
    console.error('Error in get-upload-auth:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Thumbnail generation endpoint to bypass CORS issues
router.post('/generate-thumbnail', adminAuth, async (req, res) => {
  try {
    const { videoUrl } = req.body;
    
    if (!videoUrl) {
      return res.status(400).json({
        success: false,
        message: 'Video URL is required'
      });
    }
    
    console.log('Server-side thumbnail generation for:', videoUrl);
    
    // For YouTube videos
    if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
      try {
        // Extract video ID
        let videoId = '';
        if (videoUrl.includes('youtube.com/watch')) {
          videoId = new URL(videoUrl).searchParams.get('v');
        } else if (videoUrl.includes('youtu.be/')) {
          videoId = videoUrl.split('youtu.be/')[1].split('?')[0];
        }
        
        if (videoId) {
          // Use YouTube thumbnail directly
          const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
          return res.json({
            success: true,
            thumbnailUrl: thumbnailUrl,
            message: 'Using YouTube thumbnail'
          });
        }
      } catch (error) {
        console.error('YouTube thumbnail extraction error:', error);
        // Continue to fallback methods
      }
    }
    
    // Set a timeout for Cloudinary request
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Thumbnail generation timed out')), 20000)
    );
    
    // For videos on external domains (not our own server)
    if (videoUrl.startsWith('http') && !videoUrl.includes(req.headers.host)) {
      try {
        // Get thumbnail from video using server-side tools
        const { cloudinary } = require('../utils/cloudinary');
        
        // Race between Cloudinary upload and timeout
        const uploadPromise = cloudinary.uploader.upload(videoUrl, {
          resource_type: 'video',
          folder: 'salon/thumbnails',
          allowed_formats: ['mp4', 'mov', 'webm'],
          transformation: [
            { width: 300, height: 300, crop: 'fill', format: 'jpg' }
          ],
          // Extract the first frame of the video for thumbnail
          transformation: [
            { width: 300, height: 300, crop: 'fill', format: 'jpg' },
            { flags: "animated", video_sampling: "2" }
          ],
          // Instead of eager transformations, get a single thumbnail
          eager_async: false,
          timeout: 15000
        });
        
        // Use Promise.race to handle timeouts
        const uploadResult = await Promise.race([uploadPromise, timeoutPromise]);
        
        console.log('Thumbnail generated via Cloudinary:', uploadResult);
        
        // Check if we have a URL in the format we expect for a video
        if (uploadResult.secure_url && uploadResult.secure_url.endsWith('.mp4')) {
          // If we still have a video URL, transform it to get the image thumbnail
          const thumbnailUrl = uploadResult.secure_url.replace('/upload/', '/upload/w_300,h_300,c_fill,f_jpg,so_0/');
          
          return res.json({
            success: true,
            thumbnailUrl: thumbnailUrl,
            message: 'Thumbnail generated by transforming video URL'
          });
        }
        
        // Return the thumbnail URL
        return res.json({
          success: true,
          thumbnailUrl: uploadResult.eager ? uploadResult.eager[0].secure_url : uploadResult.secure_url,
          message: 'Thumbnail generated successfully via Cloudinary'
        });
      } catch (error) {
        console.error('Error generating thumbnail via Cloudinary:', error);
        
        // If Cloudinary fails, try using a generic video thumbnail
        return res.json({
          success: true,
          thumbnailUrl: '/images/video-placeholder.jpg',
          message: 'Using placeholder image due to timeout or CORS restrictions'
        });
      }
    } 
    // For videos on our own server
    else {
      try {
        // For local videos, we can use a placeholder or default thumbnail
        // In a more complex implementation, we could use ffmpeg to generate thumbnails
        return res.json({
          success: true,
          thumbnailUrl: '/images/video-placeholder.jpg',
          message: 'Using placeholder image for local video'
        });
      } catch (error) {
        console.error('Error handling local video thumbnail:', error);
        return res.json({
          success: true,
          thumbnailUrl: '/images/video-placeholder.jpg',
          message: 'Using placeholder image as fallback'
        });
      }
    }
  } catch (error) {
    console.error('Thumbnail generation error:', error);
    // Always return success with a fallback image instead of an error
    return res.json({
      success: true,
      thumbnailUrl: '/images/video-placeholder.jpg',
      message: 'Using placeholder image due to error'
    });
  }
});

module.exports = router; 