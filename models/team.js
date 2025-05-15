const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  bio: {
    type: String,
    required: true,
    trim: true
  },
  image: {
    type: String,
    default: '/images/placeholder.jpg'
  }
});

const Team = mongoose.model('Team', teamSchema);

module.exports = Team; 