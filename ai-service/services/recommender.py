"""
Recommendation Service
Generates personalized recommendations for students and schools
"""

from typing import Dict, List
import logging

logger = logging.getLogger(__name__)


class Recommender:
    """Generate personalized recommendations"""
    
    def __init__(self):
        # Intervention catalog
        self.interventions = {
            'Parent Engagement Call': {
                'type': 'communication',
                'cost': 'low',
                'effectiveness': 0.7,
                'duration_days': 1,
            },
            'Home Visit': {
                'type': 'outreach',
                'cost': 'medium',
                'effectiveness': 0.8,
                'duration_days': 7,
            },
            'Learning Support': {
                'type': 'academic',
                'cost': 'medium',
                'effectiveness': 0.75,
                'duration_days': 30,
            },
            'Peer Tutoring': {
                'type': 'academic',
                'cost': 'low',
                'effectiveness': 0.65,
                'duration_days': 30,
            },
            'Feeding Program': {
                'type': 'welfare',
                'cost': 'high',
                'effectiveness': 0.8,
                'duration_days': 90,
            },
            'Transportation Assistance': {
                'type': 'logistics',
                'cost': 'high',
                'effectiveness': 0.85,
                'duration_days': 90,
            },
            'Special Education': {
                'type': 'academic',
                'cost': 'high',
                'effectiveness': 0.9,
                'duration_days': 180,
            },
            'Financial Support': {
                'type': 'welfare',
                'cost': 'high',
                'effectiveness': 0.85,
                'duration_days': 90,
            },
            'Counseling': {
                'type': 'psychosocial',
                'cost': 'medium',
                'effectiveness': 0.7,
                'duration_days': 30,
            },
            'Health Referral': {
                'type': 'health',
                'cost': 'medium',
                'effectiveness': 0.75,
                'duration_days': 14,
            },
        }
    
    def recommend_for_student(
        self,
        student_data: Dict,
        risk_assessment: Dict,
        budget: str = 'medium'
    ) -> Dict:
        """
        Generate recommendations for a student
        
        Args:
            student_data: Student information
            risk_assessment: Risk assessment results
            budget: Budget level (low/medium/high)
            
        Returns:
            Recommendations with priorities
        """
        recommendations = []
        risk_level = risk_assessment.get('riskLevel', 'low')
        risk_factors = risk_assessment.get('riskFactors', [])
        
        # Get base recommendations from risk assessment
        base_recommendations = risk_assessment.get('recommendations', [])
        
        # Score and prioritize each intervention
        for intervention_name in base_recommendations:
            if intervention_name in self.interventions:
                intervention = self.interventions[intervention_name]
                
                # Calculate priority score
                priority_score = self._calculate_priority(
                    intervention,
                    risk_level,
                    risk_factors,
                    student_data
                )
                
                # Check budget constraint
                if self._fits_budget(intervention['cost'], budget):
                    recommendations.append({
                        'intervention': intervention_name,
                        'type': intervention['type'],
                        'priority': priority_score,
                        'cost': intervention['cost'],
                        'expectedEffectiveness': intervention['effectiveness'],
                        'estimatedDuration': intervention['duration_days'],
                        'reasoning': self._get_reasoning(
                            intervention_name,
                            risk_factors,
                            student_data
                        ),
                    })
        
        # Sort by priority
        recommendations.sort(key=lambda x: x['priority'], reverse=True)
        
        # Add implementation plan for top recommendations
        top_recommendations = recommendations[:3]
        for rec in top_recommendations:
            rec['implementationSteps'] = self._get_implementation_steps(
                rec['intervention']
            )
        
        return {
            'studentId': student_data.get('_id'),
            'studentName': student_data.get('fullName'),
            'riskLevel': risk_level,
            'recommendations': recommendations,
            'topRecommendations': top_recommendations,
            'estimatedImpact': self._estimate_impact(top_recommendations),
        }
    
    def recommend_for_school(
        self,
        school_data: Dict,
        student_risks: List[Dict],
        budget: float
    ) -> Dict:
        """
        Generate school-level recommendations
        
        Args:
            school_data: School information
            student_risks: List of student risk assessments
            budget: Available budget
            
        Returns:
            School-level recommendations
        """
        # Analyze school-wide patterns
        high_risk_count = sum(1 for r in student_risks if r.get('riskLevel') in ['high', 'critical'])
        total_students = len(student_risks)
        high_risk_rate = high_risk_count / total_students if total_students > 0 else 0
        
        # Aggregate risk factors
        factor_counts = {}
        for risk in student_risks:
            for factor in risk.get('riskFactors', []):
                factor_name = factor.get('factor')
                factor_counts[factor_name] = factor_counts.get(factor_name, 0) + 1
        
        # Get top school-wide issues
        top_issues = sorted(
            factor_counts.items(),
            key=lambda x: x[1],
            reverse=True
        )[:5]
        
        # Generate school-level interventions
        recommendations = []
        
        if high_risk_rate > 0.3:
            recommendations.append({
                'intervention': 'School-wide Attendance Campaign',
                'priority': 'high',
                'affectedStudents': high_risk_count,
                'estimatedCost': budget * 0.3,
                'expectedImpact': 'Reduce dropout risk by 20-30%',
            })
        
        if any('learning' in issue[0].lower() for issue in top_issues):
            recommendations.append({
                'intervention': 'Teacher Training Program',
                'priority': 'high',
                'affectedStudents': total_students,
                'estimatedCost': budget * 0.25,
                'expectedImpact': 'Improve learning outcomes by 15-25%',
            })
        
        if any('contact' in issue[0].lower() for issue in top_issues):
            recommendations.append({
                'intervention': 'Parent Engagement Initiative',
                'priority': 'medium',
                'affectedStudents': high_risk_count,
                'estimatedCost': budget * 0.2,
                'expectedImpact': 'Increase parent engagement by 40%',
            })
        
        return {
            'schoolId': school_data.get('_id'),
            'schoolName': school_data.get('name'),
            'totalStudents': total_students,
            'highRiskStudents': high_risk_count,
            'highRiskRate': round(high_risk_rate * 100, 1),
            'topIssues': [{'issue': issue, 'count': count} for issue, count in top_issues],
            'recommendations': recommendations,
            'totalBudget': budget,
        }
    
    def _calculate_priority(
        self,
        intervention: Dict,
        risk_level: str,
        risk_factors: List[Dict],
        student_data: Dict
    ) -> float:
        """Calculate intervention priority score"""
        score = 0.0
        
        # Base score from risk level
        risk_scores = {'low': 0.2, 'medium': 0.5, 'high': 0.7, 'critical': 1.0}
        score += risk_scores.get(risk_level, 0.5)
        
        # Boost for effectiveness
        score += intervention['effectiveness'] * 0.5
        
        # Boost for urgency (short duration interventions)
        if intervention['duration_days'] <= 7:
            score += 0.2
        
        # Reduce for high cost
        if intervention['cost'] == 'high':
            score -= 0.1
        
        return round(min(score, 1.0), 2)
    
    def _fits_budget(self, cost: str, budget: str) -> bool:
        """Check if intervention fits budget"""
        cost_levels = {'low': 1, 'medium': 2, 'high': 3}
        return cost_levels.get(cost, 2) <= cost_levels.get(budget, 2)
    
    def _get_reasoning(
        self,
        intervention: str,
        risk_factors: List[Dict],
        student_data: Dict
    ) -> str:
        """Get reasoning for recommendation"""
        reasons = {
            'Parent Engagement Call': 'High absence rate requires immediate parent contact',
            'Home Visit': 'Critical risk level requires in-person intervention',
            'Learning Support': 'Below benchmark performance in literacy or numeracy',
            'Peer Tutoring': 'Cost-effective academic support for struggling students',
            'Feeding Program': 'Poverty indicators suggest need for nutritional support',
            'Transportation Assistance': 'Remote location creates access barriers',
            'Special Education': 'Disability status requires specialized support',
            'Financial Support': 'Economic barriers preventing regular attendance',
            'Counseling': 'Psychosocial factors affecting school engagement',
            'Health Referral': 'Health-related absences require medical attention',
        }
        return reasons.get(intervention, 'Recommended based on risk assessment')
    
    def _get_implementation_steps(self, intervention: str) -> List[str]:
        """Get implementation steps for intervention"""
        steps = {
            'Parent Engagement Call': [
                'Verify parent contact information',
                'Schedule call within 24 hours',
                'Use preferred language',
                'Document conversation',
                'Schedule follow-up if needed',
            ],
            'Home Visit': [
                'Coordinate with district officer',
                'Schedule visit with family',
                'Prepare assessment checklist',
                'Conduct visit with teacher',
                'Document findings and action plan',
            ],
            'Learning Support': [
                'Assess specific learning gaps',
                'Create individualized learning plan',
                'Assign support teacher',
                'Schedule regular sessions',
                'Monitor progress weekly',
            ],
        }
        return steps.get(intervention, ['Plan intervention', 'Implement', 'Monitor', 'Evaluate'])
    
    def _estimate_impact(self, recommendations: List[Dict]) -> Dict:
        """Estimate combined impact of recommendations"""
        if not recommendations:
            return {'expectedReduction': 0, 'confidence': 'low'}
        
        # Simple additive model (could be more sophisticated)
        total_effectiveness = sum(r['expectedEffectiveness'] for r in recommendations)
        avg_effectiveness = total_effectiveness / len(recommendations)
        
        # Estimate risk reduction
        expected_reduction = min(avg_effectiveness * 0.5, 0.8)  # Cap at 80%
        
        confidence = 'high' if len(recommendations) >= 3 else 'medium'
        
        return {
            'expectedRiskReduction': round(expected_reduction * 100, 1),
            'confidence': confidence,
            'timeframe': '30-90 days',
        }


# Singleton instance
_recommender = None

def get_recommender() -> Recommender:
    """Get recommender instance"""
    global _recommender
    if _recommender is None:
        _recommender = Recommender()
    return _recommender
