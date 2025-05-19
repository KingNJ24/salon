const express = require('express');
const router = express.Router();
const { Service, Gallery, Team, SiteInfo, Booking } = require('../models');
const axios = require('axios');

// Home page
router.get('/', async (req, res, next) => {
  try {
    let services, siteInfo, gallery;
    
    siteInfo = await SiteInfo.findOne();
    
    // If no siteInfo exists, create a default one
    if (!siteInfo) {
      try {
        console.log('No site info found, creating default...');
        siteInfo = new SiteInfo({
          salonName: 'NandiniJ Makeup Studio',
          address: '123 Main Street, City, State 12345',
          phone: '(123) 456-7890',
          email: 'info@nandinijstudio.com',
          heroTitle: 'Makeup Studio',
          heroSubtitle: 'Experience luxury beauty services at our studio. Our expert stylists will help you look and feel your best.',
          aboutText: 'NandiniJ Makeup Studio was founded with a simple mission: to provide exceptional beauty services in a welcoming and relaxing environment.'
        });
        await siteInfo.save();
        console.log('Default site info created');
      } catch (error) {
        console.error('Error creating default site info:', error);
        // Continue with null siteInfo, views should handle it
      }
    }
    
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
    console.log('Fetching gallery items for homepage...');
    gallery = await Gallery.find()
      .where('showOnHomepage').equals(true)
      .where('isVisible').ne(false)
      .sort({ displayOrder: 1 });
    
    console.log('Gallery items found for homepage:', gallery.length);
    
    // If no gallery items marked for homepage, get first 4 visible items
    if (gallery.length === 0) {
      console.log('No items marked for homepage, getting default items');
      gallery = await Gallery.find({ isVisible: { $ne: false } })
        .sort({ displayOrder: 1 })
        .limit(4);
      console.log('Default gallery items found:', gallery.length);
    }
    
    // Get team members
    const team = await Team.find().sort({ _id: 1 });
    
    res.render('index', { 
      title: siteInfo?.salonName || 'Salon',
      services,
      homepageGallery: gallery,
      team,
      siteInfo,
      page: 'home'
    });
  } catch (error) {
    console.error('Error in homepage route:', error);
    next(error);
  }
});

// Services page
router.get('/services', async (req, res, next) => {
  try {
    const services = await Service.find({ isVisible: { $ne: false } })
      .sort({ displayOrder: 1 });
    let siteInfo = await SiteInfo.findOne();
    
    // If siteInfo doesn't exist, just proceed with null
    // The view will handle it with the safety checks
    
    res.render('services', { 
      title: 'Services', 
      services,
      siteInfo,
      page: 'services'
    });
  } catch (error) {
    next(error);
  }
});

// Gallery/Lookbook page
router.get('/lookbook', async (req, res, next) => {
  try {
    const galleryItems = await Gallery.find({ isVisible: { $ne: false } })
      .sort({ displayOrder: 1 });
    const siteInfo = await SiteInfo.findOne();
    
    // Extract unique categories from gallery items
    const allCategories = galleryItems.map(item => item.category || 'Uncategorized');
    const uniqueCategories = [...new Set(allCategories)];
    const categories = ['All', ...uniqueCategories];
    
    res.render('lookbook', { 
      title: 'Lookbook', 
      galleryItems,
      categories,
      siteInfo,
      page: 'lookbook'
    });
  } catch (error) {
    next(error);
  }
});

// Contact/Booking page
router.get('/contact', async (req, res, next) => {
  try {
    const siteInfo = await SiteInfo.findOne();
    const services = await Service.find({ isVisible: { $ne: false } }).sort({ displayOrder: 1 });
    
    res.render('contact', { 
      title: 'Contact Us', 
      siteInfo,
      services,
      page: 'contact'
    });
  } catch (error) {
    next(error);
  }
});

// About page
router.get('/about', async (req, res, next) => {
  try {
    const siteInfo = await SiteInfo.findOne();
    const team = await Team.find().sort({ _id: 1 });
    
    res.render('about', { 
      title: 'About Us', 
      siteInfo,
      team,
      page: 'about',
      googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY
    });
  } catch (error) {
    next(error);
  }
});

// Booking form submission
router.post('/booking', async (req, res, next) => {
  try {
    // Create a new booking in the database
    const booking = new Booking({
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      service: req.body.service,
      date: req.body.date,
      message: req.body.message
    });
    
    await booking.save();
    
    const siteInfo = await SiteInfo.findOne();
    
    res.render('contact', { 
      title: 'Contact Us', 
      siteInfo,
      page: 'contact',
      success: true
    });
  } catch (error) {
    next(error);
  }
});

