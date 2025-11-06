"""
Language Detection Service
Detects Ghanaian languages from text and audio
"""

import re
from typing import Dict, Optional, Tuple
import logging

logger = logging.getLogger(__name__)

# Language patterns and keywords
LANGUAGE_PATTERNS = {
    'Twi': {
        'keywords': ['wo', 'me', 'yɛ', 'ɔ', 'ne', 'na', 'sɛ', 'akye', 'maakye', 'meda', 'ase'],
        'patterns': [r'\bwo\b', r'\bme\b', r'\byɛ\b', r'\bɔ\b', r'\bne\b'],
        'phone_prefixes': ['024', '054', '055'],
    },
    'Ga': {
        'keywords': ['ni', 'mi', 'ko', 'le', 'he', 'ojekoo', 'oyiwaladonɔ'],
        'patterns': [r'\bni\b', r'\bmi\b', r'\bko\b', r'\ble\b'],
        'phone_prefixes': ['020', '050'],
    },
    'Ewe': {
        'keywords': ['nye', 'wò', 'le', 'na', 'ɖe', 'ŋdi', 'akpe'],
        'patterns': [r'\bnye\b', r'\bwò\b', r'\ble\b', r'\bɖe\b'],
        'phone_prefixes': ['027', '057'],
    },
    'Dagbani': {
        'keywords': ['n', 'a', 'o', 'ni', 'ka', 'ti', 'desiba'],
        'patterns': [r'\bni\b', r'\bka\b', r'\bti\b'],
        'phone_prefixes': ['026', '056'],
    },
    'Hausa': {
        'keywords': ['na', 'ka', 'ya', 'ta', 'mu', 'ku', 'su', 'sannu'],
        'patterns': [r'\bna\b', r'\bka\b', r'\bya\b'],
        'phone_prefixes': ['026', '056'],
    },
    'Fante': {
        'keywords': ['me', 'wo', 'ɔ', 'ye', 'dɔ', 'edziban'],
        'patterns': [r'\bme\b', r'\bwo\b', r'\bye\b'],
        'phone_prefixes': ['024', '054'],
    },
}

# Default to English if no match
DEFAULT_LANGUAGE = 'English'


