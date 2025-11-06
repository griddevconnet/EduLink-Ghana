const express = require('express');
const ivrController = require('../controllers/ivrController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

/**
 * @route   POST /api/ivr/incoming
 * @desc    Handle incoming IVR call (Africa's Talking webhook)
 * @access  Public (webhook)
 */
router.post('/incoming', ivrController.handleIncomingCall);

/**
 * @route   POST /api/ivr/dtmf
 * @desc    Handle DTMF input (Africa's Talking webhook)
 * @access  Public (webhook)
 */
router.post('/dtmf', ivrController.handleDTMF);

/**
 * @route   POST /api/ivr/status
 * @desc    Handle call status update (Africa's Talking webhook)
 * @access  Public (webhook)
 */
router.post('/status', ivrController.handleCallStatus);

/**
 * @route   POST /api/ivr/recording
 * @desc    Handle voice recording (Africa's Talking webhook)
 * @access  Public (webhook)
 */
router.post('/recording', ivrController.handleRecording);

/**
 * @route   GET /api/ivr/test
 * @desc    Test IVR flow
 * @access  Private
 */
router.get('/test', authenticate, ivrController.testIVR);

module.exports = router;
