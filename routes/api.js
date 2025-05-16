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
    // Check if we're in Vercel environment
    if (process.env.VERCEL === '1') {
      // In Vercel environment
      const { cloudinaryUpload } = require('../utils/cloudinary');
      
      // If Cloudinary is not configured, return a clear error message
      if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
        console.error('Cloudinary configuration missing');
        return res.status(500).json({
          success: false,
          message: 'File uploads require Cloudinary configuration in Vercel. Please add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables.'
        });
      }
      
      // Use Cloudinary upload
      cloudinaryUpload.single('file')(req, res, (err) => {
        try {
          // Handle multer errors
          if (err) {
            console.error('Cloudinary upload error:', err);
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
          
          console.log('File uploaded to Cloudinary:', req.file);
          
          // Determine the file type
          const fileType = req.file.mimetype.startsWith('video/') ? 'video' : 'image';
          
          // Return the Cloudinary URL
          return res.json({ 
            success: true, 
            filePath: req.file.path,
            fileType,
            originalName: req.file.originalname,
            size: req.file.size,
            url: req.file.secure_url || req.file.path
          });
        } catch (error) {
          console.error('Unexpected error in Cloudinary upload handler:', error);
          return res.status(500).json({ 
            success: false, 
            message: 'Server error: ' + error.message 
          });
        }
      });
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