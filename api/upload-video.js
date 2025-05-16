// API handler for video uploads on Vercel
require('dotenv').config();
const { cloudinary } = require('../utils/cloudinary');

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

// Handler for Vercel API route
module.exports = async (req, res) => {
  // Log the request for debugging
  console.log('VIDEO UPLOAD REQUEST RECEIVED:', { 
    method: req.method,
    headers: req.headers,
    bodyType: typeof req.body
  });
  
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
    
    // Handle file upload from JSON body
    if (req.body && req.body.file) {
      try {
        // Log for debugging
        console.log('Processing video upload from JSON body');
        
        // Validate file format based on the provided info
        const fileDataParts = req.body.file.split(';base64,');
        
        if (fileDataParts.length !== 2) {
          return res.status(400).json({
            success: false,
            message: 'Invalid file format. Expected base64 encoded data.'
          });
        }
        
        const fileType = fileDataParts[0];
        // Check if it's an allowed video type
        const allowedVideoTypes = ['data:video/mp4', 'data:video/webm', 'data:video/quicktime'];
        
        if (!allowedVideoTypes.includes(fileType)) {
          return res.status(400).json({
            success: false,
            message: 'Only video files (MP4, WebM, MOV) are allowed for this endpoint!'
          });
        }
        
        // Direct file upload to Cloudinary with explicit video type
        const result = await cloudinary.uploader.upload(req.body.file, {
          folder: 'salon/videos',
          resource_type: 'video'
        });
        
        console.log('Video upload success:', { 
          public_id: result.public_id,
          url: result.secure_url,
          resource_type: result.resource_type
        });
        
        return res.status(200).json({
          success: true,
          filePath: result.secure_url,
          fileType: 'video',
          originalName: req.body.fileName || result.original_filename || 'uploaded-video',
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
      console.error('No file data found in request body');
      return res.status(400).json({
        success: false,
        message: 'No file data found in request. Send file as base64 in the "file" field of the JSON body.'
      });
    }
  } catch (error) {
    console.error('Unexpected error in video upload handler:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
}; 