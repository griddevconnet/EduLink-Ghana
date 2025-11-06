const mongoose = require('mongoose');

const parentContactSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: [true, 'Parent phone number is required'],
    trim: true,
    match: [/^\+?[0-9]{10,15}$/, 'Please provide a valid phone number'],
  },
  
  relation: {
    type: String,
    enum: ['Mother', 'Father', 'Guardian', 'Sibling', 'Other'],
    default: 'Guardian',
  },
  
  name: {
    type: String,
    trim: true,
    maxlength: 100,
  },
  
  verified: {
    type: Boolean,
    default: false,
  },
  
  verifiedAt: {
    type: Date,
  },
  
  preferredLanguage: {
    type: String,
    enum: ['English', 'Twi', 'Ewe', 'Ga', 'Dagbani', 'Hausa', 'Gonja', 'Fante', 'Nzema'],
    default: 'English',
  },
  
  // Community proxy flag (for households without phones)
  isProxy: {
    type: Boolean,
    default: false,
  },
  
  proxyType: {
    type: String,
    enum: ['Community Leader', 'Assembly Member', 'Neighbor', 'School Contact'],
  },
  
  // Opt-out from calls
  optedOut: {
    type: Boolean,
    default: false,
  },
  
  optedOutAt: {
    type: Date,
  },
  
  // Call history summary
  lastContactedAt: {
    type: Date,
  },
  
  totalCallsReceived: {
    type: Number,
    default: 0,
  },
  
  totalCallsAnswered: {
    type: Number,
    default: 0,
  },
}, { _id: true });

