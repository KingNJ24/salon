// API upload handler for Vercel serverless
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
  console.log('===== SERVERLESS API UPLOAD ENDPOINT CALLED =====');
  console.log('Request method:', req.method);
  console.log('Request headers:', JSON.stringify(req.headers));
  console.log('Request body type:', typeof req.body);
  console.log('Request body has file:', req.body && !!req.body.file);
  
  // Check if method is POST
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }
  
  // Check authentication
  const authResult = basicAuth(req, res);
  if (!authResult.authenticated) {
    console.log('Authentication failed in serverless function');
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  
  try {
    // Verify Cloudinary config
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.error('Cloudinary configuration missing in serverless function');
      return res.status(500).json({
        success: false,
        message: 'Cloudinary configuration missing. Please check environment variables.'
      });
    }
    
    // Handle file upload from JSON body
    if (req.body && req.body.file) {
      try {
        // Log for debugging
        console.log('Processing file upload from JSON body in serverless function');
        
        // Validate file format based on the provided info
        const fileDataParts = req.body.file.split(';base64,');
        
        if (fileDataParts.length !== 2) {
          return res.status(400).json({
            success: false,
            message: 'Invalid file format. Expected base64 encoded data.'
          });
        }
        
        const fileType = fileDataParts[0];
        // Check if it's an allowed file type
        const allowedImageTypes = ['data:image/jpeg', 'data:image/jpg', 'data:image/png', 'data:image/gif', 'data:image/webp'];
        const allowedVideoTypes = ['data:video/mp4', 'data:video/webm', 'data:video/quicktime'];
        
        if (!allowedImageTypes.includes(fileType) && !allowedVideoTypes.includes(fileType)) {
          console.log('Invalid file type detected in serverless function:', fileType);
          return res.status(400).json({
            success: false,
            message: 'Only image and video files are allowed!'
          });
        }
        
        // Determine the resource type
        const isVideo = allowedVideoTypes.includes(fileType);
        console.log('File type detected:', isVideo ? 'video' : 'image');
        
        // Direct file upload to Cloudinary with explicit resource type
        const result = await cloudinary.uploader.upload(req.body.file, {
          folder: 'salon',
          resource_type: isVideo ? 'video' : 'auto',
          allowed_formats: isVideo ? ['mp4', 'mov', 'webm'] : ['jpg', 'jpeg', 'png', 'gif', 'webp']
        });
        
        console.log('Upload success in serverless function:', { 
          public_id: result.public_id,
          url: result.secure_url,
          resource_type: result.resource_type
        });
        
        return res.status(200).json({
          success: true,
          filePath: result.secure_url,
          fileType: result.resource_type,
          originalName: req.body.fileName || result.original_filename || 'uploaded-file',
          size: result.bytes,
          url: result.secure_url
        });
      } catch (error) {
        console.error('Cloudinary upload error in serverless function:', error);
        return res.status(500).json({
          success: false,
          message: 'Error uploading to Cloudinary: ' + error.message
        });
      }
    } else {
      console.error('No file data found in request body in serverless function');
      return res.status(400).json({
        success: false,
        message: 'No file data found in request. Send file as base64 in the "file" field of the JSON body.'
      });
    }
  } catch (error) {
    console.error('Unexpected error in upload handler serverless function:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
}; 