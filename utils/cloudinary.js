/**
 * Cloudinary integration for file uploads on Vercel
 */
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const path = require('path');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

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

// Configure multer upload
const cloudinaryUpload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
    files: 1
  },
  fileFilter: function(req, file, cb) {
    try {
      const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif'];
      const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
      const allowedTypes = [...allowedImageTypes, ...allowedVideoTypes];
      
      if (!allowedTypes.includes(file.mimetype)) {
        const error = new Error('Only image (JPG, PNG, GIF) and video (MP4, WebM, MOV) files are allowed!');
        error.code = 'INVALID_FILE_TYPE';
        return cb(error, false);
      }
      
      cb(null, true);
    } catch (error) {
      console.error('Error in file filter:', error);
      cb(error);
    }
  }
});

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
  uploadBase64ToCloudinary
}; 