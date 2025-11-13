const { generateAbsenceIVR, generateRecordingIVR, generateThankYouIVR, processDTMFInput, handleCallStatusUpdate } = require('../services/callService');
const { processConversationalCall } = require('../services/openaiService');
const { CallLog, Attendance } = require('../models');
const logger = require('../utils/logger');

/**
 * IVR Controller
 * Handles Africa's Talking IVR webhooks
 */

/**
 * Handle incoming call
 * POST /api/ivr/incoming
 * @access Public (webhook)
 */
const handleIncomingCall = async (req, res) => {
  try {
    const { sessionId, phoneNumber, isActive } = req.body;
    
    logger.info('Incoming call:', { sessionId, phoneNumber, isActive });
    
    // Find call log by session ID
    const callLog = await CallLog.findOne({ providerCallId: sessionId })
      .populate('student', 'firstName lastName school')
      .populate({ path: 'student', populate: { path: 'school', select: 'name' } });
    
    if (!callLog) {
      // Unknown call - hangup
      const xml = generateThankYouIVR('English');
      return res.set('Content-Type', 'text/xml').send(xml);
    }
    
    // Generate IVR menu
    const language = callLog.languageDetected || 'English';
    const childName = callLog.student.firstName;
    const schoolName = callLog.student.school?.name || 'School';
    
    const xml = generateAbsenceIVR(language, childName, schoolName);
    
    res.set('Content-Type', 'text/xml').send(xml);
  } catch (error) {
    logger.error('Error handling incoming call:', error);
    
    // Return error IVR
    const xml = generateThankYouIVR('English');
    res.set('Content-Type', 'text/xml').send(xml);
  }
};

/**
 * Handle DTMF input
 * POST /api/ivr/dtmf
 * @access Public (webhook)
 */
const handleDTMF = async (req, res) => {
  try {
    const { sessionId, dtmfDigits, phoneNumber } = req.body;
    
    logger.info('DTMF received:', { sessionId, dtmfDigits, phoneNumber });
    
    // Find call log
    const callLog = await CallLog.findOne({ providerCallId: sessionId });
    
    if (!callLog) {
      const xml = generateThankYouIVR('English');
      return res.set('Content-Type', 'text/xml').send(xml);
    }
    
    // Process DTMF
    const result = await processDTMFInput(callLog._id, dtmfDigits);
    
    const language = callLog.languageDetected || 'English';
    
    // If user wants to speak to teacher (9), offer recording
    if (result.meaning === 'speak_to_teacher') {
      const xml = generateRecordingIVR(language);
      return res.set('Content-Type', 'text/xml').send(xml);
    }
    
    // Otherwise, thank and hangup
    const xml = generateThankYouIVR(language);
    res.set('Content-Type', 'text/xml').send(xml);
  } catch (error) {
    logger.error('Error handling DTMF:', error);
    
    const xml = generateThankYouIVR('English');
    res.set('Content-Type', 'text/xml').send(xml);
  }
};

/**
 * Handle call status update
 * POST /api/ivr/status
 * @access Public (webhook)
 */
const handleCallStatus = async (req, res) => {
  try {
    const { sessionId, status, duration, durationInSeconds, amount, currencyCode } = req.body;
    
    logger.info('Call status update:', { sessionId, status, duration });
    
    const data = {
      duration: durationInSeconds,
      cost: amount,
      currency: currencyCode,
    };
    
    await handleCallStatusUpdate(sessionId, status, data);
    
    res.json({ success: true });
  } catch (error) {
    logger.error('Error handling call status:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Handle recording - NOW WITH CONVERSATIONAL AI!
 * POST /api/ivr/recording
 * @access Public (webhook)
 */
const handleRecording = async (req, res) => {
  try {
    const { sessionId, recordingUrl, durationInSeconds } = req.body;
    
    logger.info('Recording received for conversational AI:', { sessionId, recordingUrl, durationInSeconds });
    
    // Find call log
    const callLog = await CallLog.findOne({ providerCallId: sessionId })
      .populate('student', 'firstName lastName')
      .populate({ path: 'student', populate: { path: 'school', select: 'name' } });
    
    if (!callLog) {
      logger.warn('Call log not found for recording');
      const xml = generateThankYouIVR('English');
      return res.set('Content-Type', 'text/xml').send(xml);
    }
    
    // Save original recording
    callLog.audioBlobPath = recordingUrl;
    callLog.audioDurationSeconds = durationInSeconds;
    callLog.audioStorageProvider = 'africastalking';
    await callLog.save();
    
    logger.info(`Recording saved for call ${callLog._id}, processing with AI...`);
    
    // Process with conversational AI
    const context = {
      studentName: `${callLog.student.firstName} ${callLog.student.lastName}`,
      schoolName: callLog.student.school?.name || 'school',
    };
    
    const aiResult = await processConversationalCall(recordingUrl, context);
    
    if (aiResult.success) {
      // Update call log with AI analysis
      callLog.languageDetected = aiResult.transcription.language;
      callLog.dtmfInput = aiResult.transcription.text; // Store what parent said
      callLog.dtmfMeaning = aiResult.analysis.reason;
      callLog.result = 'answered';
      
      // Store AI response
      callLog.aiTranscription = aiResult.transcription.text;
      callLog.aiAnalysis = aiResult.analysis;
      callLog.aiResponse = aiResult.response.text;
      
      await callLog.save();
      
      // Update attendance record with reason
      const attendance = await Attendance.findById(callLog.attendance);
      if (attendance) {
        attendance.reason = aiResult.analysis.reason;
        attendance.reasonDetails = aiResult.analysis.details;
        attendance.followUpCompleted = true;
        attendance.followUpCompletedAt = new Date();
        
        if (aiResult.analysis.needsFollowUp) {
          attendance.teacherFollowUpRequired = true;
        }
        
        await attendance.save();
        logger.info(`Attendance updated with AI analysis: ${aiResult.analysis.reason}`);
      }
      
      // Generate AI response in parent's language
      const responseText = aiResult.response.text;
      const language = aiResult.transcription.language;
      
      // Play AI response back to parent
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>${responseText}</Say>
</Response>`;
      
      logger.info(`AI response generated in ${language}:`, responseText);
      
      res.set('Content-Type', 'text/xml').send(xml);
    } else {
      // AI processing failed, use fallback
      logger.error('AI processing failed:', aiResult.error);
      
      const language = callLog.languageDetected || 'English';
      const xml = generateThankYouIVR(language);
      
      res.set('Content-Type', 'text/xml').send(xml);
    }
  } catch (error) {
    logger.error('Error handling recording:', error);
    
    const xml = generateThankYouIVR('English');
    res.set('Content-Type', 'text/xml').send(xml);
  }
};

/**
 * Test IVR flow
 * GET /api/ivr/test
 * @access Private (for testing)
 */
const testIVR = async (req, res) => {
  try {
    const { language = 'English' } = req.query;
    
    const xml = generateAbsenceIVR(language, 'John', 'Test School');
    
    res.set('Content-Type', 'text/xml').send(xml);
  } catch (error) {
    logger.error('Error testing IVR:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  handleIncomingCall,
  handleDTMF,
  handleCallStatus,
  handleRecording,
  testIVR,
};
