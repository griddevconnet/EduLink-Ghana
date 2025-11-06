const { makeCall, generateIVRMenu, generateIVRRecord, generateIVRHangup, parseDTMFInput } = require('./africasTalking');
const { CallLog, Student, Attendance } = require('../models');
const logger = require('../utils/logger');

/**
 * Call Service
 * Handles IVR calls for absence follow-up
 */

/**
 * Initiate absence follow-up call
 * @param {Object} student - Student object
 * @param {Object} attendance - Attendance record
 * @param {Object} contact - Parent contact
 * @returns {Promise} Call result
 */
const initiateAbsenceCall = async (student, attendance, contact) => {
  try {
    // Create call log
    const callLog = await CallLog.create({
      student: student._id,
      attendance: attendance._id,
      phone: contact.phone,
      contactName: contact.name,
      provider: 'africastalking',
      timePlaced: new Date(),
      result: 'pending',
      attemptNumber: 1,
      languageDetected: contact.preferredLanguage || 'English',
      languageDetectionMethod: 'user_preference',
    });
    
    // Make call
    const callResult = await makeCall(contact.phone);
    
    if (callResult.success) {
      callLog.providerCallId = callResult.data.entries?.[0]?.sessionId;
      callLog.result = 'answered'; // Will be updated by webhook
      await callLog.save();
      
      logger.info(`Absence call initiated for ${student.fullName} to ${contact.phone}`);
      
      return {
        success: true,
        callLog,
      };
    } else {
      callLog.result = 'failed';
      callLog.error = {
        code: 'CALL_FAILED',
        message: callResult.error,
      };
      await callLog.save();
      
      return {
        success: false,
        error: callResult.error,
        callLog,
      };
    }
  } catch (error) {
    logger.error('Failed to initiate absence call:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Generate IVR flow for absence notification
 * @param {String} language - Language code
 * @param {String} childName - Child's name
 * @param {String} schoolName - School name
 * @returns {String} IVR XML
 */
const generateAbsenceIVR = (language = 'English', childName, schoolName) => {
  // Multilingual prompts
  const prompts = {
    English: `Hello. This is ${schoolName}. ${childName} was absent from school today. Press 1 if sick, 2 if traveling, 3 if working, 4 for family emergency, 5 for other reason, or 9 to speak to a teacher.`,
    Twi: `Meda wo akye. Yɛfiri ${schoolName}. ${childName} anhyia sukuu nnɛ. Mia 1 sɛ ɔyare, 2 sɛ ɔrekɔ akwantu, 3 sɛ ɔreyɛ adwuma, 4 sɛ abusua asɛm bi aba, 5 sɛ ɛyɛ nea ɛka ho, anaa 9 sɛ wobɛkasa ne ɔkyerɛkyerɛfo.`,
    Ga: `Ojekoo. Yɛfɛɛ ${schoolName}. ${childName} ko sukuu nnɛ. Press 1 sɛ ɔyare, 2 sɛ akwantu, 3 sɛ adwuma, 4 sɛ abusua, 5 sɛ nea ɛka ho, 9 sɛ teacher.`,
  };
  
  const prompt = prompts[language] || prompts.English;
  
  return generateIVRMenu(prompt, {
    timeout: 30,
    numDigits: 1,
    finishOnKey: '#',
  });
};

/**
 * Generate IVR flow for recording voice message
 * @param {String} language - Language code
 * @returns {String} IVR XML
 */
const generateRecordingIVR = (language = 'English') => {
  const prompts = {
    English: 'Please record your message after the beep. Press hash when done.',
    Twi: 'Yɛsrɛ wo kyerɛw wo nkrasɛm wɔ beep no akyi. Mia hash sɛ wowie.',
    Ga: 'Please record your message. Press hash when finish.',
  };
  
  const prompt = prompts[language] || prompts.English;
  
  return generateIVRRecord(prompt);
};

/**
 * Generate IVR flow for thank you and hangup
 * @param {String} language - Language code
 * @returns {String} IVR XML
 */
const generateThankYouIVR = (language = 'English') => {
  const messages = {
    English: 'Thank you for your response. Goodbye.',
    Twi: 'Yɛda wo ase. Nante yie.',
    Ga: 'Thank you. Goodbye.',
  };
  
  const message = messages[language] || messages.English;
  
  return generateIVRHangup(message);
};

/**
 * Process DTMF input from IVR
 * @param {String} callId - Call log ID
 * @param {String} dtmfDigits - DTMF digits
 * @returns {Promise} Processing result
 */
const processDTMFInput = async (callId, dtmfDigits) => {
  try {
    const callLog = await CallLog.findById(callId);
    
    if (!callLog) {
      return {
        success: false,
        error: 'Call log not found',
      };
    }
    
    // Parse DTMF
    const parsed = parseDTMFInput(dtmfDigits);
    
    // Update call log
    callLog.dtmfInput = parsed.digits;
    callLog.dtmfMeaning = parsed.meaning;
    callLog.result = 'answered';
    await callLog.save();
    
    // Update attendance record if we have a reason
    if (parsed.meaning !== 'unknown' && parsed.meaning !== 'speak_to_teacher') {
      const attendance = await Attendance.findById(callLog.attendance);
      if (attendance) {
        attendance.reason = parsed.meaning;
        attendance.followUpCompleted = true;
        attendance.followUpCompletedAt = new Date();
        await attendance.save();
      }
    }
    
    logger.info(`DTMF processed for call ${callId}: ${parsed.meaning}`);
    
    return {
      success: true,
      meaning: parsed.meaning,
      callLog,
    };
  } catch (error) {
    logger.error('Failed to process DTMF:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Handle call status update from webhook
 * @param {String} sessionId - Provider session ID
 * @param {String} status - Call status
 * @param {Object} data - Additional data
 * @returns {Promise} Update result
 */
const handleCallStatusUpdate = async (sessionId, status, data = {}) => {
  try {
    const callLog = await CallLog.findOne({ providerCallId: sessionId });
    
    if (!callLog) {
      logger.warn(`Call log not found for session ${sessionId}`);
      return {
        success: false,
        error: 'Call log not found',
      };
    }
    
    // Map Africa's Talking status to our status
    const statusMap = {
      Completed: 'answered',
      NotAnswered: 'no_answer',
      Busy: 'busy',
      Failed: 'failed',
      Rejected: 'rejected',
    };
    
    callLog.result = statusMap[status] || status.toLowerCase();
    
    if (data.duration) {
      callLog.durationSeconds = parseInt(data.duration);
    }
    
    if (data.cost) {
      callLog.costAmount = parseFloat(data.cost);
      callLog.costCurrency = data.currency || 'USD';
    }
    
    if (status === 'Completed') {
      callLog.timeAnswered = data.timeAnswered || new Date();
      callLog.timeEnded = data.timeEnded || new Date();
    }
    
    await callLog.save();
    
    logger.info(`Call status updated for ${sessionId}: ${status}`);
    
    return {
      success: true,
      callLog,
    };
  } catch (error) {
    logger.error('Failed to handle call status update:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Schedule retry for failed call
 * @param {String} callId - Call log ID
 * @param {Number} delayHours - Delay in hours
 * @returns {Promise} Retry result
 */
const scheduleRetry = async (callId, delayHours = 6) => {
  try {
    const callLog = await CallLog.findById(callId);
    
    if (!callLog) {
      return {
        success: false,
        error: 'Call log not found',
      };
    }
    
    if (callLog.attemptNumber >= callLog.maxAttempts) {
      logger.info(`Max attempts reached for call ${callId}`);
      return {
        success: false,
        error: 'Max attempts reached',
      };
    }
    
    const retryAt = new Date(Date.now() + delayHours * 60 * 60 * 1000);
    
    await callLog.scheduleRetry(retryAt);
    
    logger.info(`Retry scheduled for call ${callId} at ${retryAt}`);
    
    return {
      success: true,
      retryAt,
    };
  } catch (error) {
    logger.error('Failed to schedule retry:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Get calls needing retry
 * @returns {Promise} Calls to retry
 */
const getCallsNeedingRetry = async () => {
  try {
    const calls = await CallLog.findNeedingRetry();
    
    return {
      success: true,
      calls,
    };
  } catch (error) {
    logger.error('Failed to get calls needing retry:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

module.exports = {
  initiateAbsenceCall,
  generateAbsenceIVR,
  generateRecordingIVR,
  generateThankYouIVR,
  processDTMFInput,
  handleCallStatusUpdate,
  scheduleRetry,
  getCallsNeedingRetry,
};
