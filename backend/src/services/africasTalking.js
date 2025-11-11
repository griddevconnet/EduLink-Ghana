const AfricasTalking = require('africastalking');
const logger = require('../utils/logger');

/**
 * Africa's Talking Service
 * Handles IVR calls, SMS, and USSD
 */

// Initialize Africa's Talking
const credentials = {
  apiKey: process.env.AFRICASTALKING_API_KEY || 'sandbox',
  username: process.env.AFRICASTALKING_USERNAME || 'sandbox',
};

const africasTalking = AfricasTalking(credentials);

// Get service instances
const voice = africasTalking.VOICE;
const sms = africasTalking.SMS;
const ussd = africasTalking.USSD;

/**
 * Make a voice call
 * @param {String} to - Phone number to call
 * @param {String} callerId - Caller ID (optional)
 * @returns {Promise} Call result
 */
const makeCall = async (to, callerId = null) => {
  try {
    const from = callerId || process.env.AFRICASTALKING_CALLER_ID || '+254711082300';
    
    logger.info(`Making call to ${to} from ${from}`);
    
    const options = {
      callTo: to,
      callFrom: from,
    };
    
    const result = await voice.call(options);
    
    // Log only the important parts to avoid circular structure error
    logger.info(`Call initiated to ${to}:`, {
      status: result.status,
      errorMessage: result.errorMessage,
      entries: result.entries
    });
    
    return {
      success: true,
      data: result,
    };
  } catch (error) {
    logger.error(`Failed to make call to ${to}:`, error.message || error);
    return {
      success: false,
      error: error.message || 'Call failed',
    };
  }
};

/**
 * Send SMS
 * @param {String|Array} to - Phone number(s)
 * @param {String} message - SMS message
 * @param {String} from - Sender ID (optional)
 * @returns {Promise} SMS result
 */
