const { Student, School } = require('../models');
const { success, created, badRequest, notFound, forbidden } = require('../utils/response');
const logger = require('../utils/logger');

/**
 * Student Controller
 */

/**
 * Create new student
 * POST /api/students
 * @access Teacher, Headteacher, Admin
 */
const createStudent = async (req, res, next) => {
  try {
    const {
      firstName,
      lastName,
      otherNames,
      dateOfBirth,
      gender,
      disabilityStatus,
      disabilityDetails,
      school,
      class: studentClass,
      studentId,
      enrollmentStatus,
      enrollmentDate,
      dropoutReason,
      locationType,
      homeGPS,
      community,
      parentContacts,
      registrationSource,
      notes,
      specialNeeds,
      schoolName,
      schoolLocation,
      district,
      region,
    } = req.body;
    
    let schoolId = school;
    
    // If no school ID provided but schoolName is provided, try to find or create school
    if (!schoolId && schoolName) {
      // Try to find existing school by name
      let existingSchool = await School.findOne({ 
        name: { $regex: new RegExp(schoolName, 'i') } 
      });
      
      if (!existingSchool) {
        // Create new school if it doesn't exist
        // Use district field if provided, otherwise fall back to schoolLocation
        const schoolDistrict = district || schoolLocation || 'Unknown District';
        
        existingSchool = await School.create({
          name: schoolName,
          region: region || 'Greater Accra', // Use provided region or default
          district: schoolDistrict,
          address: schoolLocation || district,
          type: 'Primary',
          ownership: 'Public',
          active: true,
        });
        
        // Associate the school with the user if they don't have one
        if (!req.user.school) {
          req.user.school = existingSchool._id;
          await req.user.save();
        }
      }
      
      schoolId = existingSchool._id;
    }
    
    // For teachers/headteachers, use their associated school if no school provided
    if (!schoolId && req.user.school) {
      schoolId = req.user.school;
    }
    
    // Verify school exists
    if (schoolId) {
      const schoolExists = await School.findById(schoolId);
      if (!schoolExists) {
        return badRequest(res, 'School not found');
      }
    }
    
    const student = await Student.create({
      firstName,
      lastName,
      otherNames,
      dateOfBirth,
      gender,
      disabilityStatus: disabilityStatus || 'None',
      disabilityDetails,
      school: enrollmentStatus === 'enrolled' ? schoolId : undefined,
      class: studentClass,
      studentId,
      enrollmentStatus: enrollmentStatus || 'enrolled',
      enrollmentDate,
      dropoutReason,
      locationType: locationType || 'Rural',
      homeGPS,
      community,
      parentContacts,
      registeredBy: req.user._id,
      registrationSource: registrationSource || 'School',
      notes,
      specialNeeds,
    });
    
    // Populate references
    await student.populate('school', 'name region district');
    await student.populate('registeredBy', 'firstName lastName');
    
    logger.info(`Student created: ${student.fullName} by ${req.user.phone}`);
    
    created(res, { student }, 'Student registered successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get all students
 * GET /api/students
 * @access Private
 */
const getStudents = async (req, res, next) => {
  try {
    const {
      school,
      enrollmentStatus,
      gender,
      disabilityStatus,
      locationType,
      class: studentClass,
      search,
      page = 1,
      limit = 20,
    } = req.query;
    
    // Build query
    const query = { active: true };
    
    // School filter
    if (school) {
      query.school = school;
    } else if (['teacher', 'headteacher'].includes(req.user.role) && req.user.school) {
      // Teachers can see their school's students OR students they registered (orphaned students)
      query.$or = [
        { school: req.user.school },
        { school: null, registeredBy: req.user._id },
        { school: { $exists: false }, registeredBy: req.user._id }
      ];
    }
    
    if (enrollmentStatus) query.enrollmentStatus = enrollmentStatus;
    if (gender) query.gender = gender;
    if (disabilityStatus) query.disabilityStatus = disabilityStatus;
    if (locationType) query.locationType = locationType;
    if (studentClass) query.class = studentClass;
    
    // Text search
    if (search) {
      query.$text = { $search: search };
    }
    
    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Student.countDocuments(query);
    
    const students = await Student.find(query)
      .populate('school', 'name region district')
      .populate('registeredBy', 'firstName lastName')
      .sort({ lastName: 1, firstName: 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();
    
    const totalPages = Math.ceil(total / parseInt(limit));
    
    success(res, {
      students,
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
 * Get out-of-school children
 * GET /api/students/out-of-school
 * @access Private
 */
const getOutOfSchoolChildren = async (req, res, next) => {
  try {
    const { region, district, gender, disabilityStatus, page = 1, limit = 20 } = req.query;
    
    const filters = {};
    if (region) filters['school.region'] = region;
    if (district) filters['school.district'] = district;
    if (gender) filters.gender = gender;
    if (disabilityStatus) filters.disabilityStatus = disabilityStatus;
    
    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const students = await Student.findOutOfSchool(filters)
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Student.countDocuments({
      enrollmentStatus: { $in: ['never_enrolled', 'dropped_out'] },
      active: true,
      ...filters,
    });
    
    const totalPages = Math.ceil(total / parseInt(limit));
    
    logger.info(`Out-of-school query by ${req.user.phone}: ${total} found`);
    
    success(res, {
      students,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages,
      },
      summary: {
        totalOutOfSchool: total,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single student
 * GET /api/students/:id
 * @access Private
 */
const getStudent = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate('school', 'name region district')
      .populate('registeredBy', 'firstName lastName');
    
    if (!student) {
      return notFound(res, 'Student not found');
    }
    
    // Check access for teachers
    if (['teacher', 'headteacher'].includes(req.user.role)) {
      console.log('=== STUDENT ACCESS DEBUG ===');
      console.log('Teacher ID:', req.user._id);
      console.log('Teacher School:', req.user.school);
      console.log('Student ID:', student._id);
      console.log('Student School:', student.school?._id);
      console.log('Student Registered By:', student.registeredBy);
      
      // Allow access if:
      // 1. Student has no school assigned (orphaned student)
      // 2. Student's school matches teacher's school
      // 3. Student was registered by this teacher
      const hasSchoolAccess = !student.school || 
                             (req.user.school && student.school?._id.toString() === req.user.school.toString());
      const isRegisteredByTeacher = student.registeredBy?.toString() === req.user._id.toString();
      
      console.log('Has School Access:', hasSchoolAccess);
      console.log('Is Registered By Teacher:', isRegisteredByTeacher);
      console.log('=== END DEBUG ===');
      
      if (!hasSchoolAccess && !isRegisteredByTeacher) {
        return forbidden(res, 'Access denied to this student');
      }
    }
    
    // If student has no school but teacher has one, associate them
    if (!student.school && req.user.school && student.enrollmentStatus === 'enrolled') {
      student.school = req.user.school;
      await student.save();
      await student.populate('school', 'name region district');
    }
    
    success(res, { student });
  } catch (error) {
    next(error);
  }
};

/**
 * Update student
 * PUT /api/students/:id
 * @access Teacher, Headteacher, Admin
 */
const updateStudent = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id);
    
    if (!student) {
      return notFound(res, 'Student not found');
    }
    
    // Check access for teachers
    if (['teacher', 'headteacher'].includes(req.user.role)) {
      if (!req.user.school || student.school?.toString() !== req.user.school.toString()) {
        return forbidden(res, 'You can only update students from your school');
      }
    }
    
    const {
      firstName,
      lastName,
      otherNames,
      dateOfBirth,
      gender,
      disabilityStatus,
      disabilityDetails,
      school,
      class: studentClass,
      studentId,
      enrollmentStatus,
      dropoutDate,
      dropoutReason,
      locationType,
      homeGPS,
      community,
      parentContacts,
      notes,
      specialNeeds,
    } = req.body;
    
    // Update fields
    if (firstName) student.firstName = firstName;
    if (lastName) student.lastName = lastName;
    if (otherNames !== undefined) student.otherNames = otherNames;
    if (dateOfBirth) student.dateOfBirth = dateOfBirth;
    if (gender) student.gender = gender;
    if (disabilityStatus) student.disabilityStatus = disabilityStatus;
    if (disabilityDetails !== undefined) student.disabilityDetails = disabilityDetails;
    if (school) student.school = school;
    if (studentClass !== undefined) student.class = studentClass;
    if (studentId !== undefined) student.studentId = studentId;
    if (enrollmentStatus) student.enrollmentStatus = enrollmentStatus;
    if (dropoutDate) student.dropoutDate = dropoutDate;
    if (dropoutReason) student.dropoutReason = dropoutReason;
    if (locationType) student.locationType = locationType;
    if (homeGPS) student.homeGPS = homeGPS;
    if (community !== undefined) student.community = community;
    if (parentContacts) student.parentContacts = parentContacts;
    if (notes !== undefined) student.notes = notes;
    if (specialNeeds) student.specialNeeds = specialNeeds;
    
    await student.save();
    await student.populate('school', 'name region district');
    
    logger.info(`Student updated: ${student.fullName} by ${req.user.phone}`);
    
    success(res, { student }, 'Student updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Delete student (soft delete)
 * DELETE /api/students/:id
 * @access Admin only
 */
const deleteStudent = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate('school', 'name region district');
    
    if (!student) {
      return notFound(res, 'Student not found');
    }
    
    // Check access for teachers - same logic as getStudent
    if (['teacher', 'headteacher'].includes(req.user.role)) {
      console.log('=== DELETE STUDENT ACCESS DEBUG ===');
      console.log('Teacher ID:', req.user._id);
      console.log('Teacher School:', req.user.school);
      console.log('Student ID:', student._id);
      console.log('Student School:', student.school?._id);
      console.log('Student Registered By:', student.registeredBy);
      
      const hasSchoolAccess = !student.school || 
                             (req.user.school && student.school?._id.toString() === req.user.school.toString());
      const isRegisteredByTeacher = student.registeredBy?.toString() === req.user._id.toString();
      
      console.log('Has School Access:', hasSchoolAccess);
      console.log('Is Registered By Teacher:', isRegisteredByTeacher);
      console.log('=== END DELETE DEBUG ===');
      
      if (!hasSchoolAccess && !isRegisteredByTeacher) {
        return forbidden(res, 'Access denied to delete this student');
      }
    }
    
    student.active = false;
    await student.save();
    
    logger.info(`Student deleted: ${student.fullName} by ${req.user.phone}`);
    
    success(res, {}, 'Student deleted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get disaggregated student statistics
 * GET /api/students/stats/disaggregated
 * @access Private
 */
const getDisaggregatedStats = async (req, res, next) => {
  try {
    const { school, region, district } = req.query;
    
    const filters = { active: true };
    if (school) filters.school = school;
    
    // Teachers can only see their school
    if (['teacher', 'headteacher'].includes(req.user.role) && req.user.school) {
      filters.school = req.user.school;
    }
    
    const stats = await Student.getDisaggregatedStats(filters);
    
    // Also get enrollment breakdown
    const enrollmentStats = await Student.aggregate([
      { $match: filters },
      {
        $group: {
          _id: '$enrollmentStatus',
          count: { $sum: 1 },
        },
      },
    ]);
    
    // Gender breakdown
    const genderStats = await Student.aggregate([
      { $match: filters },
      {
        $group: {
          _id: '$gender',
          count: { $sum: 1 },
        },
      },
    ]);
    
    // Disability breakdown
    const disabilityStats = await Student.aggregate([
      { $match: filters },
      {
        $group: {
          _id: '$disabilityStatus',
          count: { $sum: 1 },
        },
      },
    ]);
    
    // Location breakdown
    const locationStats = await Student.aggregate([
      { $match: filters },
      {
        $group: {
          _id: '$locationType',
          count: { $sum: 1 },
        },
      },
    ]);
    
    success(res, {
      disaggregated: stats,
      enrollment: enrollmentStats,
      gender: genderStats,
      disability: disabilityStats,
      location: locationStats,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify parent contact
 * POST /api/students/:id/verify-contact
 * @access Teacher, Headteacher, Admin
 */
const verifyParentContact = async (req, res, next) => {
  try {
    const { contactId } = req.body;
    
    const student = await Student.findById(req.params.id);
    
    if (!student) {
      return notFound(res, 'Student not found');
    }
    
    const contact = student.parentContacts.id(contactId);
    if (!contact) {
      return badRequest(res, 'Contact not found');
    }
    
    contact.verified = true;
    contact.verifiedAt = new Date();
    
    await student.save();
    
    logger.info(`Contact verified for student: ${student.fullName}`);
    
    success(res, { student }, 'Contact verified successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Fix orphaned students by associating them with their creator's school
 * POST /api/students/fix-associations
 * @access Admin
 */
const fixStudentSchoolAssociations = async (req, res, next) => {
  try {
    console.log('Starting student school association fix...');
    
    // Find all students without school associations
    const orphanedStudents = await Student.find({ 
      school: { $exists: false },
      active: true 
    }).populate('registeredBy', 'school firstName lastName');
    
    console.log(`Found ${orphanedStudents.length} orphaned students`);
    
    let fixedCount = 0;
    
    for (const student of orphanedStudents) {
      if (student.registeredBy && student.registeredBy.school) {
        student.school = student.registeredBy.school;
        await student.save();
        fixedCount++;
        console.log(`Fixed student: ${student.firstName} ${student.lastName} -> School: ${student.registeredBy.school}`);
      }
    }
    
    // Also find students with null school
    const nullSchoolStudents = await Student.find({ 
      school: null,
      active: true 
    }).populate('registeredBy', 'school firstName lastName');
    
    console.log(`Found ${nullSchoolStudents.length} students with null school`);
    
    for (const student of nullSchoolStudents) {
      if (student.registeredBy && student.registeredBy.school) {
        student.school = student.registeredBy.school;
        await student.save();
        fixedCount++;
        console.log(`Fixed null school student: ${student.firstName} ${student.lastName} -> School: ${student.registeredBy.school}`);
      }
    }
    
    console.log(`Fixed ${fixedCount} student associations`);
    
    success(res, { 
      fixedCount,
      totalOrphaned: orphanedStudents.length + nullSchoolStudents.length
    }, `Fixed ${fixedCount} student school associations`);
  } catch (error) {
    console.error('Error fixing student associations:', error);
    next(error);
  }
};

module.exports = {
  createStudent,
  getStudents,
  getOutOfSchoolChildren,
  getStudent,
  updateStudent,
  deleteStudent,
  getDisaggregatedStats,
  verifyParentContact,
  fixStudentSchoolAssociations,
};
