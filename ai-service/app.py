import os
import logging
from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv
from pymongo import MongoClient
import redis

# Import AI services
from services.language_detector import get_detector
from services.risk_scorer import get_scorer
from services.recommender import get_recommender

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

# Language detection endpoint
@app.route('/ai/detect-language', methods=['POST'])
def detect_language():
    """
    Detect language from text, phone, or region
    Expected JSON: { text, phone, region }
    Returns: detected language and confidence
    """
    try:
        data = request.json or {}
        text = data.get('text')
        phone = data.get('phone')
        region = data.get('region')
        
        if not any([text, phone, region]):
            return jsonify({'error': 'At least one of text, phone, or region is required'}), 400
        
        detector = get_detector()
        result = detector.detect_combined(text=text, phone=phone, region=region)
        
        logger.info(f'Language detected: {result["language"]} (confidence: {result["confidence"]})')
        
        return jsonify(result), 200
        
    except Exception as e:
        logger.error(f'Language detection error: {e}')
        return jsonify({'error': str(e)}), 500

# Risk scoring endpoint
@app.route('/ai/score-risk', methods=['POST'])
def score_risk():
    """
    Calculate dropout risk score for a student
    Expected JSON: { features: {...} }
    Returns: risk assessment with score, level, and recommendations
    """
    try:
        data = request.json or {}
        features = data.get('features', {})
        
        if not features:
            return jsonify({'error': 'features object is required'}), 400
        
        scorer = get_scorer()
        result = scorer.calculate_risk_score(features)
        
        logger.info(f'Risk score calculated: {result["riskScore"]} ({result["riskLevel"]})')
        
        return jsonify(result), 200
        
    except Exception as e:
        logger.error(f'Risk scoring error: {e}')
        return jsonify({'error': str(e)}), 500

# Batch risk scoring endpoint
@app.route('/ai/score-risk/batch', methods=['POST'])
def score_risk_batch():
    """
    Calculate risk scores for multiple students
    Expected JSON: { students: [{features: {...}}, ...] }
    Returns: list of risk assessments
    """
    try:
        data = request.json or {}
        students = data.get('students', [])
        
        if not students:
            return jsonify({'error': 'students array is required'}), 400
        
        scorer = get_scorer()
        results = scorer.batch_calculate(students)
        
        logger.info(f'Batch risk scoring completed for {len(results)} students')
        
        return jsonify({'results': results}), 200
        
    except Exception as e:
        logger.error(f'Batch risk scoring error: {e}')
        return jsonify({'error': str(e)}), 500

# Recommendations endpoint
@app.route('/ai/recommendations', methods=['POST'])
def get_recommendations():
    """
    Get personalized recommendations for a student
    Expected JSON: { studentData: {...}, riskAssessment: {...}, budget: 'low|medium|high' }
    Returns: personalized intervention recommendations
    """
    try:
        data = request.json or {}
        student_data = data.get('studentData', {})
        risk_assessment = data.get('riskAssessment', {})
        budget = data.get('budget', 'medium')
        
        if not student_data or not risk_assessment:
            return jsonify({'error': 'studentData and riskAssessment are required'}), 400
        
        recommender = get_recommender()
        result = recommender.recommend_for_student(student_data, risk_assessment, budget)
        
        logger.info(f'Recommendations generated for student {student_data.get("_id")}')
        
        return jsonify(result), 200
        
    except Exception as e:
        logger.error(f'Recommendations error: {e}')
        return jsonify({'error': str(e)}), 500

# School recommendations endpoint
@app.route('/ai/recommendations/school', methods=['POST'])
def get_school_recommendations():
    """
    Get school-level recommendations
    Expected JSON: { schoolData: {...}, studentRisks: [...], budget: 10000 }
    Returns: school-level intervention recommendations
    """
    try:
        data = request.json or {}
        school_data = data.get('schoolData', {})
        student_risks = data.get('studentRisks', [])
        budget = data.get('budget', 0)
        
        if not school_data or not student_risks:
            return jsonify({'error': 'schoolData and studentRisks are required'}), 400
        
        recommender = get_recommender()
        result = recommender.recommend_for_school(school_data, student_risks, budget)
        
        logger.info(f'School recommendations generated for {school_data.get("name")}')
        
        return jsonify(result), 200
        
    except Exception as e:
        logger.error(f'School recommendations error: {e}')
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
