const mongoose = require('mongoose');

const schoolSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'School name is required'],
      trim: true,
      maxlength: [200, 'School name cannot exceed 200 characters'],
    },
    
    // Location information
    region: {
      type: String,
      required: [true, 'Region is required'],
      enum: [
        'Greater Accra',
        'Ashanti',
        'Western',
        'Central',
        'Eastern',
        'Volta',
        'Northern',
        'Upper East',
        'Upper West',
        'Brong Ahafo',
        'Savannah',
        'North East',
        'Bono',
        'Bono East',
        'Ahafo',
        'Oti',
      ],
    },
    
    district: {
      type: String,
      required: [true, 'District is required'],
      trim: true,
    },
    
    address: {
      type: String,
      trim: true,
    },
    
    gps: {
      latitude: {
        type: Number,
        min: -90,
        max: 90,
      },
      longitude: {
        type: Number,
        min: -180,
        max: 180,
      },
    },
    
    // Contact information
    headteacher: {
      name: {
        type: String,
        trim: true,
      },
      phone: {
        type: String,
        trim: true,
        match: [/^\+?[0-9]{10,15}$/, 'Please provide a valid phone number'],
      },
      email: {
        type: String,
        trim: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
      },
    },
    
    // School characteristics
    type: {
      type: String,
      enum: ['Primary', 'Junior High', 'Senior High', 'Combined'],
      default: 'Primary',
    },
    
    ownership: {
      type: String,
      enum: ['Public', 'Private', 'Mission', 'NGO'],
      default: 'Public',
    },
    
    // Language support
    primaryLanguages: {
      type: [String],
      default: ['English'],
      enum: ['English', 'Twi', 'Ewe', 'Ga', 'Dagbani', 'Hausa', 'Gonja', 'Fante', 'Nzema'],
    },
    
    // Enrollment statistics
    totalStudents: {
      type: Number,
      default: 0,
      min: 0,
    },
    
    totalTeachers: {
      type: Number,
      default: 0,
      min: 0,
    },
    
    // Status
    active: {
      type: Boolean,
      default: true,
    },
    
    // Metadata
    notes: {
      type: String,
      maxlength: 1000,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for efficient queries
schoolSchema.index({ region: 1, district: 1 });
schoolSchema.index({ name: 'text' });
schoolSchema.index({ active: 1 });

// Virtual for full address
schoolSchema.virtual('fullAddress').get(function () {
  return `${this.address || ''}, ${this.district}, ${this.region}`.trim();
});

// Instance method to check if school has GPS coordinates
schoolSchema.methods.hasGPS = function () {
  return this.gps && this.gps.latitude && this.gps.longitude;
};

// Static method to find schools by region
schoolSchema.statics.findByRegion = function (region) {
  return this.find({ region, active: true }).sort({ name: 1 });
};

// Static method to find schools by district
schoolSchema.statics.findByDistrict = function (district) {
  return this.find({ district, active: true }).sort({ name: 1 });
};

// Pre-save middleware to update totalStudents count
schoolSchema.pre('save', function (next) {
  if (this.isModified('totalStudents') || this.isModified('totalTeachers')) {
    // Could trigger analytics update here
  }
  next();
});

const School = mongoose.model('School', schoolSchema);

module.exports = School;
