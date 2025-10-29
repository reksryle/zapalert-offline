// models/index.js - Centralized model exports
const User = require('./User');
const Admin = require('./Admin');

// Export all models from one place
module.exports = {
  User,
  Admin
};