# ML Predictor Service - Hospitalization Risk Prediction

AI-powered microservice for predicting hospitalization risk in Parkinson's disease patients using machine learning.

## 🎯 Overview

This service analyzes patient medical history data to predict hospitalization risk and generate automated alerts for healthcare providers. It uses Random Forest classification to evaluate multiple risk factors and provide risk scores.

## 📁 Project Structure

```
ml-predictor-service/
├── app.py                          # Flask API server
├── train_model.py                  # Model training script
├── predict_and_alert.py            # Risk prediction & alert generation
├── feature_extraction.py           # Medical feature engineering
├── generate_training_data.py       # Synthetic data generation
├── requirements.txt                # Python dependencies
├── data/
│   ├── medical_history_db.csv     # Patient medical history
│   ├── risk_alert_db.csv          # Historical alerts
│   ├── training_data.csv          # Generated training data
│   ├── generated_alerts.csv       # New alerts output
│   └── predictions.csv            # Prediction results
├── hospitalisation_model.pkl      # Trained ML model
└── feature_names.pkl              # Feature list
```

## 🚀 Quick Start

### 1. Install Dependencies

**Note:** Scikit-learn requires disk space (~100MB). If installation fails due to space:
- Free up disk space
- Or use the lightweight mock version (see below)

```powershell
pip install -r requirements.txt
```

Or install individually:
```powershell
pip install flask flask-cors pandas numpy joblib
pip install scikit-learn  # If you have disk space
```

### 2. Generate Training Data

```powershell
python generate_training_data.py
```

This creates synthetic training data based on medical patterns (500 samples).

### 3. Train the Model

```powershell
python train_model.py
```

This will:
- Load/generate training data
- Train Random Forest classifier
- Evaluate model performance
- Save `hospitalisation_model.pkl` and `feature_names.pkl`

### 4. Run the Flask API Server

```powershell
python app.py
```

Server starts at: http://localhost:5000

### 4.1 Enable Eureka (Optional)

To register this microservice in Eureka, set environment variables before running:

```powershell
$env:EUREKA_ENABLED="true"
$env:EUREKA_SERVER_URL="http://localhost:8761/eureka/"
$env:EUREKA_APP_NAME="ml-predictor-service"
$env:EUREKA_INSTANCE_HOST="localhost"   # Use reachable host/IP in your network
$env:SERVICE_PORT="5000"
python app.py
```

Optional variables:
- `EUREKA_INSTANCE_IP`
- `EUREKA_INSTANCE_ID`
- `EUREKA_HEALTHCHECK_URL` (default: `http://<host>:<port>/health`)
- `EUREKA_HOMEPAGE_URL` (default: `http://<host>:<port>/`)
- `EUREKA_STATUSPAGE_URL` (default: health check URL)

### 5. Generate Risk Predictions & Alerts

```powershell
python predict_and_alert.py
```

This will:
- Analyze all patients in medical history database
- Generate risk predictions
- Create alerts for high-risk patients
- Save results to CSV files

## 📊 Features Analyzed

The model analyzes 11 patient features (matching your Java PatientFeatures class):

| Feature | Type | Description | Values |
|---------|------|-------------|---------|
| `age` | int | Patient age | 45-85 years |
| `gender` | String/int | Patient gender | MALE=1, FEMALE=0, OTHER=2 |
| `progressionStage` | String/int | Disease progression | MILD=1, MODERATE=2, SEVERE=3 |
| `yearsSinceDiagnosis` | int | Years since diagnosis | 0-15 |
| `comorbidityCount` | int | Number of comorbidities | 0-6+ |
| `allergyCount` | int | Total allergies | 0-5+ |
| `hasGeneticRisk` | boolean/int | Genetic mutation | true=1, false=0 |
| `hasFamilyHistory` | boolean/int | Family history | true=1, false=0 |
| `surgeryCount` | int | Number of surgeries | 0-3+ |
| `caregiverCount` | int | Number of caregivers | 0-3 |
| `providerCount` | int | Healthcare providers | 1-4 |

## 🔌 API Endpoints

### Health Check
```http
GET /health
```

Response:
```json
{
  "status": "healthy",
  "model_loaded": true,
  "features_count": 16
}
```

### Single Patient Prediction
```http
POST /predict
Content-Type: application/json

{
  "patientId": 123,
  "age": 68,
  "gender": "MALE",
  "progressionStage": "MODERATE",
  "yearsSinceDiagnosis": 3,
  "comorbidityCount": 2,
  "allergyCount": 1,
  "hasGeneticRisk": true,
  "hasFamilyHistory": true,
  "surgeryCount": 1,
  "caregiverCount": 1,
  "providerCount": 2
}
```

Response:
```json
{
  "patientId": 123,
  "prediction": 1,
  "probability": 0.7234,
  "riskLevel": "HIGH",
  "riskPercentage": 72.34,
  "recommendation": "Schedule medical consultation soon. Increased monitoring recommended."
}
```

**Note**: The API also accepts legacy medical history format (diagnosis, genetic_risk, comorbidities, etc.) which will be automatically converted to features.

### Batch Prediction
```http
POST /predict/batch
Content-Type: application/json

{
  "patients": [
    { patient 1 data },
    { patient 2 data },
    ...
  ]
}
```

