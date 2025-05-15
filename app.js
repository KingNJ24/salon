require('dotenv').config();
const express = require('express');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const fs = require('fs');
const multer = require('multer');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const connectDB = require('./db/connect');
const initializeDatabase = require('./db/init');
const { Booking, Service, Gallery, Team, SiteInfo } = require('./models');

const app = express();
const port = process.env.PORT || 3000;

// Configure multer for file uploads
const UPLOADS_DIR = path.join(__dirname, 'public', 'uploads');
// Create uploads directory if it doesn't exist
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Create videos directory if it doesn't exist
const VIDEOS_DIR = path.join(__dirname, 'public', 'videos');
if (!fs.existsSync(VIDEOS_DIR)) {
  fs.mkdirSync(VIDEOS_DIR, { recursive: true });
}

// Function to determine file type and appropriate directory
const getUploadPath = (file) => {
  // Check if it's a video file
  if (file.mimetype.startsWith('video/')) {
    return VIDEOS_DIR;
  }
  // Default to images/uploads directory
  return UPLOADS_DIR;
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, getUploadPath(file));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    
    // Prefix based on file type
    const prefix = file.mimetype.startsWith('video/') ? 'video-' : 'image-';
    cb(null, prefix + uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // Increased to 100MB to accommodate larger videos
  fileFilter: function (req, file, cb) {
    // Accept images and videos
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif|mp4|webm|mov|avi|wmv)$/i)) {
      return cb(new Error('Only image and video files are allowed!'), false);
    }
    cb(null, true);
  }
});

// Admin credentials from environment variables
let ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'nikhil';
let ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '123456';

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.set('layout', 'layouts/main');

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'yoursalonsecret123',
  resave: false,
  saveUninitialized: true,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 // 1 day
  }
}));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Body parser
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// Make user session available to views
app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isAuthenticated || false;
  next();
});

// Admin authentication middleware
const adminAuth = (req, res, next) => {
  // Check if authenticated via session
  console.log('Admin auth check:', req.session.isAuthenticated);
  
  if (req.session.isAuthenticated) {
    console.log('User is authenticated, proceeding to protected route');
    return next();
  }
  
  // For GET requests, allow access to login page
  if (req.method === 'GET' && req.path === '/admin') {
    return next();
  }
  
  // Redirect to login if not authenticated
  console.log('User is not authenticated, redirecting to login');
  return res.redirect('/admin');
};

// In-memory fallback data store
let inMemoryDb = {
  bookings: [],
  services: [
    { id: 1, name: 'Women\'s Haircut', price: '60+', description: 'Personalized haircuts tailored to your face shape and lifestyle', image: '/images/cuts1.jpg', category: 'Haircut' },
    { id: 2, name: 'Men\'s Haircut', price: '40+', description: 'Modern or classic cuts for men of all ages', image: '/images/cuts2.jpg', category: 'Haircut' },
    { id: 3, name: 'Hair Coloring', price: '80+', description: 'Full color services to help you achieve the perfect shade', image: '/images/colors1.jpg', category: 'Coloring' },
    { id: 4, name: 'Balayage', price: '150+', description: 'Beautiful, natural-looking highlights and color gradients', image: '/images/colors2.jpg', category: 'Coloring' },
    { id: 5, name: 'Bridal Styling', price: '120+', description: 'Make your special day even more memorable with our bridal services', image: '/images/bridal1.jpg', category: 'Styling' },
    { id: 6, name: 'Hair Treatments', price: '45+', description: 'Revitalize your hair with our professional treatments', image: '/images/texture1.jpg', category: 'Treatment' }
  ],
  galleryImages: [
    { id: 1, category: 'Bridal', image: '/images/bridal1.jpg', title: 'Bridal Style 1' },
    { id: 2, category: 'Bridal', image: '/images/bridal2.jpg', title: 'Bridal Style 2' },
    { id: 3, category: 'Colors', image: '/images/colors1.jpg', title: 'Hair Color 1' },
    { id: 4, category: 'Colors', image: '/images/colors2.jpg', title: 'Hair Color 2' },
    { id: 5, category: 'Cuts', image: '/images/cuts1.jpg', title: 'Haircut 1' },
    { id: 6, category: 'Cuts', image: '/images/cuts2.jpg', title: 'Haircut 2' },
    { id: 7, category: 'Makeup', image: '/images/makeup1.jpg', title: 'Makeup Look 1' },
    { id: 8, category: 'Textures', image: '/images/texture1.jpg', title: 'Hair Texture 1' }
  ],
  team: [
    { id: 1, name: 'Sarah Johnson', title: 'Founder & Master Stylist', bio: 'Specializing in precision cuts and color transformations.', image: '/images/stylist1.jpg' },
    { id: 2, name: 'Michael Brown', title: 'Senior Stylist', bio: 'Expert in modern men\'s cuts and styling techniques.', image: '/images/stylist2.jpg' },
    { id: 3, name: 'Emily Davis', title: 'Color Specialist', bio: 'Known for creating stunning balayage and color melts.', image: '/images/stylist3.jpg' }
  ],
  siteInfo: {
    salonName: 'Your Salon',
    address: '123 Main Street, City, State 12345',
    phone: '(123) 456-7890',
    email: 'info@yoursalon.com',
    socialMedia: {
      facebook: 'https://facebook.com/yoursalon',
      instagram: 'https://instagram.com/yoursalon',
      twitter: 'https://twitter.com/yoursalon',
      pinterest: '',
      youtube: ''
    },
    featuredServices: [1, 3, 5],
    hours: {
      monday: '9am - 8pm',
      tuesday: '9am - 8pm',
      wednesday: '9am - 8pm',
      thursday: '9am - 8pm',
      friday: '9am - 8pm',
      saturday: '9am - 6pm',
      sunday: '10am - 5pm'
    }
  }
};

// Indicate if using MongoDB or in-memory data
let usingMongoDB = false;

