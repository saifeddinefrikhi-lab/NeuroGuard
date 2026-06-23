"""
Generate synthetic training data for hospitalization risk prediction
Based on medical history patterns
Aligned with Java PatientFeatures class
"""
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import random
from feature_extraction import MedicalFeatureExtractor, load_medical_history


def _label_real_sample(features):
    """Heuristic label used for weakly supervised samples from real-world records."""
    score = 0.0
    score += max(0, (features['age'] - 60) * 0.01)
    score += max(0, features['yearsSinceDiagnosis'] * 0.02)
    score += (features['progressionStage'] - 1) * 0.18
    score += features['comorbidityCount'] * 0.06
    score += features['allergyCount'] * 0.01
    score += features['hasGeneticRisk'] * 0.07
    score += features['hasFamilyHistory'] * 0.05
    score += features['surgeryCount'] * 0.05
    score += features['caregiverCount'] * 0.04

    probability = min(0.95, max(0.02, score))
    return 1 if probability >= 0.45 else 0


def _build_real_world_training_samples(medical_history_file='data/medical_history_db.csv', replications=10, max_total_samples=8000):
    """Create training rows from medical history records using feature extraction + weak labels."""
    if replications <= 0:
        return pd.DataFrame()

    extractor = MedicalFeatureExtractor()
    medical_df = load_medical_history(medical_history_file)
    if len(medical_df) == 0:
        return pd.DataFrame()

    rows = []
    if len(medical_df) > 0:
        replications = max(1, min(replications, int(max_total_samples / len(medical_df))))
    for _, row in medical_df.iterrows():
        base_features = extractor.extract_features(row)
        base_patient_id = int(base_features.get('patientId') or 0)

        for replica in range(replications):
            # Light jitter avoids overfitting identical duplicates.
            jittered = dict(base_features)
            jittered['patientId'] = base_patient_id * 100 + replica
            jittered['age'] = int(np.clip(jittered['age'] + np.random.randint(-2, 3), 40, 95))
            jittered['yearsSinceDiagnosis'] = int(np.clip(jittered['yearsSinceDiagnosis'] + np.random.randint(-1, 2), 0, 25))
            jittered['comorbidityCount'] = int(np.clip(jittered['comorbidityCount'] + np.random.randint(-1, 2), 0, 10))
            jittered['allergyCount'] = int(np.clip(jittered['allergyCount'] + np.random.randint(-1, 2), 0, 8))
            jittered['surgeryCount'] = int(np.clip(jittered['surgeryCount'] + np.random.randint(-1, 2), 0, 6))
            jittered['caregiverCount'] = int(np.clip(jittered['caregiverCount'] + np.random.randint(-1, 2), 0, 6))
            jittered['providerCount'] = int(np.clip(jittered['providerCount'] + np.random.randint(-1, 2), 1, 8))
            jittered['hospitalized'] = _label_real_sample(jittered)
            rows.append(jittered)

    return pd.DataFrame(rows)