const studentSchema = new mongoose.Schema(
  {
    // Basic information
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      maxlength: [50, 'First name cannot exceed 50 characters'],
    },
    
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      maxlength: [50, 'Last name cannot exceed 50 characters'],
    },
    
    otherNames: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    
    dateOfBirth: {
      type: Date,
      required: [true, 'Date of birth is required'],
    },
    
    // Disaggregated data - UNICEF requirement
    gender: {
      type: String,
      required: [true, 'Gender is required'],
      enum: ['Male', 'Female', 'Other'],
    },
    
    // ⭐ UNICEF: Disability tracking
    disabilityStatus: {
      type: String,
      required: [true, 'Disability status is required'],
      enum: ['None', 'Visual', 'Hearing', 'Physical', 'Cognitive', 'Multiple'],
      default: 'None',
    },
    
    disabilityDetails: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    
    // School information
    school: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School',
      required: function () {
        return this.enrollmentStatus === 'enrolled';
      },
    },
    
    class: {
      type: String,
      trim: true,
    },
    
    studentId: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
    },
    
    // ⭐ UNICEF: Out-of-school tracking
    enrollmentStatus: {
      type: String,
      required: [true, 'Enrollment status is required'],
      enum: ['enrolled', 'never_enrolled', 'dropped_out'],
      default: 'enrolled',
    },
    
    enrollmentDate: {
      type: Date,
    },
    
    dropoutDate: {
      type: Date,
    },
    
    dropoutReason: {
      type: String,
      enum: [
        'Poverty',
        'Child Labor',
        'Early Marriage',
        'Pregnancy',
        'Migration',
        'Disability',
        'Distance to School',
        'Lack of Interest',
        'Family Issues',
        'Health Issues',
        'Other',
      ],
    },
    
    // ⭐ UNICEF: Location tracking (disaggregated data)
    locationType: {
      type: String,
      required: [true, 'Location type is required'],
      enum: ['Urban', 'Rural', 'Remote'],
      default: 'Rural',
    },
    
    homeGPS: {
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
    
    community: {
      type: String,
      trim: true,
    },
    
    // ⭐ UNICEF: Wealth proxy (disaggregated data)
    wealthProxy: {
      type: String,
      enum: ['phone_verified', 'proxy_only', 'no_contact'],
      default: 'no_contact',
    },
    
    // Parent/Guardian contacts
    parentContacts: {
      type: [parentContactSchema],
      validate: {
        validator: function (contacts) {
          return contacts.length > 0 || this.enrollmentStatus === 'never_enrolled';
        },
        message: 'At least one parent contact is required for enrolled students',
      },
    },
    
    // Registration metadata
    registeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    
    registrationSource: {
      type: String,
      enum: ['School', 'Community Outreach', 'District Office', 'Mobile App'],
      default: 'School',
    },
    
    // Status
    active: {
      type: Boolean,
      default: true,
    },
    
    // Notes
    notes: {
      type: String,
      maxlength: 1000,
    },
    
    // Special needs or interventions
    specialNeeds: {
      type: [String],
      enum: [
        'Learning Support',
        'Feeding Program',
        'Transportation',
        'Uniform Assistance',
        'Books/Materials',
        'Health Support',
        'Counseling',
      ],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for efficient queries
studentSchema.index({ school: 1, active: 1 });
studentSchema.index({ enrollmentStatus: 1 });
studentSchema.index({ gender: 1 });
studentSchema.index({ disabilityStatus: 1 });
studentSchema.index({ locationType: 1 });
studentSchema.index({ wealthProxy: 1 });
studentSchema.index({ 'parentContacts.phone': 1 });
studentSchema.index({ firstName: 'text', lastName: 'text' });

// Virtual for full name
studentSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for age
studentSchema.virtual('age').get(function () {
  if (!this.dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
});

// Virtual for verified contact count
studentSchema.virtual('verifiedContactCount').get(function () {
  return this.parentContacts.filter((c) => c.verified).length;
});

// Instance method to check if student is out of school
studentSchema.methods.isOutOfSchool = function () {
  return ['never_enrolled', 'dropped_out'].includes(this.enrollmentStatus);
};

// Instance method to get primary contact
studentSchema.methods.getPrimaryContact = function () {
  // Return first verified contact, or first contact if none verified
  const verified = this.parentContacts.find((c) => c.verified && !c.optedOut);
  return verified || this.parentContacts.find((c) => !c.optedOut) || this.parentContacts[0];
};

// Instance method to check if student has disability
studentSchema.methods.hasDisability = function () {
  return this.disabilityStatus !== 'None';
};

// Static method to find out-of-school children
studentSchema.statics.findOutOfSchool = function (filters = {}) {
  return this.find({
    enrollmentStatus: { $in: ['never_enrolled', 'dropped_out'] },
    active: true,
    ...filters,
  }).populate('school');
};

// Static method to find students by school
studentSchema.statics.findBySchool = function (schoolId, includeInactive = false) {
  const query = { school: schoolId };
  if (!includeInactive) query.active = true;
  return this.find(query).sort({ lastName: 1, firstName: 1 });
};

// Static method for disaggregated data queries
studentSchema.statics.getDisaggregatedStats = async function (filters = {}) {
  const pipeline = [
    { $match: { active: true, ...filters } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        byGender: {
          $push: {
            gender: '$gender',
            disability: '$disabilityStatus',
            location: '$locationType',
            enrollment: '$enrollmentStatus',
          },
        },
      },
    },
  ];
  
  return this.aggregate(pipeline);
};

// Pre-save middleware
studentSchema.pre('save', function (next) {
  // Update wealth proxy based on contact verification
  if (this.isModified('parentContacts')) {
    const hasVerifiedContact = this.parentContacts.some((c) => c.verified);
    const hasProxyOnly = this.parentContacts.every((c) => c.isProxy);
    
    if (hasVerifiedContact && !hasProxyOnly) {
      this.wealthProxy = 'phone_verified';
    } else if (hasProxyOnly) {
      this.wealthProxy = 'proxy_only';
    } else {
      this.wealthProxy = 'no_contact';
    }
  }
  
  // Set enrollment date if newly enrolled
  if (this.isModified('enrollmentStatus') && this.enrollmentStatus === 'enrolled' && !this.enrollmentDate) {
    this.enrollmentDate = new Date();
  }
  
  // Set dropout date if status changed to dropped_out
  if (this.isModified('enrollmentStatus') && this.enrollmentStatus === 'dropped_out' && !this.dropoutDate) {
    this.dropoutDate = new Date();
  }
  
  next();
});

const Student = mongoose.model('Student', studentSchema);

module.exports = Student;