// Routes with fallback to in-memory data if DB connection fails
app.get('/', async (req, res) => {
  try {
    let services, siteInfo, homepageGallery;
    
    if (usingMongoDB) {
      siteInfo = await SiteInfo.findOne();
      
      // First try to get services marked for homepage display
      services = await Service.find({ 
        showOnHomepage: true,
        isVisible: { $ne: false }
      }).sort({ displayOrder: 1 });
      
      // If no services are marked for homepage, fall back to featured services
      if (services.length === 0 && siteInfo && siteInfo.featuredServices && siteInfo.featuredServices.length > 0) {
        services = await Service.find({
          _id: { $in: siteInfo.featuredServices },
          isVisible: { $ne: false }
        }).sort({ displayOrder: 1 });
      }
      
      // If still no services, get first 3 visible services
      if (services.length === 0) {
        services = await Service.find({ isVisible: { $ne: false } }).sort({ displayOrder: 1 }).limit(3);
      }
      
      // Get gallery items marked for homepage display
      homepageGallery = await Gallery.find({ 
        showOnHomepage: true,
        isVisible: { $ne: false }
      }).sort({ displayOrder: 1 }).limit(4);
    } else {
      siteInfo = inMemoryDb.siteInfo;
      
      // First try to get services marked for homepage display
      services = inMemoryDb.services
        .filter(service => service.showOnHomepage === true && service.isVisible !== false)
        .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
      
      // If no services are marked for homepage, fall back to featured services
      if (services.length === 0 && siteInfo.featuredServices && siteInfo.featuredServices.length > 0) {
        services = siteInfo.featuredServices
          .map(id => inMemoryDb.services.find(service => service.id === id && service.isVisible !== false))
          .filter(Boolean) // Remove any undefined values
          .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
      }
      
      // If still no services, get first 3 visible services
      if (services.length === 0) {
        services = inMemoryDb.services
          .filter(service => service.isVisible !== false)
          .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
          .slice(0, 3);
      }
      
      // Get gallery items for homepage (in-memory version)
      homepageGallery = inMemoryDb.galleryImages
        .filter(item => item.showOnHomepage && item.isVisible !== false)
        .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
        .slice(0, 4);
    }
    
    res.render('index', { 
      title: `${siteInfo?.salonName || 'Your Salon'} - Home`,
      page: 'home',
      services,
      homepageGallery,
      siteInfo: siteInfo || { salonName: 'Your Salon', hours: {} }
    });
  } catch (error) {
    console.error('Error:', error);
    // Fallback to in-memory data
    const siteInfo = inMemoryDb.siteInfo;
    
    // First try to get services marked for homepage display
    let services = inMemoryDb.services
      .filter(service => service.showOnHomepage === true && service.isVisible !== false)
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
    
    // If no services are marked for homepage, fall back to featured services
    if (services.length === 0 && siteInfo.featuredServices && siteInfo.featuredServices.length > 0) {
      services = siteInfo.featuredServices
        .map(id => inMemoryDb.services.find(service => service.id === id && service.isVisible !== false))
        .filter(Boolean)
        .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
    }
    
    // If still no services, get first 3 visible services
    if (services.length === 0) {
      services = inMemoryDb.services
        .filter(service => service.isVisible !== false)
        .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
        .slice(0, 3);
    }
    
    // Get gallery items for homepage (fallback)
    const homepageGallery = inMemoryDb.galleryImages
      .filter(item => item.showOnHomepage && item.isVisible !== false)
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
      .slice(0, 4);
    
    res.render('index', { 
      title: 'Your Salon - Home',
      page: 'home',
      services,
      homepageGallery,
      siteInfo
    });
  }
});

app.get('/lookbook', async (req, res) => {
  try {
    // Categories for filtering
    const categories = ['All', 'Bridal', 'Colors', 'Cuts', 'Makeup', 'Textures'];
    let galleryItems, siteInfo;
    
    if (usingMongoDB) {
      // Get only visible gallery items ordered by displayOrder
      galleryItems = await Gallery.find({ isVisible: { $ne: false } }).sort({ displayOrder: 1 });
      siteInfo = await SiteInfo.findOne();
    } else {
      // Filter visible items and sort by displayOrder for in-memory storage
      galleryItems = inMemoryDb.galleryImages
        .filter(item => item.isVisible !== false)
        .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
      
      siteInfo = inMemoryDb.siteInfo;
    }
    
    res.render('lookbook', { 
      title: `${siteInfo?.salonName || 'Your Salon'} - Lookbook`,
      page: 'lookbook',
      categories,
      galleryItems,
      siteInfo: siteInfo || { salonName: 'Your Salon', hours: {} }
    });
  } catch (error) {
    console.error('Error:', error);
    // Fallback to in-memory data
    const categories = ['All', 'Bridal', 'Colors', 'Cuts', 'Makeup', 'Textures'];
    
    // Filter and sort in-memory gallery items
    const galleryItems = inMemoryDb.galleryImages
      .filter(item => item.isVisible !== false)
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
    
    res.render('lookbook', { 
      title: 'Your Salon - Lookbook',
      page: 'lookbook',
      categories,
      galleryItems,
      siteInfo: inMemoryDb.siteInfo
    });
  }
});

// Services page
app.get('/services', async (req, res) => {
  try {
    let services, siteInfo;
    
    if (usingMongoDB) {
      // Only get visible services ordered by displayOrder
      services = await Service.find({ isVisible: { $ne: false } }).sort({ displayOrder: 1 });
      siteInfo = await SiteInfo.findOne();
    } else {
      // Filter visible services and sort by displayOrder for in-memory storage
      services = inMemoryDb.services
        .filter(service => service.isVisible !== false)
        .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
      siteInfo = inMemoryDb.siteInfo;
    }
    
    res.render('services', { 
      title: `${siteInfo?.salonName || 'Your Salon'} - Services`,
      page: 'services',
      services,
      siteInfo: siteInfo || { salonName: 'Your Salon', hours: {} }
    });
  } catch (error) {
    console.error('Error:', error);
    // Fallback to in-memory data
    // Filter visible services for fallback as well
    const services = inMemoryDb.services
      .filter(service => service.isVisible !== false)
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
    
    res.render('services', { 
      title: 'Your Salon - Services',
      page: 'services',
      services,
      siteInfo: inMemoryDb.siteInfo
    });
  }
});

