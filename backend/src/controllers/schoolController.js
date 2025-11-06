const { School, User } = require('../models');
const { success, created, badRequest, notFound } = require('../utils/response');
const logger = require('../utils/logger');

/**
 * School Controller
 */

/**
 * Create new school
 * POST /api/schools
 * @access Admin only
 */
const createSchool = async (req, res, next) => {
  try {
    const {
      name,
      region,
      district,
      address,
      gps,
      headteacher,
      type,
      ownership,
      primaryLanguages,
    } = req.body;
    
    const school = await School.create({
      name,
      region,
      district,
      address,
      gps,
      headteacher,
      type,
      ownership,
      primaryLanguages,
    });
    
    logger.info(`School created: ${school.name} by ${req.user.phone}`);
    
    created(res, { school }, 'School created successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get all schools
 * GET /api/schools
 * @access Private
 */
const getSchools = async (req, res, next) => {
  try {
    const {
      region,
      district,
      type,
      ownership,
      active,
      search,
      page = 1,
      limit = 20,
    } = req.query;
    
    // Build query
    const query = {};
    
    if (region) query.region = region;
    if (district) query.district = district;
    if (type) query.type = type;
    if (ownership) query.ownership = ownership;
    if (active !== undefined) query.active = active === 'true';
    
    // Text search
    if (search) {
      query.$text = { $search: search };
    }
    
    // District officer can only see their district
    if (req.user.role === 'district_officer' && req.user.assignedDistrict) {
      query.district = req.user.assignedDistrict;
    }
    
    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await School.countDocuments(query);
    
    const schools = await School.find(query)
      .sort({ name: 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();
    
    const totalPages = Math.ceil(total / parseInt(limit));
    
    success(res, {
      schools,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages,
        hasNext: parseInt(page) < totalPages,
        hasPrev: parseInt(page) > 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single school
 * GET /api/schools/:id
 * @access Private
 */
const getSchool = async (req, res, next) => {
  try {
    const school = await School.findById(req.params.id);
    
    if (!school) {
      return notFound(res, 'School not found');
    }
    
    // Check access for district officers
    if (req.user.role === 'district_officer' && req.user.assignedDistrict) {
      if (school.district !== req.user.assignedDistrict) {
        return forbidden(res, 'Access denied to this school');
      }
    }
    
    // Get teacher count
    const teacherCount = await User.countDocuments({
      school: school._id,
      role: { $in: ['teacher', 'headteacher'] },
      active: true,
    });
    
    const schoolData = school.toObject();
    schoolData.teacherCount = teacherCount;
    
    success(res, { school: schoolData });
  } catch (error) {
    next(error);
  }
};

/**
 * Update school
 * PUT /api/schools/:id
 * @access Admin or Headteacher of the school
 */
const updateSchool = async (req, res, next) => {
  try {
    const school = await School.findById(req.params.id);
    
    if (!school) {
      return notFound(res, 'School not found');
    }
    
    // Check permissions
    if (req.user.role === 'headteacher') {
      if (!req.user.school || req.user.school.toString() !== school._id.toString()) {
        return forbidden(res, 'You can only update your own school');
      }
    }
    
    const {
      name,
      region,
      district,
      address,
      gps,
      headteacher,
      type,
      ownership,
      primaryLanguages,
      totalStudents,
      totalTeachers,
      notes,
    } = req.body;
    
    // Update fields
    if (name) school.name = name;
    if (region) school.region = region;
    if (district) school.district = district;
    if (address) school.address = address;
    if (gps) school.gps = gps;
    if (headteacher) school.headteacher = headteacher;
    if (type) school.type = type;
    if (ownership) school.ownership = ownership;
    if (primaryLanguages) school.primaryLanguages = primaryLanguages;
    if (totalStudents !== undefined) school.totalStudents = totalStudents;
    if (totalTeachers !== undefined) school.totalTeachers = totalTeachers;
    if (notes !== undefined) school.notes = notes;
    
    await school.save();
    
    logger.info(`School updated: ${school.name} by ${req.user.phone}`);
    
    success(res, { school }, 'School updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Delete school (soft delete)
 * DELETE /api/schools/:id
 * @access Admin only
 */
const deleteSchool = async (req, res, next) => {
  try {
    const school = await School.findById(req.params.id);
    
    if (!school) {
      return notFound(res, 'School not found');
    }
    
    // Soft delete
    school.active = false;
    await school.save();
    
    logger.info(`School deleted: ${school.name} by ${req.user.phone}`);
    
    success(res, {}, 'School deleted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get schools by region
 * GET /api/schools/region/:region
 * @access Private
 */
const getSchoolsByRegion = async (req, res, next) => {
  try {
    const { region } = req.params;
    
    const schools = await School.findByRegion(region);
    
    success(res, { schools, count: schools.length });
  } catch (error) {
    next(error);
  }
};

/**
 * Get schools by district
 * GET /api/schools/district/:district
 * @access Private
 */
const getSchoolsByDistrict = async (req, res, next) => {
  try {
    const { district } = req.params;
    
    const schools = await School.findByDistrict(district);
    
    success(res, { schools, count: schools.length });
  } catch (error) {
    next(error);
  }
};

/**
 * Get school statistics
 * GET /api/schools/:id/stats
 * @access Private
 */
const getSchoolStats = async (req, res, next) => {
  try {
    const school = await School.findById(req.params.id);
    
    if (!school) {
      return notFound(res, 'School not found');
    }
    
    // Get counts from related models
    const { Student, Attendance, LearningAssessment } = require('../models');
    
    const [
      totalStudents,
      enrolledStudents,
      outOfSchoolStudents,
      totalTeachers,
      todayAttendance,
      recentAssessments,
    ] = await Promise.all([
      Student.countDocuments({ school: school._id, active: true }),
      Student.countDocuments({ school: school._id, enrollmentStatus: 'enrolled', active: true }),
      Student.countDocuments({
        school: school._id,
        enrollmentStatus: { $in: ['never_enrolled', 'dropped_out'] },
        active: true,
      }),
      User.countDocuments({
        school: school._id,
        role: { $in: ['teacher', 'headteacher'] },
        active: true,
      }),
      Attendance.countDocuments({
        school: school._id,
        date: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0)),
          $lte: new Date(new Date().setHours(23, 59, 59, 999)),
        },
      }),
      LearningAssessment.countDocuments({
        school: school._id,
        assessmentDate: {
          $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      }),
    ]);
    
    const stats = {
      school: {
        id: school._id,
        name: school.name,
        region: school.region,
        district: school.district,
      },
      students: {
        total: totalStudents,
        enrolled: enrolledStudents,
        outOfSchool: outOfSchoolStudents,
      },
      teachers: {
        total: totalTeachers,
      },
      attendance: {
        today: todayAttendance,
      },
      assessments: {
        last30Days: recentAssessments,
      },
    };
    
    success(res, { stats });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createSchool,
  getSchools,
  getSchool,
  updateSchool,
  deleteSchool,
  getSchoolsByRegion,
  getSchoolsByDistrict,
  getSchoolStats,
};
