/**
 * Global error handler
 */

const { SiteInfo } = require('../models');

// 404 Not Found handler
const notFound = (req, res, next) => {
  // Ignore Chrome DevTools requests
  if (req.path === '/.well-known/appspecific/com.chrome.devtools.json') {
    return res.status(200).json({});
  }
  
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// Error handler
const errorHandler = async (err, req, res, next) => {
  // Default to 500 - Internal Server Error if status code is not already set
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  
  // Set status code
  res.status(statusCode);
  
  // Log error
  console.error('Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack,
    path: req.path,
    method: req.method
  });
  
  // Get site info for layout
  let siteInfo;
  try {
    siteInfo = await SiteInfo.findOne();
  } catch (e) {
    console.error('Error fetching siteInfo for error page:', e);
    siteInfo = {};
  }
  
  // If it's an API request
  if (req.path.startsWith('/api/')) {
    return res.json({
      success: false,
      message: err.message,
      stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
    });
  }
  
  // Otherwise render error page
  if (statusCode === 404) {
    return res.render('error', { 
      title: '404 Not Found',
      statusCode,
      message: 'Page not found',
      layout: 'layouts/main',
      page: 'error',
      siteInfo
    });
  }
  
  res.render('error', { 
    title: 'Error',
    statusCode,
    message: err.message,
    layout: 'layouts/main',
    page: 'error',
    siteInfo
  });
};

module.exports = { notFound, errorHandler }; 