// About page
app.get('/about', async (req, res) => {
  try {
    let team, siteInfo;
    
    if (usingMongoDB) {
      team = await Team.find();
      siteInfo = await SiteInfo.findOne();
    } else {
      team = inMemoryDb.team;
      siteInfo = inMemoryDb.siteInfo;
    }
    
    res.render('about', { 
      title: `${siteInfo?.salonName || 'Your Salon'} - About Us`,
      page: 'about',
      team,
      siteInfo: siteInfo || { salonName: 'Your Salon', hours: {} }
    });
  } catch (error) {
    console.error('Error:', error);
    // Fallback to in-memory data
    res.render('about', { 
      title: 'Your Salon - About Us',
      page: 'about',
      team: inMemoryDb.team,
      siteInfo: inMemoryDb.siteInfo
    });
  }
});

// Contact page
app.get('/contact', async (req, res) => {
  try {
    let siteInfo, services;
    
    if (usingMongoDB) {
      siteInfo = await SiteInfo.findOne();
      // Only get visible services for the dropdown
      services = await Service.find({ isVisible: { $ne: false } }).select('name').sort({ displayOrder: 1 });
    } else {
      siteInfo = inMemoryDb.siteInfo;
      // Filter visible services for in-memory storage
      services = inMemoryDb.services
        .filter(service => service.isVisible !== false)
        .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
        .map(s => ({ name: s.name }));
    }
    
    res.render('contact', { 
      title: `${siteInfo?.salonName || 'Your Salon'} - Contact Us`,
      page: 'contact',
      services,
      siteInfo: siteInfo || { salonName: 'Your Salon', hours: {} },
      success: req.query.success === 'true'
    });
  } catch (error) {
    console.error('Error:', error);
    // Fallback to in-memory data
    // Filter visible services for fallback too
    const services = inMemoryDb.services
      .filter(service => service.isVisible !== false)
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
      .map(s => ({ name: s.name }));
      
    res.render('contact', { 
      title: 'Your Salon - Contact Us',
      page: 'contact',
      services,
      siteInfo: inMemoryDb.siteInfo,
      success: req.query.success === 'true'
    });
  }
});

// Handle booking form submission
app.post('/booking', async (req, res) => {
  try {
    if (usingMongoDB) {
      const booking = new Booking({
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
        service: req.body.service,
        date: req.body.date,
        message: req.body.message,
        status: 'New'
      });
      
      await booking.save();
    } else {
      // Use in-memory storage
      const booking = {
        id: inMemoryDb.bookings.length + 1,
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
        service: req.body.service,
        date: req.body.date,
        message: req.body.message,
        status: 'New',
        createdAt: new Date()
      };
      
      inMemoryDb.bookings.push(booking);
    }
    
    // Send json response for AJAX requests
    if (req.xhr) {
      return res.json({ success: true, message: 'Booking received! We\'ll contact you shortly to confirm.' });
    }
    
    // Redirect with success message for form submissions
    res.redirect('/contact?success=true');
  } catch (error) {
    console.error('Error:', error);
    
    if (req.xhr) {
      return res.status(500).json({ success: false, message: 'An error occurred while processing your booking.' });
    }
    
    res.status(500).send('An error occurred while processing your booking.');
  }
});

// Admin routes
app.get('/admin', (req, res) => {
  // If already authenticated, redirect to dashboard
  if (req.session.isAuthenticated) {
    return res.redirect('/admin/dashboard');
  }
  
  // Return login page
  res.render('admin/login', { 
    title: 'Admin Login',
    layout: 'layouts/admin',
    error: req.query.error === 'true'
  });
});

app.post('/admin', (req, res) => {
  const { username, password } = req.body;
  console.log(`Login attempt: ${username} / ${password}`);
  console.log(`Expected: ${ADMIN_USERNAME} / ${ADMIN_PASSWORD}`);
  
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    req.session.isAuthenticated = true;
    req.session.save(() => {
      console.log('Authentication successful, redirecting to dashboard');
      return res.redirect('/admin/dashboard');
    });
  } else {
    console.log('Authentication failed');
    return res.redirect('/admin?error=true');
  }
});

app.get('/admin/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Error destroying session:', err);
    }
    res.redirect('/admin');
  });
});

app.get('/admin/dashboard', adminAuth, async (req, res) => {
  try {
    let bookings, services, gallery, team, siteInfo;
    
    if (usingMongoDB) {
      bookings = await Booking.find().sort({ createdAt: -1 });
      services = await Service.find();
      gallery = await Gallery.find();
      team = await Team.find();
      siteInfo = await SiteInfo.findOne();
    } else {
      bookings = inMemoryDb.bookings;
      services = inMemoryDb.services;
      gallery = inMemoryDb.galleryImages;
      team = inMemoryDb.team;
      siteInfo = inMemoryDb.siteInfo;
    }
    
    res.render('admin/dashboard', { 
      title: 'Admin Dashboard',
      layout: 'layouts/admin',
      bookings,
      services,
      gallery,
      team,
      siteInfo: siteInfo || { salonName: 'Your Salon', hours: {} }
    });
  } catch (error) {
    console.error('Error:', error);
    res.render('admin/dashboard', { 
      title: 'Admin Dashboard',
      layout: 'layouts/admin',
      bookings: inMemoryDb.bookings,
      services: inMemoryDb.services,
      gallery: inMemoryDb.galleryImages,
      team: inMemoryDb.team,
      siteInfo: inMemoryDb.siteInfo
    });
  }
});

