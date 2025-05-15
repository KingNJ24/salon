require('dotenv').config();
const connectDB = require('./connect');
const { Service, Gallery, Team, SiteInfo } = require('../models');

// Initial services data
const services = [
  { name: 'Women\'s Haircut', price: '60+', description: 'Personalized haircuts tailored to your face shape and lifestyle', image: '/images/cuts1.jpg', category: 'Haircut' },
  { name: 'Men\'s Haircut', price: '40+', description: 'Modern or classic cuts for men of all ages', image: '/images/cuts2.jpg', category: 'Haircut' },
  { name: 'Hair Coloring', price: '80+', description: 'Full color services to help you achieve the perfect shade', image: '/images/colors1.jpg', category: 'Coloring' },
  { name: 'Balayage', price: '150+', description: 'Beautiful, natural-looking highlights and color gradients', image: '/images/colors2.jpg', category: 'Coloring' },
  { name: 'Bridal Styling', price: '120+', description: 'Make your special day even more memorable with our bridal services', image: '/images/bridal1.jpg', category: 'Styling' },
  { name: 'Hair Treatments', price: '45+', description: 'Revitalize your hair with our professional treatments', image: '/images/texture1.jpg', category: 'Treatment' }
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

// Seed the database
const seedDatabase = async () => {
  try {
    // Connect to database
    await connectDB();
    
    // Clear existing data
    await Service.deleteMany({});
    await Gallery.deleteMany({});
    await Team.deleteMany({});
    await SiteInfo.deleteMany({});
    
    console.log('Cleared existing data');
    
    // Insert new data
    await Service.insertMany(services);
    await Gallery.insertMany(galleryImages);
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
seedDatabase(); 