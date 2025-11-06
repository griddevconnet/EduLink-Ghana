const mongoose = require('mongoose');

/**
 * MessageTemplate Model
 * Stores multilingual message templates for IVR, SMS, and WhatsApp
 */

const messageTemplateSchema = new mongoose.Schema(
  {
    // Template identification
    name: {
      type: String,
      required: [true, 'Template name is required'],
      unique: true,
      trim: true,
    },
    
    code: {
      type: String,
      required: [true, 'Template code is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    
    // Template type
    type: {
      type: String,
      required: [true, 'Template type is required'],
      enum: ['ivr_voice', 'sms', 'whatsapp', 'ussd', 'email'],
    },
    
    category: {
      type: String,
      required: [true, 'Template category is required'],
      enum: [
        'absence_notification',
        'contact_verification',
        'learning_tip',
        'attendance_reminder',
        'intervention_message',
        'general_announcement',
        'emergency_alert',
      ],
    },
    
    // Language and content
    language: {
      type: String,
      required: [true, 'Language is required'],
      enum: ['English', 'Twi', 'Ewe', 'Ga', 'Dagbani', 'Hausa', 'Gonja', 'Fante', 'Nzema'],
    },
    
    content: {
      type: String,
      required: [true, 'Template content is required'],
      maxlength: 2000,
    },
    
    // For IVR - audio file path
    audioFilePath: {
      type: String,
      trim: true,
    },
    
    audioStorageProvider: {
      type: String,
      enum: ['s3', 'digitalocean', 'local', 'tts'],
    },
    
    audioDurationSeconds: {
      type: Number,
      min: 0,
    },
    
    // Variables supported in template
    variables: {
      type: [String],
      default: [],
    },
    
    // Example: "Hello {{parent_name}}, {{child_name}} was absent today."
    // Variables: ['parent_name', 'child_name']
    
    // Quality control
    qualityReviewed: {
      type: Boolean,
      default: false,
    },
    
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    
    reviewedAt: {
      type: Date,
    },
    
    // Translation metadata
    translatedFrom: {
      type: String,
      enum: ['English', 'Twi', 'Ewe', 'Ga', 'Dagbani', 'Hausa', 'Gonja', 'Fante', 'Nzema'],
    },
    
    translatedBy: {
      type: String,
      trim: true,
    },
    
    // Usage tracking
    timesUsed: {
      type: Number,
      default: 0,
    },
    
    lastUsedAt: {
      type: Date,
    },
    
    // Status
    active: {
      type: Boolean,
      default: true,
    },
    
    // Metadata
    notes: {
      type: String,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
messageTemplateSchema.index({ code: 1, language: 1 }, { unique: true });
messageTemplateSchema.index({ type: 1, category: 1 });
messageTemplateSchema.index({ language: 1, active: 1 });
messageTemplateSchema.index({ name: 'text', content: 'text' });

// Instance method to render template with variables
messageTemplateSchema.methods.render = function (variables = {}) {
  let rendered = this.content;
  
  // Replace {{variable}} with actual values
  Object.keys(variables).forEach((key) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    rendered = rendered.replace(regex, variables[key] || '');
  });
  
  // Increment usage counter
  this.timesUsed += 1;
  this.lastUsedAt = new Date();
  this.save().catch((err) => console.error('Failed to update template usage:', err));
  
  return rendered;
};

// Instance method to check if all required variables are provided
messageTemplateSchema.methods.validateVariables = function (variables = {}) {
  const missing = this.variables.filter((v) => !(v in variables));
  return {
    valid: missing.length === 0,
    missing,
  };
};

// Static method to find templates by type and language
messageTemplateSchema.statics.findByTypeAndLanguage = function (type, language) {
  return this.find({ type, language, active: true });
};

// Static method to find template by code and language
messageTemplateSchema.statics.findByCode = function (code, language = 'English') {
  return this.findOne({ code: code.toUpperCase(), language, active: true });
};

// Static method to get all languages for a template code
messageTemplateSchema.statics.getAllLanguages = function (code) {
  return this.find({ code: code.toUpperCase(), active: true }).select('language content');
};

// Static method to find templates needing review
messageTemplateSchema.statics.findNeedingReview = function () {
  return this.find({ qualityReviewed: false, active: true }).sort({ createdAt: 1 });
};

// Static method to get usage statistics
messageTemplateSchema.statics.getUsageStats = async function () {
  const pipeline = [
    { $match: { active: true } },
    {
      $group: {
        _id: {
          type: '$type',
          language: '$language',
        },
        totalTemplates: { $sum: 1 },
        totalUsage: { $sum: '$timesUsed' },
        avgUsage: { $avg: '$timesUsed' },
      },
    },
    { $sort: { totalUsage: -1 } },
  ];
  
  return this.aggregate(pipeline);
};

// Pre-save middleware
messageTemplateSchema.pre('save', function (next) {
  // Extract variables from content ({{variable}} format)
  if (this.isModified('content')) {
    const variableRegex = /{{(\w+)}}/g;
    const matches = [...this.content.matchAll(variableRegex)];
    this.variables = [...new Set(matches.map((m) => m[1]))];
  }
  
  // Uppercase code
  if (this.isModified('code')) {
    this.code = this.code.toUpperCase();
  }
  
  next();
});

const MessageTemplate = mongoose.model('MessageTemplate', messageTemplateSchema);

module.exports = MessageTemplate;
