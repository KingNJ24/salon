/**
 * Gallery controller
 */
const { Gallery } = require('../models');
const { saveBase64Image } = require('../utils/upload');

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
    // For video items, use a placeholder if no image is provided
    else if (req.body.type === 'video' && (!req.body.image || req.body.image === '')) {
      console.log('Using placeholder for video item with no thumbnail');
      req.body.image = '/images/video-placeholder.jpg';
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

// Update gallery item by ID
const updateItem = async (req, res, next) => {
  try {
    console.log('Updating gallery item with data:', req.body);
    
    // Fix boolean conversions
    if ('isVisible' in req.body) {
      // Convert string 'true'/'false' to boolean if needed
      if (typeof req.body.isVisible === 'string') {
        req.body.isVisible = req.body.isVisible === 'true';
      }
      console.log(`Setting isVisible to ${req.body.isVisible} (${typeof req.body.isVisible}) for item ${req.params.id}`);
    }
    
    if ('showOnHomepage' in req.body) {
      // Convert string 'true'/'false' to boolean if needed
      if (typeof req.body.showOnHomepage === 'string') {
        req.body.showOnHomepage = req.body.showOnHomepage === 'true';
      }
      console.log(`Setting showOnHomepage to ${req.body.showOnHomepage} (${typeof req.body.showOnHomepage}) for item ${req.params.id}`);
    }
    
    // If making invisible, ensure it's not on homepage
    if (req.body.isVisible === false && !('showOnHomepage' in req.body)) {
      req.body.showOnHomepage = false;
      console.log('Item being made invisible, setting showOnHomepage to false');
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
    // For video items, use a placeholder if no image is provided
    else if (req.body.type === 'video' && (!req.body.image || req.body.image === '')) {
      console.log('Using placeholder for video item with no thumbnail');
      req.body.image = '/images/video-placeholder.jpg';
    }
    
    console.log('Final update data:', req.body);
    
    const updatedItem = await Gallery.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: false }
    );
    
    if (!updatedItem) {
      return res.status(404).json({ success: false, message: 'Gallery item not found' });
    }
    
    console.log('Gallery item updated successfully:', updatedItem);
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