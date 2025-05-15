const express = require('express');
const router = express.Router();
const { Service, Gallery, Team, SiteInfo } = require('../models');

// Home page
router.get('/', async (req, res, next) => {
  try {
    let services, siteInfo, gallery;
    
    siteInfo = await SiteInfo.findOne();
    
    // Get services for homepage
    services = await Service.find({ 
      showOnHomepage: true,
      isVisible: { $ne: false }
    }).sort({ displayOrder: 1 });
    
    // If no services marked for homepage, get first 3 visible services
    if (services.length === 0) {
      services = await Service.find({ isVisible: { $ne: false } })
        .sort({ displayOrder: 1 })
        .limit(3);
    }
    
    // Get gallery items for homepage
    gallery = await Gallery.find({ 
      showOnHomepage: true,
      isVisible: { $ne: false }
    }).sort({ displayOrder: 1 });
    
    // Get team members
    const team = await Team.find().sort({ _id: 1 });
    
    res.render('index', { 
      title: siteInfo?.salonName || 'Salon',
      services,
      gallery,
      team,
      siteInfo
    });
  } catch (error) {
    next(error);
  }
});

// Services page
router.get('/services', async (req, res, next) => {
  try {
    const services = await Service.find({ isVisible: { $ne: false } })
      .sort({ displayOrder: 1 });
    const siteInfo = await SiteInfo.findOne();
    
    res.render('services', { 
      title: 'Services', 
      services,
      siteInfo
    });
  } catch (error) {
    next(error);
  }
});

// Gallery/Lookbook page
router.get('/lookbook', async (req, res, next) => {
  try {
    const gallery = await Gallery.find({ isVisible: { $ne: false } })
      .sort({ displayOrder: 1 });
    const siteInfo = await SiteInfo.findOne();
    
    res.render('lookbook', { 
      title: 'Lookbook', 
      gallery,
      siteInfo
    });
  } catch (error) {
    next(error);
  }
});

// Contact/Booking page
router.get('/contact', async (req, res, next) => {
  try {
    const siteInfo = await SiteInfo.findOne();
    
    res.render('contact', { 
      title: 'Contact Us', 
      siteInfo
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router; 