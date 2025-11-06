const mongoose = require('mongoose');

/**
 * LearningAssessment Model
 * ⭐ NEW for UNICEF Challenge - Track foundational literacy and numeracy outcomes
 */

const learningAssessmentSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student reference is required'],
    },
    
    school: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School',
      required: [true, 'School reference is required'],
    },
    
    assessmentDate: {
      type: Date,
      required: [true, 'Assessment date is required'],
      default: Date.now,
    },
    
    // Literacy assessment
    literacyLevel: {
      type: String,
      required: [true, 'Literacy level is required'],
      enum: ['below_benchmark', 'meeting_benchmark', 'exceeding_benchmark', 'not_assessed'],
      default: 'not_assessed',
    },
    
    literacyScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    
    literacyDetails: {
      canReadSimpleSentence: {
        type: Boolean,
      },
      canWriteName: {
        type: Boolean,
      },
      canIdentifyLetters: {
        type: Boolean,
      },
      readingFluency: {
        type: String,
        enum: ['none', 'low', 'medium', 'high'],
      },
    },
    
    // Numeracy assessment
    numeracyLevel: {
      type: String,
      required: [true, 'Numeracy level is required'],
      enum: ['below_benchmark', 'meeting_benchmark', 'exceeding_benchmark', 'not_assessed'],
      default: 'not_assessed',
    },
    
    numeracyScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    
    numeracyDetails: {
      canCountTo20: {
        type: Boolean,
      },
      canSolveBasicAddition: {
        type: Boolean,
      },
      canSolveBasicSubtraction: {
        type: Boolean,
      },
      numberRecognition: {
        type: String,
        enum: ['none', 'low', 'medium', 'high'],
      },
    },
    
    // Overall assessment
    overallLevel: {
      type: String,
      enum: ['below_benchmark', 'meeting_benchmark', 'exceeding_benchmark', 'not_assessed'],
    },
    
    // Assessment metadata
    assessedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Assessed by user is required'],
    },
    
    assessmentType: {
      type: String,
      enum: ['quick_check', 'formal_test', 'observation', 'parent_report'],
      default: 'quick_check',
    },
    
    // Class/grade context
    classLevel: {
      type: String,
      trim: true,
    },
    
    // Notes and recommendations
    teacherNotes: {
      type: String,
      maxlength: 1000,
    },
    
    recommendations: {
      type: [String],
      enum: [
        'Extra Reading Practice',
        'Math Tutoring',
        'Parental Support',
        'Learning Materials',
        'Special Education Referral',
        'Peer Tutoring',
        'After School Program',
      ],
    },
    
    // Follow-up tracking
    followUpRequired: {
      type: Boolean,
      default: false,
    },
    
    followUpCompleted: {
      type: Boolean,
      default: false,
    },
    
    followUpDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
learningAssessmentSchema.index({ student: 1, assessmentDate: -1 });
learningAssessmentSchema.index({ school: 1, assessmentDate: -1 });
learningAssessmentSchema.index({ literacyLevel: 1 });
learningAssessmentSchema.index({ numeracyLevel: 1 });
learningAssessmentSchema.index({ overallLevel: 1 });

// Virtual for needs intervention
learningAssessmentSchema.virtual('needsIntervention').get(function () {
  return (
    this.literacyLevel === 'below_benchmark' ||
    this.numeracyLevel === 'below_benchmark' ||
    this.overallLevel === 'below_benchmark'
  );
});

// Instance method to calculate overall level
learningAssessmentSchema.methods.calculateOverallLevel = function () {
  if (this.literacyLevel === 'not_assessed' || this.numeracyLevel === 'not_assessed') {
    this.overallLevel = 'not_assessed';
    return this.overallLevel;
  }
  
  const levels = { below_benchmark: 1, meeting_benchmark: 2, exceeding_benchmark: 3 };
  const literacyValue = levels[this.literacyLevel] || 0;
  const numeracyValue = levels[this.numeracyLevel] || 0;
  const average = (literacyValue + numeracyValue) / 2;
  
  if (average < 1.5) {
    this.overallLevel = 'below_benchmark';
  } else if (average < 2.5) {
    this.overallLevel = 'meeting_benchmark';
  } else {
    this.overallLevel = 'exceeding_benchmark';
  }
  
  return this.overallLevel;
};

