const mongoose = require('mongoose');

const gallerySchema = new mongoose.Schema({
  title: {
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
    required: true
  },
  type: {
    type: String,
    enum: ['image', 'video'],
    default: 'image'
  },
  videoUrl: {
    type: String,
    default: ''
  },
  displayOrder: {
    type: Number,
    default: 0
  },
  isVisible: {
    type: Boolean,
    default: true
  },
  showOnHomepage: {
    type: Boolean,
    default: false
  }
});

const Gallery = mongoose.model('Gallery', gallerySchema);

module.exports = Gallery; 