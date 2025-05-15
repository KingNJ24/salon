require('dotenv').config();
const mongoose = require('mongoose');
const { Gallery } = require('./models');

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

async function updateGalleryItems() {
  try {
    // Connect to MongoDB
    const connected = await connectDB();
    if (!connected) {
      console.error('Could not connect to MongoDB. Exiting...');
      process.exit(1);
    }

    // Get all gallery items
    const galleryItems = await Gallery.find({});
    console.log(`Found ${galleryItems.length} gallery items to update`);

    if (galleryItems.length === 0) {
      console.log('No gallery items found. Exiting...');
      process.exit(0);
    }

    // Update each gallery item
    for (let i = 0; i < galleryItems.length; i++) {
      const item = galleryItems[i];
      console.log(`Updating gallery item ${i+1}/${galleryItems.length}: ${item._id}, ${item.title}`);
      
      // Set display order sequentially if not set
      if (item.displayOrder === undefined) {
        item.displayOrder = i;
      }
      
      // Ensure isVisible is set
      if (item.isVisible === undefined) {
        item.isVisible = true;
      }
      
      // Make first 4 items show on homepage if not set
      if (item.showOnHomepage === undefined) {
        item.showOnHomepage = i < 4;
      }
      
      // Use findByIdAndUpdate to avoid validation issues
      await Gallery.findByIdAndUpdate(
        item._id,
        { 
          $set: { 
            displayOrder: item.displayOrder,
            isVisible: item.isVisible,
            showOnHomepage: item.showOnHomepage
          } 
        },
        { runValidators: false }
      );
      
      console.log(`Gallery item ${item._id} updated successfully`);
    }

    console.log('All gallery items updated successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error updating gallery items:', error);
    process.exit(1);
  }
}

// Run the update function
updateGalleryItems(); 