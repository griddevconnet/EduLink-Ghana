const { LearningAssessment, Student, School } = require('../models');
const { success, created, badRequest, notFound, forbidden } = require('../utils/response');
const logger = require('../utils/logger');

/**
 * Learning Assessment Controller
 */

/**
 * Create learning assessment
 * POST /api/assessments
 * @access Teacher, Headteacher
 */
const createAssessment = async (req, res, next) => {
  try {
    const {
      student,
      school,
      assessmentDate,
      literacyLevel,
      literacyScore,
      literacyDetails,
      numeracyLevel,
      numeracyScore,
      numeracyDetails,
      assessmentType,
      classLevel,
      teacherNotes,
      recommendations,
    } = req.body;
    
    // Verify student exists
    const studentDoc = await Student.findById(student);
    if (!studentDoc) {
      return badRequest(res, 'Student not found');
    }
    
    // Check school access
    if (['teacher', 'headteacher'].includes(req.user.role)) {
      if (!req.user.school || req.user.school.toString() !== school) {
        return forbidden(res, 'You can only create assessments for your school');
      }
    }
    
    const assessment = await LearningAssessment.create({
      student,
      school,
      assessmentDate: assessmentDate || new Date(),
      literacyLevel: literacyLevel || 'not_assessed',
      literacyScore,
      literacyDetails,
      numeracyLevel: numeracyLevel || 'not_assessed',
      numeracyScore,
      numeracyDetails,
      assessedBy: req.user._id,
      assessmentType: assessmentType || 'quick_check',
      classLevel,
      teacherNotes,
      recommendations,
    });
    
    await assessment.populate('student', 'firstName lastName class');
    await assessment.populate('school', 'name');
    await assessment.populate('assessedBy', 'firstName lastName');
    
    logger.info(`Assessment created for ${studentDoc.fullName} by ${req.user.phone}`);
    
    created(res, { assessment }, 'Learning assessment recorded successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get assessments
 * GET /api/assessments
 * @access Private
 */
const getAssessments = async (req, res, next) => {
  try {
    const {
      school,
      student,
      literacyLevel,
      numeracyLevel,
      overallLevel,
      startDate,
      endDate,
      page = 1,
      limit = 20,
    } = req.query;
    
    const query = {};
    
    if (school) query.school = school;
    if (student) query.student = student;
    if (literacyLevel) query.literacyLevel = literacyLevel;
    if (numeracyLevel) query.numeracyLevel = numeracyLevel;
    if (overallLevel) query.overallLevel = overallLevel;
    
    // Date range
    if (startDate || endDate) {
      query.assessmentDate = {};
      if (startDate) query.assessmentDate.$gte = new Date(startDate);
      if (endDate) query.assessmentDate.$lte = new Date(endDate);
    }
    
    // School filter for teachers
    if (['teacher', 'headteacher'].includes(req.user.role) && req.user.school) {
      query.school = req.user.school;
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await LearningAssessment.countDocuments(query);
    
    const assessments = await LearningAssessment.find(query)
      .populate('student', 'firstName lastName class gender disabilityStatus')
      .populate('school', 'name')
      .populate('assessedBy', 'firstName lastName')
      .sort({ assessmentDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const totalPages = Math.ceil(total / parseInt(limit));
    
    success(res, {
      assessments,
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
 * Get student assessment history
 * GET /api/assessments/student/:studentId
 * @access Private
 */
const getStudentAssessments = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    
    const student = await Student.findById(studentId);
    if (!student) {
      return notFound(res, 'Student not found');
    }
    
    const assessments = await LearningAssessment.getStudentHistory(studentId);
    
    // Calculate progress
    const progress = {
      total: assessments.length,
      latest: assessments[0] || null,
      trend: null,
    };
    
    if (assessments.length >= 2) {
      const latest = assessments[0];
      const previous = assessments[1];
      
      progress.trend = {
        literacy: {
          current: latest.literacyLevel,
          previous: previous.literacyLevel,
          improved: latest.literacyScore > previous.literacyScore,
        },
        numeracy: {
          current: latest.numeracyLevel,
          previous: previous.numeracyLevel,
          improved: latest.numeracyScore > previous.numeracyScore,
        },
      };
    }
    
    success(res, {
      student: {
        id: student._id,
        name: student.fullName,
        class: student.class,
      },
      assessments,
      progress,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get school assessment summary
 * GET /api/assessments/school/:schoolId/summary
 * @access Private
 */
const getSchoolSummary = async (req, res, next) => {
  try {
    const { schoolId } = req.params;
    const { startDate, endDate } = req.query;
    
    // Check school access
    if (['teacher', 'headteacher'].includes(req.user.role)) {
      if (!req.user.school || req.user.school.toString() !== schoolId) {
        return forbidden(res, 'Access denied to this school');
      }
    }
    
    const summary = await LearningAssessment.getSchoolSummary(schoolId, startDate, endDate);
    
    success(res, { summary: summary[0] || {} });
  } catch (error) {
    next(error);
  }
};

/**
 * Get disaggregated learning outcomes
 * GET /api/assessments/stats/disaggregated
 * @access Private
 */
const getDisaggregatedOutcomes = async (req, res, next) => {
  try {
    const { school, startDate, endDate } = req.query;
    
    const filters = {};
    if (school) filters.school = school;
    
    if (startDate || endDate) {
      filters.assessmentDate = {};
      if (startDate) filters.assessmentDate.$gte = new Date(startDate);
      if (endDate) filters.assessmentDate.$lte = new Date(endDate);
    }
    
    // School filter for teachers
    if (['teacher', 'headteacher'].includes(req.user.role) && req.user.school) {
      filters.school = req.user.school;
    }
    
    const outcomes = await LearningAssessment.getDisaggregatedOutcomes(filters);
    
    logger.info(`Disaggregated outcomes query by ${req.user.phone}`);
    
    success(res, { outcomes });
  } catch (error) {
    next(error);
  }
};

/**
 * Get students needing intervention
 * GET /api/assessments/intervention-needed
 * @access Private
 */
const getInterventionNeeded = async (req, res, next) => {
  try {
    const { school } = req.query;
    
    let schoolId = school;
    if (['teacher', 'headteacher'].includes(req.user.role) && req.user.school) {
      schoolId = req.user.school;
    }
    
    const assessments = await LearningAssessment.findNeedingIntervention(schoolId);
    
    success(res, {
      assessments,
      count: assessments.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update assessment
 * PUT /api/assessments/:id
 * @access Teacher, Headteacher
 */
const updateAssessment = async (req, res, next) => {
  try {
    const assessment = await LearningAssessment.findById(req.params.id);
    
    if (!assessment) {
      return notFound(res, 'Assessment not found');
    }
    
    // Check school access
    if (['teacher', 'headteacher'].includes(req.user.role)) {
      if (!req.user.school || assessment.school.toString() !== req.user.school.toString()) {
        return forbidden(res, 'You can only update assessments for your school');
      }
    }
    
    const {
      literacyLevel,
      literacyScore,
      literacyDetails,
      numeracyLevel,
      numeracyScore,
      numeracyDetails,
      teacherNotes,
      recommendations,
      followUpCompleted,
      followUpDate,
    } = req.body;
    
    if (literacyLevel) assessment.literacyLevel = literacyLevel;
    if (literacyScore !== undefined) assessment.literacyScore = literacyScore;
    if (literacyDetails) assessment.literacyDetails = literacyDetails;
    if (numeracyLevel) assessment.numeracyLevel = numeracyLevel;
    if (numeracyScore !== undefined) assessment.numeracyScore = numeracyScore;
    if (numeracyDetails) assessment.numeracyDetails = numeracyDetails;
    if (teacherNotes !== undefined) assessment.teacherNotes = teacherNotes;
    if (recommendations) assessment.recommendations = recommendations;
    if (followUpCompleted !== undefined) assessment.followUpCompleted = followUpCompleted;
    if (followUpDate) assessment.followUpDate = followUpDate;
    
    await assessment.save();
    
    logger.info(`Assessment updated: ${assessment._id} by ${req.user.phone}`);
    
    success(res, { assessment }, 'Assessment updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Delete assessment
 * DELETE /api/assessments/:id
 * @access Admin only
 */
const deleteAssessment = async (req, res, next) => {
  try {
    const assessment = await LearningAssessment.findByIdAndDelete(req.params.id);
    
    if (!assessment) {
      return notFound(res, 'Assessment not found');
    }
    
    logger.info(`Assessment deleted: ${assessment._id} by ${req.user.phone}`);
    
    success(res, {}, 'Assessment deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createAssessment,
  getAssessments,
  getStudentAssessments,
  getSchoolSummary,
  getDisaggregatedOutcomes,
  getInterventionNeeded,
  updateAssessment,
  deleteAssessment,
};
