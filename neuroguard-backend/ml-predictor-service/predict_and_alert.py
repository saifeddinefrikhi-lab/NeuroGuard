"""
Risk Prediction and Alert Generation Script
Analyzes medical history data, predicts hospitalization risk, and generates alerts
"""
import pandas as pd
import numpy as np
from datetime import datetime
import joblib
import os
from feature_extraction import MedicalFeatureExtractor, load_medical_history, load_risk_alerts


class RiskAlertGenerator:
    """Generate risk alerts based on ML predictions"""
    
    def __init__(self, model_path='hospitalisation_model.pkl', features_path='feature_names.pkl'):
        """Initialize with trained model"""
        if os.path.exists(model_path) and os.path.exists(features_path):
            self.model = joblib.load(model_path)
            self.feature_names = joblib.load(features_path)
            self.feature_extractor = MedicalFeatureExtractor()
            print("✓ Model loaded successfully")
        else:
            raise FileNotFoundError("Model files not found. Please train the model first.")
    
    def predict_risk(self, medical_record):
        """
        Predict hospitalization risk for a patient
        
        Args:
            medical_record: dict or pandas Series with medical history
            
        Returns:
            dict with prediction results
        """
        # Extract features
        features = self.feature_extractor.extract_features(medical_record)
        
        # Build feature row with explicit column names to match training schema.
        X_row = {name: features.get(name, 0) for name in self.feature_names}
        X = pd.DataFrame([X_row], columns=self.feature_names)
        
        # Predict
        probability = self.model.predict_proba(X)[0][1]
        prediction = int(self.model.predict(X)[0])
        
        # Determine risk level
        risk_level = self._get_risk_level(probability)
        
        return {
            'patient_id': medical_record.get('patient_id') or medical_record.get('patientId'),
            'prediction': prediction,
            'probability': round(probability, 4),
            'risk_percentage': round(probability * 100, 2),
            'risk_level': risk_level,
            'features': features
        }
    
    def generate_alert(self, prediction_result, medical_record):
        """
        Generate alert message based on prediction
        
        Args:
            prediction_result: dict from predict_risk()
            medical_record: original medical history record
            
        Returns:
            dict with alert details
        """
        patient_id = prediction_result['patient_id']
        risk_level = prediction_result['risk_level']
        probability = prediction_result['risk_percentage']
        features = prediction_result['features']
        
        # Generate alert message
        message = self._create_alert_message(risk_level, probability, features, medical_record)
        
        # Determine severity
        severity = self._map_risk_to_severity(risk_level)
        
        alert = {
            'patient_id': patient_id,
            'severity': severity,
            'message': message,
            'created_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'resolved': 0,
            'risk_score': probability,
            'risk_level': risk_level,
            'prediction': prediction_result['prediction']
        }
        
        return alert
    
    def process_all_patients(self, medical_history_df):
        """
        Process all patients and generate alerts
        
        Args:
            medical_history_df: DataFrame with medical history records
            
        Returns:
            DataFrame with alerts
        """
        alerts = []
        predictions = []
        
        print(f"\nProcessing {len(medical_history_df)} patients...")
        
        for idx, record in medical_history_df.iterrows():
            try:
                # Predict risk
                prediction = self.predict_risk(record)
                predictions.append(prediction)
                
                # Generate alert if risk is significant
                if prediction['risk_level'] in ['MODERATE', 'HIGH', 'CRITICAL']:
                    alert = self.generate_alert(prediction, record)
                    alerts.append(alert)
                    
                    print(f"  Patient {record['patient_id']}: {prediction['risk_level']} risk ({prediction['risk_percentage']:.1f}%)")
                
            except Exception as e:
                print(f"  Error processing patient {record.get('patient_id')}: {e}")
        
        print(f"\n✓ Generated {len(alerts)} alerts")
        
        return pd.DataFrame(alerts), pd.DataFrame(predictions)
    
    def _get_risk_level(self, probability):
        """Determine risk level from probability"""
        if probability >= 0.7:
            return 'CRITICAL'
        elif probability >= 0.5:
            return 'HIGH'
        elif probability >= 0.3:
            return 'MODERATE'
        elif probability >= 0.15:
            return 'LOW'
        else:
            return 'MINIMAL'
    
    def _map_risk_to_severity(self, risk_level):
        """Map risk level to alert severity"""
        mapping = {
            'CRITICAL': 'CRITICAL',
            'HIGH': 'WARNING',
            'MODERATE': 'WARNING',
            'LOW': 'INFO',
            'MINIMAL': 'INFO'
        }
        return mapping.get(risk_level, 'INFO')
    
    def _create_alert_message(self, risk_level, probability, features, medical_record):
        """Create detailed alert message"""
        diagnosis = medical_record.get('diagnosis', 'N/A')
        
        if risk_level == 'CRITICAL':
            message = f"CRITICAL ALERT: Patient shows {probability:.1f}% hospitalization risk. "
            message += "Immediate medical evaluation recommended. "
        elif risk_level == 'HIGH':
            message = f"HIGH RISK: Patient has {probability:.1f}% hospitalization risk. "
            message += "Schedule medical consultation soon. "
        else:
            message = f"MODERATE RISK: Patient has {probability:.1f}% hospitalization risk. "
            message += "Increased monitoring recommended. "
        
        # Add contributing factors
        risk_factors = []
        
        if features.get('progressionStage', 0) >= 3:
            stage = medical_record.get('progression_stage', 'ADVANCED')
            risk_factors.append(f"{stage} disease stage")
        
        if features.get('comorbidityCount', 0) >= 2:
            comorbidities = medical_record.get('comorbidities', '')
            risk_factors.append(f"multiple comorbidities ({comorbidities[:50]}...)")
        
        if features.get('hasGeneticRisk', 0) >= 1:
            genetic = medical_record.get('genetic_risk', '')
            risk_factors.append(f"genetic risk ({genetic})")
        
        if features.get('yearsSinceDiagnosis', 0) > 5:
            years = features['yearsSinceDiagnosis']
            risk_factors.append(f"{years:.1f} years since diagnosis")

        diagnosis_text = str(medical_record.get('diagnosis', '')).lower()
        if 'dementia' in diagnosis_text or 'alzheimer' in diagnosis_text:
            risk_factors.append("neurocognitive disorder")
        
        if risk_factors:
            message += f"Contributing factors: {', '.join(risk_factors[:3])}. "
        
        message += f"Diagnosis: {diagnosis}."
        
        return message


