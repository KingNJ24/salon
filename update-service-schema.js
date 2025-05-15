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

async function updateServiceSchema() {
  try {
    // Connect to MongoDB
    const connected = await connectDB();
    if (!connected) {
      console.error('Could not connect to MongoDB. Exiting...');
      process.exit(1);
    }

    // Get all services
    const services = await Service.find({});
    console.log(`Found ${services.length} services to update`);

    // Update each service to ensure it has the new fields
    for (let i = 0; i < services.length; i++) {
      const service = services[i];
      console.log(`Updating service: ${service._id}, ${service.name}`);
      
      // Set display order sequentially
      service.displayOrder = i;
      
      // Ensure other fields have default values if they don't exist
      if (service.isVisible === undefined) {
        service.isVisible = true;
      }
      
      if (service.showOnHomepage === undefined) {
        service.showOnHomepage = false;
      }
      
      // Use findByIdAndUpdate to avoid validation issues
      await Service.findByIdAndUpdate(
        service._id,
        { 
          $set: { 
            displayOrder: service.displayOrder,
            isVisible: service.isVisible,
            showOnHomepage: service.showOnHomepage
          } 
        },
        { runValidators: false }
      );
      
      console.log(`Service ${service._id} updated successfully`);
    }

    console.log('All services updated successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error updating services:', error);
    process.exit(1);
  }
}

// Run the update function
updateServiceSchema(); 