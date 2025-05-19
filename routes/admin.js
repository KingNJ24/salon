const express = require('express');
const router = express.Router();
const { adminAuth } = require('../middlewares/auth');
const { upload } = require('../utils/upload');
const { Service, Gallery, Team, SiteInfo, Booking } = require('../models');

// Admin login page
router.get('/', (req, res) => {
  if (req.session.isAuthenticated) {
    return res.redirect('/admin/dashboard');
  }
  res.render('admin/login', { 
    title: 'Admin Login', 
    layout: 'layouts/admin',
    error: null
  });
});

// Login POST handler (for form submitting to /admin directly)
router.post('/', (req, res) => {
  const { username, password } = req.body;
  const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'nikhil';
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '123456';
  
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    req.session.isAuthenticated = true;
    return res.redirect('/admin/dashboard');
  }
  
  res.render('admin/login', { 
    title: 'Admin Login', 
    layout: 'layouts/admin', 
    error: 'Invalid credentials' 
  });
});

// Login POST handler
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'nikhil';
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '123456';
  
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    req.session.isAuthenticated = true;
    return res.redirect('/admin/dashboard');
  }
  
  res.render('admin/login', { 
    title: 'Admin Login', 
    layout: 'layouts/admin', 
    error: 'Invalid credentials' 
  });
});

// Logout
router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/admin');
});

// Admin dashboard
router.get('/dashboard', adminAuth, async (req, res, next) => {
  try {
    // Get counts for dashboard
    const services = await Service.find();
    const gallery = await Gallery.find();
    const bookings = await Booking.find();
    const siteInfo = await SiteInfo.findOne() || {};
    
    res.render('admin/dashboard', { 
      title: 'Admin Dashboard', 
      layout: 'layouts/admin',
      services,
      gallery,
      bookings,
      siteInfo
    });
  } catch (error) {
    next(error);
  }
});

// Services admin page
router.get('/services', adminAuth, async (req, res, next) => {
  try {
    const services = await Service.find().sort({ displayOrder: 1 });
    const siteInfo = await SiteInfo.findOne();
    
    res.render('admin/services', { 
      title: 'Services Admin', 
      layout: 'layouts/admin',
      services,
      siteInfo
    });
  } catch (error) {
    next(error);
  }
});

// Gallery admin page
router.get('/gallery', adminAuth, async (req, res, next) => {
  try {
    const gallery = await Gallery.find();
    res.render('admin/gallery', { 
      title: 'Manage Gallery', 
      layout: 'layouts/admin', 
      gallery 
    });
  } catch (error) {
    next(error);
  }
});

// Team admin page
router.get('/team', adminAuth, async (req, res, next) => {
  try {
    const team = await Team.find();
    res.render('admin/team', { 
      title: 'Manage Team', 
      layout: 'layouts/admin', 
      team 
    });
  } catch (error) {
    next(error);
  }
});

// Settings admin page
router.get('/settings', adminAuth, async (req, res, next) => {
  try {
    const siteInfo = await SiteInfo.findOne() || {};
    res.render('admin/settings', { 
      title: 'Site Settings', 
      layout: 'layouts/admin', 
      siteInfo 
    });
  } catch (error) {
    next(error);
  }
});

// Bookings admin page
router.get('/bookings', adminAuth, async (req, res, next) => {
  try {
    const bookings = await Booking.find();
    
    res.render('admin/bookings', { 
      title: 'Manage Bookings', 
      layout: 'layouts/admin', 
      bookings 
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router; 