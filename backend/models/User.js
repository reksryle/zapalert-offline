const mongoose = require('mongoose');

// Define what user data looks like in database
const userSchema = new mongoose.Schema({
  username: { 
    type: String, 
    required: true, // Must have username
    unique: true,   // No duplicate usernames
    lowercase: true, // Store in lowercase
    trim: true      // Remove extra spaces
  },
  password: { type: String, required: true }, // Must have password

  firstName: { type: String, required: true }, // Must have first name
  lastName: { type: String, required: true }, // Must have last name

  age: { type: Number, required: true, min: 7, max: 100 }, // Age between 7-100
  contactNumber: {
    type: String,
    required: true,
    match: [/^09\d{9}$/, 'Contact number must start with 09 and be 11 digits long.'] // PH number format
  },
  barangay: { type: String, default: 'Zapatera' }, // Default to Zapatera        
  barrio: { type: String, required: true }, // Neighborhood required

  role: { type: String, enum: ['resident', 'responder', 'admin'], default: 'resident' }, // User type
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }, // Account status

  idImagePath: String, // File path for ID photo
  submittedAt: { type: Date, default: Date.now }, // When user registered
  approvedAt: Date, // When admin approved account
});

module.exports = mongoose.model('User', userSchema);