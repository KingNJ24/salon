/**
 * Database initializer - populates MongoDB with initial data if collections are empty
 */
const mongoose = require('mongoose');
const { Service, Gallery, Team, SiteInfo } = require('../models');

const initializeDatabase = async () => {
  try {
    console.log('Checking if database needs initialization...');
    
    // Check if SiteInfo exists
    const siteInfoCount = await SiteInfo.countDocuments();
    if (siteInfoCount === 0) {
      console.log('Creating default site info...');
      const defaultSiteInfo = new SiteInfo({
        salonName: 'NandiniJ Makeup Studio',
        address: '123 Main Street, City, State 12345',
        phone: '(123) 456-7890',
        email: 'info@nandinijstudio.com',
        heroTitle: 'Makeup Studio',
        heroSubtitle: 'Experience luxury beauty services at our studio. Our expert stylists will help you look and feel your best.',
        aboutText: 'NandiniJ Makeup Studio was founded with a simple mission: to provide exceptional beauty services in a welcoming and relaxing environment. Our team of highly skilled makeup artists and stylists is dedicated to helping you look and feel your best. We use only the finest products and stay up-to-date with the latest trends and techniques.'
      });
      await defaultSiteInfo.save();
      console.log('Default site info created successfully');
    }
    
    // Check if Services collection is empty
    const serviceCount = await Service.countDocuments();
    if (serviceCount === 0) {
      console.log('Creating default services...');
      
      const defaultServices = [
        { 
          name: 'Women\'s Haircut', 
          price: '60+', 
          description: 'Personalized haircuts tailored to your face shape and lifestyle', 
          image: '/images/cuts1.jpg', 
          category: 'Haircut' 
        },
        { 
          name: 'Men\'s Haircut', 
          price: '40+', 
          description: 'Modern or classic cuts for men of all ages', 
          image: '/images/cuts2.jpg', 
          category: 'Haircut' 
        },
        { 
          name: 'Hair Coloring', 
          price: '80+', 
          description: 'Full color services to help you achieve the perfect shade', 
          image: '/images/colors1.jpg', 
          category: 'Coloring' 
        },
        { 
          name: 'Balayage', 
          price: '150+', 
          description: 'Beautiful, natural-looking highlights and color gradients', 
          image: '/images/colors2.jpg', 
          category: 'Coloring' 
        }
      ];
      
      await Service.insertMany(defaultServices);
      console.log('Default services created successfully');
    }
    
    // Check if Gallery collection is empty
    const galleryCount = await Gallery.countDocuments();
    if (galleryCount === 0) {
      console.log('Creating default gallery items...');
      
      const defaultGallery = [
        { category: 'Cuts', image: '/images/cuts1.jpg', title: 'Haircut 1' },
        { category: 'Cuts', image: '/images/cuts2.jpg', title: 'Haircut 2' },
        { category: 'Colors', image: '/images/colors1.jpg', title: 'Hair Color 1' },
        { category: 'Colors', image: '/images/colors2.jpg', title: 'Hair Color 2' }
      ];
      
      await Gallery.insertMany(defaultGallery);
      console.log('Default gallery items created successfully');
    }
    
    // Check if Team collection is empty
    const teamCount = await Team.countDocuments();
    if (teamCount === 0) {
      console.log('Creating default team members...');
      
      const defaultTeam = [
        { 
          name: 'Sarah Johnson', 
          title: 'Founder & Master Stylist', 
          bio: 'Specializing in precision cuts and color transformations.', 
          image: '/images/stylist1.jpg' 
        },
        { 
          name: 'Michael Brown', 
          title: 'Senior Stylist', 
          bio: 'Expert in modern men\'s cuts and styling techniques.', 
          image: '/images/stylist2.jpg' 
        },
        { 
          name: 'Emily Davis', 
          title: 'Color Specialist', 
          bio: 'Known for creating stunning balayage and color melts.', 
          image: '/images/stylist3.jpg' 
        }
      ];
      
      await Team.insertMany(defaultTeam);
      console.log('Default team members created successfully');
    }
    
    console.log('Database initialization completed');
    return true;
  } catch (error) {
    console.error('Error initializing database:', error);
    return false;
  }
};

module.exports = initializeDatabase; 