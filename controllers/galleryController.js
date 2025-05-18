/**
 * Gallery controller
 */
const { Gallery } = require('../models');
const { saveBase64Image } = require('../utils/upload');
const mongoose = require('mongoose');

// Get all gallery items
const getAllItems = async (req, res, next) => {
  try {
    const gallery = await Gallery.find().sort({ displayOrder: 1 });
    return res.json({ success: true, gallery });
  } catch (error) {
    return next(error);
  }
};

// Get visible gallery items
const getVisibleItems = async (req, res, next) => {
  try {
    const gallery = await Gallery.find({ isVisible: { $ne: false } })
      .sort({ displayOrder: 1 });
    return res.json({ success: true, gallery });
  } catch (error) {
    return next(error);
  }
};

// Get gallery item by ID
const getItemById = async (req, res, next) => {
  try {
    const item = await Gallery.findById(req.params.id);
    
    if (!item) {
      return res.status(404).json({ success: false, message: 'Gallery item not found' });
    }
    
    return res.json({ success: true, item });
  } catch (error) {
    return next(error);
  }
};

// Create new gallery item
const createItem = async (req, res, next) => {
  try {
    console.log('Creating gallery item with data:', req.body);
    
    // Fix videoUrl path if needed (remove leading slashes)
    if (req.body.videoUrl && req.body.videoUrl.startsWith('//')) {
      req.body.videoUrl = 'https:' + req.body.videoUrl;
    }
    
    // Process base64 image if present (including video thumbnails)
    if (req.body.image && req.body.image.startsWith('data:image/')) {
      const savedImagePath = saveBase64Image(req.body.image);
      if (!savedImagePath) {
        console.error('Failed to save base64 image');
        return res.status(500).json({ success: false, message: 'Failed to save image' });
      }
      req.body.image = savedImagePath;
    }
    // For video items, ensure thumbnail exists
    else if (req.body.type === 'video') {
      // If no image provided or it's the same as videoUrl, use placeholder
      if (!req.body.image || req.body.image === '' || req.body.image === req.body.videoUrl) {
        console.log('Using placeholder for video item with no thumbnail');
        req.body.image = '/images/video-placeholder.jpg';
      }
    }
    // For regular items, check if image is provided
    else if (!req.body.image || req.body.image === '') {
      console.error('No image provided in request body');
      return res.status(400).json({ success: false, message: 'Image is required' });
    }
    
    // Ensure required fields
    if (!req.body.title) {
      console.error('No title provided in request body');
      return res.status(400).json({ success: false, message: 'Title is required' });
    }
    
    if (!req.body.category) {
      req.body.category = 'Uncategorized';
    }
    
    const newItem = new Gallery(req.body);
    await newItem.save();
    console.log('Gallery item created successfully:', newItem);
    return res.json({ success: true, item: newItem });
  } catch (error) {
    console.error('Error creating gallery item:', error);
    return next(error);
  }
};

// Update gallery item
const updateItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid ID format' });
    }
    
    // Fix videoUrl path if needed (remove leading slashes)
    if (req.body.videoUrl && req.body.videoUrl.startsWith('//')) {
      req.body.videoUrl = 'https:' + req.body.videoUrl;
    }
    
    // Process base64 image if present (including video thumbnails)
    if (req.body.image && req.body.image.startsWith('data:image/')) {
      const savedImagePath = saveBase64Image(req.body.image);
      if (!savedImagePath) {
        console.error('Failed to save base64 image');
        return res.status(500).json({ success: false, message: 'Failed to save image' });
      }
      req.body.image = savedImagePath;
    }
    // For video items, ensure thumbnail exists
    else if (req.body.type === 'video') {
      // If no image provided or it's the same as videoUrl, use placeholder
      if (!req.body.image || req.body.image === '' || req.body.image === req.body.videoUrl) {
        console.log('Using placeholder for video item with no thumbnail');
        req.body.image = '/images/video-placeholder.jpg';
      }
    }
    
    // Handle removing image
    if (req.body.removeImage) {
      req.body.image = '';
      delete req.body.removeImage;
    }
    
    const updatedItem = await Gallery.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!updatedItem) {
      return res.status(404).json({ success: false, message: 'Gallery item not found' });
    }
    
    return res.json({ success: true, item: updatedItem });
  } catch (error) {
    console.error('Error updating gallery item:', error);
    return next(error);
  }
};

// Delete gallery item by ID
const deleteItem = async (req, res, next) => {
  try {
    const result = await Gallery.findByIdAndDelete(req.params.id);
    
    if (!result) {
      return res.status(404).json({ success: false, message: 'Gallery item not found' });
    }
    
    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getAllItems,
  getVisibleItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem
}; 