// Static method to get student assessment history
learningAssessmentSchema.statics.getStudentHistory = function (studentId) {
  return this.find({ student: studentId })
    .sort({ assessmentDate: -1 })
    .populate('assessedBy', 'firstName lastName');
};

// Static method to get school assessment summary
learningAssessmentSchema.statics.getSchoolSummary = async function (schoolId, startDate, endDate) {
  const query = { school: schoolId };
  
  if (startDate || endDate) {
    query.assessmentDate = {};
    if (startDate) query.assessmentDate.$gte = new Date(startDate);
    if (endDate) query.assessmentDate.$lte = new Date(endDate);
  }
  
  const pipeline = [
    { $match: query },
    {
      $group: {
        _id: null,
        totalAssessed: { $sum: 1 },
        literacyBelowBenchmark: {
          $sum: { $cond: [{ $eq: ['$literacyLevel', 'below_benchmark'] }, 1, 0] },
        },
        literacyMeetingBenchmark: {
          $sum: { $cond: [{ $eq: ['$literacyLevel', 'meeting_benchmark'] }, 1, 0] },
        },
        literacyExceedingBenchmark: {
          $sum: { $cond: [{ $eq: ['$literacyLevel', 'exceeding_benchmark'] }, 1, 0] },
        },
        numeracyBelowBenchmark: {
          $sum: { $cond: [{ $eq: ['$numeracyLevel', 'below_benchmark'] }, 1, 0] },
        },
        numeracyMeetingBenchmark: {
          $sum: { $cond: [{ $eq: ['$numeracyLevel', 'meeting_benchmark'] }, 1, 0] },
        },
        numeracyExceedingBenchmark: {
          $sum: { $cond: [{ $eq: ['$numeracyLevel', 'exceeding_benchmark'] }, 1, 0] },
        },
        avgLiteracyScore: { $avg: '$literacyScore' },
        avgNumeracyScore: { $avg: '$numeracyScore' },
      },
    },
  ];
  
  return this.aggregate(pipeline);
};

// Static method for disaggregated learning outcomes (UNICEF requirement)
learningAssessmentSchema.statics.getDisaggregatedOutcomes = async function (filters = {}) {
  // This will be joined with Student model to get gender, disability, location data
  const pipeline = [
    { $match: filters },
    {
      $lookup: {
        from: 'students',
        localField: 'student',
        foreignField: '_id',
        as: 'studentData',
      },
    },
    { $unwind: '$studentData' },
    {
      $group: {
        _id: {
          gender: '$studentData.gender',
          disability: '$studentData.disabilityStatus',
          location: '$studentData.locationType',
        },
        totalAssessed: { $sum: 1 },
        avgLiteracyScore: { $avg: '$literacyScore' },
        avgNumeracyScore: { $avg: '$numeracyScore' },
        belowBenchmark: {
          $sum: { $cond: [{ $eq: ['$overallLevel', 'below_benchmark'] }, 1, 0] },
        },
        meetingBenchmark: {
          $sum: { $cond: [{ $eq: ['$overallLevel', 'meeting_benchmark'] }, 1, 0] },
        },
        exceedingBenchmark: {
          $sum: { $cond: [{ $eq: ['$overallLevel', 'exceeding_benchmark'] }, 1, 0] },
        },
      },
    },
    { $sort: { '_id.gender': 1, '_id.disability': 1 } },
  ];
  
  return this.aggregate(pipeline);
};

// Static method to find students needing intervention
learningAssessmentSchema.statics.findNeedingIntervention = function (schoolId) {
  const query = {
    $or: [
      { literacyLevel: 'below_benchmark' },
      { numeracyLevel: 'below_benchmark' },
      { overallLevel: 'below_benchmark' },
    ],
  };
  
  if (schoolId) query.school = schoolId;
  
  return this.find(query)
    .populate('student', 'firstName lastName class')
    .populate('school', 'name')
    .sort({ assessmentDate: -1 });
};

// Pre-save middleware
learningAssessmentSchema.pre('save', function (next) {
  // Auto-calculate overall level if not set
  if (!this.overallLevel || this.isModified('literacyLevel') || this.isModified('numeracyLevel')) {
    this.calculateOverallLevel();
  }
  
  // Set follow-up required if below benchmark
  if (this.isModified('overallLevel')) {
    this.followUpRequired = this.overallLevel === 'below_benchmark';
  }
  
  next();
});

const LearningAssessment = mongoose.model('LearningAssessment', learningAssessmentSchema);

module.exports = LearningAssessment;
