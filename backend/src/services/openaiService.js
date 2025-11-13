const OpenAI = require('openai');
const logger = require('../utils/logger');

/**
 * OpenAI Service
 * Handles conversational AI for parent calls
 * Supports all Ghanaian languages
 */

// Initialize OpenAI client (only if API key is available)
let openai = null;

if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  logger.info('OpenAI service initialized successfully');
} else {
  logger.warn('OPENAI_API_KEY not found - conversational AI features will be disabled');
}

/**
 * Supported Ghanaian Languages
 */
const GHANAIAN_LANGUAGES = {
  twi: 'Twi (Akan)',
  ewe: 'Ewe',
  ga: 'Ga',
  dagbani: 'Dagbani',
  fante: 'Fante',
  dagaare: 'Dagaare',
  dangme: 'Dangme',
  gonja: 'Gonja',
  hausa: 'Hausa',
  english: 'English',
};

/**
 * Convert speech to text using Whisper
 * Automatically detects language
 * @param {String} audioUrl - URL to audio file
 * @returns {Promise} Transcription result
 */
const speechToText = async (audioUrl) => {
  try {
    if (!openai) {
      return {
        success: false,
        error: 'OpenAI API key not configured',
      };
    }
    
    logger.info('Converting speech to text:', audioUrl);
    
    // Download audio file
    const response = await fetch(audioUrl);
    const audioBuffer = await response.arrayBuffer();
    const audioFile = new File([audioBuffer], 'audio.mp3', { type: 'audio/mpeg' });
    
    // Transcribe with Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: null, // Auto-detect language
      response_format: 'verbose_json', // Get language info
    });
    
    logger.info('Transcription result:', {
      text: transcription.text,
      language: transcription.language,
      duration: transcription.duration,
    });
    
    return {
      success: true,
      text: transcription.text,
      language: transcription.language,
      duration: transcription.duration,
    };
  } catch (error) {
    logger.error('Speech-to-text failed:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Analyze parent's response and extract absence reason
 * Works in all Ghanaian languages
 * @param {String} parentResponse - What parent said
 * @param {String} language - Detected language
 * @param {Object} context - Call context (student name, school, etc.)
 * @returns {Promise} Analysis result
 */
const analyzeParentResponse = async (parentResponse, language, context) => {
  try {
    if (!openai) {
      return {
        success: false,
        error: 'OpenAI API key not configured',
      };
    }
    
    const { studentName, schoolName } = context;
    
    const systemPrompt = `You are an AI assistant for ${schoolName} in Ghana. 
You are analyzing a parent's response about why their child ${studentName} was absent from school.

Your task:
1. Understand what the parent said (in ANY Ghanaian language: Twi, Ewe, Ga, Dagbani, Fante, etc.)
2. Extract the reason for absence
3. Categorize it into one of these: sick, traveling, working, family_emergency, other
4. Detect any additional concerns or requests

Respond in JSON format:
{
  "reason": "sick|traveling|working|family_emergency|other",
  "details": "Brief description of what parent said",
  "concerns": "Any concerns or requests mentioned",
  "needsFollowUp": true/false,
  "detectedLanguage": "language name"
}`;

    const userPrompt = `Parent said: "${parentResponse}"

Language detected: ${language}

Analyze this response and extract the absence reason.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3, // Lower temperature for more consistent results
    });

    const analysis = JSON.parse(completion.choices[0].message.content);
    
    logger.info('Parent response analyzed:', analysis);
    
    return {
      success: true,
      ...analysis,
    };
  } catch (error) {
    logger.error('Response analysis failed:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Generate AI response to parent
 * Responds in the same language the parent spoke
 * @param {Object} analysis - Analysis of parent's response
 * @param {String} language - Language to respond in
 * @param {Object} context - Call context
 * @returns {Promise} AI response
 */
const generateAIResponse = async (analysis, language, context) => {
  try {
    if (!openai) {
      return {
        success: false,
        error: 'OpenAI API key not configured',
      };
    }
    
    const { studentName, schoolName } = context;
    
    const systemPrompt = `You are a friendly AI assistant for ${schoolName} in Ghana.
You are speaking to a parent about their child ${studentName} who was absent from school.

IMPORTANT:
- Respond in ${language} (the language the parent is speaking)
- Be warm, empathetic, and professional
- Keep responses short and clear (2-3 sentences max)
- If the child is sick, express concern and wish them well
- If there are concerns, offer to have the teacher call
- Always thank the parent for responding

The parent explained why ${studentName} was absent: ${analysis.details}
Reason category: ${analysis.reason}`;

    const userPrompt = `Generate a response to the parent in ${language}.
The response should:
1. Acknowledge what they said
2. Thank them for letting us know
3. ${analysis.needsFollowUp ? 'Offer to have the teacher call them' : 'Wish the child well'}
4. Say goodbye politely`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7, // Higher temperature for more natural responses
      max_tokens: 150,
    });

    const response = completion.choices[0].message.content;
    
    logger.info('AI response generated:', response);
    
    return {
      success: true,
      response,
    };
  } catch (error) {
    logger.error('Response generation failed:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Convert text to speech
 * @param {String} text - Text to convert
 * @param {String} language - Language code
 * @returns {Promise} Audio URL
 */
const textToSpeech = async (text, language) => {
  try {
    if (!openai) {
      return {
        success: false,
        error: 'OpenAI API key not configured',
      };
    }
    
    logger.info('Converting text to speech:', { text, language });
    
    // Select appropriate voice based on language
    const voice = selectVoiceForLanguage(language);
    
    const mp3 = await openai.audio.speech.create({
      model: 'tts-1',
      voice: voice,
      input: text,
      speed: 0.9, // Slightly slower for clarity
    });

    const buffer = Buffer.from(await mp3.arrayBuffer());
    
    // In production, upload to cloud storage (S3, Cloudinary, etc.)
    // For now, return base64
    const base64Audio = buffer.toString('base64');
    
    return {
      success: true,
      audio: base64Audio,
      format: 'mp3',
    };
  } catch (error) {
    logger.error('Text-to-speech failed:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Select appropriate voice for language
 * @param {String} language - Language code
 * @returns {String} Voice name
 */
const selectVoiceForLanguage = (language) => {
  // OpenAI TTS voices: alloy, echo, fable, onyx, nova, shimmer
  // Map languages to appropriate voices
  const voiceMap = {
    twi: 'nova', // Warm, friendly female voice
    ewe: 'nova',
    ga: 'nova',
    dagbani: 'alloy', // Neutral voice
    fante: 'nova',
    english: 'shimmer', // Professional female voice
  };
  
  return voiceMap[language.toLowerCase()] || 'nova';
};

/**
 * Process full conversational call
 * Handles entire flow: speech-to-text → analysis → response → text-to-speech
 * @param {String} audioUrl - URL to parent's voice recording
 * @param {Object} context - Call context
 * @returns {Promise} Complete conversation result
 */
const processConversationalCall = async (audioUrl, context) => {
  try {
    logger.info('Processing conversational call:', context);
    
    // Step 1: Convert speech to text
    const transcription = await speechToText(audioUrl);
    if (!transcription.success) {
      return {
        success: false,
        error: 'Failed to transcribe audio',
        step: 'speech-to-text',
      };
    }
    
    // Step 2: Analyze parent's response
    const analysis = await analyzeParentResponse(
      transcription.text,
      transcription.language,
      context
    );
    if (!analysis.success) {
      return {
        success: false,
        error: 'Failed to analyze response',
        step: 'analysis',
      };
    }
    
    // Step 3: Generate AI response
    const aiResponse = await generateAIResponse(
      analysis,
      transcription.language,
      context
    );
    if (!aiResponse.success) {
      return {
        success: false,
        error: 'Failed to generate response',
        step: 'response-generation',
      };
    }
    
    // Step 4: Convert response to speech
    const audioResponse = await textToSpeech(
      aiResponse.response,
      transcription.language
    );
    if (!audioResponse.success) {
      return {
        success: false,
        error: 'Failed to generate audio',
        step: 'text-to-speech',
      };
    }
    
    // Return complete result
    return {
      success: true,
      transcription: {
        text: transcription.text,
        language: transcription.language,
      },
      analysis: {
        reason: analysis.reason,
        details: analysis.details,
        concerns: analysis.concerns,
        needsFollowUp: analysis.needsFollowUp,
      },
      response: {
        text: aiResponse.response,
        audio: audioResponse.audio,
      },
    };
  } catch (error) {
    logger.error('Conversational call processing failed:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

module.exports = {
  speechToText,
  analyzeParentResponse,
  generateAIResponse,
  textToSpeech,
  processConversationalCall,
  GHANAIAN_LANGUAGES,
};
