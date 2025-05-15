const express = require('express');
const router = express.Router();
const { adminAuth } = require('../middlewares/auth');
const { upload } = require('../utils/upload');
const { Service, Gallery, Team, SiteInfo } = require('../models');

// Admin login page
router.get('/', (req, res) => {
  if (req.session.isAuthenticated) {
    return res.redirect('/admin/dashboard');
  }
  res.render('admin/login', { 
    title: 'Admin Login', 
    layout: 'layouts/admin'
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
router.get('/dashboard', adminAuth, async (req, res) => {
  try {
    res.render('admin/dashboard', { 
      title: 'Admin Dashboard', 
      layout: 'layouts/admin' 
    });
  } catch (error) {
    next(error);
  }
});

// Services admin page
router.get('/services', adminAuth, async (req, res, next) => {
  try {
    const services = await Service.find();
    res.render('admin/services', { 
      title: 'Manage Services', 
      layout: 'layouts/admin', 
      services 
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

module.exports = router; 