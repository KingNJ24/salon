/**
 * File upload utility
 */
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create upload directories if they don't exist
const UPLOADS_DIR = path.join(__dirname, '..', 'public', 'uploads');
const VIDEOS_DIR = path.join(__dirname, '..', 'public', 'videos');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

if (!fs.existsSync(VIDEOS_DIR)) {
  fs.mkdirSync(VIDEOS_DIR, { recursive: true });
}

// Function to determine file type and appropriate directory
const getUploadPath = (file) => {
  // Check if it's a video file
  if (file.mimetype.startsWith('video/')) {
    return VIDEOS_DIR;
  }
  // Default to images/uploads directory
  return UPLOADS_DIR;
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, getUploadPath(file));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    
    // Prefix based on file type
    const prefix = file.mimetype.startsWith('video/') ? 'video-' : 'image-';
    cb(null, prefix + uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB to accommodate larger videos
  fileFilter: function (req, file, cb) {
    // Accept images and videos
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif|mp4|webm|mov|avi|wmv)$/i)) {
      return cb(new Error('Only image and video files are allowed!'), false);
    }
    cb(null, true);
  }
});

// Function to save base64 image
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