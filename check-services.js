require('dotenv').config();
const mongoose = require('mongoose');
const { Service } = require('./models');

async function connectDB() {
  try {
    console.log('Attempting to connect to MongoDB...');
    const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/salon';
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB connected successfully');
    return true;
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error.message);
    return false;
  }
}

async function checkServices() {
  try {
    // Connect to MongoDB
    const connected = await connectDB();
    if (!connected) {
      console.error('Could not connect to MongoDB. Exiting...');
      process.exit(1);
    }

    // Get all services
    const services = await Service.find({}).sort({ displayOrder: 1 });
    console.log(`Found ${services.length} services:`);

    for (const service of services) {
      console.log(`ID: ${service._id}, Name: ${service.name}, DisplayOrder: ${service.displayOrder}, isVisible: ${service.isVisible}, onHomepage: ${service.showOnHomepage}`);
    }

    mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error checking services:', error);
    process.exit(1);
  }
}

// Run the function
checkServices(); 