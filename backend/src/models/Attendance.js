const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
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
    
    date: {
      type: Date,
      required: [true, 'Attendance date is required'],
      default: Date.now,
    },
    
    status: {
      type: String,
      required: [true, 'Attendance status is required'],
      enum: ['present', 'absent', 'excused', 'late'],
      default: 'present',
    },
    
    // Absence reason
    reason: {
      type: String,
      enum: [
        'sick',
        'travel',
        'family_emergency',
        'work',
        'migration',
        'weather',
        'transport',
        'other',
        'unknown',
      ],
    },
    
    reasonDetails: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    
    // Who marked the attendance
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Marked by user is required'],
    },
    
    // Source of attendance record
    source: {
      type: String,
      enum: ['teacher', 'parent', 'proxy', 'system'],
      default: 'teacher',
    },
    
    // Follow-up tracking
    followUpRequired: {
      type: Boolean,
      default: function () {
        // All absences require follow-up by default
        return this.status === 'absent';
      },
    },
    
    followUpCompleted: {
      type: Boolean,
      default: false,
    },
    
    followUpCompletedAt: {
      type: Date,
    },
    
    // Call triggered for this absence
    callTriggered: {
      type: Boolean,
      default: false,
    },
    
    callLog: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CallLog',
    },
    
    // Notes
    notes: {
      type: String,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
attendanceSchema.index({ student: 1, date: -1 });
attendanceSchema.index({ school: 1, date: -1 });
attendanceSchema.index({ date: -1, status: 1 });
attendanceSchema.index({ followUpRequired: 1, followUpCompleted: 1 });
attendanceSchema.index({ student: 1, status: 1, date: -1 });

// Ensure one attendance record per student per day
attendanceSchema.index({ student: 1, date: 1 }, { unique: true });

// Instance method to mark follow-up complete
attendanceSchema.methods.completeFollowUp = function (reason, details) {
  this.followUpCompleted = true;
  this.followUpCompletedAt = new Date();
  if (reason) this.reason = reason;
  if (details) this.reasonDetails = details;
  return this.save();
};

// Static method to get attendance for a student in date range
attendanceSchema.statics.getStudentAttendance = function (studentId, startDate, endDate) {
  const query = { student: studentId };
  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = new Date(startDate);
    if (endDate) query.date.$lte = new Date(endDate);
  }
  return this.find(query).sort({ date: -1 }).populate('markedBy', 'firstName lastName');
};

// Static method to get school attendance for a date
attendanceSchema.statics.getSchoolAttendance = function (schoolId, date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  return this.find({
    school: schoolId,
    date: { $gte: startOfDay, $lte: endOfDay },
  }).populate('student', 'firstName lastName class');
};

// Static method to get absence statistics
attendanceSchema.statics.getAbsenceStats = async function (filters = {}) {
  const pipeline = [
    { $match: { status: 'absent', ...filters } },
    {
      $group: {
        _id: '$reason',
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
  ];
  
  return this.aggregate(pipeline);
};

// Static method to find students needing follow-up
attendanceSchema.statics.findNeedingFollowUp = function (schoolId) {
  const query = {
    followUpRequired: true,
    followUpCompleted: false,
  };
  
  if (schoolId) query.school = schoolId;
  
  return this.find(query)
    .populate('student', 'firstName lastName parentContacts')
    .populate('school', 'name')
    .sort({ date: -1 });
};

// Static method to calculate attendance rate
attendanceSchema.statics.calculateAttendanceRate = async function (studentId, days = 30) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const records = await this.find({
    student: studentId,
    date: { $gte: startDate, $lte: endDate },
  });
  
  if (records.length === 0) return null;
  
  const presentCount = records.filter((r) => r.status === 'present').length;
  return {
    total: records.length,
    present: presentCount,
    absent: records.filter((r) => r.status === 'absent').length,
    rate: (presentCount / records.length) * 100,
  };
};

// Pre-save middleware
attendanceSchema.pre('save', function (next) {
  // Normalize date to start of day
  if (this.isModified('date')) {
    const date = new Date(this.date);
    date.setHours(0, 0, 0, 0);
    this.date = date;
  }
  
  // Set followUpRequired based on status
  // All absences require follow-up unless explicitly marked as not needed
  if (this.isModified('status') || this.isModified('reason')) {
    // Require follow-up for all absences, except excused absences with a valid reason
    this.followUpRequired = this.status === 'absent' && 
                            this.status !== 'excused' &&
                            !this.followUpCompleted;
  }
  
  next();
});

const Attendance = mongoose.model('Attendance', attendanceSchema);

module.exports = Attendance;
