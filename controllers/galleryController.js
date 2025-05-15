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
    // Process base64 image if present
    if (req.body.image && req.body.image.startsWith('data:image/')) {
      req.body.image = saveBase64Image(req.body.image) || '/images/placeholder.jpg';
    }
    
    const newItem = new Gallery(req.body);
    await newItem.save();
    return res.json({ success: true, item: newItem });
  } catch (error) {
    return next(error);
  }
};

// Update gallery item by ID
const updateItem = async (req, res, next) => {
  try {
    // Process base64 image if present
    if (req.body.image && req.body.image.startsWith('data:image/')) {
      req.body.image = saveBase64Image(req.body.image) || req.body.image;
    }
    
    const updatedItem = await Gallery.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: false }
    );
    
    if (!updatedItem) {
      return res.status(404).json({ success: false, message: 'Gallery item not found' });
    }
    
    return res.json({ success: true, item: updatedItem });
  } catch (error) {
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