const sendSMS = async (to, message, from = null) => {
  try {
    const options = {
      to: Array.isArray(to) ? to : [to],
      message,
    };
    
    if (from) {
      options.from = from;
    }
    
    const result = await sms.send(options);
    
    logger.info(`SMS sent to ${to}:`, result);
    return {
      success: true,
      data: result,
    };
  } catch (error) {
    logger.error(`Failed to send SMS to ${to}:`, error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Send bulk SMS
 * @param {Array} recipients - Array of {phone, message}
 * @param {String} from - Sender ID (optional)
 * @returns {Promise} Bulk SMS results
 */
const sendBulkSMS = async (recipients, from = null) => {
  try {
    const results = [];
    
    for (const recipient of recipients) {
      const result = await sendSMS(recipient.phone, recipient.message, from);
      results.push({
        phone: recipient.phone,
        ...result,
      });
    }
    
    return {
      success: true,
      results,
    };
  } catch (error) {
    logger.error('Bulk SMS failed:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Fetch messages (for premium SMS)
 * @param {String} lastReceivedId - Last received message ID
 * @returns {Promise} Messages
 */
const fetchMessages = async (lastReceivedId = null) => {
  try {
    const options = {};
    if (lastReceivedId) {
      options.lastReceivedId = lastReceivedId;
    }
    
    const result = await sms.fetchMessages(options);
    
    return {
      success: true,
      data: result,
    };
  } catch (error) {
    logger.error('Failed to fetch messages:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Generate IVR response XML
 * @param {String} text - Text to speak
 * @param {Object} options - Additional options
 * @returns {String} XML response
 */
const generateIVRResponse = (text, options = {}) => {
  const {
    voice: voiceType = 'man',
    playBeep = false,
    getDigits = null,
    redirect = null,
    record = false,
  } = options;
  
  let xml = '<?xml version="1.0" encoding="UTF-8"?>';
  xml += '<Response>';
  
  if (getDigits) {
    xml += `<GetDigits timeout="${getDigits.timeout || 30}" finishOnKey="${getDigits.finishOnKey || '#'}" numDigits="${getDigits.numDigits || 1}">`;
    xml += `<Say voice="${voiceType}" playBeep="${playBeep}">${text}</Say>`;
    xml += '</GetDigits>';
  } else {
    xml += `<Say voice="${voiceType}" playBeep="${playBeep}">${text}</Say>`;
  }
  
  if (record) {
    xml += '<Record finishOnKey="#" maxLength="60" trimSilence="true" playBeep="true"/>';
  }
  
  if (redirect) {
    xml += `<Redirect>${redirect}</Redirect>`;
  }
  
  xml += '</Response>';
  
  return xml;
};

/**
 * Generate IVR menu
 * @param {String} prompt - Menu prompt
 * @param {Object} options - Menu options
 * @returns {String} XML response
 */
const generateIVRMenu = (prompt, options = {}) => {
  return generateIVRResponse(prompt, {
    getDigits: {
      timeout: options.timeout || 30,
      finishOnKey: options.finishOnKey || '#',
      numDigits: options.numDigits || 1,
    },
    voice: options.voice || 'man',
    playBeep: options.playBeep || false,
  });
};

/**
 * Generate IVR record prompt
 * @param {String} prompt - Recording prompt
 * @param {Object} options - Recording options
 * @returns {String} XML response
 */
const generateIVRRecord = (prompt, options = {}) => {
  return generateIVRResponse(prompt, {
    record: true,
    voice: options.voice || 'man',
    playBeep: true,
  });
};

/**
 * Generate IVR hangup
 * @param {String} message - Goodbye message
 * @returns {String} XML response
 */
const generateIVRHangup = (message) => {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>';
  xml += '<Response>';
  xml += `<Say>${message}</Say>`;
  xml += '<Hangup/>';
  xml += '</Response>';
  return xml;
};

/**
 * Parse DTMF input
 * @param {String} dtmfDigits - DTMF digits received
 * @returns {Object} Parsed input
 */
const parseDTMFInput = (dtmfDigits) => {
  const mapping = {
    '1': 'sick',
    '2': 'travel',
    '3': 'work',
    '4': 'family_emergency',
    '5': 'other',
    '9': 'speak_to_teacher',
  };
  
  return {
    digits: dtmfDigits,
    meaning: mapping[dtmfDigits] || 'unknown',
  };
};

/**
 * Get call cost estimate
 * @param {String} to - Phone number
 * @param {Number} durationSeconds - Call duration
 * @returns {Object} Cost estimate
 */
const estimateCallCost = (to, durationSeconds) => {
  // Africa's Talking pricing (approximate)
  const ratePerMinute = 0.05; // $0.05 per minute (example)
  const minutes = Math.ceil(durationSeconds / 60);
  const cost = minutes * ratePerMinute;
  
  return {
    durationSeconds,
    minutes,
    costUSD: cost,
    costGHS: cost * 12, // Approximate USD to GHS conversion
    currency: 'GHS',
  };
};

/**
 * Validate phone number format
 * @param {String} phone - Phone number
 * @returns {Boolean} Is valid
 */
const validatePhoneNumber = (phone) => {
  // Ghana phone numbers: +233XXXXXXXXX or 0XXXXXXXXX
  const ghanaRegex = /^(\+233|0)[2-5][0-9]{8}$/;
  return ghanaRegex.test(phone);
};

/**
 * Format phone number to E.164
 * @param {String} phone - Phone number
 * @returns {String} Formatted phone number
 */
const formatPhoneNumber = (phone) => {
  // Remove spaces and dashes
  let cleaned = phone.replace(/[\s-]/g, '');
  
  // Convert 0XXXXXXXXX to +233XXXXXXXXX
  if (cleaned.startsWith('0')) {
    cleaned = '+233' + cleaned.substring(1);
  }
  
  // Ensure it starts with +
  if (!cleaned.startsWith('+')) {
    cleaned = '+' + cleaned;
  }
  
  return cleaned;
};

module.exports = {
  // Call functions
  makeCall,
  
  // SMS functions
  sendSMS,
  sendBulkSMS,
  fetchMessages,
  
  // IVR functions
  generateIVRResponse,
  generateIVRMenu,
  generateIVRRecord,
  generateIVRHangup,
  parseDTMFInput,
  
  // Utility functions
  estimateCallCost,
  validatePhoneNumber,
  formatPhoneNumber,
  
  // Raw SDK access (for advanced use)
  voice,
  sms,
  ussd,
};