class LanguageDetector:
    """Language detection for Ghanaian languages"""
    
    def __init__(self):
        self.languages = LANGUAGE_PATTERNS
        
    def detect_from_text(self, text: str) -> Tuple[str, float]:
        """
        Detect language from text
        
        Args:
            text: Input text
            
        Returns:
            Tuple of (language, confidence)
        """
        if not text or len(text.strip()) < 3:
            return DEFAULT_LANGUAGE, 0.5
        
        text_lower = text.lower()
        scores = {}
        
        for language, patterns in self.languages.items():
            score = 0
            
            # Check keywords
            for keyword in patterns['keywords']:
                if keyword.lower() in text_lower:
                    score += 1
            
            # Check regex patterns
            for pattern in patterns['patterns']:
                matches = re.findall(pattern, text_lower)
                score += len(matches) * 2  # Patterns weighted higher
            
            scores[language] = score
        
        # Get language with highest score
        if scores and max(scores.values()) > 0:
            detected_language = max(scores, key=scores.get)
            max_score = scores[detected_language]
            
            # Calculate confidence (0-1)
            total_score = sum(scores.values())
            confidence = max_score / total_score if total_score > 0 else 0.5
            
            # Boost confidence if score is high
            if max_score >= 5:
                confidence = min(confidence + 0.2, 1.0)
            
            return detected_language, round(confidence, 2)
        
        return DEFAULT_LANGUAGE, 0.5
    
    def detect_from_phone(self, phone: str) -> Tuple[str, float]:
        """
        Detect likely language from phone number prefix
        
        Args:
            phone: Phone number
            
        Returns:
            Tuple of (language, confidence)
        """
        # Extract prefix (e.g., 024 from +233241234567)
        phone_clean = re.sub(r'[^\d]', '', phone)
        
        if phone_clean.startswith('233'):
            prefix = phone_clean[3:6]
        elif phone_clean.startswith('0'):
            prefix = phone_clean[1:4]
        else:
            return DEFAULT_LANGUAGE, 0.3
        
        # Check which language uses this prefix
        for language, patterns in self.languages.items():
            if prefix in patterns.get('phone_prefixes', []):
                return language, 0.6  # Medium confidence
        
        return DEFAULT_LANGUAGE, 0.3
    
    def detect_from_location(self, region: str) -> Tuple[str, float]:
        """
        Detect likely language from region
        
        Args:
            region: Ghana region name
            
        Returns:
            Tuple of (language, confidence)
        """
        region_language_map = {
            'Ashanti': 'Twi',
            'Brong Ahafo': 'Twi',
            'Bono': 'Twi',
            'Bono East': 'Twi',
            'Ahafo': 'Twi',
            'Eastern': 'Twi',
            'Greater Accra': 'Ga',
            'Volta': 'Ewe',
            'Oti': 'Ewe',
            'Northern': 'Dagbani',
            'Upper East': 'Dagbani',
            'Upper West': 'Dagbani',
            'Savannah': 'Gonja',
            'North East': 'Dagbani',
            'Central': 'Fante',
            'Western': 'Fante',
        }
        
        language = region_language_map.get(region, DEFAULT_LANGUAGE)
        confidence = 0.7 if language != DEFAULT_LANGUAGE else 0.5
        
        return language, confidence
    
    def detect_combined(
        self,
        text: Optional[str] = None,
        phone: Optional[str] = None,
        region: Optional[str] = None
    ) -> Dict[str, any]:
        """
        Detect language using multiple signals
        
        Args:
            text: Text sample
            phone: Phone number
            region: Region name
            
        Returns:
            Detection result with language and confidence
        """
        detections = []
        
        if text:
            lang, conf = self.detect_from_text(text)
            detections.append({
                'method': 'text',
                'language': lang,
                'confidence': conf,
                'weight': 3.0  # Text is most reliable
            })
        
        if phone:
            lang, conf = self.detect_from_phone(phone)
            detections.append({
                'method': 'phone',
                'language': lang,
                'confidence': conf,
                'weight': 1.0
            })
        
        if region:
            lang, conf = self.detect_from_location(region)
            detections.append({
                'method': 'region',
                'language': lang,
                'confidence': conf,
                'weight': 1.5
            })
        
        if not detections:
            return {
                'language': DEFAULT_LANGUAGE,
                'confidence': 0.5,
                'method': 'default',
                'alternatives': []
            }
        
        # Weighted voting
        language_scores = {}
        
        for detection in detections:
            lang = detection['language']
            weighted_conf = detection['confidence'] * detection['weight']
            
            if lang in language_scores:
                language_scores[lang] += weighted_conf
            else:
                language_scores[lang] = weighted_conf
        
        # Get top language
        detected_language = max(language_scores, key=language_scores.get)
        total_weight = sum(d['weight'] for d in detections)
        final_confidence = language_scores[detected_language] / total_weight
        
        # Get alternatives
        sorted_languages = sorted(
            language_scores.items(),
            key=lambda x: x[1],
            reverse=True
        )
        alternatives = [
            {'language': lang, 'score': round(score / total_weight, 2)}
            for lang, score in sorted_languages[1:4]
        ]
        
        return {
            'language': detected_language,
            'confidence': round(final_confidence, 2),
            'method': 'combined',
            'detections': detections,
            'alternatives': alternatives
        }
    
    def get_supported_languages(self) -> list:
        """Get list of supported languages"""
        return list(self.languages.keys()) + [DEFAULT_LANGUAGE]


# Singleton instance
_detector = None

def get_detector() -> LanguageDetector:
    """Get language detector instance"""
    global _detector
    if _detector is None:
        _detector = LanguageDetector()
    return _detector
