/**
 * Cloudinary integration for file uploads on Vercel
 */
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const path = require('path');

// Check if Cloudinary is properly configured
const isCloudinaryConfigured = () => {
  const requiredVars = [
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET'
  ];
  
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    console.error(`Cloudinary configuration error: Missing ${missing.join(', ')}`);
    return false;
  }
  
  return true;
};

// Initialize Cloudinary with error handling
try {
  console.log('Configuring Cloudinary...');
  
  if (!isCloudinaryConfigured()) {
    throw new Error('Cloudinary is not properly configured. Check environment variables.');
  }
  
  // Configure cloudinary
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
  
  console.log('✅ Cloudinary configured successfully for:', process.env.CLOUDINARY_CLOUD_NAME);
} catch (error) {
  console.error('Failed to configure Cloudinary:', error);
  // Don't throw here, as it would crash the app - we'll handle errors when uploads are attempted
}

// Configure storage engine
let cloudinaryStorage;
let cloudinaryUpload;

try {
  cloudinaryStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'salon',
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'mov', 'webm'],
      resource_type: 'auto',
    },
  });
  
  // Create multer upload middleware
  cloudinaryUpload = multer({
    storage: cloudinaryStorage,
    limits: {
      fileSize: 50 * 1024 * 1024, // 50MB
    },
    fileFilter: (req, file, cb) => {
      // Allow images and videos
      if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
        cb(null, true);
      } else {
        cb({
          code: 'INVALID_FILE_TYPE',
          message: 'Only image and video files are allowed!'
        }, false);
      }
    }
  });
  
  console.log('✅ Cloudinary storage engine configured successfully');
} catch (error) {
  console.error('Failed to configure Cloudinary storage engine:', error);
  
  // Create fallback upload middleware that will return appropriate errors
  cloudinaryUpload = multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
      cb(new Error('Cloudinary storage is not configured properly. Check server logs.'), false);
    }
  });
}

// Simple helper to test Cloudinary connection
const testCloudinaryConnection = async () => {
  try {
    if (!isCloudinaryConfigured()) {
      return { success: false, message: 'Cloudinary not configured' };
    }
    
    // Ping Cloudinary to check connection
    const result = await cloudinary.api.ping();
    return { success: true, result };
  } catch (error) {
    console.error('Failed to connect to Cloudinary:', error);
    return { success: false, error: error.message };
  }
};

// Function to determine if we're in a Vercel production environment
const isVercelProduction = () => {
  return process.env.VERCEL === '1' && process.env.NODE_ENV === 'production';
};

// Function to upload base64 image to Cloudinary
const uploadBase64ToCloudinary = async (base64String) => {
  try {
    if (!base64String || !base64String.startsWith('data:image/')) {
      console.error('Invalid base64 string');
      return null;
    }

    const result = await cloudinary.uploader.upload(base64String, {
      folder: 'salon',
      resource_type: 'image'
    });

    return result.secure_url;
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    return null;
  }
};

module.exports = {
  cloudinary,
  cloudinaryUpload,
  isVercelProduction,
  uploadBase64ToCloudinary,
  testCloudinaryConnection
}; 