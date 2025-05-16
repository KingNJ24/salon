const mongoose = require('mongoose');
const { Gallery } = require('./models');

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/salon')
  .then(async () => {
    try {
      console.log('Connected to database');
      
      // Update all video items to be visible and show on homepage
      const result = await Gallery.updateMany(
        { type: 'video' }, 
        { $set: { isVisible: true, showOnHomepage: true } }
      );
      
      console.log('Update result:', result);
      
      // Verify video items after update
      const videoItems = await Gallery.find({ type: 'video' });
      console.log('Video items after update:', JSON.stringify(videoItems, null, 2));
      
      mongoose.disconnect();
      console.log('Done');
    } catch (error) {
      console.error('Error:', error);
      mongoose.disconnect();
    }
  })
  .catch(err => {
    console.error('Connection error:', err);
  }); 