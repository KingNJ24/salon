// API route for initializing database on Vercel
require('dotenv').config();
const mongoose = require('mongoose');
const { SiteInfo, Service, Gallery } = require('../models');

// Initialize database connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/salon';

module.exports = async (req, res) => {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Initialize SiteInfo if not exists
    let siteInfo = await SiteInfo.findOne();
    
    if (!siteInfo) {
      console.log('Creating default site info...');
      siteInfo = new SiteInfo({
        salonName: 'NandiniJ Makeup Studio',
        address: '123 Main Street, City, State 12345',
        phone: '(123) 456-7890',
        email: 'info@nandinijstudio.com',
        heroTitle: 'Makeup Studio',
        heroSubtitle: 'Experience luxury beauty services at our studio. Our expert stylists will help you look and feel your best.',
        aboutText: 'NandiniJ Makeup Studio was founded with a simple mission: to provide exceptional beauty services in a welcoming and relaxing environment.'
      });
      await siteInfo.save();
      console.log('Default site info created');
    } else {
      console.log('Site info already exists');
    }

    // Initialize default Services if none exist
    const servicesCount = await Service.countDocuments();
    
    if (servicesCount === 0) {
      console.log('Creating default services...');
      const defaultServices = [
        {
          name: 'Makeup',
          description: 'Professional makeup application for any occasion.',
          price: '₹2,500+',
          duration: '60 mins',
          image: '/images/makeup1.jpg',
          isVisible: true,
          showOnHomepage: true,
          displayOrder: 1
        },
        {
          name: 'Hair Styling',
          description: 'Hair styling service for special occasions and everyday looks.',
          price: '₹1,500+',
          duration: '45 mins',
          image: '/images/texture1.jpg',
          isVisible: true,
          showOnHomepage: true,
          displayOrder: 2
        },
        {
          name: 'Bridal Package',
          description: 'Complete bridal look including makeup, hair styling, and consultation.',
          price: '₹10,000+',
          duration: '3 hours',
          image: '/images/about.jpg',
          isVisible: true,
          showOnHomepage: true,
          displayOrder: 3
        }
      ];
      
      await Service.insertMany(defaultServices);
      console.log('Default services created');
    } else {
      console.log('Services already exist');
    }

    // Initialize default Gallery items if none exist
    const galleryCount = await Gallery.countDocuments();
    
    if (galleryCount === 0) {
      console.log('Creating default gallery items...');
      const defaultGallery = [
        {
          title: 'Vivid Colors',
          category: 'Color',
          image: '/images/colors1.jpg',
          type: 'image',
          isVisible: true,
          showOnHomepage: true,
          displayOrder: 1
        },
        {
          title: 'Vibrant Red Color',
          category: 'Color',
          image: '/images/colors2.jpg',
          type: 'image',
          isVisible: true,
          showOnHomepage: true,
          displayOrder: 2
        },
        {
          title: 'Modern Cut',
          category: 'Cuts',
          image: '/images/cuts1.jpg',
          type: 'image',
          isVisible: true,
          showOnHomepage: true,
          displayOrder: 3
        }
      ];
      
      await Gallery.insertMany(defaultGallery);
      console.log('Default gallery items created');
    } else {
      console.log('Gallery items already exist');
    }

    // Close database connection
    await mongoose.disconnect();
    console.log('Database initialized successfully');

    // Return success
    return res.status(200).json({
      success: true,
      message: 'Database initialized successfully',
      data: {
        siteInfo: siteInfo ? true : false,
        servicesCount: servicesCount || 'Created default services',
        galleryCount: galleryCount || 'Created default gallery items'
      }
    });
  } catch (error) {
    console.error('Error initializing database:', error);
    
    // Try to disconnect if connection was established
    try {
      await mongoose.disconnect();
    } catch (disconnectError) {
      console.error('Error disconnecting from database:', disconnectError);
    }

    // Return error
    return res.status(500).json({
      success: false,
      message: 'Error initializing database',
      error: error.message
    });
  }
}; 