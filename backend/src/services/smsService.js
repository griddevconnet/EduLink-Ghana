const { sendSMS, sendBulkSMS, formatPhoneNumber } = require('./africasTalking');
const { MessageTemplate } = require('../models');
const logger = require('../utils/logger');

/**
 * SMS Service
 * Handles multilingual SMS notifications
 */

/**
 * Send templated SMS
 * @param {String} phone - Phone number
 * @param {String} templateCode - Template code
 * @param {String} language - Language code
 * @param {Object} variables - Template variables
 * @returns {Promise} SMS result
 */
const sendTemplatedSMS = async (phone, templateCode, language = 'English', variables = {}) => {
  try {
    // Get template
    const template = await MessageTemplate.findByCode(templateCode, language);
    
    if (!template) {
      logger.error(`Template not found: ${templateCode} (${language})`);
      return {
        success: false,
        error: 'Template not found',
      };
    }
    
    // Render message
    const message = template.render(variables);
    
    // Format phone number
    const formattedPhone = formatPhoneNumber(phone);
    
    // Send SMS
    const result = await sendSMS(formattedPhone, message);
    
    return result;
  } catch (error) {
    logger.error('Failed to send templated SMS:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Send absence notification to parent
 * @param {Object} student - Student object
 * @param {String} date - Absence date
 * @param {Object} contact - Parent contact
 * @returns {Promise} SMS result
 */
const sendAbsenceNotification = async (student, date, contact) => {
  try {
    const variables = {
      parent_name: contact.name || 'Parent',
      child_name: student.firstName,
      date: new Date(date).toLocaleDateString('en-GB'),
      school_name: student.school?.name || 'School',
    };
    
    const language = contact.preferredLanguage || 'English';
    
    return await sendTemplatedSMS(
      contact.phone,
      'ABSENCE_NOTIFY',
      language,
      variables
    );
  } catch (error) {
    logger.error('Failed to send absence notification:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Send contact verification SMS
 * @param {String} phone - Phone number
 * @param {String} code - Verification code
 * @param {String} language - Language
 * @returns {Promise} SMS result
 */
const sendVerificationSMS = async (phone, code, language = 'English') => {
  try {
    const variables = {
      code,
    };
    
    return await sendTemplatedSMS(
      phone,
      'CONTACT_VERIFY',
      language,
      variables
    );
  } catch (error) {
    logger.error('Failed to send verification SMS:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Send learning tip SMS
 * @param {String} phone - Phone number
 * @param {String} tip - Learning tip
 * @param {String} language - Language
 * @returns {Promise} SMS result
 */
const sendLearningTip = async (phone, tip, language = 'English') => {
  try {
    const variables = {
      tip,
    };
    
    return await sendTemplatedSMS(
      phone,
      'LEARNING_TIP',
      language,
      variables
    );
  } catch (error) {
    logger.error('Failed to send learning tip:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Send attendance reminder
 * @param {String} phone - Phone number
 * @param {String} childName - Child's name
 * @param {String} language - Language
 * @returns {Promise} SMS result
 */
const sendAttendanceReminder = async (phone, childName, language = 'English') => {
  try {
    const variables = {
      child_name: childName,
      date: new Date().toLocaleDateString('en-GB'),
    };
    
    return await sendTemplatedSMS(
      phone,
      'ATTENDANCE_REMINDER',
      language,
      variables
    );
  } catch (error) {
    logger.error('Failed to send attendance reminder:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Send intervention message
 * @param {String} phone - Phone number
 * @param {String} childName - Child's name
 * @param {String} intervention - Intervention type
 * @param {String} language - Language
 * @returns {Promise} SMS result
 */
const sendInterventionMessage = async (phone, childName, intervention, language = 'English') => {
  try {
    const variables = {
      child_name: childName,
      intervention,
    };
    
    return await sendTemplatedSMS(
      phone,
      'INTERVENTION_MESSAGE',
      language,
      variables
    );
  } catch (error) {
    logger.error('Failed to send intervention message:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Send bulk SMS to multiple parents
 * @param {Array} recipients - Array of {phone, message, language}
 * @returns {Promise} Bulk SMS results
 */
const sendBulkParentSMS = async (recipients) => {
  try {
    const formatted = recipients.map((r) => ({
      phone: formatPhoneNumber(r.phone),
      message: r.message,
    }));
    
    return await sendBulkSMS(formatted);
  } catch (error) {
    logger.error('Failed to send bulk SMS:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Send emergency alert
 * @param {Array} phones - Phone numbers
 * @param {String} message - Alert message
 * @returns {Promise} SMS result
 */
const sendEmergencyAlert = async (phones, message) => {
  try {
    const formatted = phones.map(formatPhoneNumber);
    
    return await sendSMS(formatted, message);
  } catch (error) {
    logger.error('Failed to send emergency alert:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

module.exports = {
  sendTemplatedSMS,
  sendAbsenceNotification,
  sendVerificationSMS,
  sendLearningTip,
  sendAttendanceReminder,
  sendInterventionMessage,
  sendBulkParentSMS,
  sendEmergencyAlert,
};
