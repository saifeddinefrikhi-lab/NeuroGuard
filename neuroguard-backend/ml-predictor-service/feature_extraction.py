"""
Feature extraction module for medical history data
Converts medical history records into numerical features for ML model
Aligned with Java PatientFeatures class
"""
import pandas as pd
import numpy as np
from datetime import datetime
import re
import json


class MedicalFeatureExtractor:
    """Extract and encode features from medical history data"""
    
    # Progression stage encoding (matching Java enum values)
    PROGRESSION_STAGES = {
        'MILD': 1,
        'MODERATE': 2,
        'SEVERE': 3,
        'EARLY': 1,      # Backwards compatibility
        'ADVANCED': 3    # Backwards compatibility
    }
    
    # Gender encoding
    GENDER_ENCODING = {
        'MALE': 1,
        'FEMALE': 0,
        'M': 1,
        'F': 0,
        'OTHER': 2
    }
    
    def __init__(self):
        self.feature_names = []

    def _get_first(self, medical_record, keys, default=None):
        """Get the first non-empty value from a list of candidate keys."""
        for key in keys:
            if key in medical_record and pd.notna(medical_record.get(key)):
                value = medical_record.get(key)
                if str(value).strip() != '':
                    return value
        return default

    def _count_list_like(self, value):
        """Count list-like values from list, JSON text, or comma-separated text."""
        if value is None:
            return 0

        if isinstance(value, list):
            return len(value)

        text = str(value).strip()
        if text in ['', 'nan', 'None', 'null', '[]']:
            return 0

        if text.startswith('[') and text.endswith(']'):
            try:
                parsed = json.loads(text)
                if isinstance(parsed, list):
                    return len(parsed)
            except Exception:
                pass

        return len([item.strip() for item in text.split(',') if item.strip()])
    
    def extract_features(self, medical_record):
        """
        Extract features from a medical history record
        Matches Java PatientFeatures class structure
        
        Args:
            medical_record: dict or pandas Series with medical history fields
            
        Returns:
            dict: Feature values matching PatientFeatures attributes
        """
        features = {}
        
        # patientId - kept for reference but not used in training
        features['patientId'] = self._get_first(medical_record, ['patient_id', 'patientId'])
        
        # age (int) - calculate from diagnosis date or use directly
        age_value = self._get_first(medical_record, ['age'])
        if age_value is not None:
            features['age'] = int(age_value)
        else:
            # Estimate: assume average diagnosis age is 60, add years since diagnosis
            years_since = self._calculate_years_since_diagnosis(medical_record)
            features['age'] = int(60 + years_since)
        
        # gender (encoded as int: MALE=1, FEMALE=0, OTHER=2)
        gender = str(self._get_first(medical_record, ['gender'], default='MALE')).upper()
        features['gender'] = self.GENDER_ENCODING.get(gender, 1)
        
        # progressionStage (encoded as int: MILD=1, MODERATE=2, SEVERE=3)
        stage = str(self._get_first(medical_record, ['progression_stage', 'progressionStage'], default='MODERATE')).upper()
        features['progressionStage'] = self.PROGRESSION_STAGES.get(stage, 2)
        
        # yearsSinceDiagnosis (int)
        features['yearsSinceDiagnosis'] = int(self._calculate_years_since_diagnosis(medical_record))
        
        # comorbidityCount (int)
        features['comorbidityCount'] = self._count_comorbidities(
            self._get_first(medical_record, ['comorbidities'], default='')
        )
        
        # allergyCount (int) - sum of all allergy types
        features['allergyCount'] = self._count_allergies(medical_record)
        
        # hasGeneticRisk (boolean -> int: true=1, false=0)
        genetic_risk = str(self._get_first(medical_record, ['genetic_risk', 'geneticRisk'], default='none')).lower()
        features['hasGeneticRisk'] = 1 if self._has_genetic_risk(genetic_risk) else 0
        
        # hasFamilyHistory (boolean -> int: true=1, false=0)
        family_history = str(self._get_first(medical_record, ['family_history', 'familyHistory'], default='')).lower()
        features['hasFamilyHistory'] = 1 if family_history and family_history not in ['none', 'nan', ''] else 0
        
        # surgeryCount (int) - count surgical procedures
        features['surgeryCount'] = self._count_surgeries(medical_record)
        
        # caregiverCount (int)
        caregiver_count = self._get_first(medical_record, ['caregiver_count', 'caregiverCount'])
        if caregiver_count is not None:
            features['caregiverCount'] = int(caregiver_count)
        else:
            features['caregiverCount'] = self._count_list_like(
                self._get_first(medical_record, ['caregiverIds', 'caregiver_ids', 'caregiverNames', 'caregiver_names'])
            )
        
        # providerCount (int)
        provider_count = self._get_first(medical_record, ['provider_count', 'providerCount'])
        if provider_count is not None:
            features['providerCount'] = int(provider_count)
        else:
            features['providerCount'] = self._count_list_like(
                self._get_first(medical_record, ['providerIds', 'provider_ids'])
            )
        
        return features
    
    def _calculate_years_since_diagnosis(self, medical_record):
        """Calculate years since diagnosis"""
        if 'yearsSinceDiagnosis' in medical_record:
            return float(medical_record['yearsSinceDiagnosis'])
        
        if 'years_since_diagnosis' in medical_record:
            return float(medical_record['years_since_diagnosis'])
        
        diagnosis_date_value = self._get_first(medical_record, ['diagnosis_date', 'diagnosisDate'])
        if diagnosis_date_value:
            try:
                diagnosis_date = pd.to_datetime(diagnosis_date_value)
                years = (datetime.now() - diagnosis_date).days / 365.25
                return round(years, 2)
            except:
                pass
        
        return 0.0
    
    def _count_comorbidities(self, comorbidities_text):
        """Count number of comorbidities"""
        if not comorbidities_text or str(comorbidities_text) in ['nan', 'None', '']:
            return 0
        # Split by comma and count
        return len([c.strip() for c in str(comorbidities_text).split(',') if c.strip()])
    
    def _count_allergies(self, medical_record):
        """Count total allergies from all sources"""
        count = 0
        
        if 'allergyCount' in medical_record:
            return int(medical_record['allergyCount'])
        
        if 'allergy_count' in medical_record:
            return int(medical_record['allergy_count'])
        
        # Count from individual allergy fields
        allergy_fields = [
            ['food_allergies', 'foodAllergies'],
            ['medication_allergies', 'medicationAllergies'],
            ['environmental_allergies', 'environmentalAllergies']
        ]
        for field_group in allergy_fields:
            allergies = str(self._get_first(medical_record, field_group, default=''))
            if allergies and allergies not in ['nan', 'None', '']:
                count += len([a.strip() for a in allergies.split(',') if a.strip()])
        
        return count
    
    def _has_genetic_risk(self, genetic_risk_text):
        """Check if patient has genetic risk"""
        risk_indicators = ['mutation', 'positive', 'suspected', 'carrier', 'homozygous', 'heterozygous', 'lrrk2', 'gba', 'snca', 'parkin', 'apoe', 'psen', 'app', 'mapt']
        return any(indicator in genetic_risk_text for indicator in risk_indicators)
    
    def _count_surgeries(self, medical_record):
        """Count surgical procedures"""
        if 'surgeryCount' in medical_record:
            return int(medical_record['surgeryCount'])
        
        if 'surgery_count' in medical_record:
            return int(medical_record['surgery_count'])
        
        surgeries_value = self._get_first(medical_record, ['surgeries', 'surgical_procedures'])

        # Handle explicit surgeries list from JSON payloads
        if isinstance(surgeries_value, list):
            return len(surgeries_value)

        # Handle serialized surgeries list
        if surgeries_value is not None:
            surgeries = str(surgeries_value)
            if surgeries and surgeries not in ['nan', 'None', '', '[]']:
                if surgeries.startswith('[') and surgeries.endswith(']'):
                    try:
                        parsed = json.loads(surgeries)
                        if isinstance(parsed, list):
                            return len(parsed)
                    except Exception:
                        pass
                return len([s.strip() for s in surgeries.replace('\n', ';').split(';') if s.strip()])
        
        return 0
    
    def get_feature_names(self):
        """
        Return list of all feature names in order (matching Java PatientFeatures)
        Note: patientId is excluded as it's not used for training
        """
        return [
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
    
    def extract_features_batch(self, medical_records_df):
        """
        Extract features from multiple records
        
        Args:
            medical_records_df: pandas DataFrame with medical history records
            
        Returns:
            pandas DataFrame with features
        """
        features_list = []
        for idx, record in medical_records_df.iterrows():
            features = self.extract_features(record)
            features_list.append(features)
        
        return pd.DataFrame(features_list)


def load_medical_history(csv_path='data/medical_history_db.csv'):
    """Load medical history data from CSV"""
    df = pd.read_csv(csv_path)

    # Keep only rows with a numeric patient id and normalize core columns.
    if 'patientId' in df.columns and 'patient_id' not in df.columns:
        df = df.rename(columns={'patientId': 'patient_id'})

    if 'patient_id' in df.columns:
        patient_numeric = pd.to_numeric(df['patient_id'], errors='coerce')
        df = df[patient_numeric.notna()].copy()
        df['patient_id'] = patient_numeric.astype(int)

    return df


def load_risk_alerts(csv_path='data/risk_alert_db.csv'):
    """Load risk alerts data from CSV"""
    df = pd.read_csv(csv_path)
    return df