// Bookings management
app.get('/admin/bookings', adminAuth, async (req, res) => {
  try {
    let bookings;
    
    if (usingMongoDB) {
      bookings = await Booking.find().sort({ createdAt: -1 });
    } else {
      bookings = inMemoryDb.bookings;
    }
    
    res.render('admin/bookings', { 
      title: 'Manage Bookings',
      layout: 'layouts/admin',
      bookings
    });
  } catch (error) {
    console.error('Error:', error);
    res.render('admin/bookings', { 
      title: 'Manage Bookings',
      layout: 'layouts/admin',
      bookings: inMemoryDb.bookings
    });
  }
});

// Services management
app.get('/admin/services', adminAuth, async (req, res) => {
  try {
    let services;
    
    if (usingMongoDB) {
      services = await Service.find();
    } else {
      services = inMemoryDb.services;
    }
    
    res.render('admin/services', { 
      title: 'Manage Services',
      layout: 'layouts/admin',
      services
    });
  } catch (error) {
    console.error('Error:', error);
    res.render('admin/services', { 
      title: 'Manage Services',
      layout: 'layouts/admin',
      services: inMemoryDb.services
    });
  }
});

// Gallery management
app.get('/admin/gallery', adminAuth, async (req, res) => {
  try {
    let gallery;
    
    if (usingMongoDB) {
      gallery = await Gallery.find();
    } else {
      gallery = inMemoryDb.galleryImages;
    }
    
    res.render('admin/gallery', { 
      title: 'Manage Gallery',
      layout: 'layouts/admin',
      gallery
    });
  } catch (error) {
    console.error('Error:', error);
    res.render('admin/gallery', { 
      title: 'Manage Gallery',
      layout: 'layouts/admin',
      gallery: inMemoryDb.galleryImages
    });
  }
});

// Team management
app.get('/admin/team', adminAuth, async (req, res) => {
  try {
    let team;
    
    if (usingMongoDB) {
      team = await Team.find();
    } else {
      team = inMemoryDb.team;
    }
    
    res.render('admin/team', { 
      title: 'Manage Team',
      layout: 'layouts/admin',
      team
    });
  } catch (error) {
    console.error('Error:', error);
    res.render('admin/team', { 
      title: 'Manage Team',
      layout: 'layouts/admin',
      team: inMemoryDb.team
    });
  }
});

// Site settings
app.get('/admin/settings', adminAuth, async (req, res) => {
  try {
    let siteInfo;
    
    if (usingMongoDB) {
      siteInfo = await SiteInfo.findOne();
      
      // Create default site info if none exists
      if (!siteInfo) {
        siteInfo = new SiteInfo({
          salonName: 'Your Salon',
          address: '123 Main Street, City, State 12345',
          phone: '(123) 456-7890',
          email: 'info@yoursalon.com',
          hours: {
            monday: '9am - 8pm',
            tuesday: '9am - 8pm',
            wednesday: '9am - 8pm',
            thursday: '9am - 8pm',
            friday: '9am - 8pm',
            saturday: '9am - 6pm',
            sunday: '10am - 5pm'
          }
        });
        await siteInfo.save();
      }
    } else {
      siteInfo = inMemoryDb.siteInfo;
    }
    
    res.render('admin/settings', { 
      title: 'Site Settings',
      layout: 'layouts/admin',
      siteInfo
    });
  } catch (error) {
    console.error('Error:', error);
    res.render('admin/settings', { 
      title: 'Site Settings',
      layout: 'layouts/admin',
      siteInfo: inMemoryDb.siteInfo
    });
  }
});

