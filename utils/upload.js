/**
 * File upload utility
 */
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create upload directories if they don't exist
const UPLOADS_DIR = path.join(__dirname, '..', 'public', 'uploads');
const VIDEOS_DIR = path.join(__dirname, '..', 'public', 'videos');

// Ensure directories exist with better error handling
try {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    console.log('Created uploads directory:', UPLOADS_DIR);
  }

  if (!fs.existsSync(VIDEOS_DIR)) {
    fs.mkdirSync(VIDEOS_DIR, { recursive: true });
    console.log('Created videos directory:', VIDEOS_DIR);
  }
} catch (error) {
  console.error('Error creating upload directories:', error);
  // Continue execution - the directories might already exist or be created on demand
}

// Function to determine file type and appropriate directory
const getUploadPath = (file) => {
  try {
    // Check if it's a video file
    if (file.mimetype.startsWith('video/')) {
      // Ensure video directory exists
      if (!fs.existsSync(VIDEOS_DIR)) {
        fs.mkdirSync(VIDEOS_DIR, { recursive: true });
      }
      return VIDEOS_DIR;
    }
    
    // Ensure uploads directory exists
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }
    
    // Default to images/uploads directory
    return UPLOADS_DIR;
  } catch (error) {
    console.error('Error in getUploadPath:', error);
    // Default to uploads as fallback
    return UPLOADS_DIR;
  }
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    try {
      const uploadPath = getUploadPath(file);
      cb(null, uploadPath);
    } catch (error) {
      console.error('Error setting upload destination:', error);
      cb(error);
    }
  },
  filename: function (req, file, cb) {
    try {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      
      // Prefix based on file type
      const prefix = file.mimetype.startsWith('video/') ? 'video-' : 'image-';
      cb(null, prefix + uniqueSuffix + ext);
    } catch (error) {
      console.error('Error setting filename:', error);
      cb(error);
    }
  }
});

const upload = multer({ 
  storage: storage,
  limits: { 
    fileSize: 50 * 1024 * 1024, // 50MB limit for better compatibility
    files: 1 // Only allow one file at a time
  },
  fileFilter: function (req, file, cb) {
    try {
      // Accept images and common video formats
      const allowedTypes = /\.(jpg|jpeg|png|gif|mp4|webm|mov)$/i;
      const isAccepted = allowedTypes.test(path.extname(file.originalname));
      
      if (!isAccepted) {
        const error = new Error('Only image (JPG, PNG, GIF) and video (MP4, WebM, MOV) files are allowed!');
        error.code = 'INVALID_FILE_TYPE';
        return cb(error, false);
      }
      
      // File type is ok
      cb(null, true);
    } catch (error) {
      console.error('Error in file filter:', error);
      cb(error);
    }
  }
});

// Function to save base64 image with improved error handling
const saveBase64Image = (base64String) => {
  try {
    // Check if it's a valid base64 image
    if (!base64String || !base64String.startsWith('data:image/')) {
      console.error('Invalid base64 string provided');
      return null;
    }
    
    // Extract the MIME type and data
    const matches = base64String.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    
    if (!matches || matches.length !== 3) {
      console.error('Invalid base64 format');
      return null;
    }
    
    const type = matches[1];
    const data = Buffer.from(matches[2], 'base64');
    
    // Determine file extension
    let extension = 'jpg'; // default
    if (type === 'image/png') extension = 'png';
    if (type === 'image/gif') extension = 'gif';
    
    // Create file
    const filename = `image-${Date.now()}-${Math.round(Math.random() * 1E9)}.${extension}`;
    const filepath = path.join(UPLOADS_DIR, filename);
    
    // Ensure directory exists
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }
    
    // Write file
    fs.writeFileSync(filepath, data);
    
    // Return web-accessible path
    return `/uploads/${filename}`;
  } catch (error) {
    console.error('Error saving base64 image:', error);
    return null;
  }
};

module.exports = {
  upload,
  saveBase64Image,
  getUploadPath
}; 