const RiskScore = require('../models/RiskScore');
const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const { success, error: errorResponse, notFound } = require('../utils/response');
const logger = require('../utils/logger');

/**
 * Calculate risk score for a student based on attendance and other factors
 */
const calculateRiskScore = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    
    const student = await Student.findById(studentId);
    if (!student) {
      return notFound(res, 'Student not found');
    }
    
    // Calculate attendance-based features
    const now = new Date();
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const last90Days = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    
    const attendance7 = await Attendance.find({
      student: studentId,
      date: { $gte: last7Days },
    });
    
    const attendance30 = await Attendance.find({
      student: studentId,
      date: { $gte: last30Days },
    });
    
    const attendance90 = await Attendance.find({
      student: studentId,
      date: { $gte: last90Days },
    });
    
    // Calculate absences
    const absences7Days = attendance7.filter(a => a.status === 'absent').length;
    const absences30Days = attendance30.filter(a => a.status === 'absent').length;
    const absences90Days = attendance90.filter(a => a.status === 'absent').length;
    
    // Calculate attendance rate
    const attendanceRate30Days = attendance30.length > 0
      ? ((attendance30.filter(a => a.status === 'present').length / attendance30.length) * 100)
      : 100;
    
    // Calculate consecutive absences
    const sortedAttendance = await Attendance.find({
      student: studentId,
    }).sort({ date: -1 }).limit(30);
    
    let consecutiveAbsences = 0;
    for (const record of sortedAttendance) {
      if (record.status === 'absent') {
        consecutiveAbsences++;
      } else {
        break;
      }
    }
    
    // Build features object
    const features = {
      absences7Days,
      absences30Days,
      absences90Days,
      attendanceRate30Days,
      consecutiveAbsences,
      contactVerified: student.parentContacts?.some(c => c.verified) || false,
      hasDisability: student.disabilityStatus !== 'none',
      locationType: student.locationType || 'Urban',
      wealthProxy: student.wealthProxy || 'phone_verified',
    };
    
    // Simple risk calculation (can be replaced with ML model later)
    let riskScore = 0;
    
    // Attendance factors (40% weight)
    if (consecutiveAbsences >= 5) riskScore += 0.25;
    else if (consecutiveAbsences >= 3) riskScore += 0.15;
    
    if (attendanceRate30Days < 50) riskScore += 0.15;
    else if (attendanceRate30Days < 75) riskScore += 0.10;
    
    // Contact factors (20% weight)
    if (!features.contactVerified) riskScore += 0.15;
    if (features.wealthProxy === 'no_contact') riskScore += 0.05;
    
    // Demographic factors (20% weight)
    if (features.hasDisability) riskScore += 0.10;
    if (features.locationType === 'Remote') riskScore += 0.10;
    else if (features.locationType === 'Rural') riskScore += 0.05;
    
    // Recent absence spike (20% weight)
    if (absences7Days >= 4) riskScore += 0.15;
    else if (absences7Days >= 2) riskScore += 0.05;
    
    // Cap at 1.0
    riskScore = Math.min(riskScore, 1.0);
    
    // Determine risk level
    let riskLevel;
    if (riskScore >= 0.75) riskLevel = 'critical';
    else if (riskScore >= 0.50) riskLevel = 'high';
    else if (riskScore >= 0.25) riskLevel = 'medium';
    else riskLevel = 'low';
    
    // Update or create risk score
    const riskScoreDoc = await RiskScore.findOneAndUpdate(
      { student: studentId },
      {
        student: studentId,
        riskScore,
        riskLevel,
        features,
        lastCalculated: new Date(),
      },
      { upsert: true, new: true }
    ).populate('student', 'firstName lastName class');
    
    logger.info(`Risk score calculated for student ${studentId}: ${riskLevel} (${riskScore})`);
    
    success(res, riskScoreDoc, 'Risk score calculated successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * Get risk score for a student
 */
const getRiskScore = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    
    const riskScore = await RiskScore.findOne({ student: studentId })
      .populate('student', 'firstName lastName class enrollmentStatus');
    
    if (!riskScore) {
      return notFound(res, 'Risk score not found for this student');
    }
    
    success(res, riskScore);
  } catch (err) {
    next(err);
  }
};

/**
 * Get all at-risk students for a school
 */
