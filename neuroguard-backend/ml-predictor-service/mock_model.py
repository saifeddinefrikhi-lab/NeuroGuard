"""
Mock RandomForest model for testing without scikit-learn
This module provides a lightweight model that mimics scikit-learn's API
"""
import numpy as np


class MockRandomForestModel:
    """Mock model that mimics scikit-learn RandomForestClassifier API"""
    
    def __init__(self):
        self.classes_ = np.array([0, 1])
        self.n_features_ = 11
    
    def predict(self, X):
        """Predict class labels (0 or 1)"""
        # Simple rule-based prediction
        predictions = []
        for features in X:
            # Calculate risk score from features
            age, gender, stage, years, comorbid, allergies, genetic, family, surgery, caregiver, provider = features
            
            # Risk factors
            risk_score = 0
            risk_score += (age - 50) / 10  # Age factor
            risk_score += stage * 10  # Progression stage
            risk_score += years * 5  # Years since diagnosis
            risk_score += comorbid * 8  # Comorbidities
            risk_score += genetic * 15  # Genetic risk
            risk_score += family * 10  # Family history
            risk_score += surgery * 5  # Surgeries
            
            # Predict based on risk score
            if risk_score > 50:
                predictions.append(1)  # High risk - will be hospitalized
            else:
                predictions.append(0)  # Low risk
        
        return np.array(predictions)
    
    def predict_proba(self, X):
        """Predict class probabilities"""
        probabilities = []
        for features in X:
            age, gender, stage, years, comorbid, allergies, genetic, family, surgery, caregiver, provider = features
            
            # Calculate probability based on risk factors
            prob = 0.15  # Base risk
            
            # Age (older = higher risk)
            if age >= 75:
                prob += 0.15
            elif age >= 70:
                prob += 0.10
            elif age >= 65:
                prob += 0.05
            
            # Progression stage
            if stage == 3:  # SEVERE
                prob += 0.25
            elif stage == 2:  # MODERATE
                prob += 0.12
            
            # Years since diagnosis
            if years > 10:
                prob += 0.15
            elif years > 5:
                prob += 0.10
            elif years > 2:
                prob += 0.05
            
            # Comorbidities
            if comorbid >= 4:
                prob += 0.20
            elif comorbid >= 2:
                prob += 0.10
            
            # Genetic and family
            if genetic:
                prob += 0.12
            if family:
                prob += 0.08
            
            # Surgeries
            if surgery >= 2:
                prob += 0.08
            
            # Caregiver count (indicator of severity)
            if caregiver >= 2:
                prob += 0.10
            
            # Cap probability
            prob = min(prob, 0.95)
            prob = max(prob, 0.05)
            
            # Return [prob_class_0, prob_class_1]
            probabilities.append([1 - prob, prob])
        
        return np.array(probabilities)