## 🎚️ Risk Levels

| Risk Level | Probability Range | Severity | Action |
|-----------|------------------|----------|--------|
| **CRITICAL** | ≥ 70% | CRITICAL | Immediate medical evaluation |
| **HIGH** | 50-69% | WARNING | Schedule consultation soon |
| **MODERATE** | 30-49% | WARNING | Increased monitoring |
| **LOW** | 15-29% | INFO | Standard monitoring |
| **MINIMAL** | < 15% | INFO | Continue standard care |

## 🧪 Testing the API

### Using cURL:
```powershell
# Health check
curl http://localhost:5000/health

# Prediction123,\"age\":68,\"gender\":\"MALE\",\"progressionStage\":\"MODERATE\",\"yearsSinceDiagnosis\":3,\"comorbidityCount\":2,\"allergyCount\":1,\"hasGeneticRisk\":true,\"hasFamilyHistory\":true,\"surgeryCount\":1,\"caregiverCount\":1,\"providerCount\":2}'
```

### Using Python:
```python
import requests

url = "http://localhost:5000/predict"
data = {
    "patientId": 123,
    "age": 68,
    "gender": "MALE",
    "progressionStage": "MODERATE",
    "yearsSinceDiagnosis": 3,
    "comorbidityCount": 2,
    "allergyCount": 1,
    "hasGeneticRisk": True,
    "hasFamilyHistory": True,
    "surgeryCount": 1,
    "caregiverCount": 1,
    "providerCount": 2
    "genetic_risk": "LRRK2 mutation positive",
    "comorbidities": "Hypertension, Type 2 diabetes",
    "progression_stage": "MODERATE"
}

response = requests.post(url,Java/Spring Boot):

See the complete Java integration guide in `java-integration/INTEGRATION_GUIDE.md`

```java
@Autowired
private MLPredictorClient mlClient;

// Build PatientFeatures from your MedicalHistory entity
PatientFeatures features = new PatientFeatures();
features.setPatientId(patient.getId());
features.setAge(67);
features.setGender("MALE");
features.setProgressionStage("MODERATE");
features.setYearsSinceDiagnosis(3);
features.setComorbidityCount(2);
features.setAllergyCount(1);
features.setHasGeneticRisk(true);
features.setHasFamilyHistory(true);
features.setSurgeryCount(1);
features.setCaregiverCount(1);
features.setProviderCount(2);

// Get prediction
PredictionResult result = mlClient.predictHospitalizationRisk(features);

// Create alert if high risk
if (result.getRiskLevel().equals("HIGH") || result.getRiskLevel().equals("CRITICAL")) {
    RiskAlert alert = new RiskAlert();
    alert.setPatientId(patient.getId());
    alert.setSeverity(result.getRiskLevel().equals("CRITICAL") ? 
        Severity.CRITICAL : Severity.WARNING);
    alert.setMessage(String.format("ML Prediction: %s risk (%.1f%%). %s",
        result.getRiskLevel(), result.getRiskPercentage(), 
        result.getRecommendation()));
    alertRepository.save(alert);
}
```

**Files provided:**
- `java-integration/MLPredictorClient.java` - REST client for ML service
- `java-integration/RiskAlertMLService.java` - Integration with risk alert service
- `java-integration/INTEGRATION_GUIDE.md` - Complete integration guide return response.data;
  } catch (error) {
    console.error('ML prediction failed:', error);
    throw error;
  }
}
```

## 📈 Model Performance

Based on synthetic training data:
- **Accuracy**: ~85-90%
- **ROC AUC**: ~0.88-0.92
- **Features**: 16 medical risk factors
- **Algorithm**: Random Forest (100 trees)

## 🛠️ Troubleshooting

### Model files not found
```
⚠ WARNING: Model files not found
```
**Solution**: Run `python train_model.py` to train the model

### Scikit-learn installation fails
```
ERROR: No space left on device
```
**Solutions**:
1. Free up disk space (need ~100MB)
2. Use pip cache: `pip install --no-cache-dir scikit-learn`
3. Install on different drive: `pip install --target=D:\packages scikit-learn`

### Flask not found
```
ModuleNotFoundError: No module named 'flask'
```
**Solution**: `pip install -r requirements.txt`

## 📝 Development

### Adding New Features
1. Update `feature_extraction.py` to extract new features
2. Modify `generate_training_data.py` to include new features
3. Retrain model: `python train_model.py`
4. Test predictions: `python predict_and_alert.py`

### Updating the Model
1. Modify hyperparameters in `train_model.py`
2. Retrain: `python train_model.py`
3. Restart Flask server

## 🔐 Production Deployment

For production use:
1. Use a production WSGI server (gunicorn, waitress)
2. Add authentication/authorization
3. Use environment variables for configuration
4. Add logging and monitoring
5. Deploy behind reverse proxy (nginx)
6. Use HTTPS

Example with Waitress:
```powershell
pip install waitress
waitress-serve --host=0.0.0.0 --port=5000 app:app
```

## 📄 License

Part of the NeuroGuard platform.

## 🤝 Contributing

1. Add new medical features
2. Improve model accuracy
3. Add more endpoints
4. Enhance alert generation logic
