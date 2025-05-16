require('dotenv').config();
const mongoose = require('mongoose');
const { SiteInfo } = require('./models');

// Use the environment variable or replace with your actual MongoDB Atlas connection string
const MONGO_URI = process.env.MONGO_URI || 'your_mongodb_atlas_connection_string';

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('Connected to MongoDB Atlas');
    
    try {
      // Check if SiteInfo exists
      const existingSiteInfo = await SiteInfo.findOne();
      
      if (!existingSiteInfo) {
        console.log('Creating default site info...');
        const defaultSiteInfo = new SiteInfo({
          salonName: 'NandiniJ Makeup Studio',
          address: '123 Main Street, City, State 12345',
          phone: '(123) 456-7890',
          email: 'info@nandinijstudio.com',
          heroTitle: 'Makeup Studio',
          heroSubtitle: 'Experience luxury beauty services at our studio. Our expert stylists will help you look and feel your best.',
          aboutText: 'NandiniJ Makeup Studio was founded with a simple mission: to provide exceptional beauty services in a welcoming and relaxing environment.'
        });
        
        await defaultSiteInfo.save();
        console.log('Default site info created successfully');
      } else {
        console.log('Site info already exists');
      }
    } catch (error) {
      console.error('Error:', error);
    }
    
    mongoose.disconnect();
    console.log('Database connection closed');
  })
  .catch(err => {
    console.error('Connection error:', err);
  }); 