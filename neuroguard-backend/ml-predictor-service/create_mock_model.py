"""
Create mock model files for testing without scikit-learn
This allows API testing when disk space is limited
"""
import joblib
import numpy as np
from mock_model import MockRandomForestModel


def create_mock_model():
    """Create and save mock model files"""
    print("Creating mock model files...")
    print("(This is a lightweight model for testing without scikit-learn)")
    
    # Create mock model
    model = MockRandomForestModel()
    
    # Feature names matching Java PatientFeatures
    feature_names = [
        'age',
        'gender',
        'progressionStage',
        'yearsSinceDiagnosis',
        'comorbidityCount',
        'allergyCount',
        'hasGeneticRisk',
        'hasFamilyHistory',
        'surgeryCount',
        'caregiverCount',
        'providerCount'
    ]
    
    # Save model and features
    joblib.dump(model, 'hospitalisation_model.pkl')
    joblib.dump(feature_names, 'feature_names.pkl')
    
    print("\n✓ Mock model files created:")
    print("  - hospitalisation_model.pkl")
    print("  - feature_names.pkl")
    print("\nYou can now test the API!")
    print("This is a rule-based model, not ML-trained.")
    print("\nTo use a real ML model:")
    print("  1. Free up disk space (~100MB)")
    print("  2. pip install scikit-learn")
    print("  3. python train_model.py")
    
    # Test the model
    print("\n" + "=" * 50)
    print("Testing mock model...")
    print("=" * 50)
    
    # Test case: High risk patient
    X_test_high = np.array([[
        72,  # age
        1,   # gender (MALE)
        3,   # progressionStage (SEVERE)
        8,   # yearsSinceDiagnosis
        4,   # comorbidityCount
        2,   # allergyCount
        1,   # hasGeneticRisk
        1,   # hasFamilyHistory
        2,   # surgeryCount
        2,   # caregiverCount
        3    # providerCount
    ]])
    
    pred_high = model.predict(X_test_high)[0]
    prob_high = model.predict_proba(X_test_high)[0][1]
    
    print(f"\nHigh Risk Patient:")
    print(f"  Prediction: {pred_high}")
    print(f"  Probability: {prob_high:.2%}")
    print(f"  Risk Level: {'HIGH' if prob_high >= 0.5 else 'MODERATE'}")
    
    # Test case: Low risk patient
    X_test_low = np.array([[
        58,  # age
        0,   # gender (FEMALE)
        1,   # progressionStage (MILD)
        1,   # yearsSinceDiagnosis
        1,   # comorbidityCount
        0,   # allergyCount
        0,   # hasGeneticRisk
        0,   # hasFamilyHistory
        0,   # surgeryCount
        0,   # caregiverCount
        1    # providerCount
    ]])
    
    pred_low = model.predict(X_test_low)[0]
    prob_low = model.predict_proba(X_test_low)[0][1]
    
    print(f"\nLow Risk Patient:")
    print(f"  Prediction: {pred_low}")
    print(f"  Probability: {prob_low:.2%}")
    print(f"  Risk Level: {'LOW' if prob_low < 0.3 else 'MODERATE'}")
    
    print("\n" + "=" * 50)
    print("Mock model is ready to use!")
    print("=" * 50)


if __name__ == '__main__':
    create_mock_model()
