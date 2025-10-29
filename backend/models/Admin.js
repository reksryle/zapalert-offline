const mongoose = require('mongoose');

// Define what admin data looks like in database
const adminSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true, // Must have email
    unique: true,   // No duplicate emails
    lowercase: true, // Store as lowercase
    trim: true      // Remove extra spaces
  },
  password: {
    type: String,
    required: true, // Must have password
    minlength: 6    // At least 6 characters
  },
  firstName: {
    type: String,
    required: true, // Must have first name
    trim: true
  },
  lastName: {
    type: String,
    required: true, // Must have last name
    trim: true
  },
  role: {
    type: String,
    enum: ['admin', 'super-admin'], // Can only be these values
    default: 'admin' // Default to regular admin
  },
  isActive: {
    type: Boolean,
    default: true // Account is active by default
  },
  lastLoginAt: {
    type: Date // Track when they last logged in
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin' // Which admin created this account
  }
}, {
  timestamps: true // Auto-add createdAt and updatedAt fields
});

// Make database searches faster
adminSchema.index({ email: 1 });
adminSchema.index({ role: 1 });
adminSchema.index({ isActive: 1 });

// Create a virtual full name field (not stored in database)
adminSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`; // Combine first + last name
});

// Control what data gets sent when converting to JSON
adminSchema.set('toJSON', {
  virtuals: true, // Include virtual fields
  transform: function(doc, ret) {
    delete ret.password; // Never send password in responses
    return ret;
  }
});

module.exports = mongoose.model('Admin', adminSchema);