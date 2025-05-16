// API endpoint to provide upload credentials for client authentication
require('dotenv').config();

module.exports = async (req, res) => {
  try {
    // Check if the request is coming from an admin session
    const isAdmin = req.headers.cookie && req.headers.cookie.includes('isAdmin=true');
    
    if (isAdmin) {
      // Only provide credentials to logged-in admin users
      return res.status(200).json({
        success: true,
        credentials: {
          username: process.env.ADMIN_USERNAME,
          password: process.env.ADMIN_PASSWORD
        }
      });
    } else {
      // Don't provide credentials to non-admin users
      return res.status(200).json({
        success: false,
        message: 'Authentication required'
      });
    }
  } catch (error) {
    console.error('Error in get-upload-auth:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
}; 