require('dotenv').config();
const mongoose = require('mongoose');
const SiteInfo = require('../models/site-info');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/salon')
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Exact coordinates for 29°26'42.3"N 77°18'21.3"E
const EXACT_LAT = 29.4450833;
const EXACT_LNG = 77.3059167;
const EMBED_URL = `https://www.openstreetmap.org/export/embed.html?bbox=${EXACT_LNG-0.01}%2C${EXACT_LAT-0.01}%2C${EXACT_LNG+0.01}%2C${EXACT_LAT+0.01}&layer=mapnik&marker=${EXACT_LAT}%2C${EXACT_LNG}`;

// Update coordinates in database
async function updateCoordinates() {
  try {
    console.log('Updating coordinates...');
    
    // Find the site info document (there should only be one)
    const siteInfo = await SiteInfo.findOne();
    
    if (!siteInfo) {
      console.log('Creating new site info with exact coordinates');
      const newSiteInfo = new SiteInfo({
        mapLat: EXACT_LAT,
        mapLng: EXACT_LNG,
        mapEmbedUrl: EMBED_URL
      });
      await newSiteInfo.save();
    } else {
      console.log('Updating existing site info with exact coordinates');
      siteInfo.mapLat = EXACT_LAT;
      siteInfo.mapLng = EXACT_LNG;
      siteInfo.mapEmbedUrl = EMBED_URL;
      await siteInfo.save();
    }
    
    console.log('✅ Coordinates updated successfully!');
    console.log(`Latitude: ${EXACT_LAT}`);
    console.log(`Longitude: ${EXACT_LNG}`);
    console.log(`Map URL: ${EMBED_URL}`);
    
    // Close connection
    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error updating coordinates:', error);
    mongoose.connection.close();
    process.exit(1);
  }
}

// Run the update function
updateCoordinates(); 