// API upload handler for Vercel serverless
require('dotenv').config();
const { cloudinary } = require('../utils/cloudinary');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Basic auth middleware
const basicAuth = (req, res) => {
  // Get credentials from request headers
  const authHeader = req.headers.authorization || '';
  const match = authHeader.match(/Basic (.+)/);
  
  if (!match) {
    return { authenticated: false };
  }
  
  const credentials = Buffer.from(match[1], 'base64').toString();
  const [username, password] = credentials.split(':');
  
  // Check against environment variables
  const adminUsername = process.env.ADMIN_USERNAME;
  const adminPassword = process.env.ADMIN_PASSWORD;
  
  if (username === adminUsername && password === adminPassword) {
    return { authenticated: true };
  }
  
  return { authenticated: false };
};

// Configure storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'salon',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'mov', 'webm'],
    resource_type: (req, file) => {
      if (file.mimetype.startsWith('video/')) return 'video';
      return 'image';
    }
  }
});

// Handler for Vercel API route
module.exports = async (req, res) => {
  // Check if method is POST
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }
  
  // Check authentication
  const authResult = basicAuth(req, res);
  if (!authResult.authenticated) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  
  try {
    // Verify Cloudinary config
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.error('Cloudinary configuration missing');
      return res.status(500).json({
        success: false,
        message: 'Cloudinary configuration missing. Please check environment variables.'
      });
    }
    
    // We need to manually parse multipart form data for Vercel serverless
    if (!req.file && req.body && req.body.file) {
      // Direct file upload to Cloudinary
      try {
        const result = await cloudinary.uploader.upload(req.body.file, {
          folder: 'salon',
          resource_type: 'auto'
        });
        
        return res.status(200).json({
          success: true,
          filePath: result.secure_url,
          fileType: result.resource_type,
          originalName: result.original_filename,
          size: result.bytes,
          url: result.secure_url
        });
      } catch (error) {
        console.error('Cloudinary upload error:', error);
        return res.status(500).json({
          success: false,
          message: 'Error uploading to Cloudinary: ' + error.message
        });
      }
    } else {
      // Let Multer handle the upload (custom implementation for serverless)
      // This requires more setup than a simple API handler can provide
      return res.status(400).json({
        success: false,
        message: 'Direct file upload not yet implemented for serverless functions. Use the base64 upload method.'
      });
    }
  } catch (error) {
    console.error('Unexpected error in upload handler:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
}; 