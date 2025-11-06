import os
import logging
from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv
from pymongo import MongoClient
import redis

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(
    level=getattr(logging, os.getenv('LOG_LEVEL', 'INFO')),
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

# Database connections
try:
    mongo_client = MongoClient(os.getenv('MONGODB_URI'))
    db = mongo_client.edulink
    logger.info('MongoDB connected successfully')
except Exception as e:
    logger.error(f'MongoDB connection failed: {e}')
    db = None

try:
    redis_client = redis.from_url(os.getenv('REDIS_URL'))
    redis_client.ping()
    logger.info('Redis connected successfully')
except Exception as e:
    logger.error(f'Redis connection failed: {e}')
    redis_client = None

# Health check endpoint
@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'ok',
        'service': 'edulink-ai-service',
        'version': '1.0.0',
        'mongodb': 'connected' if db else 'disconnected',
        'redis': 'connected' if redis_client else 'disconnected'
    }), 200

# Root endpoint
@app.route('/', methods=['GET'])
def root():
    return jsonify({
        'message': 'EduLink AI Service',
        'version': '1.0.0',
        'endpoints': {
            'health': '/health',
            'language_detection': '/ai/detect-language',
            'risk_scoring': '/ai/score-risk',
            'recommendations': '/ai/recommendations/<student_id>'
        }
    }), 200

# Language detection endpoint (placeholder)
@app.route('/ai/detect-language', methods=['POST'])
def detect_language():
    """
    Detect language from audio file
    Expected: multipart/form-data with 'audio' file
    Returns: detected language and confidence
    """
    try:
        if 'audio' not in request.files:
            return jsonify({'error': 'No audio file provided'}), 400
        
        audio_file = request.files['audio']
        
        # TODO: Implement actual language detection model
        # For MVP, we'll use phone prefix fallback
        phone_prefix = request.form.get('phone_prefix', '')
        
        # Simple phone prefix to language mapping (Ghana)
        language_map = {
            '233': 'en',  # Default to English
            '23320': 'tw',  # Twi (Ashanti region)
            '23324': 'tw',  # Twi (Brong Ahafo)
            '23327': 'ee',  # Ewe (Volta region)
            '23337': 'dag', # Dagbani (Northern region)
            '23330': 'ga',  # Ga (Greater Accra)
        }
        
        detected_language = language_map.get(phone_prefix[:5], 'en')
        
        logger.info(f'Language detected: {detected_language} (phone prefix: {phone_prefix})')
        
        return jsonify({
            'language': detected_language,
            'confidence': 0.85,  # Placeholder confidence
            'method': 'phone_prefix_fallback',
            'note': 'Using phone prefix for MVP. ML model will be trained with pilot data.'
        }), 200
        
    except Exception as e:
        logger.error(f'Language detection error: {e}')
        return jsonify({'error': str(e)}), 500

# Risk scoring endpoint (placeholder)
@app.route('/ai/score-risk', methods=['POST'])
def score_risk():
    """
    Calculate dropout risk score for a student
    Expected JSON: { student_id, features: {...} }
    Returns: risk_score (0-1) and explanation
    """
    try:
        data = request.json
        student_id = data.get('student_id')
        features = data.get('features', {})
        
        if not student_id:
            return jsonify({'error': 'student_id is required'}), 400
        
        # TODO: Implement actual ML risk scoring model
        # For MVP, use rule-based scoring
        
        absences_30d = features.get('absences_30d', 0)
        contact_verified = features.get('contact_verified', False)
        learning_score = features.get('learning_score', 0.5)
        
        # Simple rule-based risk calculation
        risk_score = 0.0
        
        # High absences increase risk
        if absences_30d > 10:
            risk_score += 0.4
        elif absences_30d > 5:
            risk_score += 0.2
        
        # Unverified contact increases risk
        if not contact_verified:
            risk_score += 0.2
        
        # Low learning scores increase risk
        if learning_score < 0.3:
            risk_score += 0.3
        elif learning_score < 0.5:
            risk_score += 0.15
        
        risk_score = min(risk_score, 1.0)  # Cap at 1.0
        
        explanation = []
        if absences_30d > 5:
            explanation.append(f'High absence rate: {absences_30d} days in last 30 days')
        if not contact_verified:
            explanation.append('Parent contact not verified')
        if learning_score < 0.5:
            explanation.append('Below-average learning assessment scores')
        
        logger.info(f'Risk score calculated for student {student_id}: {risk_score}')
        
        return jsonify({
            'student_id': student_id,
            'risk_score': round(risk_score, 2),
            'risk_level': 'high' if risk_score > 0.6 else 'medium' if risk_score > 0.3 else 'low',
            'explanation': explanation,
            'method': 'rule_based',
            'note': 'Using rule-based scoring for MVP. ML model will be trained with pilot data.'
        }), 200
        
    except Exception as e:
        logger.error(f'Risk scoring error: {e}')
        return jsonify({'error': str(e)}), 500

# Recommendations endpoint (placeholder)
@app.route('/ai/recommendations/<student_id>', methods=['GET'])
def get_recommendations(student_id):
    """
    Get learning strategy recommendations for a student
    Returns: list of recommended interventions
    """
    try:
        # TODO: Implement actual recommendation engine
        # For MVP, return template-based recommendations
        
        recommendations = [
            {
                'type': 'parent_engagement',
                'title': 'Increase Parent Communication',
                'description': 'Schedule weekly voice calls to parents in their local language',
                'priority': 'high',
                'delivery_method': 'voice_call'
            },
            {
                'type': 'learning_support',
                'title': 'Literacy Practice',
                'description': 'Provide read-aloud exercises and simple reading materials',
                'priority': 'medium',
                'delivery_method': 'sms'
            },
            {
                'type': 'attendance_monitoring',
                'title': 'Daily Attendance Check',
                'description': 'Enable daily attendance alerts for this student',
                'priority': 'high',
                'delivery_method': 'system'
            }
        ]
        
        logger.info(f'Recommendations generated for student {student_id}')
        
        return jsonify({
            'student_id': student_id,
            'recommendations': recommendations,
            'generated_at': '2025-11-06T00:00:00Z',
            'note': 'Using template-based recommendations for MVP. ML model will be trained with pilot data.'
        }), 200
        
    except Exception as e:
        logger.error(f'Recommendations error: {e}')
        return jsonify({'error': str(e)}), 500

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    logger.error(f'Internal server error: {error}')
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5001))
    logger.info(f'🚀 EduLink AI Service starting on port {port}')
    logger.info(f'📍 Environment: {os.getenv("FLASK_ENV", "development")}')
    app.run(host='0.0.0.0', port=port, debug=os.getenv('FLASK_ENV') == 'development')
