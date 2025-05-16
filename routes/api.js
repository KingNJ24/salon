const express = require('express');
const router = express.Router();
const { adminAuth } = require('../middlewares/auth');
const { upload, saveBase64Image } = require('../utils/upload');
const serviceController = require('../controllers/serviceController');
const galleryController = require('../controllers/galleryController');
const { Team, SiteInfo, Booking } = require('../models');

// File upload endpoint
router.post('/upload', adminAuth, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    
    // Return the file path
    const filePath = '/' + req.file.path.split('public')[1].replace(/\\/g, '/');
    return res.json({ success: true, filePath });
  } catch (error) {
    console.error('Error uploading file:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
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