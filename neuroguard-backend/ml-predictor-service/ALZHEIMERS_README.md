# Alzheimer's Disease Risk Prediction Microservice
## Refactored ML Predictor Service

### Overview

This is a refactored microservice specifically optimized for Alzheimer's disease risk prediction using clinical data and ML models. It replaces the generic Parkinson's-focused service with disease-specific feature engineering and prediction pipelines.

**Key Improvements:**
- ✓ Optimized feature extraction for Alzheimer's disease
- ✓ Disease-specific risk thresholds and recommendations
- ✓ Clean separation of concerns (feature extraction, training, inference)
- ✓ Extended clinical context and interpretability
- ✓ Batch processing support
- ✓ Production-ready error handling and logging

---

## 🎯 Most Effective Features for Alzheimer's Prediction

Based on correlation analysis of the Alzheimer's disease dataset, these features have the strongest predictive power:

### **Core Features (5 features)**
| Feature | Type | Correlation | Clinical Significance |
|---------|------|-------------|----------------------|
| **MMSE** | Numeric (0-30) | -0.36 | Cognitive function test; **lower = higher risk** |
| **FunctionalAssessment** | Numeric (0-10) | -0.36 | Overall functional ability; **lower = higher risk** |
| **ADL** | Numeric (0-10) | -0.33 | Activities of Daily Living; **lower = higher risk** |
| **MemoryComplaints** | Binary | +0.30 | Patient-reported memory issues; **present = higher risk** |
| **BehavioralProblems** | Binary | +0.22 | Behavioral changes; **present = higher risk** |

### **Supporting Features (7 features)**
- Age (demographic)
- Gender (demographic)
- FamilyHistoryAlzheimers (genetic risk)
- Smoking (lifestyle)
- CardiovascularDisease (comorbidity)
- Diabetes (comorbidity)
- Depression (comorbidity)
- HeadInjury (injury history)
- Hypertension (comorbidity)

### **Extended Clinical Features (6 features)**
- BMI
- AlcoholConsumption
- PhysicalActivity
- DietQuality
- SleepQuality
- CholesterolTotal

---

## 📁 Project Structure

```
ml-predictor-service/
├── alzheimers_feature_extractor.py    # Feature extraction & normalization
├── alzheimers_train_model.py          # Model training pipeline
├── alzheimers_app.py                  # Flask API server
├── alzheimers_model.pkl               # Trained ML model (generated)
├── alzheimers_features.pkl            # Feature names in order (generated)
├── alzheimers_scaler.pkl              # Feature scaler (generated)
├── alzheimers_metadata.pkl            # Feature metadata (generated)
├── data/
│   └── alzheimers_disease_data.csv   # Training dataset (2,149 records)
└── ALZHEIMERS_README.md              # This file
```

---

## 🚀 Quick Start

### 1. Install Dependencies

```powershell
pip install -r requirements.txt
```

### 2. Train the Model

```powershell
python alzheimers_train_model.py
```

This will:
- Load the Alzheimer's disease dataset
- Extract optimized features (extended set: 12 features)
- Train multiple models (Logistic Regression, Random Forest, Gradient Boosting)
- Evaluate with cross-validation and test metrics
- Save the best model and artifacts

**Output:**
- `alzheimers_model.pkl` - Trained model
- `alzheimers_features.pkl` - Feature names in order
- `alzheimers_scaler.pkl` - StandardScaler for feature normalization
- `alzheimers_metadata.pkl` - Feature descriptions and metadata
- `feature_importance.png` - Top features visualization

### 3. Run the API Server

```powershell
python alzheimers_app.py
```

Server starts at: **http://localhost:5000**

### 4. Test the API

**Health Check:**
```powershell
curl http://localhost:5000/health
```

**Single Prediction:**
```powershell
curl -X POST http://localhost:5000/predict `
  -H "Content-Type: application/json" `
  -d '{
    "patientId": "P001",
    "age": 72,
    "gender": "Male",
    "MMSE": 22,
    "FunctionalAssessment": 5,
    "ADL": 3,
    "MemoryComplaints": 1,
    "BehavioralProblems": 0,
    "FamilyHistoryAlzheimers": 1,
    "Smoking": 0,
    "CardiovascularDisease": 1,
    "Diabetes": 1,
    "Depression": 0,
    "HeadInjury": 0,
    "Hypertension": 1
  }'
```

