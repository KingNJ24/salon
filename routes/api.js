const express = require('express');
const router = express.Router();
const { adminAuth } = require('../middlewares/auth');
const { upload, saveBase64Image } = require('../utils/upload');
const serviceController = require('../controllers/serviceController');
const galleryController = require('../controllers/galleryController');
const { Team, SiteInfo, Booking } = require('../models');

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
            resource_type: isVideo ? 'video' : 'image'
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

// SERVICE ROUTES
router.get('/services', serviceController.getAllServices);
router.get('/services/visible', serviceController.getVisibleServices);
router.get('/services/:id', serviceController.getServiceById);
router.post('/service/create', adminAuth, serviceController.createService);
router.post('/service/update/:id', adminAuth, serviceController.updateService);
router.post('/service/delete/:id', adminAuth, serviceController.deleteService);

// GALLERY ROUTES
router.get('/gallery', galleryController.getAllItems);
router.get('/gallery/visible', galleryController.getVisibleItems);
router.get('/gallery/:id', galleryController.getItemById);
router.post('/gallery/create', adminAuth, galleryController.createItem);
router.post('/gallery/update/:id', adminAuth, galleryController.updateItem);
router.post('/gallery/delete/:id', adminAuth, galleryController.deleteItem);

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

module.exports = router; 