/**
 * Global error handler
 */

// 404 Not Found handler
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// Error handler
const errorHandler = (err, req, res, next) => {
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
      layout: 'layouts/main'
    });
  }
  
  res.render('error', { 
    title: 'Error',
    statusCode,
    message: err.message,
    layout: 'layouts/main'
  });
};

module.exports = { notFound, errorHandler }; 