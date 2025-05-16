/**
 * Authentication middleware
 */

// Admin authentication middleware
const adminAuth = (req, res, next) => {
  // Check if authenticated via session
  if (req.session.isAuthenticated) {
    return next();
  }
  
  // For GET requests, redirect to login page
  return res.redirect('/admin');
};

module.exports = { adminAuth }; 