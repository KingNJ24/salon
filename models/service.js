const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  image: {
    type: String,
    default: '/images/placeholder.jpg'
  },
  type: {
    type: String,
    enum: ['image', 'video'],
    default: 'image'
  },
  videoUrl: {
    type: String,
    default: ''
  }
});

const Service = mongoose.model('Service', serviceSchema);

module.exports = Service; 