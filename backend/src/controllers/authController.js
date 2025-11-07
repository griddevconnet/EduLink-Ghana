const { User } = require('../models');
const { generateAccessToken, generateRefreshToken } = require('../utils/jwt');
const { success, created, badRequest, unauthorized, notFound } = require('../utils/response');
const logger = require('../utils/logger');

/**
 * Authentication Controller
 */

/**
 * Register new user
 * POST /api/auth/register
 */
const register = async (req, res, next) => {
  try {
    const { firstName, lastName, phone, email, password, role, school } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return badRequest(res, 'Phone number already registered');
    }
    
    // Create user
    const user = await User.create({
      firstName,
      lastName,
      phone,
      email,
      password,
      role: role || 'teacher',
      school,
    });
    
    // Generate verification code
    const verificationCode = user.generateVerificationCode();
    await user.save();
    
    // TODO: Send verification SMS via Africa's Talking
    logger.info(`Verification code for ${phone}: ${verificationCode}`);
    
    // Generate token
    const token = generateAccessToken(user);
    
    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;
    
    created(res, {
      user: userResponse,
      token,
      verificationRequired: true,
    }, 'User registered successfully. Please verify your phone number.');
  } catch (error) {
    next(error);
  }
};

/**
 * Login user
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { phone, password } = req.body;
    
    // Find user with password field
    const user = await User.findOne({ phone }).select('+password').populate('school', 'name region district');
    
    if (!user) {
      return unauthorized(res, 'Invalid phone number or password');
    }
    
    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return unauthorized(res, 'Invalid phone number or password');
    }
    
    // Check if user is active
    if (!user.active) {
      return forbidden(res, 'Account is inactive. Please contact administrator.');
    }
    
    // Update last login
    user.lastLogin = new Date();
    await user.save();
    
    // Generate token
    const token = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    
    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;
    
    logger.info(`User logged in: ${user.phone}`);
    
    success(res, {
      user: userResponse,
      token,
      refreshToken,
    }, 'Login successful');
  } catch (error) {
    next(error);
  }
};

/**
 * Verify phone number
 * POST /api/auth/verify-phone
 */