**Response:**
```json
{
  "patientId": "P001",
  "prediction": 1,
  "probability": 0.7852,
  "riskPercentage": 78.52,
  "riskLevel": "HIGH",
  "recommendation": "HIGH RISK (78.5%): Schedule comprehensive neurological consultation soon. Advanced cognitive testing recommended.",
  "interpretations": {
    "prediction_label": "Likely Alzheimer's",
    "key_features": {
      "MMSE": 22,
      "FunctionalAssessment": 5,
      "ADL": 3,
      "MemoryComplaints": true,
      "BehavioralProblems": false
    }
  }
}
```

---

## 📊 API Endpoints

### GET `/health`
Health check for load balancers and monitoring.

**Response:**
```json
{
  "status": "healthy",
  "service": "alzheimers-predictor",
  "model_loaded": true,
  "features_count": 12,
  "feature_names": ["MMSE", "FunctionalAssessment", ...]
}
```

---

### POST `/predict`
Predict Alzheimer's disease risk for a single patient.

**Request Body:**
```json
{
  "patientId": "string",
  "age": number,
  "gender": "Male|Female|Other",
  "MMSE": number (0-30),
  "FunctionalAssessment": number (0-10),
  "ADL": number (0-10),
  "MemoryComplaints": 0 or 1,
  "BehavioralProblems": 0 or 1,
  "FamilyHistoryAlzheimers": 0 or 1,
  "Smoking": 0 or 1,
  "CardiovascularDisease": 0 or 1,
  "Diabetes": 0 or 1,
  "Depression": 0 or 1,
  "HeadInjury": 0 or 1,
  "Hypertension": 0 or 1
}
```

**Response:**
```json
{
  "patientId": "string",
  "prediction": 0 or 1,
  "probability": number (0-1),
  "riskPercentage": number,
  "riskLevel": "CRITICAL|HIGH|MODERATE|LOW|MINIMAL",
  "recommendation": "string",
  "interpretations": {
    "prediction_label": "string",
    "key_features": {
      "MMSE": number,
      "FunctionalAssessment": number,
      "ADL": number,
      "MemoryComplaints": boolean,
      "BehavioralProblems": boolean
    }
  }
}
```

---

### POST `/predict/batch`
Predict for multiple patients in one request.

**Request Body:**
```json
{
  "patients": [
    { patient 1 data },
    { patient 2 data },
    ...
  ]
}
```

**Response:**
```json
{
  "predictions": [
    {
      "patientId": "string",
      "prediction": 0 or 1,
      "probability": number,
      "riskPercentage": number,
      "riskLevel": "string"
    }
  ],
  "totalPatients": number,
  "successfulPredictions": number,
  "failedPredictions": number,
  "errors": [optional]
}
```

---

### GET `/features`
Get information about all features used by the model.

**Response:**
```json
{
  "feature_names": [...],
  "total_features": 12,
  "feature_descriptions": {...},
  "core_features": [...],
  "demographic_features": [...],
  "health_risk_features": [...]
}
```

---

### GET `/info`
Get service metadata and available endpoints.

---

## 🎯 Risk Level Thresholds (Alzheimer's-specific)

| Risk Level | Probability | Action |
|-----------|-------------|--------|
| **CRITICAL** | ≥ 80% | Immediate neurological evaluation |
| **HIGH** | 60-79% | Schedule comprehensive consultation soon |
| **MODERATE** | 40-59% | Consider neurological evaluation |
| **LOW** | 20-39% | Continue standard monitoring |
| **MINIMAL** | < 20% | Routine healthcare, prevention focus |

---

## 🔧 Integration with Medical History Service

### Feature Mapping for Medical History Service

The ML Predictor Service expects normalized features. Map your medical history tables as follows:

**Clinical Assessment Fields:**
```
medical_history.cognitive_score → MMSE
medical_history.functional_score → FunctionalAssessment
medical_history.daily_living_score → ADL
medical_history.memory_complaints_flag → MemoryComplaints
medical_history.behavioral_issues_flag → BehavioralProblems
```

**Demographic Fields:**
```
patient.age → Age
patient.gender → Gender
```

**Disease Risk Factors:**
```
medical_history.family_history_alzheimers → FamilyHistoryAlzheimers
patient.smoking_status → Smoking
medical_history.cardiovascular_diagnosis → CardiovascularDisease
medical_history.diabetes_diagnosis → Diabetes
medical_history.depression_diagnosis → Depression
medical_history.head_injury_history → HeadInjury
medical_history.hypertension_diagnosis → Hypertension
```

---

## 💡 Example: Java Integration

