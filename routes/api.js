const express = require('express');
const router = express.Router();
const { adminAuth } = require('../middlewares/auth');
const { upload, saveBase64Image } = require('../utils/upload');
const serviceController = require('../controllers/serviceController');
const galleryController = require('../controllers/galleryController');
const { Team, SiteInfo, Booking, ServiceCategory, GalleryCategory, Service } = require('../models');
const axios = require('axios');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Google Places API proxy route
router.get('/google-reviews', async (req, res) => {
    try {
        const { placeId } = req.query;
        const apiKey = process.env.GOOGLE_MAPS_API_KEY;

        if (!placeId || !apiKey) {
            return res.status(400).json({ 
                error: 'Missing required parameters',
                details: {
                    placeId: !placeId ? 'Missing' : 'Present',
                    apiKey: !apiKey ? 'Missing' : 'Present'
                }
            });
        }

        console.log('Making Google Places API request:', {
            placeId,
            hasApiKey: !!apiKey,
            apiKeyPrefix: apiKey ? apiKey.substring(0, 5) + '...' : 'missing'
        });

        const response = await axios.get(
            'https://maps.googleapis.com/maps/api/place/details/json',
            {
                params: {
                    place_id: placeId,
                    fields: 'reviews,rating,user_ratings_total',
                    key: apiKey
                },
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('Google Places API response:', {
            status: response.status,
            dataStatus: response.data.status,
            hasReviews: !!response.data.result?.reviews,
            reviewCount: response.data.result?.reviews?.length || 0
        });

        if (response.data.status === 'OK') {
            res.json(response.data);
        } else {
            res.status(400).json({
                error: 'Failed to fetch reviews',
                details: response.data
            });
        }
    } catch (error) {
        console.error('Error fetching Google reviews:', error.response?.data || error.message);
        res.status(500).json({
            error: 'Error fetching reviews',
            details: error.response?.data || error.message
        });
    }
});

// File upload endpoint
router.post('/upload', adminAuth, async (req, res) => {
  try {
    if (!req.body || !req.body.file) {
      return res.status(400).json({
        success: false,
        message: 'No file data found in request'
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
    console.error('Error in upload handler:', error);
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
router.delete('/services/:id', adminAuth, serviceController.deleteService);
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
    
    // Validate map embed URL if provided
    if (req.body.mapEmbedUrl) {
      // Ensure it's a valid map embed URL (Google Maps or OpenStreetMap)
      if (!req.body.mapEmbedUrl.includes('google.com/maps/embed') && !req.body.mapEmbedUrl.includes('openstreetmap.org/export/embed')) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid map embed URL format. Must be from Google Maps or OpenStreetMap.' 
        });
      }
    }
    
    if (siteInfo) {
      // Update existing settings
      const updateData = {};
      
      // Handle basic info
      if (req.body.salonName) updateData.salonName = req.body.salonName;
      if (req.body.email) updateData.email = req.body.email;
      if (req.body.phone) updateData.phone = req.body.phone;
      if (req.body.address) updateData.address = req.body.address;
      
      // Handle appearance settings
      if (req.body.servicesViewMode) updateData.servicesViewMode = req.body.servicesViewMode;
      if (req.body.currencySymbol) updateData.currencySymbol = req.body.currencySymbol;
      if (req.body.heroTitle) updateData.heroTitle = req.body.heroTitle;
      if (req.body.heroSubtitle) updateData.heroSubtitle = req.body.heroSubtitle;
      if (req.body.aboutText) updateData.aboutText = req.body.aboutText;
      
      // Handle social media
      if (req.body.socialMedia) {
        updateData.socialMedia = {
          ...siteInfo.socialMedia,
          ...req.body.socialMedia
        };
      }
      
      // Handle business hours
      if (req.body.hours) {
        updateData.hours = {
          ...siteInfo.hours,
          ...req.body.hours
        };
      }
      
      // Handle notification settings
      if (req.body.emailNotifications) {
        updateData.emailNotifications = {
          ...siteInfo.emailNotifications,
          ...req.body.emailNotifications
        };
      }
      if (req.body.smsNotifications) {
        updateData.smsNotifications = {
          ...siteInfo.smsNotifications,
          ...req.body.smsNotifications
        };
      }
      
      // Update the document
      Object.assign(siteInfo, updateData);
      await siteInfo.save();
      
      console.log('Settings updated successfully:', updateData);
    } else {
      // Create new settings
      siteInfo = new SiteInfo(req.body);
      await siteInfo.save();
      console.log('New settings created successfully');
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

// Bulk actions for bookings
router.post('/bookings/bulk-action', adminAuth, async (req, res) => {
  try {
    const { ids, action, status } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'No booking IDs provided' });
    }
    if (action === 'delete') {
      await Booking.deleteMany({ _id: { $in: ids } });
      return res.json({ success: true, message: 'Bookings deleted successfully' });
    } else if (action === 'update-status' && status) {
      await Booking.updateMany({ _id: { $in: ids } }, { $set: { status } });
      return res.json({ success: true, message: 'Bookings updated successfully' });
    } else {
      return res.status(400).json({ success: false, message: 'Invalid action or missing status' });
    }
  } catch (error) {
    console.error('Error in bulk action:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Add a new route for creating a service that accepts a POST request to /api/services
router.post('/services', adminAuth, async (req, res) => {
  try {
    console.log('Received service creation request:', req.body);
    const { name, description, price, videoUrl, isVisible, showOnHomepage, displayOrder, type } = req.body;
    let image = req.body.image;

    // Handle file upload if present
    if (req.body.file && req.body.file.startsWith('data:')) {
      try {
        console.log('Attempting to upload file to Cloudinary...');
        const result = await cloudinary.uploader.upload(req.body.file, {
          folder: 'salon/services',
          resource_type: 'auto',
          allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'mov', 'webm']
        });
        console.log('Cloudinary upload successful:', result.secure_url);
        image = result.secure_url;
      } catch (uploadError) {
        console.error('Error uploading to Cloudinary:', uploadError);
        return res.status(500).json({ 
          success: false, 
          message: 'Error uploading file to Cloudinary: ' + uploadError.message 
        });
      }
    }

    // Create new service with default category if not provided
    const newService = new Service({
      name,
      description,
      price,
      image,
      videoUrl,
      type: type || 'image',
      isVisible: isVisible === 'on' || isVisible === true,
      showOnHomepage: showOnHomepage === 'on' || showOnHomepage === true,
      displayOrder: displayOrder || 0,
      category: req.body.category || 'General' // Add default category
    });
    
    console.log('Saving new service:', newService);
    await newService.save();
    console.log('Service saved successfully');
    
    return res.json({ success: true, service: newService });
  } catch (error) {
    console.error('Error creating service:', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

module.exports = router; 