// Diagnostic route to check gallery items
router.get('/gallery-debug', async (req, res, next) => {
  try {
    const gallery = await Gallery.find().sort({ displayOrder: 1 });
    
    // Convert to plain objects to safely convert to JSON
    const items = gallery.map(item => {
      return {
        id: item._id.toString(),
        title: item.title,
        isVisible: !!item.isVisible,
        showOnHomepage: !!item.showOnHomepage,
        displayOrder: item.displayOrder || 0
      };
    });
    
    res.json({
      totalItems: items.length,
      visibleItems: items.filter(item => item.isVisible).length,
      homepageItems: items.filter(item => item.showOnHomepage).length,
      items: items
    });
  } catch (error) {
    next(error);
  }
});

// Make all gallery items visible (improved version)
router.get('/gallery-fix-all', async (req, res, next) => {
  try {
    // First get all gallery items
    const items = await Gallery.find();
    const results = [];
    
    // Make all items visible
    for (const item of items) {
      const updateData = {
        isVisible: true
      };
      
      // Add first 4 items to homepage
      if (results.length < 4) {
        updateData.showOnHomepage = true;
      }
      
      // Update this item
      const result = await Gallery.findByIdAndUpdate(
        item._id,
        { $set: updateData },
        { new: true }
      );
      
      results.push({
        id: item._id.toString(),
        title: item.title,
        isVisible: result.isVisible,
        showOnHomepage: result.showOnHomepage
      });
    }
    
    res.json({
      message: 'Gallery items fixed',
      totalItems: results.length,
      visibleItems: results.filter(item => item.isVisible).length,
      homepageItems: results.filter(item => item.showOnHomepage).length,
      items: results
    });
  } catch (error) {
    console.error('Error fixing gallery items:', error);
    next(error);
  }
});

// Make all gallery items visible
router.get('/gallery-make-visible', async (req, res, next) => {
  try {
    // Update all gallery items to be visible
    const result = await Gallery.updateMany({}, { 
      $set: { 
        isVisible: true 
      } 
    });
    
    // Update some items to show on homepage
    await Gallery.updateMany({}, { 
      $set: { 
        showOnHomepage: true 
      } 
    }).limit(4);
    
    res.json({
      message: 'All gallery items made visible',
      updated: result.modifiedCount || result.nModified,
      result
    });
  } catch (error) {
    console.error('Error making gallery items visible:', error);
    next(error);
  }
});

// Fix all gallery items directory
router.get('/fix-gallery-direct', async (req, res, next) => {
  try {
    // Direct query to update all items to be visible and first 4 on homepage
    await Gallery.updateMany({}, { $set: { isVisible: true } });
    
    // Get first 4 items and set them to show on homepage
    const items = await Gallery.find().limit(4);
    
    for (const item of items) {
      item.showOnHomepage = true;
      await item.save();
    }
    
    res.send('Fixed all gallery items. <a href="/">Go to homepage</a>');
  } catch (error) {
    console.error('Error fixing gallery items:', error);
    res.status(500).send('Error: ' + error.message);
  }
});

// Fix video items in gallery
router.get('/fix-video-items', async (req, res, next) => {
  try {
    // Make all video items visible
    const videoUpdateResult = await Gallery.updateMany(
      { type: 'video' }, 
      { $set: { isVisible: true, showOnHomepage: true } }
    );
    
    // Get all video items for confirmation
    const videoItems = await Gallery.find({ type: 'video' });
    
    res.json({
      message: 'Video items fixed successfully',
      updated: videoUpdateResult.modifiedCount || videoUpdateResult.nModified || 0,
      videoItems: videoItems.map(item => ({
        id: item._id.toString(),
        title: item.title,
        isVisible: item.isVisible,
        showOnHomepage: item.showOnHomepage
      }))
    });
  } catch (error) {
    console.error('Error fixing video items:', error);
    res.status(500).send('Error: ' + error.message);
  }
});

// Google Places API proxy route
router.get('/api/google-reviews', async (req, res) => {
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

        // Add logging to debug the request
        console.log('Fetching reviews for place:', placeId);

        const response = await axios.get(
            `https://maps.googleapis.com/maps/api/place/details/json`,
            {
                params: {
                    place_id: placeId,
                    fields: 'reviews,rating,user_ratings_total',
                    key: apiKey
                },
                headers: {
                    'Accept': 'application/json'
                }
            }
        );

        // Add logging to debug the response
        console.log('Google Places API response status:', response.status);

        if (response.data.status === 'OK') {
            res.json(response.data);
        } else {
            console.error('Google Places API error:', response.data);
            res.status(400).json({
                error: 'Failed to fetch reviews',
                details: response.data
            });
        }
    } catch (error) {
        console.error('Error fetching Google reviews:', error.response?.data || error.message);
        res.status(500).json({ 
            error: 'Failed to fetch reviews',
            details: error.response?.data || error.message
        });
    }
});

module.exports = router; 