const verifyPhone = async (req, res, next) => {
  try {
    const { phone, code } = req.body;
    
    // Find user with verification code
    const user = await User.findOne({ phone }).select('+verificationCode +verificationCodeExpires');
    
    if (!user) {
      return notFound(res, 'User not found');
    }
    
    // Check if code matches and not expired
    if (user.verificationCode !== code) {
      return badRequest(res, 'Invalid verification code');
    }
    
    if (user.verificationCodeExpires < Date.now()) {
      return badRequest(res, 'Verification code expired. Please request a new one.');
    }
    
    // Mark phone as verified
    user.phoneVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    await user.save();
    
    logger.info(`Phone verified: ${phone}`);
    
    success(res, { phoneVerified: true }, 'Phone number verified successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Resend verification code
 * POST /api/auth/resend-verification
 */
const resendVerification = async (req, res, next) => {
  try {
    const { phone } = req.body;
    
    const user = await User.findOne({ phone });
    
    if (!user) {
      return notFound(res, 'User not found');
    }
    
    if (user.phoneVerified) {
      return badRequest(res, 'Phone number already verified');
    }
    
    // Generate new verification code
    const verificationCode = user.generateVerificationCode();
    await user.save();
    
    // TODO: Send verification SMS
    logger.info(`New verification code for ${phone}: ${verificationCode}`);
    
    success(res, { codeSent: true }, 'Verification code sent successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user
 * GET /api/auth/me
 */
const getMe = async (req, res, next) => {
  try {
    // User is already attached by authenticate middleware
    const user = await User.findById(req.user._id).populate('school', 'name region district');
    
    if (!user) {
      return notFound(res, 'User not found');
    }
    
    success(res, { user }, 'User retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Update current user profile
 * PUT /api/auth/me
 */
const updateMe = async (req, res, next) => {
  try {
    const { firstName, lastName, email, schoolInfo } = req.body;
    
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return notFound(res, 'User not found');
    }
    
    // Update allowed fields
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (email) user.email = email;
    
    // Handle school setup
    if (schoolInfo) {
      const { School } = require('../models');
      console.log('Updating school info:', schoolInfo);
      console.log('User current school:', user.school);
      
      let school;
      
      // If user already has a school, update it
      if (user.school) {
        school = await School.findById(user.school);
        if (school) {
          console.log('Updating existing school:', school._id);
          // Update existing school
          school.name = schoolInfo.name;
          school.region = schoolInfo.region || 'Greater Accra';
          school.district = schoolInfo.district;
          school.address = schoolInfo.address;
          await school.save();
          console.log('School updated successfully:', school);
        }
      }
      
      // If no existing school or school not found, create/find new one
      if (!school) {
        // Try to find existing school by name, region, and district
        school = await School.findOne({ 
          name: { $regex: new RegExp(schoolInfo.name, 'i') },
          region: schoolInfo.region || 'Greater Accra',
          district: schoolInfo.district
        });
        
        if (!school) {
          // Create new school if it doesn't exist
          school = await School.create({
            name: schoolInfo.name,
            region: schoolInfo.region || 'Greater Accra',
            district: schoolInfo.district,
            address: schoolInfo.address,
            type: 'Primary',
            ownership: 'Public',
            active: true,
          });
        }
        
        // Associate school with user
        user.school = school._id;
      }
    }
    
    await user.save();
    
    // Populate school information for response
    await user.populate('school', 'name region district');
    
    success(res, { user }, 'Profile updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Change password
 * POST /api/auth/change-password
 */
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // Get user with password
    const user = await User.findById(req.user._id).select('+password');
    
    if (!user) {
      return notFound(res, 'User not found');
    }
    
    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return unauthorized(res, 'Current password is incorrect');
    }
    
    // Update password
    user.password = newPassword;
    await user.save();
    
    logger.info(`Password changed for user: ${user.phone}`);
    
    success(res, {}, 'Password changed successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Forgot password - Request reset
 * POST /api/auth/forgot-password
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { phone } = req.body;
    
    const user = await User.findOne({ phone });
    
    if (!user) {
      // Don't reveal if user exists
      return success(res, {}, 'If the phone number exists, a reset code will be sent');
    }
    
    // Generate reset code (6-digit)
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetPasswordToken = resetCode;
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();
    
    // TODO: Send reset code via SMS
    logger.info(`Password reset code for ${phone}: ${resetCode}`);
    
    success(res, {}, 'If the phone number exists, a reset code will be sent');
  } catch (error) {
    next(error);
  }
};

/**
 * Reset password with code
 * POST /api/auth/reset-password
 */
const resetPassword = async (req, res, next) => {
  try {
    const { phone, code, newPassword } = req.body;
    
    const user = await User.findOne({ phone }).select('+resetPasswordToken +resetPasswordExpires');
    
    if (!user) {
      return badRequest(res, 'Invalid reset code');
    }
    
    // Verify reset code
    if (user.resetPasswordToken !== code) {
      return badRequest(res, 'Invalid reset code');
    }
    
    if (user.resetPasswordExpires < Date.now()) {
      return badRequest(res, 'Reset code expired. Please request a new one.');
    }
    
    // Update password
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    
    logger.info(`Password reset for user: ${phone}`);
    
    success(res, {}, 'Password reset successfully. Please login with your new password.');
  } catch (error) {
    next(error);
  }
};

/**
 * Logout (client-side token removal)
 * POST /api/auth/logout
 */
const logout = async (req, res, next) => {
  try {
    // In a stateless JWT system, logout is handled client-side
    // But we can log it for analytics
    logger.info(`User logged out: ${req.user.phone}`);
    
    success(res, {}, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  verifyPhone,
  resendVerification,
  getMe,
  updateMe,
  changePassword,
  forgotPassword,
  resetPassword,
  logout,
};
