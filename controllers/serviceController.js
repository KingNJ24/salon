/**
 * Service controller
 */
const { Service } = require('../models');
const { saveBase64Image } = require('../utils/upload');

// Get all services
const getAllServices = async (req, res, next) => {
  try {
    const services = await Service.find().sort({ displayOrder: 1 });
    return res.json({ success: true, services });
  } catch (error) {
    return next(error);
  }
};

// Get visible services
const getVisibleServices = async (req, res, next) => {
  try {
    const services = await Service.find({ isVisible: { $ne: false } })
      .sort({ displayOrder: 1 });
    return res.json({ success: true, services });
  } catch (error) {
    return next(error);
  }
};

// Get service by ID
const getServiceById = async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.id);
    
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }
    
    return res.json({ success: true, service });
  } catch (error) {
    return next(error);
  }
};

// Create new service
const createService = async (req, res, next) => {
  try {
    // Process base64 image if present
    if (req.body.image && req.body.image.startsWith('data:image/')) {
      req.body.image = saveBase64Image(req.body.image) || '/images/placeholder.jpg';
    }
    
    const newService = new Service(req.body);
    await newService.save();
    return res.json({ success: true, service: newService });
  } catch (error) {
    return next(error);
  }
};

// Update service by ID
const updateService = async (req, res, next) => {
  try {
    // Process base64 image if present
    if (req.body.image && req.body.image.startsWith('data:image/')) {
      req.body.image = saveBase64Image(req.body.image) || req.body.image;
    }
    
    const updatedService = await Service.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: false }
    );
    
    if (!updatedService) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }
    
    return res.json({ success: true, service: updatedService });
  } catch (error) {
    return next(error);
  }
};

// Delete service by ID
const deleteService = async (req, res, next) => {
  try {
    const result = await Service.findByIdAndDelete(req.params.id);
    
    if (!result) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }
    
    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getAllServices,
  getVisibleServices,
  getServiceById,
  createService,
  updateService,
  deleteService
}; 