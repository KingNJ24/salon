const mongoose = require('mongoose');

// Use MongoDB connection from environment variables
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/salon';

// Connect to MongoDB with improved options
const connectDB = async () => {
  try {
    console.log('Attempting to connect to MongoDB at:', MONGODB_URI);
    
    // Connect with improved options
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // 5 seconds
      socketTimeoutMS: 45000, // 45 seconds
    });
    
    console.log('MongoDB connected successfully');
    return true;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    
    // Fall back to in-memory database if MongoDB connection fails
    console.log('Using in-memory data instead');
    return false;
  }
};

// Handle connection events
mongoose.connection.on('error', err => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

mongoose.connection.on('connected', () => {
  console.log('MongoDB connection established');
});

mongoose.connection.on('reconnected', () => {
  console.log('MongoDB reconnected');
});

// Handle application termination
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('MongoDB connection closed due to app termination');
  process.exit(0);
});

module.exports = connectDB; 