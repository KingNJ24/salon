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
  const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
  
  console.log('Login attempt:', { username, providedPassword: password ? '****' : 'not provided' });
  
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    req.session.isAuthenticated = true;
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        return res.render('admin/login', { 
          title: 'Admin Login', 
          layout: 'layouts/admin', 
          error: 'Login failed. Please try again.' 
        });
      }
      console.log('Login successful, redirecting to dashboard');
      return res.redirect('/admin/dashboard');
    });
  } else {
    console.log('Login failed: Invalid credentials');
    res.render('admin/login', { 
      title: 'Admin Login', 
      layout: 'layouts/admin', 
      error: 'Invalid username or password' 
    });
  }
});

// Login POST handler
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
  
  console.log('Login attempt:', { username, providedPassword: password ? '****' : 'not provided' });
  
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    req.session.isAuthenticated = true;
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        return res.render('admin/login', { 
          title: 'Admin Login', 
          layout: 'layouts/admin', 
          error: 'Login failed. Please try again.' 
        });
      }
      console.log('Login successful, redirecting to dashboard');
      return res.redirect('/admin/dashboard');
    });
  } else {
    console.log('Login failed: Invalid credentials');
    res.render('admin/login', { 
      title: 'Admin Login', 
      layout: 'layouts/admin', 
      error: 'Invalid username or password' 
    });
  }
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
    const { status, service, date, sort } = req.query;
    let query = {};
    if (status) query.status = status;
    if (service) query.service = service;
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      query.date = { $gte: startDate, $lt: endDate };
    }
    let sortOption = {};
    if (sort === 'date-desc') sortOption = { date: -1 };
    else if (sort === 'date-asc') sortOption = { date: 1 };
    else if (sort === 'status') sortOption = { status: 1 };
    else if (sort === 'customer') sortOption = { name: 1 };
    else sortOption = { date: -1 }; // default sort by newest date

    const bookings = await Booking.find(query).sort(sortOption);
    const services = await Service.find();
    res.render('admin/bookings', { 
      title: 'Manage Bookings', 
      layout: 'layouts/admin', 
      bookings,
      services
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router; 