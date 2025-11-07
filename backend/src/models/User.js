const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    // Personal information
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
    
    // Contact information
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      unique: true,
      trim: true,
      match: [/^\+?[0-9]{10,15}$/, 'Please provide a valid phone number'],
    },
    
    email: {
      type: String,
      trim: true,
      lowercase: true,
      sparse: true, // Allow null but enforce uniqueness when present
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    
    // Authentication
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Don't return password by default
    },
    
    // Role and permissions
    role: {
      type: String,
      required: [true, 'User role is required'],
      enum: {
        values: ['teacher', 'headteacher', 'admin', 'district_officer', 'national_admin'],
        message: '{VALUE} is not a valid role',
      },
      default: 'teacher',
    },
    
    // School association
    school: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School',
      required: false, // Made optional for initial registration
    },
    
    // District/Region for officers
    assignedDistrict: {
      type: String,
      trim: true,
    },
    
    assignedRegion: {
      type: String,
      trim: true,
    },
    
    // Verification
    phoneVerified: {
      type: Boolean,
      default: false,
    },
    
    emailVerified: {
      type: Boolean,
      default: false,
    },
    
    verificationCode: {
      type: String,
      select: false,
    },
    
    verificationCodeExpires: {
      type: Date,
      select: false,
    },
    
    // Status
    active: {
      type: Boolean,
      default: true,
    },
    
    lastLogin: {
      type: Date,
    },
    
    // Password reset
    resetPasswordToken: {
      type: String,
      select: false,
    },
    
    resetPasswordExpires: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
userSchema.index({ phone: 1 });
userSchema.index({ email: 1 });
userSchema.index({ school: 1 });
userSchema.index({ role: 1, active: 1 });

// Virtual for full name
userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  // Only hash password if it's modified
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Instance method to check if user has permission
userSchema.methods.hasPermission = function (requiredRole) {
  const roleHierarchy = {
    teacher: 1,
    headteacher: 2,
    district_officer: 3,
    admin: 4,
    national_admin: 5,
  };
  
  return roleHierarchy[this.role] >= roleHierarchy[requiredRole];
};

// Instance method to generate verification code
userSchema.methods.generateVerificationCode = function () {
  const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
  this.verificationCode = code;
  this.verificationCodeExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  return code;
};

// Static method to find teachers by school
userSchema.statics.findTeachersBySchool = function (schoolId) {
  return this.find({ school: schoolId, role: { $in: ['teacher', 'headteacher'] }, active: true });
};

// Static method to find district officers
userSchema.statics.findDistrictOfficers = function (district) {
  return this.find({ role: 'district_officer', assignedDistrict: district, active: true });
};

const User = mongoose.model('User', userSchema);

module.exports = User;
