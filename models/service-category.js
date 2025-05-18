const mongoose = require('mongoose');

const serviceCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  displayOrder: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const ServiceCategory = mongoose.model('ServiceCategory', serviceCategorySchema);

module.exports = ServiceCategory; 