def generate_training_data(n_samples=500, output_file='data/training_data.csv', medical_history_file='data/medical_history_db.csv'):
    """
    Generate synthetic training data for hospitalization risk
    Features match Java PatientFeatures class
    
    Args:
        n_samples: Number of samples to generate
        output_file: Path to save the training data
        
    Returns:
        pandas DataFrame with training data
    """
    np.random.seed(42)
    random.seed(42)
    
    # Features matching Java PatientFeatures class
    data = {
        'patientId': [],
        'age': [],
        'gender': [],                    # 0=FEMALE, 1=MALE, 2=OTHER
        'progressionStage': [],          # 1=MILD, 2=MODERATE, 3=SEVERE
        'yearsSinceDiagnosis': [],
        'comorbidityCount': [],
        'allergyCount': [],
        'hasGeneticRisk': [],            # 0=false, 1=true
        'hasFamilyHistory': [],          # 0=false, 1=true
        'surgeryCount': [],
        'caregiverCount': [],
        'providerCount': [],
        'hospitalized': []                # Target variable
    }
    
    for i in range(n_samples):
        # Patient ID
        patient_id = 1000 + i
        
        # Age (45-85 years, Parkinson's mostly affects older adults)
        age = int(np.random.normal(65, 10))
        age = max(45, min(85, age))
        
        # Gender (slightly more males have Parkinson's)
        gender = np.random.choice([0, 1, 2], p=[0.45, 0.52, 0.03])  # FEMALE, MALE, OTHER
        
        # Years since diagnosis (0-15 years)
        years = np.random.exponential(3)
        years = int(min(years, 15))
        
        # Progression stage (increases with years since diagnosis)
        if years < 2:
            progression = np.random.choice([1, 2], p=[0.7, 0.3])
        elif years < 5:
            progression = np.random.choice([1, 2, 3], p=[0.2, 0.5, 0.3])
        elif years < 10:
            progression = np.random.choice([2, 3], p=[0.4, 0.6])
        else:
            progression = np.random.choice([2, 3], p=[0.2, 0.8])
        
        # Comorbidity count (0-6, increases with age)
        comorbidity_mean = 1.0 + (age - 50) / 20  # More comorbidities with age
        comorbidity_count = int(np.random.poisson(comorbidity_mean))
        comorbidity_count = min(comorbidity_count, 6)
        
        # Allergy count (0-5)
        allergy_count = int(np.random.poisson(1.2))
        allergy_count = min(allergy_count, 5)
        
        # Genetic risk (15% have genetic risk)
        has_genetic_risk = 1 if np.random.random() < 0.15 else 0
        
        # Family history (30% have family history)
        has_family_history = 1 if np.random.random() < 0.30 else 0
        
        # Surgery count (0-3, increases with disease progression)
        surgery_prob = 0.1 + (progression * 0.15)
        if np.random.random() < surgery_prob:
            surgery_count = int(np.random.poisson(1.0))
            surgery_count = min(surgery_count, 3)
        else:
            surgery_count = 0
        
        # Caregiver count (0-3, increases with progression)
        if progression == 1:
            caregiver_count = np.random.choice([0, 1], p=[0.7, 0.3])
        elif progression == 2:
            caregiver_count = np.random.choice([0, 1, 2], p=[0.3, 0.5, 0.2])
        else:  # progression == 3
            caregiver_count = np.random.choice([1, 2, 3], p=[0.3, 0.5, 0.2])
        
        # Provider count (1-4, more for advanced cases)
        if progression == 1:
            provider_count = np.random.choice([1, 2], p=[0.6, 0.4])
        elif progression == 2:
            provider_count = np.random.choice([1, 2, 3], p=[0.3, 0.5, 0.2])
        else:  # progression == 3
            provider_count = np.random.choice([2, 3, 4], p=[0.3, 0.5, 0.2])
        
        # Calculate hospitalization probability based on risk factors
        hospitalization_probability = calculate_hospitalization_risk(
            age, years, progression, comorbidity_count, has_genetic_risk,
            has_family_history, surgery_count, caregiver_count
        )
        
        hospitalized = 1 if np.random.random() < hospitalization_probability else 0
        
        # Add to dataset
        data['patientId'].append(patient_id)
        data['age'].append(age)
        data['gender'].append(gender)
        data['progressionStage'].append(progression)
        data['yearsSinceDiagnosis'].append(years)
        data['comorbidityCount'].append(comorbidity_count)
        data['allergyCount'].append(allergy_count)
        data['hasGeneticRisk'].append(has_genetic_risk)
        data['hasFamilyHistory'].append(has_family_history)
        data['surgeryCount'].append(surgery_count)
        data['caregiverCount'].append(caregiver_count)
        data['providerCount'].append(provider_count)
        data['hospitalized'].append(hospitalized)
    
    df = pd.DataFrame(data)

    # Blend in medical-history-derived samples so real records influence training.
    real_samples = _build_real_world_training_samples(
        medical_history_file=medical_history_file,
        replications=12,
        max_total_samples=8000
    )
    if len(real_samples) > 0:
        real_samples = real_samples[['patientId', 'age', 'gender', 'progressionStage', 'yearsSinceDiagnosis',
                                     'comorbidityCount', 'allergyCount', 'hasGeneticRisk', 'hasFamilyHistory',
                                     'surgeryCount', 'caregiverCount', 'providerCount', 'hospitalized']]
        df = pd.concat([df, real_samples], ignore_index=True)
    
    # Save to CSV
    df.to_csv(output_file, index=False)
    print(f"Generated {n_samples} synthetic training samples")
    if len(real_samples) > 0:
        print(f"Added {len(real_samples)} real-profile weakly labeled samples")
    print(f"Hospitalization rate: {df['hospitalized'].mean():.2%}")
    print(f"Saved to: {output_file}")
    
    return df


def calculate_hospitalization_risk(age, years, progression, comorbidity_count,
                                   has_genetic_risk, has_family_history,
                                   surgery_count, caregiver_count):
    """
    Calculate probability of hospitalization based on risk factors
    Uses logistic-like function
    """
    # Base risk increases with age and time
    base_risk = 0.05 + (age - 45) / 200 + (years / 30)
    
    # Progression stage (major factor)
    if progression == 3:  # SEVERE
        base_risk += 0.25
    elif progression == 2:  # MODERATE
        base_risk += 0.10
    
    # Comorbidities (major factor)
    if comorbidity_count >= 4:
        base_risk += 0.20
    elif comorbidity_count >= 2:
        base_risk += 0.10
    
    # Genetic and family factors
    if has_genetic_risk:
        base_risk += 0.12
    if has_family_history:
        base_risk += 0.06
    
    # Surgery history
    if surgery_count >= 2:
        base_risk += 0.15
    elif surgery_count >= 1:
        base_risk += 0.08
    
    # Caregiver count (indicator of disease severity)
    if caregiver_count >= 2:
        base_risk += 0.12
    elif caregiver_count >= 1:
        base_risk += 0.05
    
    # Advanced age
    if age >= 75:
        base_risk += 0.10
    elif age >= 70:
        base_risk += 0.05
    
    # Cap at reasonable probability
    return min(base_risk, 0.85)


if __name__ == '__main__':
    # Generate training data
    df = generate_training_data(n_samples=500)
    
    # Display statistics
    print("\n=== Training Data Statistics ===")
    print(df.describe())
    print("\n=== Feature Correlations with Hospitalization ===")
    correlations = df.corr()['hospitalized'].sort_values(ascending=False)
    print(correlations)