def save_alerts_to_csv(alerts_df, output_file='data/generated_alerts.csv'):
    """Save generated alerts to CSV"""
    alerts_df.to_csv(output_file, index=False)
    print(f"\n✓ Alerts saved to: {output_file}")


def main():
    """Main execution function"""
    print("=" * 60)
    print("Risk Prediction and Alert Generation")
    print("=" * 60)
    
    try:
        # Load medical history data
        print("\n1. Loading medical history data...")
        medical_history = load_medical_history('data/medical_history_db.csv')
        print(f"   Loaded {len(medical_history)} patient records")
        
        # Initialize alert generator
        print("\n2. Loading ML model...")
        generator = RiskAlertGenerator()
        
        # Process all patients
        print("\n3. Processing patients and generating predictions...")
        alerts_df, predictions_df = generator.process_all_patients(medical_history)
        
        # Save results
        print("\n4. Saving results...")
        if len(alerts_df) > 0:
            save_alerts_to_csv(alerts_df, 'data/generated_alerts.csv')
            
            # Display summary
            print("\n" + "=" * 60)
            print("ALERT SUMMARY")
            print("=" * 60)
            print(f"\nTotal patients analyzed: {len(medical_history)}")
            print(f"Alerts generated: {len(alerts_df)}")
            print("\nAlerts by severity:")
            print(alerts_df['severity'].value_counts().to_string())
            print("\nAlerts by risk level:")
            print(alerts_df['risk_level'].value_counts().to_string())
            
            # Show sample alerts
            print("\n" + "=" * 60)
            print("SAMPLE ALERTS")
            print("=" * 60)
            for idx, alert in alerts_df.head(3).iterrows():
                print(f"\nPatient ID: {alert['patient_id']}")
                print(f"Severity: {alert['severity']}")
                print(f"Risk: {alert['risk_level']} ({alert['risk_score']:.1f}%)")
                print(f"Message: {alert['message']}")
        else:
            print("\n⚠ No alerts generated (all patients have low risk)")
        
        # Save predictions
        predictions_df.to_csv('data/predictions.csv', index=False)
        print(f"\n✓ All predictions saved to: data/predictions.csv")
        
        print("\n" + "=" * 60)
        print("✓ Processing complete!")
        print("=" * 60)
        
    except FileNotFoundError as e:
        print(f"\n❌ Error: {e}")
        print("\nPlease ensure:")
        print("  1. Medical history data exists: data/medical_history_db.csv")
        print("  2. Model is trained: python train_model.py")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == '__main__':
    main()
