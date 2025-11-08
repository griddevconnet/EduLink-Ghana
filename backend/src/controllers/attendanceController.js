const { Attendance, Student, School } = require('../models');
const { success, created, badRequest, notFound, forbidden } = require('../utils/response');
const logger = require('../utils/logger');

/**
 * Attendance Controller
 */

/**
 * Mark attendance
 * POST /api/attendance
 * @access Teacher, Headteacher
 */
const markAttendance = async (req, res, next) => {
  try {
    const { student, school, date, status, reason, reasonDetails, notes } = req.body;
    
    // Verify student exists
    const studentDoc = await Student.findById(student);
    if (!studentDoc) {
      return badRequest(res, 'Student not found');
    }
    
    // Check school access
    if (['teacher', 'headteacher'].includes(req.user.role)) {
      if (!req.user.school || req.user.school.toString() !== school) {
        return forbidden(res, 'You can only mark attendance for your school');
      }
    }
    
    // Check if attendance already exists for this student on this date
    const attendanceDate = date ? new Date(date) : new Date();
    attendanceDate.setHours(0, 0, 0, 0);
    
    const existing = await Attendance.findOne({
      student,
      date: attendanceDate,
    });
    
    if (existing) {
      return badRequest(res, 'Attendance already marked for this student today');
    }
    
    // Create attendance record
    const attendance = await Attendance.create({
      student,
      school,
      date: attendanceDate,
      status: status || 'present',
      reason,
      reasonDetails,
      markedBy: req.user._id,
      source: 'teacher',
      notes,
    });
    
    await attendance.populate('student', 'firstName lastName class');
    await attendance.populate('markedBy', 'firstName lastName');
    
    // TODO: If absent with unknown reason, trigger call job
    if (attendance.status === 'absent' && attendance.followUpRequired) {
      logger.info(`Follow-up required for student ${studentDoc.fullName}`);
      // Queue call job here in Phase 4
    }
    
    logger.info(`Attendance marked: ${studentDoc.fullName} - ${status} by ${req.user.phone}`);
    
    created(res, { attendance }, 'Attendance marked successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk mark attendance
 * POST /api/attendance/bulk
 * @access Teacher, Headteacher
 */
const bulkMarkAttendance = async (req, res, next) => {
  try {
    const { school, date, records } = req.body;
    
    // Check school access
    if (['teacher', 'headteacher'].includes(req.user.role)) {
      console.log('🔍 Bulk Attendance Authorization Check:');
      console.log('  req.user.school:', req.user.school);
      console.log('  req.user.school type:', typeof req.user.school);
      console.log('  req.user.school._id:', req.user.school?._id);
      console.log('  school from request:', school);
      console.log('  school type:', typeof school);
      
      // Extract school ID for comparison
      const userSchoolId = req.user.school?._id?.toString() || req.user.school?.toString() || req.user.school;
      console.log('  userSchoolId after extraction:', userSchoolId);
      console.log('  Match:', userSchoolId === school);
      
      if (!req.user.school || userSchoolId !== school) {
        console.log('❌ School mismatch! Returning 403');
        return forbidden(res, 'You can only mark attendance for your school');
      }
      
      console.log('✅ School match! Proceeding with bulk mark');
    }
    
    const attendanceDate = date ? new Date(date) : new Date();
    attendanceDate.setHours(0, 0, 0, 0);
    
    const results = {
      success: [],
      failed: [],
    };
    
    for (const record of records) {
      try {
        // Check if already exists
        const existing = await Attendance.findOne({
          student: record.student,
          date: attendanceDate,
        });
        
        if (existing) {
          results.failed.push({
            student: record.student,
            error: 'Already marked',
          });
          continue;
        }
        
        const attendance = await Attendance.create({
          student: record.student,
          school,
          date: attendanceDate,
          status: record.status || 'present',
          reason: record.reason,
          reasonDetails: record.reasonDetails,
          markedBy: req.user._id,
          source: 'teacher',
          notes: record.notes,
        });
        
        results.success.push(attendance._id);
      } catch (error) {
        results.failed.push({
          student: record.student,
          error: error.message,
        });
      }
    }
    
    logger.info(`Bulk attendance: ${results.success.length} success, ${results.failed.length} failed`);
    
    success(res, results, 'Bulk attendance processed');
  } catch (error) {
    next(error);
  }
};

/**
 * Get attendance records
 * GET /api/attendance
 * @access Private
 */
const getAttendance = async (req, res, next) => {
  try {
    const {
      school,
      student,
      status,
      startDate,
      endDate,
      followUpRequired,
      page = 1,
      limit = 50,
    } = req.query;
    
    const query = {};
    
    if (school) query.school = school;
    if (student) query.student = student;
    if (status) query.status = status;
    if (followUpRequired !== undefined) query.followUpRequired = followUpRequired === 'true';
    
    // Date range
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    
    // School filter for teachers
    if (['teacher', 'headteacher'].includes(req.user.role) && req.user.school) {
      query.school = req.user.school;
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Attendance.countDocuments(query);
    
    const attendance = await Attendance.find(query)
      .populate('student', 'firstName lastName class')
      .populate('school', 'name')
      .populate('markedBy', 'firstName lastName')
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const totalPages = Math.ceil(total / parseInt(limit));
    
    success(res, {
      attendance,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get student attendance
 * GET /api/attendance/student/:studentId
 * @access Private
 */
const getStudentAttendance = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const { startDate, endDate } = req.query;
    
    const student = await Student.findById(studentId);
    if (!student) {
      return notFound(res, 'Student not found');
    }
    
    const attendance = await Attendance.getStudentAttendance(studentId, startDate, endDate);
    
    // Calculate statistics
    const stats = await Attendance.calculateAttendanceRate(studentId, 30);
    
    success(res, {
      student: {
        id: student._id,
        name: student.fullName,
        class: student.class,
      },
      attendance,
      stats,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get school attendance for a date
 * GET /api/attendance/school/:schoolId/date/:date
 * @access Private
 */
const getSchoolAttendanceByDate = async (req, res, next) => {
  try {
    const { schoolId, date } = req.params;
    
    // Check school access
    if (['teacher', 'headteacher'].includes(req.user.role)) {
      if (!req.user.school || req.user.school.toString() !== schoolId) {
        return forbidden(res, 'Access denied to this school');
      }
    }
    
    const attendance = await Attendance.getSchoolAttendance(schoolId, date);
    
    // Calculate summary
    const summary = {
      total: attendance.length,
      present: attendance.filter((a) => a.status === 'present').length,
      absent: attendance.filter((a) => a.status === 'absent').length,
      excused: attendance.filter((a) => a.status === 'excused').length,
      late: attendance.filter((a) => a.status === 'late').length,
    };
    
    success(res, {
      date,
      attendance,
      summary,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get attendance needing follow-up
 * GET /api/attendance/follow-up
 * @access Private
 */
const getFollowUpRequired = async (req, res, next) => {
  try {
    const { school } = req.query;
    
    let schoolId = school;
    if (['teacher', 'headteacher'].includes(req.user.role) && req.user.school) {
      schoolId = req.user.school;
    }
    
    const attendance = await Attendance.findNeedingFollowUp(schoolId);
    
    success(res, {
      attendance,
      count: attendance.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Complete follow-up
 * POST /api/attendance/:id/complete-followup
 * @access Teacher, Headteacher
 */
const completeFollowUp = async (req, res, next) => {
  try {
    const { reason, reasonDetails } = req.body;
    
    const attendance = await Attendance.findById(req.params.id);
    if (!attendance) {
      return notFound(res, 'Attendance record not found');
    }
    
    await attendance.completeFollowUp(reason, reasonDetails);
    
    logger.info(`Follow-up completed for attendance ${attendance._id}`);
    
    success(res, { attendance }, 'Follow-up completed successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get absence statistics
 * GET /api/attendance/stats/absences
 * @access Private
 */
const getAbsenceStats = async (req, res, next) => {
  try {
    const { school, startDate, endDate } = req.query;
    
    const filters = {};
    if (school) filters.school = school;
    
    if (startDate || endDate) {
      filters.date = {};
      if (startDate) filters.date.$gte = new Date(startDate);
      if (endDate) filters.date.$lte = new Date(endDate);
    }
    
    // School filter for teachers
    if (['teacher', 'headteacher'].includes(req.user.role) && req.user.school) {
      filters.school = req.user.school;
    }
    
    const stats = await Attendance.getAbsenceStats(filters);
    
    success(res, { stats });
  } catch (error) {
    next(error);
  }
};

/**
 * Update attendance
 * PUT /api/attendance/:id
 * @access Teacher, Headteacher
 */
const updateAttendance = async (req, res, next) => {
  try {
    const { status, reason, reasonDetails, notes } = req.body;
    
    const attendance = await Attendance.findById(req.params.id);
    if (!attendance) {
      return notFound(res, 'Attendance record not found');
    }
    
    // Check school access
    if (['teacher', 'headteacher'].includes(req.user.role)) {
      if (!req.user.school || attendance.school.toString() !== req.user.school.toString()) {
        return forbidden(res, 'You can only update attendance for your school');
      }
    }
    
    if (status) attendance.status = status;
    if (reason) attendance.reason = reason;
    if (reasonDetails !== undefined) attendance.reasonDetails = reasonDetails;
    if (notes !== undefined) attendance.notes = notes;
    
    await attendance.save();
    
    logger.info(`Attendance updated: ${attendance._id} by ${req.user.phone}`);
    
    success(res, { attendance }, 'Attendance updated successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  markAttendance,
  bulkMarkAttendance,
  getAttendance,
  getStudentAttendance,
  getSchoolAttendanceByDate,
  getFollowUpRequired,
  completeFollowUp,
  getAbsenceStats,
  updateAttendance,
};
