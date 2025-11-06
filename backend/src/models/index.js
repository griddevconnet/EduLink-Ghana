/**
 * Models Index
 * Central export for all Mongoose models
 */

const School = require('./School');
const User = require('./User');
const Student = require('./Student');
const Attendance = require('./Attendance');
const CallLog = require('./CallLog');
const LearningAssessment = require('./LearningAssessment');
const RiskScore = require('./RiskScore');
const MessageTemplate = require('./MessageTemplate');

module.exports = {
  School,
  User,
  Student,
  Attendance,
  CallLog,
  LearningAssessment,
  RiskScore,
  MessageTemplate,
};
