"""
AI Services Package
"""

from .language_detector import get_detector
from .risk_scorer import get_scorer
from .recommender import get_recommender

__all__ = ['get_detector', 'get_scorer', 'get_recommender']
