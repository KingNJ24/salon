require('dotenv').config();
const mongoose = require('mongoose');
const { Gallery } = require('./models');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/salon')
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Sample gallery items
const galleryItems = [
  {
    title: 'Classic Bob Cut',
    category: 'Haircuts',
    image: '/images/cuts1.jpg',
    type: 'image',
    displayOrder: 1,
    isVisible: true,
    showOnHomepage: true
  },
  {
    title: 'Modern Pixie Cut',
    category: 'Haircuts',
    image: '/images/cuts2.jpg',
    type: 'image',
    displayOrder: 2,
    isVisible: true,
    showOnHomepage: true
  },
  {
    title: 'Balayage Highlights',
    category: 'Color',
    image: '/images/colors1.jpg',
    type: 'image',
    displayOrder: 3,
    isVisible: true,
    showOnHomepage: true
  },
  {
    title: 'Vibrant Red Color',
    category: 'Color',
    image: '/images/colors2.jpg',
    type: 'image',
    displayOrder: 4,
    isVisible: true,
    showOnHomepage: true
  }
];

// Function to seed the database
async function seedGallery() {
  try {
    // Clear existing gallery items
    await Gallery.deleteMany({});
    
    // Insert new gallery items
    await Gallery.insertMany(galleryItems);
    
    console.log('Gallery items seeded successfully!');
    mongoose.disconnect();
  } catch (error) {
    console.error('Error seeding gallery items:', error);
    mongoose.disconnect();
  }
}

// Run the seed function
seedGallery(); 