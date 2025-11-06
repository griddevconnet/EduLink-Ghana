const mongoose = require('mongoose');

/**
 * RiskScore Model
 * Tracks dropout risk prediction for students
 */

const riskScoreSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student reference is required'],
      unique: true, // One risk score per student (updated over time)
    },
    
    // Risk score (0-1, where 1 is highest risk)
    riskScore: {
      type: Number,
      required: [true, 'Risk score is required'],
      min: 0,
      max: 1,
    },
    
    riskLevel: {
      type: String,
      required: [true, 'Risk level is required'],
      enum: ['low', 'medium', 'high', 'critical'],
    },
    
    // Features used in calculation
    features: {
      // Attendance features
      absences7Days: {
        type: Number,
        default: 0,
      },
      absences30Days: {
        type: Number,
        default: 0,
      },
      absences90Days: {
        type: Number,
        default: 0,
      },
      attendanceRate30Days: {
        type: Number,
        min: 0,
        max: 100,
      },
      consecutiveAbsences: {
        type: Number,
        default: 0,
      },
      
      // Contact features
      contactVerified: {
        type: Boolean,
        default: false,
      },
      contactResponseRate: {
        type: Number,
        min: 0,
        max: 100,
      },
      
      // Learning features
      literacyLevel: {
        type: String,
        enum: ['below_benchmark', 'meeting_benchmark', 'exceeding_benchmark', 'not_assessed'],
      },
      numeracyLevel: {
        type: String,
        enum: ['below_benchmark', 'meeting_benchmark', 'exceeding_benchmark', 'not_assessed'],
      },
      avgLearningScore: {
        type: Number,
        min: 0,
        max: 100,
      },
      
      // Demographic features
      hasDisability: {
        type: Boolean,
        default: false,
      },
      locationType: {
        type: String,
        enum: ['Urban', 'Rural', 'Remote'],
      },
      wealthProxy: {
        type: String,
        enum: ['phone_verified', 'proxy_only', 'no_contact'],
      },
      
      // Seasonal/contextual
      seasonalMigrationRisk: {
        type: Boolean,
        default: false,
      },
      
      // Historical
      previousDropoutAttempt: {
        type: Boolean,
        default: false,
      },
    },
    
    // Model information
    modelVersion: {
      type: String,
      default: '1.0-rule-based',
    },
    
    modelType: {
      type: String,
      enum: ['rule_based', 'ml_xgboost', 'ml_neural_network'],
      default: 'rule_based',
    },
    
    // Explanation
    riskFactors: {
      type: [String],
      default: [],
    },
    
    topRiskFactors: {
      type: [
        {
          factor: String,
          weight: Number,
          description: String,
        },
      ],
    },
    
    // Intervention tracking
    interventionRecommended: {
      type: Boolean,
      default: false,
    },
    
    recommendedInterventions: {
      type: [String],
      enum: [
        'Parent Engagement Call',
        'Home Visit',
        'Learning Support',
        'Feeding Program',
        'Transportation Assistance',
        'Health Referral',
        'Counseling',
        'Financial Support',
        'Special Education',
      ],
    },
    
    interventionApplied: {
      type: Boolean,
      default: false,
    },
    
    interventionDate: {
      type: Date,
    },
    
    interventionNotes: {
      type: String,
      maxlength: 1000,
    },
    
    // Tracking
    lastComputed: {
      type: Date,
      required: [true, 'Last computed date is required'],
      default: Date.now,
    },
    
    computedBy: {
      type: String,
      enum: ['system', 'manual', 'ml_service'],
      default: 'system',
    },
    
    // Historical scores for trend analysis
    scoreHistory: {
      type: [
        {
          score: Number,
          level: String,
          date: Date,
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
riskScoreSchema.index({ student: 1 });
riskScoreSchema.index({ riskLevel: 1 });
riskScoreSchema.index({ riskScore: -1 });
riskScoreSchema.index({ interventionRecommended: 1, interventionApplied: 1 });
riskScoreSchema.index({ lastComputed: -1 });

// Virtual for needs urgent attention
riskScoreSchema.virtual('needsUrgentAttention').get(function () {
  return this.riskLevel === 'critical' || (this.riskLevel === 'high' && !this.interventionApplied);
});

// Instance method to calculate risk level from score
riskScoreSchema.methods.calculateRiskLevel = function () {
  if (this.riskScore >= 0.75) {
    this.riskLevel = 'critical';
  } else if (this.riskScore >= 0.5) {
    this.riskLevel = 'high';
  } else if (this.riskScore >= 0.25) {
    this.riskLevel = 'medium';
  } else {
    this.riskLevel = 'low';
  }
  
  return this.riskLevel;
};

// Instance method to add to score history
riskScoreSchema.methods.addToHistory = function () {
  this.scoreHistory.push({
    score: this.riskScore,
    level: this.riskLevel,
    date: new Date(),
  });
  
  // Keep only last 30 entries
  if (this.scoreHistory.length > 30) {
    this.scoreHistory = this.scoreHistory.slice(-30);
  }
};

// Instance method to recommend interventions
riskScoreSchema.methods.recommendInterventions = function () {
  const interventions = [];
  
  if (this.features.absences30Days > 10) {
    interventions.push('Parent Engagement Call', 'Home Visit');
  }
  
  if (this.features.literacyLevel === 'below_benchmark' || this.features.numeracyLevel === 'below_benchmark') {
    interventions.push('Learning Support');
  }
  
  if (!this.features.contactVerified) {
    interventions.push('Parent Engagement Call');
  }
  
  if (this.features.hasDisability) {
    interventions.push('Special Education');
  }
  
  if (this.features.wealthProxy === 'no_contact') {
    interventions.push('Financial Support', 'Feeding Program');
  }
  
  if (this.features.locationType === 'Remote') {
    interventions.push('Transportation Assistance');
  }
  
  this.recommendedInterventions = [...new Set(interventions)]; // Remove duplicates
  this.interventionRecommended = interventions.length > 0;
  
  return this.recommendedInterventions;
};

// Static method to find high-risk students
riskScoreSchema.statics.findHighRisk = function (schoolId, minLevel = 'high') {
  const levels = { medium: 1, high: 2, critical: 3 };
  const minLevelValue = levels[minLevel] || 2;
  
  const query = {
    riskLevel: { $in: Object.keys(levels).filter((l) => levels[l] >= minLevelValue) },
  };
  
  return this.find(query)
    .populate({
      path: 'student',
      match: schoolId ? { school: schoolId } : {},
      select: 'firstName lastName class school enrollmentStatus',
      populate: { path: 'school', select: 'name district region' },
    })
    .sort({ riskScore: -1 });
};

// Static method to get risk distribution
riskScoreSchema.statics.getRiskDistribution = async function (filters = {}) {
  const pipeline = [
    { $match: filters },
    {
      $group: {
        _id: '$riskLevel',
        count: { $sum: 1 },
        avgScore: { $avg: '$riskScore' },
      },
    },
    { $sort: { '_id': 1 } },
  ];
  
  return this.aggregate(pipeline);
};

// Static method to find students needing intervention
riskScoreSchema.statics.findNeedingIntervention = function (schoolId) {
  const query = {
    interventionRecommended: true,
    interventionApplied: false,
  };
  
  return this.find(query)
    .populate({
      path: 'student',
      match: schoolId ? { school: schoolId } : {},
      select: 'firstName lastName class parentContacts',
    })
    .sort({ riskScore: -1 });
};

// Pre-save middleware
riskScoreSchema.pre('save', function (next) {
  // Auto-calculate risk level if score changed
  if (this.isModified('riskScore')) {
    this.calculateRiskLevel();
    this.addToHistory();
  }
  
  // Auto-recommend interventions if risk is high
  if (this.isModified('riskScore') || this.isModified('features')) {
    if (this.riskLevel === 'high' || this.riskLevel === 'critical') {
      this.recommendInterventions();
    }
  }
  
  // Update lastComputed
  if (this.isModified('riskScore')) {
    this.lastComputed = new Date();
  }
  
  next();
});

const RiskScore = mongoose.model('RiskScore', riskScoreSchema);

module.exports = RiskScore;
