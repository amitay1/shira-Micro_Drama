// Test script to find the error
console.log('Starting test...');

try {
  console.log('Loading express...');
  const express = require('express');
  
  console.log('Loading dotenv...');
  require('dotenv').config();
  
  console.log('Loading logger...');
  const logger = require('./src/utils/logger');
  logger.info('Logger loaded successfully');
  
  console.log('Loading database config...');
  const { connectPostgreSQL } = require('./src/config/database');
  
  console.log('Loading models...');
  const models = require('./src/models');
  console.log('Models loaded:', Object.keys(models));
  
  console.log('Loading routes...');
  const seasonPassRoutes = require('./src/routes/seasonPass');
  
  console.log('All modules loaded successfully!');
  
} catch (error) {
  console.error('Error:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}
