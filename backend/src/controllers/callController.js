const CallLog = require('../models/CallLog');
const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const { success, error: errorResponse, notFound } = require('../utils/response');
const logger = require('../utils/logger');

/**
 * Create a manual call log entry
 * POST /api/calls
 */
const createCallLog = async (req, res, next) => {
  try {
    const {
      studentId,
      attendanceId,
      phone,
      contactName,
      result,
      durationSeconds,
      dtmfInput,
      dtmfMeaning,
      notes,
    } = req.body;

    // Verify student exists
    const student = await Student.findById(studentId);
    if (!student) {
      return notFound(res, 'Student not found');
    }

    // Create call log
    const callLog = await CallLog.create({
      student: studentId,
      attendance: attendanceId,
      phone,
      contactName,
      provider: 'manual',
      timePlaced: new Date(),
      timeAnswered: result === 'answered' ? new Date() : undefined,
      timeEnded: result === 'answered' ? new Date() : undefined,
      durationSeconds: result === 'answered' ? durationSeconds : 0,
      result,
      dtmfInput,
      dtmfMeaning,
      attemptNumber: 1,
      metadata: notes ? { notes } : {},
    });

    await callLog.populate('student', 'firstName lastName class');
    
    logger.info(`Manual call log created for student ${studentId} by ${req.user.userId}`);
    
    success(res, callLog, 'Call log created successfully', 201);
  } catch (err) {
    next(err);
  }
};

/**
 * Get call logs for a student
 * GET /api/calls/student/:studentId
 */
const getStudentCallLogs = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await CallLog.countDocuments({ student: studentId });

    const callLogs = await CallLog.find({ student: studentId })
      .populate('student', 'firstName lastName class')
      .populate('attendance', 'date status')
      .sort({ timePlaced: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalPages = Math.ceil(total / parseInt(limit));

    success(res, {
      callLogs,
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
 * Get all call logs (with filters)
 * GET /api/calls
 */
const getCallLogs = async (req, res, next) => {
  try {
    const {
      student,
      result,
      provider,
      startDate,
      endDate,
      page = 1,
      limit = 50,
    } = req.query;

    const query = {};

    if (student) query.student = student;
    if (result) query.result = result;
    if (provider) query.provider = provider;

    // Date range
    if (startDate || endDate) {
      query.timePlaced = {};
      if (startDate) query.timePlaced.$gte = new Date(startDate);
      if (endDate) query.timePlaced.$lte = new Date(endDate);
    }

    // School filter for teachers
    if (['teacher', 'headteacher'].includes(req.user.role) && req.user.school) {
      const students = await Student.find({ school: req.user.school }).select('_id');
      const studentIds = students.map(s => s._id);
      query.student = { $in: studentIds };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await CallLog.countDocuments(query);

    const callLogs = await CallLog.find(query)
      .populate('student', 'firstName lastName class')
      .populate('attendance', 'date status')
      .sort({ timePlaced: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalPages = Math.ceil(total / parseInt(limit));

    success(res, {
      callLogs,
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
 * Get call statistics
 * GET /api/calls/stats
 */
const getCallStats = async (req, res, next) => {
  try {
    const { studentId, startDate, endDate } = req.query;

    const query = {};
    if (studentId) query.student = studentId;

    if (startDate || endDate) {
      query.timePlaced = {};
      if (startDate) query.timePlaced.$gte = new Date(startDate);
      if (endDate) query.timePlaced.$lte = new Date(endDate);
    }

    // School filter for teachers
    if (['teacher', 'headteacher'].includes(req.user.role) && req.user.school) {
      const students = await Student.find({ school: req.user.school }).select('_id');
      const studentIds = students.map(s => s._id);
      query.student = { $in: studentIds };
    }

    const totalCalls = await CallLog.countDocuments(query);
    const answeredCalls = await CallLog.countDocuments({ ...query, result: 'answered' });
    const noAnswerCalls = await CallLog.countDocuments({ ...query, result: 'no_answer' });
    const failedCalls = await CallLog.countDocuments({ ...query, result: 'failed' });

    const stats = {
      totalCalls,
      answeredCalls,
      noAnswerCalls,
      failedCalls,
      successRate: totalCalls > 0 ? Math.round((answeredCalls / totalCalls) * 100) : 0,
    };

    success(res, stats);
  } catch (err) {
    next(err);
  }
};

/**
 * Update a call log
 * PUT /api/calls/:id
 */
const updateCallLog = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const callLog = await CallLog.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    ).populate('student', 'firstName lastName class');

    if (!callLog) {
      return notFound(res, 'Call log not found');
    }

    logger.info(`Call log ${id} updated by ${req.user.userId}`);
    
    success(res, callLog, 'Call log updated successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * Delete a call log
 * DELETE /api/calls/:id
 */
const deleteCallLog = async (req, res, next) => {
  try {
    const { id } = req.params;

    const callLog = await CallLog.findByIdAndDelete(id);

    if (!callLog) {
      return notFound(res, 'Call log not found');
    }

    logger.info(`Call log ${id} deleted by ${req.user.userId}`);
    
    success(res, null, 'Call log deleted successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createCallLog,
  getStudentCallLogs,
  getCallLogs,
  getCallStats,
  updateCallLog,
  deleteCallLog,
};