// API routes for admin CRUD operations with in-memory fallback
app.post('/api/booking/update/:id', adminAuth, async (req, res) => {
  try {
    if (usingMongoDB) {
      const booking = await Booking.findById(req.params.id);
      
      if (booking) {
        booking.status = req.body.status;
        await booking.save();
        return res.json({ success: true });
      }
    } else {
      const bookingId = parseInt(req.params.id);
      const booking = inMemoryDb.bookings.find(b => b.id === bookingId);
      
      if (booking) {
        booking.status = req.body.status;
        return res.json({ success: true });
      }
    }
    
    res.status(404).json({ success: false, message: 'Booking not found' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.post('/api/service/update/:id', adminAuth, async (req, res) => {
  try {
    console.log('Updating service with ID:', req.params.id);
    console.log('Update data size:', JSON.stringify(req.body).length / 1024, 'KB');
    console.log('Update fields:', Object.keys(req.body));
    console.log('Request body:', req.body);

    // Check if payload is too large
    if (JSON.stringify(req.body).length > 10 * 1024 * 1024) { // 10MB limit
      return res.status(413).json({ 
        success: false, 
        message: 'Payload too large. Please reduce the size of images or videos.' 
      });
    }

    if (usingMongoDB) {
      try {
        // Try to find by ID directly
        console.log('Attempting to find service with exact ID:', req.params.id);
        const service = await Service.findById(req.params.id);
        
        if (!service) {
          console.log('Service not found with direct ID. Checking if ID is a string version of ObjectId');
          return res.status(404).json({ success: false, message: 'Service not found' });
        }
        
        console.log('Found service in database:', service._id);
      
      // Process image data if it's a data URL
      if (req.body.image && req.body.image.startsWith('data:image/')) {
        try {
          const imagePath = saveBase64Image(req.body.image);
          if (imagePath) {
            req.body.image = imagePath;
            console.log('Image saved to:', imagePath);
          }
        } catch (imgError) {
          console.error('Error saving image:', imgError);
          // Continue with the original image data
        }
      }
      
      // Only update fields that are specifically provided in the request
      // Use $set to update only the specified fields
      const updateData = {};
      
      if (req.body.name !== undefined) updateData.name = req.body.name;
      if (req.body.price !== undefined) updateData.price = req.body.price;
      if (req.body.description !== undefined) updateData.description = req.body.description;
      if (req.body.category !== undefined) updateData.category = req.body.category;
      if (req.body.image) updateData.image = req.body.image;
      if (req.body.type !== undefined) updateData.type = req.body.type;
      if (req.body.videoUrl !== undefined) updateData.videoUrl = req.body.videoUrl;
      if (req.body.displayOrder !== undefined) updateData.displayOrder = parseInt(req.body.displayOrder);
      if (req.body.isVisible !== undefined) updateData.isVisible = req.body.isVisible;
      if (req.body.showOnHomepage !== undefined) updateData.showOnHomepage = req.body.showOnHomepage;
      
      console.log('Updating service with data:', updateData);
      
      // Use findByIdAndUpdate to update only the specified fields
      const updatedService = await Service.findByIdAndUpdate(
        req.params.id,
        { $set: updateData },
        { new: true, runValidators: false }
      );
      
      if (updatedService) {
        console.log('Service updated successfully:', updatedService._id);
        return res.json({ success: true, service: updatedService });
      } else {
        console.log('Update failed - service not found after update attempt');
        return res.status(404).json({ success: false, message: 'Service not found after update attempt' });
      }
    } catch (error) {
      console.error('MongoDB error:', error.message);
      return res.status(500).json({ success: false, message: 'MongoDB error: ' + error.message });
    }
    } else {
      const serviceId = parseInt(req.params.id);
      const service = inMemoryDb.services.find(s => s.id === serviceId);
      
      if (service) {
        // Process image data if it's a data URL
        if (req.body.image && req.body.image.startsWith('data:image/')) {
          try {
            const imagePath = saveBase64Image(req.body.image);
            if (imagePath) {
              req.body.image = imagePath;
              console.log('Image saved to:', imagePath);
            }
          } catch (imgError) {
            console.error('Error saving image:', imgError);
            // Continue with the original image data
          }
        }
        
        // Update service properties if provided in request
        if (req.body.name !== undefined) service.name = req.body.name;
        if (req.body.price !== undefined) service.price = req.body.price;
        if (req.body.description !== undefined) service.description = req.body.description;
        if (req.body.category !== undefined) service.category = req.body.category;
        if (req.body.image) service.image = req.body.image;
        
        // Update video fields if present
        if (req.body.type !== undefined) service.type = req.body.type;
        if (req.body.videoUrl !== undefined) service.videoUrl = req.body.videoUrl;
        
        // Update visibility and ordering fields
        if (req.body.displayOrder !== undefined) service.displayOrder = parseInt(req.body.displayOrder);
        if (req.body.isVisible !== undefined) service.isVisible = req.body.isVisible;
        if (req.body.showOnHomepage !== undefined) service.showOnHomepage = req.body.showOnHomepage;
        
        return res.json({ success: true, service });
      }
      
      return res.status(404).json({ success: false, message: 'Service not found' });
    }
  } catch (error) {
    console.error('Error updating service:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
});

app.post('/api/service/create', adminAuth, async (req, res) => {
  try {
    console.log('Creating new service');
    console.log('Data size:', JSON.stringify(req.body).length / 1024, 'KB');
    
    // Check if payload is too large
    if (JSON.stringify(req.body).length > 10 * 1024 * 1024) { // 10MB limit
      return res.status(413).json({ 
        success: false, 
        message: 'Payload too large. Please reduce the size of images or videos.' 
      });
    }
    
    // Process image data if it's a data URL
    if (req.body.image && req.body.image.startsWith('data:image/')) {
      try {
        const imagePath = saveBase64Image(req.body.image);
        if (imagePath) {
          req.body.image = imagePath;
          console.log('Image saved to:', imagePath);
        }
      } catch (imgError) {
        console.error('Error saving image:', imgError);
        // Use default image if we can't save the provided one
        req.body.image = '/images/placeholder.jpg';
      }
    }
    
    let newService;
    
    if (usingMongoDB) {
      // Find max displayOrder if not provided
      let displayOrder = 0;
      if (req.body.displayOrder !== undefined) {
        displayOrder = parseInt(req.body.displayOrder);
      } else {
        const lastService = await Service.findOne().sort({ displayOrder: -1 });
        if (lastService) {
          displayOrder = (lastService.displayOrder || 0) + 1;
        }
      }
      
      newService = new Service({
        name: req.body.name,
        price: req.body.price,
        description: req.body.description,
        category: req.body.category,
        image: req.body.image || '/images/placeholder.jpg',
        type: req.body.type || 'image',
        videoUrl: req.body.videoUrl || '',
        displayOrder: displayOrder,
        isVisible: req.body.isVisible !== undefined ? req.body.isVisible : true,
        showOnHomepage: req.body.showOnHomepage !== undefined ? req.body.showOnHomepage : false
      });
      
      console.log('Saving service to MongoDB...');
      await newService.save();
      console.log('Service saved with ID:', newService._id);
    } else {
      // Find max displayOrder if not provided
      let displayOrder = 0;
      if (req.body.displayOrder !== undefined) {
        displayOrder = parseInt(req.body.displayOrder);
      } else {
        const lastService = [...inMemoryDb.services].sort((a, b) => (b.displayOrder || 0) - (a.displayOrder || 0))[0];
        if (lastService) {
          displayOrder = (lastService.displayOrder || 0) + 1;
        }
      }
      
      newService = {
        id: inMemoryDb.services.length + 1,
        name: req.body.name,
        price: req.body.price,
        description: req.body.description,
        category: req.body.category,
        image: req.body.image || '/images/placeholder.jpg',
        type: req.body.type || 'image',
        videoUrl: req.body.videoUrl || '',
        displayOrder: displayOrder,
        isVisible: req.body.isVisible !== undefined ? req.body.isVisible : true,
        showOnHomepage: req.body.showOnHomepage !== undefined ? req.body.showOnHomepage : false
      };
      
      inMemoryDb.services.push(newService);
      console.log('Service saved to in-memory store with ID:', newService.id);
    }
    
    return res.json({ success: true, service: newService });
  } catch (error) {
    console.error('Error creating service:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
});

app.post('/api/service/delete/:id', adminAuth, async (req, res) => {
  try {
    console.log('Deleting service:', req.params.id);
    
    if (usingMongoDB) {
      const result = await Service.findByIdAndDelete(req.params.id);
      
      if (result) {
        console.log('Service deleted successfully from database');
        return res.json({ success: true });
      } else {
        console.log('Service not found in database');
        return res.status(404).json({ success: false, message: 'Service not found' });
      }
    } else {
      const serviceId = parseInt(req.params.id);
      const serviceIndex = inMemoryDb.services.findIndex(s => s.id === serviceId);
      
      if (serviceIndex !== -1) {
        inMemoryDb.services.splice(serviceIndex, 1);
        console.log('Service deleted from in-memory store');
        return res.json({ success: true });
      } else {
        console.log('Service not found in in-memory store');
        return res.status(404).json({ success: false, message: 'Service not found' });
      }
    }
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
});

// Function to save base64 image to the uploads directory
const saveBase64Image = (base64String) => {
  // Check if the string is a data URL
  if (!base64String || !base64String.startsWith('data:image/')) {
    console.log('Invalid base64 string format');
    return null;
  }
  
  try {
    // Extract the base64 data
    const matches = base64String.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      console.log('Could not parse base64 string');
      return null;
    }
    
    const imageType = matches[1];
    const imageData = matches[2];
    const buffer = Buffer.from(imageData, 'base64');
    
    // Create filename
    const fileName = `image-${Date.now()}-${Math.round(Math.random() * 1E9)}.${imageType === 'jpeg' ? 'jpg' : imageType}`;
    const filePath = path.join(UPLOADS_DIR, fileName);
    
    console.log(`Saving base64 image to ${filePath}`);
    
    // Save the file
    fs.writeFileSync(filePath, buffer);
    
    // Return the public URL
    return `/uploads/${fileName}`;
  } catch (error) {
    console.error('Error saving base64 image:', error);
    return null;
  }
};

// Default video thumbnail placeholder URL
const DEFAULT_VIDEO_THUMBNAIL = '/images/placeholder.jpg';

// Ensure we have a video placeholder
try {
  // Check if there are any images we can use as video placeholders
  const imagesDir = path.join(__dirname, 'public', 'images');
  if (fs.existsSync(imagesDir)) {
    const files = fs.readdirSync(imagesDir);
    if (files.length > 0) {
      // Use the first image as a fallback if needed
      const firstImage = files.find(file => file.match(/\.(jpg|jpeg|png|gif)$/i));
      if (firstImage) {
        console.log(`Found image to use as fallback: ${firstImage}`);
      }
    }
  }
} catch (err) {
  console.error('Error checking for fallback images:', err);
}

app.post('/api/gallery/update/:id', adminAuth, async (req, res) => {
  try {
    console.log('Updating gallery item:', req.params.id);
    console.log('Update data:', {
      title: req.body.title,
      category: req.body.category,
      type: req.body.type,
      hasVideoUrl: !!req.body.videoUrl,
      hasImage: !!req.body.image,
      imageIsBase64: req.body.image && req.body.image.startsWith('data:image/'),
      displayOrder: req.body.displayOrder,
      isVisible: req.body.isVisible,
      showOnHomepage: req.body.showOnHomepage
    });
    
    // Prepare update data object
    const updateData = {};
    
    // Only include fields that are provided in the request
    if (req.body.title !== undefined) updateData.title = req.body.title;
    if (req.body.category !== undefined) updateData.category = req.body.category;
    if (req.body.type !== undefined) updateData.type = req.body.type;
    if (req.body.videoUrl !== undefined) updateData.videoUrl = req.body.videoUrl;
    if (req.body.displayOrder !== undefined) updateData.displayOrder = parseInt(req.body.displayOrder);
    if (req.body.isVisible !== undefined) updateData.isVisible = req.body.isVisible;
    if (req.body.showOnHomepage !== undefined) updateData.showOnHomepage = req.body.showOnHomepage;
    
    // Handle image update - check if it's a base64 data URL
    if (req.body.image) {
      if (req.body.image.startsWith('data:image/')) {
        // Save base64 image to file
        const imagePath = saveBase64Image(req.body.image);
        if (imagePath) {
          console.log(`Saved base64 image as ${imagePath}`);
          updateData.image = imagePath;
        } else {
          console.log('Failed to save base64 image');
          if (req.body.type === 'video') {
            updateData.image = DEFAULT_VIDEO_THUMBNAIL;
          }
        }
      } else {
        updateData.image = req.body.image;
      }
    } else if (req.body.type === 'video' && (!updateData.image || updateData.image === '/images/video-placeholder.jpg')) {
      // If it's a video without a thumbnail, use the default placeholder
      updateData.image = DEFAULT_VIDEO_THUMBNAIL;
    }
    
    console.log('Updating gallery with data:', updateData);
    
    // Use findByIdAndUpdate instead of retrieving and saving
    const updatedItem = await Gallery.findByIdAndUpdate(
      req.params.id, 
      { $set: updateData },
      { new: true, runValidators: false }
    );
    
    if (updatedItem) {
      console.log('Gallery item updated:', updatedItem._id);
      return res.json({ success: true, item: updatedItem });
    }
    
    res.status(404).json({ success: false, message: 'Gallery item not found' });
  } catch (error) {
    console.error('Error updating gallery item:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.post('/api/gallery/create', adminAuth, async (req, res) => {
  try {
    console.log('Creating gallery item:', {
      title: req.body.title,
      category: req.body.category,
      type: req.body.type || 'image',
      hasVideoUrl: !!req.body.videoUrl,
      hasImage: !!req.body.image,
      imageIsBase64: req.body.image && req.body.image.startsWith('data:image/')
    });
    
    // Process image if it's a base64 data URL
    let imagePath = req.body.image;
    
    if (!imagePath && req.body.type === 'video' && req.body.videoUrl) {
      // For videos without thumbnails, use a default placeholder
      imagePath = DEFAULT_VIDEO_THUMBNAIL;
    } else if (!imagePath) {
      // For other items without images, use a general placeholder
      imagePath = '/images/placeholder.jpg';
    } else if (imagePath.startsWith('data:image/')) {
      // Convert base64 data URL to a file
      const savedImagePath = saveBase64Image(imagePath);
      if (savedImagePath) {
        console.log(`Saved base64 image as ${savedImagePath}`);
        imagePath = savedImagePath;
      } else {
        console.log('Failed to save base64 image, using default placeholder');
        imagePath = req.body.type === 'video' ? DEFAULT_VIDEO_THUMBNAIL : '/images/placeholder.jpg';
      }
    }
    
    const newItem = new Gallery({
      title: req.body.title,
      category: req.body.category,
      image: imagePath,
      type: req.body.type || 'image',
      videoUrl: req.body.videoUrl || ''
    });
    
    await newItem.save();
    console.log('Gallery item created:', newItem._id);
    return res.json({ success: true, item: newItem });
  } catch (error) {
    console.error('Error creating gallery item:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.post('/api/gallery/delete/:id', adminAuth, async (req, res) => {
  try {
    const result = await Gallery.findByIdAndDelete(req.params.id);
    
    if (result) {
      console.log('Gallery item deleted:', req.params.id);
      return res.json({ success: true });
    }
    
    res.status(404).json({ success: false, message: 'Gallery item not found' });
  } catch (error) {
    console.error('Error deleting gallery item:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.post('/api/team/update/:id', adminAuth, async (req, res) => {
  try {
    const member = await Team.findById(req.params.id);
    
    if (member) {
      member.name = req.body.name;
      member.title = req.body.title;
      member.bio = req.body.bio;
      if (req.body.image) {
        member.image = req.body.image;
      }
      
      await member.save();
      return res.json({ success: true });
    }
    
    res.status(404).json({ success: false, message: 'Team member not found' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.post('/api/team/create', adminAuth, async (req, res) => {
  try {
    const newMember = new Team({
      name: req.body.name,
      title: req.body.title,
      bio: req.body.bio,
      image: req.body.image || '/images/placeholder.jpg'
    });
    
    await newMember.save();
    return res.json({ success: true, member: newMember });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.post('/api/team/delete/:id', adminAuth, async (req, res) => {
  try {
    const result = await Team.findByIdAndDelete(req.params.id);
    
    if (result) {
      return res.json({ success: true });
    }
    
    res.status(404).json({ success: false, message: 'Team member not found' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.post('/api/settings/update', adminAuth, async (req, res) => {
  try {
    console.log('Received settings update request with featured services:', 
      req.body.featuredServices ? Array.isArray(req.body.featuredServices) 
        ? req.body.featuredServices.length 
        : 'single value' 
      : 'none');
    
    // Handle admin credentials update
    if (req.body.adminUsername || req.body.adminPassword) {
      if (req.body.adminPassword && req.body.adminPassword !== req.body.adminConfirmPassword) {
        return res.status(400).json({ 
          success: false, 
          message: 'Password and confirmation do not match' 
        });
      }
      
      // In a real application, these would be saved to a database
      // For this demo, we're updating the in-memory variables
      if (req.body.adminUsername) {
        ADMIN_USERNAME = req.body.adminUsername;
      }
      
      if (req.body.adminPassword) {
        ADMIN_PASSWORD = req.body.adminPassword;
      }
      
      console.log('Admin credentials updated:', ADMIN_USERNAME);
    }
    
    let siteInfo = await SiteInfo.findOne();
    console.log('Existing site info found:', siteInfo ? 'Yes' : 'No');
    
    // Create site info if it doesn't exist
    if (!siteInfo) {
      console.log('Creating new site info object');
      siteInfo = new SiteInfo();
    }
    
    siteInfo.salonName = req.body.salonName;
    siteInfo.address = req.body.address;
    siteInfo.phone = req.body.phone;
    siteInfo.email = req.body.email;
    
    // Update logo if provided
    if (req.body.logo) siteInfo.logo = req.body.logo;
    
    // Update social media links if provided
    if (req.body.socialMedia) {
      siteInfo.socialMedia = {
        facebook: req.body.socialMedia.facebook || '',
        instagram: req.body.socialMedia.instagram || '',
        twitter: req.body.socialMedia.twitter || '',
        pinterest: req.body.socialMedia.pinterest || '',
        youtube: req.body.socialMedia.youtube || ''
      };
    }
    
    // Update featured services if provided
    if (req.body.featuredServices) {
      // Always convert to array
      const featuredServices = Array.isArray(req.body.featuredServices) 
        ? req.body.featuredServices 
        : [req.body.featuredServices];
      
      // Log the featured services being saved
      console.log('Setting featured services:', featuredServices);
      
      siteInfo.featuredServices = featuredServices;
    } else {
      // If featuredServices is explicitly empty, clear the array
      console.log('Clearing featured services (none selected)');
      siteInfo.featuredServices = [];
    }
    
    // Update homepage content if provided
    if (req.body.heroTitle) siteInfo.heroTitle = req.body.heroTitle;
    if (req.body.heroSubtitle) siteInfo.heroSubtitle = req.body.heroSubtitle;
    if (req.body.aboutText) siteInfo.aboutText = req.body.aboutText;
    if (req.body.homeVideo) siteInfo.homeVideo = req.body.homeVideo;
    
    // Update hours if provided
    if (req.body.hours) {
      Object.keys(req.body.hours).forEach(day => {
        siteInfo.hours[day] = req.body.hours[day];
      });
    }
    
    console.log('Saving site info to database...');
    const savedInfo = await siteInfo.save();
    console.log('Site info saved successfully:', savedInfo._id ? 'Yes' : 'No');
    
    // Also update the in-memory data if we're using it as fallback
    if (!usingMongoDB && inMemoryDb.siteInfo) {
      inMemoryDb.siteInfo.salonName = req.body.salonName;
      inMemoryDb.siteInfo.address = req.body.address;
      inMemoryDb.siteInfo.phone = req.body.phone;
      inMemoryDb.siteInfo.email = req.body.email;
      
      // Update logo if provided
      if (req.body.logo) inMemoryDb.siteInfo.logo = req.body.logo;
      
      // Update social media links if provided
      if (req.body.socialMedia) {
        inMemoryDb.siteInfo.socialMedia = {
          facebook: req.body.socialMedia.facebook || '',
          instagram: req.body.socialMedia.instagram || '',
          twitter: req.body.socialMedia.twitter || '',
          pinterest: req.body.socialMedia.pinterest || '',
          youtube: req.body.socialMedia.youtube || ''
        };
      }
      
      // Update featured services if provided - handle properly in in-memory DB
      if (req.body.featuredServices) {
        // Always convert to array and ensure they're integers (for in-memory storage)
        const featuredServices = Array.isArray(req.body.featuredServices) 
          ? req.body.featuredServices.map(id => Number(id)) 
          : [Number(req.body.featuredServices)];
        
        inMemoryDb.siteInfo.featuredServices = featuredServices;
      } else {
        // If featuredServices is explicitly empty, clear the array
        inMemoryDb.siteInfo.featuredServices = [];
      }
      
      // Update homepage content if provided
      if (req.body.heroTitle) inMemoryDb.siteInfo.heroTitle = req.body.heroTitle;
      if (req.body.heroSubtitle) inMemoryDb.siteInfo.heroSubtitle = req.body.heroSubtitle;
      if (req.body.aboutText) inMemoryDb.siteInfo.aboutText = req.body.aboutText;
      if (req.body.homeVideo) inMemoryDb.siteInfo.homeVideo = req.body.homeVideo;
      
      // Update hours if provided
      if (req.body.hours) {
        Object.keys(req.body.hours).forEach(day => {
          inMemoryDb.siteInfo.hours[day] = req.body.hours[day];
        });
      }
    }
    
    return res.json({ success: true });
  } catch (error) {
    console.error('Error saving settings:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
});

// Image and video upload route
app.post('/api/upload', adminAuth, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    
    // Determine the public path based on file type
    let filePath;
    if (req.file.mimetype.startsWith('video/')) {
      filePath = '/videos/' + req.file.filename;
    } else {
      filePath = '/uploads/' + req.file.filename;
    }
    
    return res.json({
      success: true,
      filePath: filePath,
      fileType: req.file.mimetype.startsWith('video/') ? 'video' : 'image'
    });
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ success: false, message: 'File upload failed' });
  }
});

// API route to list services for featured services selection
app.get('/api/services/list', adminAuth, async (req, res) => {
  try {
    let services;
    
    if (usingMongoDB) {
      services = await Service.find().select('name image type');
    } else {
      services = inMemoryDb.services.map(service => ({
        id: service.id,
        name: service.name,
        image: service.image,
        type: service.type || 'image'
      }));
    }
    
    return res.json({ success: true, services });
  } catch (error) {
    console.error('Error listing services:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Connect to MongoDB and start server
const startServer = async () => {
  try {
    // Try to connect to MongoDB
    usingMongoDB = await connectDB();
    console.log('MongoDB Connection Status:', usingMongoDB ? 'Connected' : 'Failed to connect');
    
    if (usingMongoDB) {
      // Initialize database with default data if needed
      await initializeDatabase();
      
      // Log the existing data in the database
      const serviceCount = await Service.countDocuments();
      const bookingCount = await Booking.countDocuments();
      const galleryCount = await Gallery.countDocuments();
      const teamCount = await Team.countDocuments();
      const siteInfo = await SiteInfo.findOne();
      
      console.log('Database Collections:');
      console.log('- Services:', serviceCount);
      console.log('- Bookings:', bookingCount);
      console.log('- Gallery Items:', galleryCount);
      console.log('- Team Members:', teamCount);
      console.log('- Site Info:', siteInfo ? 'Exists' : 'Not created yet');
    } else {
      console.log('Using in-memory data store as fallback');
    }
    
    // Try to start server, attempt different ports if default is in use
    const startServerOnPort = (port) => {
      // Ensure port is a number and within valid range
      let numericPort = parseInt(port, 10);
      if (isNaN(numericPort) || numericPort < 1024) {
        console.error(`Invalid port: ${port}. Using default port 3000.`);
        numericPort = 3000;
      }
      
      // Ensure port doesn't exceed maximum value
      if (numericPort > 65535) {
        console.error(`Port ${numericPort} exceeds maximum value. Using port 3001.`);
        numericPort = 3001;
      }
      
      const server = app.listen(numericPort)
        .on('listening', () => {
          console.log(`Salon website running on http://localhost:${numericPort}`);
          console.log(`Using ${usingMongoDB ? 'MongoDB' : 'in-memory data store'}`);
        })
        .on('error', (err) => {
          if (err.code === 'EADDRINUSE') {
            // Increment by a small amount to avoid going out of range
            const nextPort = numericPort + 1;
            console.log(`Port ${numericPort} is busy, trying port ${nextPort}`);
            server.close();
            startServerOnPort(nextPort);
          } else {
            console.error('Server error:', err);
            process.exit(1);
          }
        });
    };
    
    startServerOnPort(port);
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer(); 