```java
@Service
public class AlzheimersRiskService {
    
    @Autowired
    private RestTemplate restTemplate;
    
    public PredictionResult predictAlzheimersRisk(MedicalHistory history) {
        // Build request payload from medical history
        Map<String, Object> payload = new HashMap<>();
        payload.put("patientId", history.getPatientId());
        payload.put("age", history.getPatient().getAge());
        payload.put("gender", history.getPatient().getGender());
        payload.put("MMSE", history.getCognitiveScore());
        payload.put("FunctionalAssessment", history.getFunctionalScore());
        payload.put("ADL", history.getAdlScore());
        payload.put("MemoryComplaints", history.hasMemoryComplaints() ? 1 : 0);
        payload.put("BehavioralProblems", history.hasBehavioralIssues() ? 1 : 0);
        payload.put("FamilyHistoryAlzheimers", history.hasFamilyHistory() ? 1 : 0);
        payload.put("Smoking", history.getSmoker() ? 1 : 0);
        payload.put("CardiovascularDisease", history.hasCardiovascular() ? 1 : 0);
        payload.put("Diabetes", history.hasDiabetes() ? 1 : 0);
        payload.put("Depression", history.hasDepression() ? 1 : 0);
        payload.put("HeadInjury", history.hasHeadInjury() ? 1 : 0);
        payload.put("Hypertension", history.hasHypertension() ? 1 : 0);
        
        // Call ML Predictor Service
        return restTemplate.postForObject(
            "http://alzheimers-predictor:5000/predict",
            payload,
            PredictionResult.class
        );
    }
}
```

---

## 🧪 Model Training Details

### Algorithms Evaluated
1. **Logistic Regression** - Baseline interpretable model
2. **Random Forest** - Ensemble with feature importance
3. **Gradient Boosting** - High-performance ensemble

### Hyperparameter Tuning
- Grid search with 5-fold cross-validation
- Metric: F1 score (balanced precision-recall)
- Test set evaluation: ROC-AUC score

### Data Preprocessing
- StandardScaler normalization (zero mean, unit variance)
- Train/Test split: 80/20 stratified by target
- Handling missing values: Default imputation per feature

### Dataset Characteristics
- **Total records:** 2,149 patient observations
- **Features:** 33 (after removing unnecessary columns)
- **Target distribution:** 65% negative, 35% positive (moderately imbalanced)
- **No duplicates or missing values** in original dataset

---

## 🔐 Environment Variables

Optional Eureka service discovery:

```powershell
$env:EUREKA_ENABLED = "true"
$env:EUREKA_SERVER_URL = "http://localhost:8761/eureka/"
$env:EUREKA_APP_NAME = "alzheimers-predictor"
$env:EUREKA_INSTANCE_HOST = "localhost"
$env:SERVICE_PORT = "5000"
```

---

## 📝 Feature Engineering Approach

### 1. Core Feature Selection
- Identified 5 most correlated features by Pearson correlation
- Negative correlations (lower scores = higher risk): MMSE, FunctionalAssessment, ADL
- Positive correlations (presence = higher risk): MemoryComplaints, BehavioralProblems

### 2. Feature Types
- **Categorical binary:** Gender, symptom flags, disease flags
- **Numeric continuous:** Age, assessment scores, lab values
- **Normalized:** All numeric features scaled to 0-1 or z-standardized

### 3. Data Validation
- Bounds checking for age (18-120), scores (0-10, 0-30)
- Boolean encoding for yes/no fields
- Default imputation for missing values
- Categorical encoding consistency (Male/MALE/M → 1)

---

## 🐛 Troubleshooting

### Model not found
```
❌ Model not loaded: Please train the model first
```
**Solution:** Run `python alzheimers_train_model.py`

### Feature extraction errors
```
Feature extraction failed: Check that required fields are provided
```
**Solution:** Ensure all required fields are present in request JSON. Check `/features` endpoint for complete field list.

### Low prediction accuracy
**Potential causes:**
- Trained model with small dataset size
- Feature values outside expected ranges
- Inconsistent data encoding

**Solutions:**
- Retrain with more diverse data
- Validate feature ranges match training data
- Check feature encoding consistency

---

## 📚 References

### Data Source
- **Dataset:** Alzheimer's Disease Dataset (2,149 records)
- **Features:** 33 clinical and demographic variables
- **Target:** Binary Alzheimer's disease diagnosis (0=No, 1=Yes)

### Model Performance
- Typical model achieves 75-85% ROC-AUC on test set
- Balanced precision-recall for clinical decision support
- See `feature_importance.png` for most influential features

---

## 📞 Support & Next Steps

1. **Train the model:** `python alzheimers_train_model.py`
2. **Start API:** `python alzheimers_app.py`
3. **Test predictions:** Use curl or Postman
4. **Integrate with Medical History Service:** Map fields as shown above
5. **Create alerts via Alert Service** based on HIGH/CRITICAL risk levels

---

**Last Updated:** 2026-03-25  
**Service Version:** 2.0 (Alzheimer's-optimized)
