require('dotenv').config();
const express = require('express');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./config/errorHandler');

// Import routes
const mainRoutes = require('./routes/main');
const adminRoutes = require('./routes/admin');
const apiRoutes = require('./routes/api');

// Create Express app
const app = express();

// Add a root-level diagnostic endpoint
app.get('/vercel-test', (req, res) => {
  res.json({
    success: true,
    message: 'Root level test endpoint working',
    timestamp: new Date().toISOString(),
    headers: req.headers,
    path: req.path,
    originalUrl: req.originalUrl,
    method: req.method
  });
});

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
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/salon',
    collectionName: 'sessions',
    ttl: 60 * 60 * 24, // 1 day
    autoRemove: 'native'
  }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 // 1 day
  }
}));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Body parser middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// Make user session available to views
app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isAuthenticated || false;
  next();
});

// Connect to MongoDB when app starts
connectDB().then(connected => {
  console.log(`MongoDB ${connected ? 'connected' : 'not connected, using fallback data'}`);
}).catch(err => {
  console.error('MongoDB connection error:', err);
});

// Add direct test API endpoint
app.get('/api/server-test', (req, res) => {
  res.json({
    success: true,
    message: 'Server-side API endpoint working',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    vercel: process.env.VERCEL || 'not-vercel'
  });
});

// Route handlers
app.use('/', mainRoutes);
app.use('/admin', adminRoutes);
app.use('/api', apiRoutes);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Start server only if not running in serverless environment (Vercel)
if (process.env.NODE_ENV !== 'production') {
  const startServer = async () => {
    try {
      // Get port from environment or default to 3000
      const port = process.env.PORT || 3000;
      
      // Start the server
      const server = app.listen(port, () => {
        console.log(`Server running on port ${port}`);
      });
      
      // Handle server errors
      server.on('error', (error) => {
        if (error.code === 'EADDRINUSE') {
          console.log(`Port ${port} is already in use, trying ${port + 1}`);
          setTimeout(() => {
            server.close();
            // Try the next port
            app.listen(port + 1, () => {
              console.log(`Server running on port ${port + 1}`);
            });
          }, 1000);
        } else {
          console.error('Server error:', error);
        }
      });
    } catch (error) {
      console.error('Failed to start server:', error);
      process.exit(1);
    }
  };

  // Run the server locally
  startServer();
}

// Export app for serverless environment
module.exports = app; 