/**
 * Authentication middleware
 */

// Admin authentication middleware
const adminAuth = (req, res, next) => {
  // Check if authenticated via session
  if (req.session.isAuthenticated) {
    return next();
  }
  
  // For GET requests, allow access to login page
  if (req.method === 'GET' && req.path === '/admin') {
    return next();
  }
  
  // Redirect to login if not authenticated
  return res.redirect('/admin');
};

module.exports = { adminAuth }; 