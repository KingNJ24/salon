const mongoose = require('mongoose');
const SiteInfo = require('./models/site-info');

const updateSiteInfo = async () => {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/salon');
    console.log('Connected to MongoDB');
    
    const siteInfo = await SiteInfo.findOne();
    if(siteInfo) {
      siteInfo.salonName = 'NandiniJ Makeup Studio';
      siteInfo.email = 'info@nandinijstudio.com';
      siteInfo.heroTitle = 'Makeup Studio';
      siteInfo.heroSubtitle = 'Experience luxury beauty services at our studio. Our expert stylists will help you look and feel your best.';
      siteInfo.aboutText = 'NandiniJ Makeup Studio was founded with a simple mission: to provide exceptional beauty services in a welcoming and relaxing environment. Our team of highly skilled makeup artists and stylists is dedicated to helping you look and feel your best. We use only the finest products and stay up-to-date with the latest trends and techniques.';
      
      await siteInfo.save();
      console.log('SiteInfo updated successfully');
    } else {
      console.log('No SiteInfo found');
    }
    
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  } catch(error) {
    console.error('Error:', error);
  }
};

updateSiteInfo(); 