require('dotenv').config();
const mongoose = require('mongoose');
const SiteInfo = require('./models/site-info');

// MongoDB URI - use the same format as in the app
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/salon';

// Connect to MongoDB
mongoose.connect(MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// New map URL
const newMapUrl = 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3474.4431684712117!2d77.30589979999999!3d29.4450669!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390c2f98f7a35099%3A0x1cc5130c96e9864d!2sNandini%20J%20Makeup%20Studio%20%26%20Luxury%20Salon%20-HD%20Party%20Makeup%20%7CHaircut%20%26%20Styling%20%7CHD%20Bridal%20Makeup%20in%20Shamli!5e0!3m2!1sen!2sin!4v1747572096609!5m2!1sen!2sin';

// Update the existing site info record
async function updateMapUrl() {
  try {
    // Find the first site info document (there should only be one)
    const siteInfo = await SiteInfo.findOne();
    
    if (!siteInfo) {
      console.log('No site info found. Creating a new one...');
      // If no site info exists, create one with default values
      const newSiteInfo = new SiteInfo();
      await newSiteInfo.save();
      console.log('New site info created with default values, including the new map URL.');
    } else {
      // Update the existing site info
      siteInfo.mapEmbedUrl = newMapUrl;
      await siteInfo.save();
      console.log('Map URL updated successfully!');
    }
    
    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error updating map URL:', error);
    mongoose.connection.close();
    process.exit(1);
  }
}

// Run the update function
updateMapUrl(); 