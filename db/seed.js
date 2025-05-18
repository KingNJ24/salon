require('dotenv').config();
const connectDB = require('./connect');
const { Service, Gallery, Team, SiteInfo, ServiceCategory } = require('../models');

// Initial services data
const services = [
  { name: 'Women\'s Haircut', price: '60+', description: 'Personalized haircuts tailored to your face shape and lifestyle', image: '/images/cuts1.jpg', category: 'Haircut' },
  { name: 'Men\'s Haircut', price: '40+', description: 'Modern or classic cuts for men of all ages', image: '/images/cuts2.jpg', category: 'Haircut' },
  { name: 'Hair Coloring', price: '80+', description: 'Full color services to help you achieve the perfect shade', image: '/images/colors1.jpg', category: 'Coloring' },
  { name: 'Balayage', price: '150+', description: 'Beautiful, natural-looking highlights and color gradients', image: '/images/colors2.jpg', category: 'Coloring' },
  { name: 'Bridal Styling', price: '120+', description: 'Make your special day even more memorable with our bridal services', image: '/images/bridal1.jpg', category: 'Styling' },
  { name: 'Hair Treatments', price: '45+', description: 'Revitalize your hair with our professional treatments', image: '/images/texture1.jpg', category: 'Treatment' }
];

// Default service categories
const serviceCategories = [
  { name: 'Haircut', displayOrder: 0 },
  { name: 'Coloring', displayOrder: 1 },
  { name: 'Treatment', displayOrder: 2 },
  { name: 'Styling', displayOrder: 3 },
  { name: 'Other', displayOrder: 4 }
];

// Initial gallery data
const galleryImages = [
  { category: 'Bridal', image: '/images/bridal1.jpg', title: 'Bridal Style 1' },
  { category: 'Bridal', image: '/images/bridal2.jpg', title: 'Bridal Style 2' },
  { category: 'Colors', image: '/images/colors1.jpg', title: 'Hair Color 1' },
  { category: 'Colors', image: '/images/colors2.jpg', title: 'Hair Color 2' },
  { category: 'Cuts', image: '/images/cuts1.jpg', title: 'Haircut 1' },
  { category: 'Cuts', image: '/images/cuts2.jpg', title: 'Haircut 2' },
  { category: 'Makeup', image: '/images/makeup1.jpg', title: 'Makeup Look 1' },
  { category: 'Textures', image: '/images/texture1.jpg', title: 'Hair Texture 1' }
];

// Initial team data
const team = [
  { name: 'Sarah Johnson', title: 'Founder & Master Stylist', bio: 'Specializing in precision cuts and color transformations.', image: '/images/stylist1.jpg' },
  { name: 'Michael Brown', title: 'Senior Stylist', bio: 'Expert in modern men\'s cuts and styling techniques.', image: '/images/stylist2.jpg' },
  { name: 'Emily Davis', title: 'Color Specialist', bio: 'Known for creating stunning balayage and color melts.', image: '/images/stylist3.jpg' }
];

// Initial site info
const siteInfo = {
  salonName: 'Your Salon',
  address: '123 Main Street, City, State 12345',
  phone: '(123) 456-7890',
  email: 'info@yoursalon.com',
  hours: {
    monday: '9am - 8pm',
    tuesday: '9am - 8pm',
    wednesday: '9am - 8pm',
    thursday: '9am - 8pm',
    friday: '9am - 8pm',
    saturday: '9am - 6pm',
    sunday: '10am - 5pm'
  }
};

// Function to seed the database
const seedData = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    console.log('Connected to MongoDB');
    
    // Check if service categories already exist
    const serviceCategoryCount = await ServiceCategory.countDocuments();
    if (serviceCategoryCount === 0) {
      // Seed service categories
      await ServiceCategory.insertMany(serviceCategories);
      console.log('Service categories seeded successfully');
    } else {
      console.log(`Service categories already exist: ${serviceCategoryCount} found`);
    }
    
    // Check if services already exist
    const serviceCount = await Service.countDocuments();
    if (serviceCount === 0) {
      // Seed services
      await Service.insertMany(services);
      console.log('Services seeded successfully');
    } else {
      console.log(`Services already exist: ${serviceCount} found`);
    }
    
    // Check if gallery items already exist
    const galleryCount = await Gallery.countDocuments();
    if (galleryCount === 0) {
      // Seed gallery
      await Gallery.insertMany(galleryImages);
      console.log('Gallery seeded successfully');
    } else {
      console.log(`Gallery items already exist: ${galleryCount} found`);
    }
    
    // Insert new data
    await Team.insertMany(team);
    await SiteInfo.create(siteInfo);
    
    console.log('Database seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

// Run the seed function
seedData(); 