const getAtRiskStudents = async (req, res, next) => {
  try {
    const { minRiskLevel = 'medium', page = 1, limit = 50 } = req.query;
    
    const query = {};
    
    // Filter by risk level
    const riskLevels = ['low', 'medium', 'high', 'critical'];
    const minIndex = riskLevels.indexOf(minRiskLevel);
    if (minIndex !== -1) {
      query.riskLevel = { $in: riskLevels.slice(minIndex) };
    }
    
    // School filter for teachers
    let studentIds = [];
    if (['teacher', 'headteacher'].includes(req.user.role) && req.user.school) {
      const students = await Student.find({ school: req.user.school }).select('_id');
      studentIds = students.map(s => s._id);
      query.student = { $in: studentIds };
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await RiskScore.countDocuments(query);
    
    const riskScores = await RiskScore.find(query)
      .populate('student', 'firstName lastName class enrollmentStatus')
      .sort({ riskScore: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const totalPages = Math.ceil(total / parseInt(limit));
    
    success(res, {
      riskScores,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Bulk calculate risk scores for all students in a school
 */
const bulkCalculateRiskScores = async (req, res, next) => {
  try {
    const { schoolId } = req.body;
    
    // Get all students for the school
    const students = await Student.find({ 
      school: schoolId || req.user.school,
      enrollmentStatus: 'enrolled',
    });
    
    const results = {
      total: students.length,
      calculated: 0,
      failed: 0,
      errors: [],
    };
    
    for (const student of students) {
      try {
        // Reuse the calculation logic
        const now = new Date();
        const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const last90Days = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        
        const attendance7 = await Attendance.find({
          student: student._id,
          date: { $gte: last7Days },
        });
        
        const attendance30 = await Attendance.find({
          student: student._id,
          date: { $gte: last30Days },
        });
        
        const attendance90 = await Attendance.find({
          student: student._id,
          date: { $gte: last90Days },
        });
        
        const absences7Days = attendance7.filter(a => a.status === 'absent').length;
        const absences30Days = attendance30.filter(a => a.status === 'absent').length;
        const absences90Days = attendance90.filter(a => a.status === 'absent').length;
        
        const attendanceRate30Days = attendance30.length > 0
          ? ((attendance30.filter(a => a.status === 'present').length / attendance30.length) * 100)
          : 100;
        
        const sortedAttendance = await Attendance.find({
          student: student._id,
        }).sort({ date: -1 }).limit(30);
        
        let consecutiveAbsences = 0;
        for (const record of sortedAttendance) {
          if (record.status === 'absent') {
            consecutiveAbsences++;
          } else {
            break;
          }
        }
        
        const features = {
          absences7Days,
          absences30Days,
          absences90Days,
          attendanceRate30Days,
          consecutiveAbsences,
          contactVerified: student.parentContacts?.some(c => c.verified) || false,
          hasDisability: student.disabilityStatus !== 'none',
          locationType: student.locationType || 'Urban',
          wealthProxy: student.wealthProxy || 'phone_verified',
        };
        
        let riskScore = 0;
        if (consecutiveAbsences >= 5) riskScore += 0.25;
        else if (consecutiveAbsences >= 3) riskScore += 0.15;
        
        if (attendanceRate30Days < 50) riskScore += 0.15;
        else if (attendanceRate30Days < 75) riskScore += 0.10;
        
        if (!features.contactVerified) riskScore += 0.15;
        if (features.wealthProxy === 'no_contact') riskScore += 0.05;
        
        if (features.hasDisability) riskScore += 0.10;
        if (features.locationType === 'Remote') riskScore += 0.10;
        else if (features.locationType === 'Rural') riskScore += 0.05;
        
        if (absences7Days >= 4) riskScore += 0.15;
        else if (absences7Days >= 2) riskScore += 0.05;
        
        riskScore = Math.min(riskScore, 1.0);
        
        let riskLevel;
        if (riskScore >= 0.75) riskLevel = 'critical';
        else if (riskScore >= 0.50) riskLevel = 'high';
        else if (riskScore >= 0.25) riskLevel = 'medium';
        else riskLevel = 'low';
        
        await RiskScore.findOneAndUpdate(
          { student: student._id },
          {
            student: student._id,
            riskScore,
            riskLevel,
            features,
            lastCalculated: new Date(),
          },
          { upsert: true, new: true }
        );
        
        results.calculated++;
      } catch (err) {
        results.failed++;
        results.errors.push({
          studentId: student._id,
          error: err.message,
        });
      }
    }
    
    logger.info(`Bulk risk calculation completed: ${results.calculated}/${results.total} successful`);
    
    success(res, results, 'Bulk risk calculation completed');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  calculateRiskScore,
  getRiskScore,
  getAtRiskStudents,
  bulkCalculateRiskScores,
};
