"""
Alzheimer's Disease Feature Extraction Module
Extracts and normalizes features from Alzheimer's disease patient data
Based on most effective predictive features identified in analysis:
- MMSE (Mini-Mental State Examination) score
- FunctionalAssessment score
- ADL (Activities of Daily Living) score  
- MemoryComplaints flag
- BehavioralProblems flag
- Demographics and health risk factors
"""
import pandas as pd
import numpy as np
from typing import Dict, List, Union
import json
import re


class AlzheimersFeatureExtractor:
    """
    Extract and encode features from patient medical history for Alzheimer's prediction
    Maps to both current dataset and medical history service structure
    """
    
    # Core effective features for Alzheimer's prediction (by correlation strength)
    CORE_FEATURES = [
        'MMSE',                      # -0.36 (negative correlation)
        'FunctionalAssessment',      # -0.36 (negative correlation)
        'ADL',                       # -0.33 (negative correlation)
        'MemoryComplaints',          #  0.30 (positive correlation)
        'BehavioralProblems'         #  0.22 (positive correlation)
    ]
    
    # Supporting demographic and health features
    DEMOGRAPHIC_FEATURES = [
        'Age',
        'Gender'
    ]
    
    HEALTH_RISK_FEATURES = [
        'FamilyHistoryAlzheimers',
        'Smoking',
        'CardiovascularDisease',
        'Diabetes',
        'Depression',
        'HeadInjury',
        'Hypertension'
    ]
    
    # Extended clinical features for richer context
    CLINICAL_FEATURES = [
        'BMI',
        'AlcoholConsumption',
        'PhysicalActivity',
        'DietQuality',
        'SleepQuality',
        'CholesterolTotal'
    ]
    
    # Categorical encoding
    GENDER_ENCODING = {
        'Male': 1,
        'MALE': 1,
        'M': 1,
        'Female': 0,
        'FEMALE': 0,
        'F': 0,
        'Other': 2,
        'OTHER': 2,
        1: 1,
        0: 0,
        2: 2
    }
    
    BOOLEAN_ENCODING = {
        'yes': 1, 'Yes': 1, 'YES': 1, 'true': 1, 'True': 1, 'TRUE': 1, '1': 1, 1: 1,
        'no': 0, 'No': 0, 'NO': 0, 'false': 0, 'False': 0, 'FALSE': 0, '0': 0, 0: 0
    }
    
    def __init__(self, feature_level: str = 'core'):
        """
        Initialize feature extractor
        
        Args:
            feature_level: 'core' (5 features), 'extended' (12 features), or 'full' (18+ features)
        """
        self.feature_level = feature_level
        self._build_feature_list()
    
    def _build_feature_list(self):
        """Build feature list based on selection level"""
        if self.feature_level == 'core':
            self.feature_names = self.CORE_FEATURES.copy()
        elif self.feature_level == 'extended':
            self.feature_names = (
                self.CORE_FEATURES +
                self.DEMOGRAPHIC_FEATURES +
                self.HEALTH_RISK_FEATURES
            )
        elif self.feature_level == 'full':
            self.feature_names = (
                self.CORE_FEATURES +
                self.DEMOGRAPHIC_FEATURES +
                self.HEALTH_RISK_FEATURES +
                self.CLINICAL_FEATURES
            )
        else:
            raise ValueError(f"Unknown feature_level: {self.feature_level}")
    
    def extract_features(self, medical_record: Union[Dict, pd.Series]) -> Dict:
        """
        Extract features from a medical history record
        
        Args:
            medical_record: dict or pandas Series with patient data
            
        Returns:
            dict: Feature values matching model's expected input
        """
        features = {}
        
        # Core cognitive and functional features (most important)
        features['MMSE'] = self._extract_score(medical_record, ['MMSE', 'mmse'], min_val=0, max_val=30)
        features['FunctionalAssessment'] = self._extract_score(
            medical_record, ['FunctionalAssessment', 'functional_assessment', 'functionalAssessment'], min_val=0, max_val=10
        )
        features['ADL'] = self._extract_score(
            medical_record, ['ADL', 'adl', 'ActivitiesOfDailyLiving'], min_val=0, max_val=10
        )
        
        # Symptom flags
        features['MemoryComplaints'] = self._extract_boolean(
            medical_record, ['MemoryComplaints', 'memory_complaints', 'memoryComplaints', 'memory_issues']
        )
        features['BehavioralProblems'] = self._extract_boolean(
            medical_record, ['BehavioralProblems', 'behavioral_problems', 'behavioralProblems', 'behavior_issues']
        )
        
        # Demographics
        age_value = self._get_field(medical_record, ['Age', 'age'], default=None)
        if age_value is not None:
            features['Age'] = self._extract_integer(medical_record, ['Age', 'age'], min_val=18, max_val=120)
        else:
            features['Age'] = 65  # default age estimate
            
        features['Gender'] = self._extract_gender(medical_record)
        
        # Health risk factors
        if self.feature_level in ['extended', 'full']:
            features['FamilyHistoryAlzheimers'] = self._extract_boolean(
                medical_record, ['FamilyHistoryAlzheimers', 'family_history_alzheimers', 'familyHistoryAlzheimers', 'family_history']
            )
            features['Smoking'] = self._extract_boolean(
                medical_record, ['Smoking', 'smoking', 'smoker']
            )
            features['CardiovascularDisease'] = self._extract_boolean(
                medical_record, ['CardiovascularDisease', 'cardiovascularDisease', 'cardiovascular_disease', 'heart_disease']
            )
            features['Diabetes'] = self._extract_boolean(
                medical_record, ['Diabetes', 'diabetes', 'diabetic']
            )
            features['Depression'] = self._extract_boolean(
                medical_record, ['Depression', 'depression', 'depressed']
            )
            features['HeadInjury'] = self._extract_boolean(
                medical_record, ['HeadInjury', 'headInjury', 'head_injury', 'traumatic_brain_injury']
            )
            features['Hypertension'] = self._extract_boolean(
                medical_record, ['Hypertension', 'hypertension', 'high_blood_pressure']
            )
        
        # Extended clinical features
        if self.feature_level == 'full':
            features['BMI'] = self._extract_score(
                medical_record, ['BMI', 'bmi', 'body_mass_index'], min_val=10, max_val=50
            )
            features['AlcoholConsumption'] = self._extract_score(
                medical_record, ['AlcoholConsumption', 'alcoholConsumption', 'alcohol_consumption'], min_val=0, max_val=10
            )
            features['PhysicalActivity'] = self._extract_score(
                medical_record, ['PhysicalActivity', 'physicalActivity', 'physical_activity'], min_val=0, max_val=10
            )
            features['DietQuality'] = self._extract_score(
                medical_record, ['DietQuality', 'dietQuality', 'diet_quality'], min_val=0, max_val=10
            )
            features['SleepQuality'] = self._extract_score(
                medical_record, ['SleepQuality', 'sleepQuality', 'sleep_quality'], min_val=0, max_val=10
            )
            features['CholesterolTotal'] = self._extract_score(
                medical_record, ['CholesterolTotal', 'cholesterolTotal', 'cholesterol_total'], min_val=0, max_val=300
            )
        
        return features
    
    def extract_batch(self, medical_records_df: pd.DataFrame) -> pd.DataFrame:
        """
        Extract features from multiple records
        
        Args:
            medical_records_df: pandas DataFrame with patient records
            
        Returns:
            pandas DataFrame with extracted features
        """
        features_list = []
        for idx, record in medical_records_df.iterrows():
            try:
                features = self.extract_features(record)
                features_list.append(features)
            except Exception as e:
                print(f"Warning: Error extracting features for record {idx}: {e}")
                features_list.append({name: 0 for name in self.feature_names})
        
        return pd.DataFrame(features_list)
    
    def get_feature_names(self) -> List[str]:
        """Return list of feature names in extraction order"""
        return self.feature_names.copy()
    
    def get_feature_descriptions(self) -> Dict[str, str]:
        """Return human-readable descriptions of each feature"""
        descriptions = {
            'MMSE': 'Mini-Mental State Examination (0-30, higher is better)',
            'FunctionalAssessment': 'Functional Assessment Score (0-10, higher is better)',
            'ADL': 'Activities of Daily Living Score (0-10, higher is better)',
            'MemoryComplaints': 'Patient reports memory complaints (0=No, 1=Yes)',
            'BehavioralProblems': 'Patient exhibits behavioral problems (0=No, 1=Yes)',
            'Age': 'Patient age in years',
            'Gender': 'Patient gender (0=Female, 1=Male, 2=Other)',
            'FamilyHistoryAlzheimers': 'Family history of Alzheimer\'s (0=No, 1=Yes)',
            'Smoking': 'Current or past smoking (0=No, 1=Yes)',
            'CardiovascularDisease': 'Cardiovascular disease diagnosis (0=No, 1=Yes)',
            'Diabetes': 'Diabetes diagnosis (0=No, 1=Yes)',
            'Depression': 'Depression diagnosis (0=No, 1=Yes)',
            'HeadInjury': 'History of head injury (0=No, 1=Yes)',
            'Hypertension': 'High blood pressure diagnosis (0=No, 1=Yes)',
            'BMI': 'Body Mass Index',
            'AlcoholConsumption': 'Alcohol consumption level (0-10)',
            'PhysicalActivity': 'Physical activity level (0-10)',
            'DietQuality': 'Diet quality score (0-10)',
            'SleepQuality': 'Sleep quality score (0-10)',
            'CholesterolTotal': 'Total cholesterol level (mg/dL)'
        }
        return {k: v for k, v in descriptions.items() if k in self.feature_names}
    
    # ===== Helper methods =====

    def _normalize_key(self, key: str) -> str:
        """Normalize field names for case/format-insensitive matching."""
        return re.sub(r'[^a-z0-9]', '', str(key).strip().lower())
    
    def _get_field(self, record: Union[Dict, pd.Series], candidate_keys: List[str], default=None):
        """Get first non-empty value from candidate field names"""
        for key in candidate_keys:
            if key in record:
                val = record[key]
                if pd.notna(val) and str(val).strip() not in ['', 'nan', 'None', 'null']:
                    return val

        # Fallback for key format differences (camelCase, snake_case, etc.)
        normalized_record = {
            self._normalize_key(k): v
            for k, v in dict(record).items()
        }
        for key in candidate_keys:
            normalized_key = self._normalize_key(key)
            if normalized_key in normalized_record:
                val = normalized_record[normalized_key]
                if pd.notna(val) and str(val).strip() not in ['', 'nan', 'None', 'null']:
                    return val

        return default
    
    def _extract_score(self, record: Union[Dict, pd.Series], keys: List[str],
                       min_val: float = 0, max_val: float = 100) -> float:
        """Extract and normalize a numeric score"""
        val = self._get_field(record, keys, default=None)
        
        if val is None:
            return 0.0
        
        try:
            score = float(val)
            # Clamp to valid range
            return float(np.clip(score, min_val, max_val))
        except (ValueError, TypeError):
            return 0.0
    
    def _extract_boolean(self, record: Union[Dict, pd.Series], keys: List[str]) -> int:
        """Extract and encode a boolean field (returns 0 or 1)"""
        val = self._get_field(record, keys, default=0)
        
        if isinstance(val, bool):
            return 1 if val else 0
        
        if isinstance(val, (int, np.integer)):
            return 1 if val != 0 else 0
        
        str_val = str(val).strip().lower()
        return self.BOOLEAN_ENCODING.get(str_val, 0)
    
    def _extract_gender(self, record: Union[Dict, pd.Series]) -> int:
        """Extract and encode gender"""
        val = self._get_field(record, ['Gender', 'gender', 'sex'], default='Male')
        
        if isinstance(val, (int, np.integer)):
            return int(np.clip(val, 0, 2))
        
        str_val = str(val).strip()
        return self.GENDER_ENCODING.get(str_val, 1)  # default to Male (1)
    
    def _extract_integer(self, record: Union[Dict, pd.Series], keys: List[str],
                        min_val: int = 0, max_val: int = 120) -> int:
        """Extract and constrain an integer value"""
        val = self._get_field(record, keys, default=None)
        
        if val is None:
            return int((min_val + max_val) / 2)  # return midpoint
        
        try:
            num = int(float(val))
            return int(np.clip(num, min_val, max_val))
        except (ValueError, TypeError):
            return int((min_val + max_val) / 2)


def load_alzheimers_data(csv_path: str) -> pd.DataFrame:
    """Load Alzheimer's disease dataset from CSV"""
    df = pd.read_csv(csv_path)
    
    # Remove irrelevant columns
    cols_to_drop = ['PatientID', 'DoctorInCharge']
    df = df.drop(columns=[col for col in cols_to_drop if col in df.columns], errors='ignore')
    
    return df
