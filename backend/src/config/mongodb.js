const mongoose = require('mongoose');
const logger = require('../utils/logger');

// ====================
// MongoDB Connection Configuration
// ====================
const mongooseOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  autoIndex: process.env.NODE_ENV === 'development',
  maxPoolSize: 10,
  minPoolSize: 5,
  socketTimeoutMS: 45000,
  serverSelectionTimeoutMS: 5000,
  family: 4 // Use IPv4
};

// ====================
// MongoDB Connection
// ====================
const connectMongoDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/shira_analytics';
    
    await mongoose.connect(mongoURI, mongooseOptions);
    
    logger.info('MongoDB connection has been established successfully.');
    
    // Connection event listeners
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected. Attempting to reconnect...');
    });
    
    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected successfully');
    });
    
    return mongoose.connection;
  } catch (error) {
    logger.error('Unable to connect to MongoDB:', error);
    throw error;
  }
};

// ====================
// MongoDB Connection Close
// ====================
const closeMongoDBConnection = async () => {
  try {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');
  } catch (error) {
    logger.error('Error closing MongoDB connection:', error);
    throw error;
  }
};

// ====================
// Exports
// ====================
module.exports = {
  mongoose,
  connectMongoDB,
  closeMongoDBConnection
};
