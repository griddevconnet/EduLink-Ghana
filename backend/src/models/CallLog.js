const mongoose = require('mongoose');

const callLogSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student reference is required'],
    },
    
    attendance: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Attendance',
    },
    
    // Contact information
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    
    contactName: {
      type: String,
      trim: true,
    },
    
    // Call details
    provider: {
      type: String,
      enum: ['africastalking', 'twilio', 'manual'],
      required: [true, 'Provider is required'],
    },
    
    providerCallId: {
      type: String,
      trim: true,
    },
    
    timePlaced: {
      type: Date,
      required: [true, 'Time placed is required'],
      default: Date.now,
    },
    
    timeAnswered: {
      type: Date,
    },
    
    timeEnded: {
      type: Date,
    },
    
    durationSeconds: {
      type: Number,
      min: 0,
    },
    
    // Call outcome
    result: {
      type: String,
      required: [true, 'Call result is required'],
      enum: ['answered', 'no_answer', 'busy', 'failed', 'rejected', 'voicemail'],
    },
    
    // Attempt tracking
    attemptNumber: {
      type: Number,
      default: 1,
      min: 1,
    },
    
    maxAttempts: {
      type: Number,
      default: 3,
    },
    
    // Language detection
    languageDetected: {
      type: String,
      enum: ['English', 'Twi', 'Ewe', 'Ga', 'Dagbani', 'Hausa', 'Gonja', 'Fante', 'Nzema'],
    },
    
    languageConfidence: {
      type: Number,
      min: 0,
      max: 1,
    },
    
    languageDetectionMethod: {
      type: String,
      enum: ['audio_ml', 'phone_prefix', 'user_preference', 'manual'],
    },
    
    // Parent response (DTMF or speech)
    dtmfInput: {
      type: String,
      trim: true,
    },
    
    dtmfMeaning: {
      type: String,
      enum: ['sick', 'travel', 'work', 'family_emergency', 'other', 'speak_to_teacher'],
    },
    
    speechTranscript: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    
    // Audio recording
    audioBlobPath: {
      type: String,
      trim: true,
    },
    
    audioStorageProvider: {
      type: String,
      enum: ['s3', 'digitalocean', 'local'],
    },
    
    audioDurationSeconds: {
      type: Number,
      min: 0,
    },
    
    // Cost tracking
    costAmount: {
      type: Number,
      min: 0,
    },
    
    costCurrency: {
      type: String,
      default: 'GHS',
    },
    
    // Metadata
    metadata: {
      type: Map,
      of: String,
    },
    
    // Error tracking
    error: {
      code: String,
      message: String,
    },
    
    // Follow-up scheduling
    retryScheduled: {
      type: Boolean,
      default: false,
    },
    
    retryAt: {
      type: Date,
    },
    
    retryCallLog: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CallLog',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
callLogSchema.index({ student: 1, timePlaced: -1 });
callLogSchema.index({ phone: 1 });
callLogSchema.index({ result: 1 });
callLogSchema.index({ timePlaced: -1 });
callLogSchema.index({ provider: 1, providerCallId: 1 });
callLogSchema.index({ retryScheduled: 1, retryAt: 1 });

// Virtual for call success
callLogSchema.virtual('isSuccessful').get(function () {
  return this.result === 'answered';
});

// Virtual for needs retry
callLogSchema.virtual('needsRetry').get(function () {
  return (
    ['no_answer', 'busy', 'failed'].includes(this.result) &&
    this.attemptNumber < this.maxAttempts &&
    !this.retryScheduled
  );
});

// Instance method to mark as answered
callLogSchema.methods.markAnswered = function (dtmfInput, meaning) {
  this.result = 'answered';
  this.timeAnswered = new Date();
  if (dtmfInput) this.dtmfInput = dtmfInput;
  if (meaning) this.dtmfMeaning = meaning;
  return this.save();
};

// Instance method to schedule retry
callLogSchema.methods.scheduleRetry = function (retryDate) {
  this.retryScheduled = true;
  this.retryAt = retryDate || new Date(Date.now() + 6 * 60 * 60 * 1000); // 6 hours default
  return this.save();
};

// Instance method to calculate duration
callLogSchema.methods.calculateDuration = function () {
  if (this.timeAnswered && this.timeEnded) {
    this.durationSeconds = Math.floor((this.timeEnded - this.timeAnswered) / 1000);
  }
  return this.durationSeconds;
};

// Static method to get call statistics
callLogSchema.statics.getCallStats = async function (filters = {}, startDate, endDate) {
  const query = { ...filters };
  
  if (startDate || endDate) {
    query.timePlaced = {};
    if (startDate) query.timePlaced.$gte = new Date(startDate);
    if (endDate) query.timePlaced.$lte = new Date(endDate);
  }
  
  const pipeline = [
    { $match: query },
    {
      $group: {
        _id: '$result',
        count: { $sum: 1 },
        totalCost: { $sum: '$costAmount' },
        avgDuration: { $avg: '$durationSeconds' },
      },
    },
  ];
  
  return this.aggregate(pipeline);
};

// Static method to get answer rate
callLogSchema.statics.getAnswerRate = async function (filters = {}) {
  const total = await this.countDocuments(filters);
  const answered = await this.countDocuments({ ...filters, result: 'answered' });
  
  return {
    total,
    answered,
    rate: total > 0 ? (answered / total) * 100 : 0,
  };
};

// Static method to find calls needing retry
callLogSchema.statics.findNeedingRetry = function () {
  const now = new Date();
  return this.find({
    retryScheduled: true,
    retryAt: { $lte: now },
  }).populate('student', 'firstName lastName parentContacts');
};

// Static method to get language detection stats
callLogSchema.statics.getLanguageStats = async function (filters = {}) {
  const pipeline = [
    { $match: { languageDetected: { $exists: true }, ...filters } },
    {
      $group: {
        _id: '$languageDetected',
        count: { $sum: 1 },
        avgConfidence: { $avg: '$languageConfidence' },
      },
    },
    { $sort: { count: -1 } },
  ];
  
  return this.aggregate(pipeline);
};

// Pre-save middleware
callLogSchema.pre('save', function (next) {
  // Calculate duration if times are set
  if (this.timeAnswered && this.timeEnded && !this.durationSeconds) {
    this.calculateDuration();
  }
  
  next();
});

const CallLog = mongoose.model('CallLog', callLogSchema);

module.exports = CallLog;
