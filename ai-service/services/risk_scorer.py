"""
Risk Scoring Service
Calculates dropout risk for students using rule-based and ML approaches
"""

from typing import Dict, List, Optional
import logging
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)


class RiskScorer:
    """Calculate student dropout risk"""
    
    def __init__(self):
        # Risk factor weights
        self.weights = {
            'attendance': 0.30,
            'learning': 0.25,
            'contact': 0.15,
            'demographics': 0.15,
            'historical': 0.15,
        }
        
        # Thresholds
        self.thresholds = {
            'low': 0.25,
            'medium': 0.50,
            'high': 0.75,
        }
    
    def calculate_attendance_risk(self, features: Dict) -> float:
        """
        Calculate risk from attendance patterns
        
        Args:
            features: Attendance features
            
        Returns:
            Risk score (0-1)
        """
        risk = 0.0
        
        # Recent absences (last 7 days)
        absences_7 = features.get('absences7Days', 0)
        if absences_7 >= 3:
            risk += 0.4
        elif absences_7 >= 2:
            risk += 0.2
        elif absences_7 >= 1:
            risk += 0.1
        
        # Monthly absences (last 30 days)
        absences_30 = features.get('absences30Days', 0)
        if absences_30 >= 10:
            risk += 0.3
        elif absences_30 >= 6:
            risk += 0.2
        elif absences_30 >= 3:
            risk += 0.1
        
        # Attendance rate
        attendance_rate = features.get('attendanceRate30Days', 100)
        if attendance_rate < 50:
            risk += 0.3
        elif attendance_rate < 70:
            risk += 0.2
        elif attendance_rate < 85:
            risk += 0.1
        
        # Consecutive absences
        consecutive = features.get('consecutiveAbsences', 0)
        if consecutive >= 5:
            risk += 0.3
        elif consecutive >= 3:
            risk += 0.2
        
        return min(risk, 1.0)
    
    def calculate_learning_risk(self, features: Dict) -> float:
        """
        Calculate risk from learning assessments
        
        Args:
            features: Learning features
            
        Returns:
            Risk score (0-1)
        """
        risk = 0.0
        
        literacy_level = features.get('literacyLevel')
        numeracy_level = features.get('numeracyLevel')
        avg_score = features.get('avgLearningScore', 50)
        
        # Literacy risk
        if literacy_level == 'below_benchmark':
            risk += 0.3
        elif literacy_level == 'not_assessed':
            risk += 0.1
        
        # Numeracy risk
        if numeracy_level == 'below_benchmark':
            risk += 0.3
        elif numeracy_level == 'not_assessed':
            risk += 0.1
        
        # Average score
        if avg_score < 40:
            risk += 0.3
        elif avg_score < 60:
            risk += 0.2
        
        return min(risk, 1.0)
    
    def calculate_contact_risk(self, features: Dict) -> float:
        """
        Calculate risk from parent contact status
        
        Args:
            features: Contact features
            
        Returns:
            Risk score (0-1)
        """
        risk = 0.0
        
        contact_verified = features.get('contactVerified', False)
        response_rate = features.get('contactResponseRate', 0)
        
        if not contact_verified:
            risk += 0.5
        
        if response_rate < 30:
            risk += 0.3
        elif response_rate < 60:
            risk += 0.2
        
        return min(risk, 1.0)
    
    def calculate_demographic_risk(self, features: Dict) -> float:
        """
        Calculate risk from demographic factors
        
        Args:
            features: Demographic features
            
        Returns:
            Risk score (0-1)
        """
        risk = 0.0
        
        has_disability = features.get('hasDisability', False)
        location_type = features.get('locationType', 'Urban')
        wealth_proxy = features.get('wealthProxy', 'phone_verified')
        
        if has_disability:
            risk += 0.3
        
        if location_type == 'Remote':
            risk += 0.3
        elif location_type == 'Rural':
            risk += 0.2
        
        if wealth_proxy == 'no_contact':
            risk += 0.3
        elif wealth_proxy == 'proxy_only':
            risk += 0.2
        
        return min(risk, 1.0)
    
    def calculate_historical_risk(self, features: Dict) -> float:
        """
        Calculate risk from historical patterns
        
        Args:
            features: Historical features
            
        Returns:
            Risk score (0-1)
        """
        risk = 0.0
        
        seasonal_migration = features.get('seasonalMigrationRisk', False)
        previous_dropout = features.get('previousDropoutAttempt', False)
        
        if previous_dropout:
            risk += 0.6
        
        if seasonal_migration:
            risk += 0.3
        
        return min(risk, 1.0)
    
    def calculate_risk_score(self, features: Dict) -> Dict:
        """
        Calculate overall risk score
        
        Args:
            features: All student features
            
        Returns:
            Risk assessment with score, level, and factors
        """
        # Calculate component risks
        attendance_risk = self.calculate_attendance_risk(features)
        learning_risk = self.calculate_learning_risk(features)
        contact_risk = self.calculate_contact_risk(features)
        demographic_risk = self.calculate_demographic_risk(features)
        historical_risk = self.calculate_historical_risk(features)
        
        # Weighted average
        risk_score = (
            attendance_risk * self.weights['attendance'] +
            learning_risk * self.weights['learning'] +
            contact_risk * self.weights['contact'] +
            demographic_risk * self.weights['demographics'] +
            historical_risk * self.weights['historical']
        )
        
        # Determine risk level
        if risk_score >= self.thresholds['high']:
            risk_level = 'critical'
        elif risk_score >= self.thresholds['medium']:
            risk_level = 'high'
        elif risk_score >= self.thresholds['low']:
            risk_level = 'medium'
        else:
            risk_level = 'low'
        
        # Identify top risk factors
        risk_factors = []
        factor_scores = {
            'High absence rate': attendance_risk,
            'Poor learning outcomes': learning_risk,
            'Limited parent contact': contact_risk,
            'Demographic challenges': demographic_risk,
            'Historical patterns': historical_risk,
        }
        
        # Get top 3 factors
        sorted_factors = sorted(
            factor_scores.items(),
            key=lambda x: x[1],
            reverse=True
        )
        
        for factor, score in sorted_factors[:3]:
            if score > 0.2:  # Only include significant factors
                risk_factors.append({
                    'factor': factor,
                    'weight': round(score, 2),
                    'description': self._get_factor_description(factor, features)
                })
        
        # Generate recommendations
        recommendations = self._generate_recommendations(
            risk_level,
            risk_factors,
            features
        )
        
        return {
            'riskScore': round(risk_score, 2),
            'riskLevel': risk_level,
            'components': {
                'attendance': round(attendance_risk, 2),
                'learning': round(learning_risk, 2),
                'contact': round(contact_risk, 2),
                'demographics': round(demographic_risk, 2),
                'historical': round(historical_risk, 2),
            },
            'riskFactors': risk_factors,
            'recommendations': recommendations,
            'modelVersion': '1.0-rule-based',
        }
    
    def _get_factor_description(self, factor: str, features: Dict) -> str:
        """Get description for risk factor"""
        descriptions = {
            'High absence rate': f"{features.get('absences30Days', 0)} absences in last 30 days",
            'Poor learning outcomes': f"Below benchmark in literacy or numeracy",
            'Limited parent contact': f"Contact response rate: {features.get('contactResponseRate', 0)}%",
            'Demographic challenges': f"Location: {features.get('locationType', 'Unknown')}",
            'Historical patterns': f"Previous dropout attempt or seasonal migration",
        }
        return descriptions.get(factor, '')
    
    def _generate_recommendations(
        self,
        risk_level: str,
        risk_factors: List[Dict],
        features: Dict
    ) -> List[str]:
        """Generate intervention recommendations"""
        recommendations = []
        
        # Based on risk level
        if risk_level in ['critical', 'high']:
            recommendations.append('Parent Engagement Call')
            recommendations.append('Home Visit')
        
        # Based on specific factors
        if features.get('absences30Days', 0) > 10:
            recommendations.append('Attendance Monitoring')
        
        if features.get('literacyLevel') == 'below_benchmark' or \
           features.get('numeracyLevel') == 'below_benchmark':
            recommendations.append('Learning Support')
            recommendations.append('Peer Tutoring')
        
        if not features.get('contactVerified', False):
            recommendations.append('Contact Verification')
        
        if features.get('hasDisability', False):
            recommendations.append('Special Education')
        
        if features.get('wealthProxy') == 'no_contact':
            recommendations.append('Financial Support')
            recommendations.append('Feeding Program')
        
        if features.get('locationType') == 'Remote':
            recommendations.append('Transportation Assistance')
        
        # Remove duplicates and limit to top 5
        recommendations = list(dict.fromkeys(recommendations))[:5]
        
        return recommendations
    
    def batch_calculate(self, students_features: List[Dict]) -> List[Dict]:
        """
        Calculate risk scores for multiple students
        
        Args:
            students_features: List of student feature dicts
            
        Returns:
            List of risk assessments
        """
        results = []
        
        for features in students_features:
            try:
                result = self.calculate_risk_score(features)
                result['studentId'] = features.get('studentId')
                results.append(result)
            except Exception as e:
                logger.error(f"Error calculating risk for student: {e}")
                results.append({
                    'studentId': features.get('studentId'),
                    'error': str(e)
                })
        
        return results


# Singleton instance
_scorer = None

def get_scorer() -> RiskScorer:
    """Get risk scorer instance"""
    global _scorer
    if _scorer is None:
        _scorer = RiskScorer()
    return _scorer
