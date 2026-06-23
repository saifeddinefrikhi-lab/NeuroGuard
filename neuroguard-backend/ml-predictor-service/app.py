"""
Alzheimer's Disease Risk Prediction API
Flask microservice for predicting Alzheimer's disease risk
Provides REST endpoints for single and batch predictions
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd
import numpy as np
import os
import atexit
import traceback
from alzheimers_feature_extractor import AlzheimersFeatureExtractor


# ===== Flask Application Setup =====

app = Flask(__name__)
CORS(app)

# ===== Global State =====

model = None
feature_names = None
feature_extractor = None
scaler = None
metadata = None


def _load_artifacts():
    """Load model, features, scaler, and metadata"""
    global model, feature_names, feature_extractor, scaler, metadata
    
    model_file = 'alzheimers_model.pkl'
    features_file = 'alzheimers_features.pkl'
    scaler_file = 'alzheimers_scaler.pkl'
    metadata_file = 'alzheimers_metadata.pkl'
    
    if not all(os.path.exists(f) for f in [model_file, features_file, scaler_file]):
        print("⚠ WARNING: Model artifacts not found.")
        print("  Please train the model first: python train_model.py")
        return False
    
    try:
        model = joblib.load(model_file)
        feature_names = joblib.load(features_file)
        scaler = joblib.load(scaler_file)
        
        if os.path.exists(metadata_file):
            metadata = joblib.load(metadata_file)
        
        print("✓ Model artifacts loaded successfully")
        print(f"  Features: {len(feature_names)}")
        print(f"  Feature level: {metadata.get('feature_level', 'unknown') if metadata else 'unknown'}")
        return True
    except Exception as e:
        print(f"❌ Error loading artifacts: {e}")
        traceback.print_exc()
        return False


# Load artifacts on startup
_load_artifacts()

# Initialize feature extractor
feature_extractor = AlzheimersFeatureExtractor(feature_level='extended')


# ===== Risk Level Mapping =====

def get_risk_level(probability: float) -> str:
    """
    Determine risk level from probability
    
    Risk thresholds based on Alzheimer's disease prediction:
    - CRITICAL: ≥ 80% (very high risk)
    - HIGH: 60-79% (high risk)
    - MODERATE: 40-59% (moderate risk)
    - LOW: 20-39% (low risk)
    - MINIMAL: < 20% (minimal risk)
    """
    if probability >= 0.80:
        return 'CRITICAL'
    elif probability >= 0.60:
        return 'HIGH'
    elif probability >= 0.40:
        return 'MODERATE'
    elif probability >= 0.20:
        return 'LOW'
    else:
        return 'MINIMAL'


def get_recommendation(risk_level: str, probability: float) -> str:
    """Generate clinical recommendation based on risk level"""
    recommendations = {
        'CRITICAL': (
            f"CRITICAL RISK ({probability*100:.1f}%): "
            "Immediate neurological evaluation recommended. "
            "Urgent cognitive and functional assessments needed."
        ),
        'HIGH': (
            f"HIGH RISK ({probability*100:.1f}%): "
            "Schedule comprehensive neurological consultation soon. "
            "Advanced cognitive testing recommended."
        ),
        'MODERATE': (
            f"MODERATE RISK ({probability*100:.1f}%): "
            "Consider neurological evaluation. "
            "Monitor cognitive function regularly."
        ),
        'LOW': (
            f"LOW RISK ({probability*100:.1f}%): "
            "Continue standard health monitoring. "
            "Maintain cognitive health through lifestyle."
        ),
        'MINIMAL': (
            f"MINIMAL RISK ({probability*100:.1f}%): "
            "Continue routine healthcare. Focus on prevention strategies."
        )
    }
    return recommendations.get(risk_level, "Risk assessment needed.")


def _to_bool(value):
    return str(value).strip().lower() in {"1", "true", "yes", "on"}


def register_eureka_if_enabled(port):
    if not _to_bool(os.getenv("EUREKA_ENABLED", "false")):
        print("ℹ Eureka disabled (set EUREKA_ENABLED=true to enable)")
        return

    try:
        import py_eureka_client.eureka_client as eureka_client
    except ImportError:
        print("⚠ py_eureka_client is not installed. Run: pip install py-eureka-client")
        return

    app_name = os.getenv("EUREKA_APP_NAME", "ml-predictor-service")
    host = os.getenv("EUREKA_INSTANCE_HOST", "localhost")
    server_url = os.getenv("EUREKA_SERVER_URL", "http://localhost:8761/eureka/")
    instance_id = os.getenv("EUREKA_INSTANCE_ID", f"{app_name}:{host}:{port}")
    health_url = os.getenv("EUREKA_HEALTHCHECK_URL", f"http://{host}:{port}/health")
    home_url = os.getenv("EUREKA_HOMEPAGE_URL", f"http://{host}:{port}/")
    status_url = os.getenv("EUREKA_STATUSPAGE_URL", health_url)
    instance_ip = os.getenv("EUREKA_INSTANCE_IP", "")

    init_kwargs = {
        "eureka_server": server_url,
        "app_name": app_name,
        "instance_port": port,
        "instance_host": host,
        "instance_id": instance_id,
        "health_check_url": health_url,
        "home_page_url": home_url,
        "status_page_url": status_url,
    }

    if instance_ip:
        init_kwargs["instance_ip"] = instance_ip

    try:
        eureka_client.init(**init_kwargs)
        print(f"✓ Registered to Eureka: {app_name} ({instance_id})")

        def _stop_eureka():
            try:
                eureka_client.stop()
                print("✓ Deregistered from Eureka")
            except Exception:
                pass

        atexit.register(_stop_eureka)
    except Exception as err:
        print(f"⚠ Eureka registration failed: {err}")


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint for load balancers and monitoring"""
    return jsonify({
        'status': 'healthy',
        'service': 'alzheimers-predictor',
        'model_loaded': model is not None,
        'features_count': len(feature_names) if feature_names else 0,
        'feature_names': feature_names if feature_names else []
    }), 200


@app.route('/predict', methods=['POST'])
def predict():
    """
    Predict Alzheimer's disease risk for a single patient

    Expected JSON payload:
    {
        "patientId": "123",
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
    }
    """
    if model is None or feature_names is None:
        return jsonify({
            'error': 'Model not loaded',
            'message': 'Please train the model first: python train_model.py',
            'status': 'service_unavailable'
        }), 503

    try:
        data = request.get_json()

        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400

        patient_id = data.get('patientId') or data.get('patient_id')

        # Extract features
        try:
            features = feature_extractor.extract_features(data)
        except Exception as e:
            return jsonify({
                'error': f'Feature extraction failed: {str(e)}',
                'details': 'Check that required fields are provided with correct types'
            }), 400

        # Build feature DataFrame with proper column names for consistent scaling
        feature_dict = {name: features.get(name, 0) for name in feature_names}
        feature_df = pd.DataFrame([feature_dict], columns=feature_names)

        # Scale features using DataFrame (preserves feature names for scaler)
        if scaler:
            feature_scaled = scaler.transform(feature_df)
            # Convert back to DataFrame with feature names for model
            feature_df_scaled = pd.DataFrame(feature_scaled, columns=feature_names)
        else:
            feature_df_scaled = feature_df

        # Make prediction with named DataFrame (model expects feature names)
        probability = model.predict_proba(feature_df_scaled)[0][1]
        prediction = int(model.predict(feature_df_scaled)[0])

        # Determine risk level
        risk_level = get_risk_level(probability)

        response = {
            'patientId': patient_id,
            'prediction': prediction,
            'probability': float(round(probability, 4)),
            'riskPercentage': float(round(probability * 100, 2)),
            'riskLevel': risk_level,
            'recommendation': get_recommendation(risk_level, probability),
            'interpretations': {
                'prediction_label': "Likely Alzheimer's" if prediction == 1 else "No Alzheimer's (likely)",
                'key_features': {
                    'MMSE': float(features.get('MMSE', 0)),
                    'FunctionalAssessment': float(features.get('FunctionalAssessment', 0)),
                    'ADL': float(features.get('ADL', 0)),
                    'MemoryComplaints': bool(features.get('MemoryComplaints', 0)),
                    'BehavioralProblems': bool(features.get('BehavioralProblems', 0))
                }
            }
        }

        return jsonify(response), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({
            'error': f'Prediction failed: {str(e)}',
            'status': 'error'
        }), 400


@app.route('/predict/batch', methods=['POST'])
def predict_batch():
    """
    Predict Alzheimer's disease risk for multiple patients

    Expected JSON payload:
    {
        "patients": [
            { patient 1 data },
            { patient 2 data },
            ...
        ]
    }
    """
    if model is None or feature_names is None:
        return jsonify({
            'error': 'Model not loaded',
            'message': 'Please train the model first: python train_model.py',
            'status': 'service_unavailable'
        }), 503

    try:
        data = request.get_json()
        patients = data.get('patients', [])

        if not patients:
            return jsonify({'error': 'No patients data provided'}), 400

        if not isinstance(patients, list):
            return jsonify({'error': 'patients must be a list'}), 400

        results = []
        errors = []

        for idx, patient_data in enumerate(patients):
            try:
                patient_id = patient_data.get('patientId') or patient_data.get('patient_id')

                # Extract features
                features = feature_extractor.extract_features(patient_data)

                # Build feature DataFrame with proper column names (consistent)
                feature_dict = {name: features.get(name, 0) for name in feature_names}
                feature_df = pd.DataFrame([feature_dict], columns=feature_names)

                # Scale features using DataFrame
                if scaler:
                    feature_scaled = scaler.transform(feature_df)
                    # Convert back to DataFrame with feature names for model
                    feature_df_scaled = pd.DataFrame(feature_scaled, columns=feature_names)
                else:
                    feature_df_scaled = feature_df

                # Predict with named DataFrame
                probability = model.predict_proba(feature_df_scaled)[0][1]
                prediction = int(model.predict(feature_df_scaled)[0])
                risk_level = get_risk_level(probability)

                results.append({
                    'patientId': patient_id,
                    'prediction': prediction,
                    'probability': float(round(probability, 4)),
                    'riskPercentage': float(round(probability * 100, 2)),
                    'riskLevel': risk_level,
                    'recommendation': get_recommendation(risk_level, probability)
                })

            except Exception as e:
                errors.append({
                    'patient_index': idx,
                    'patientId': patient_data.get('patientId') or patient_data.get('patient_id'),
                    'error': str(e)
                })

        response = {
            'predictions': results,
            'totalPatients': len(patients),
            'successfulPredictions': len(results),
            'failedPredictions': len(errors)
        }

        if errors:
            response['errors'] = errors

        return jsonify(response), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({
            'error': f'Batch prediction failed: {str(e)}',
            'status': 'error'
        }), 400


@app.route('/features', methods=['GET'])
def get_features_info():
    """Get information about expected features and their descriptions"""
    if feature_extractor is None:
        return jsonify({'error': 'Feature extractor not initialized'}), 500
    
    descriptions = feature_extractor.get_feature_descriptions()
    
    return jsonify({
        'feature_names': feature_names,
        'total_features': len(feature_names),
        'feature_descriptions': descriptions,
        'core_features': feature_extractor.CORE_FEATURES,
        'demographic_features': feature_extractor.DEMOGRAPHIC_FEATURES,
        'health_risk_features': feature_extractor.HEALTH_RISK_FEATURES
    }), 200


@app.route('/info', methods=['GET'])
def service_info():
    """Get service and model information"""
    return jsonify({
        'service_name': 'Alzheimer\'s Disease Risk Prediction API',
        'version': '2.0',
        'model_type': str(type(model).__name__) if model else 'Not loaded',
        'feature_level': metadata.get('feature_level') if metadata else 'unknown',
        'endpoints': {
            'health': '/health (GET)',
            'predict': '/predict (POST)',
            'predict_batch': '/predict/batch (POST)',
            'features': '/features (GET)',
            'info': '/info (GET)'
        },
        'model_loaded': model is not None,
        'features_count': len(feature_names) if feature_names else 0
    }), 200


@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    return jsonify({
        'error': 'Endpoint not found',
        'message': 'Check /info for available endpoints'
    }), 404


@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors"""
    return jsonify({
        'error': 'Internal server error',
        'message': str(error)
    }), 500


# ===== Main Execution =====

if __name__ == '__main__':
    port = int(os.getenv('SERVICE_PORT', 5000))
    debug = _to_bool(os.getenv('DEBUG', 'false'))
    
    print("\n" + "=" * 70)
    print("ALZHEIMER'S DISEASE RISK PREDICTION API")
    print("=" * 70)
    print(f"Starting Flask server on port {port}...")
    print(f"Health check: http://localhost:{port}/health")
    print(f"API info: http://localhost:{port}/info")
    print("=" * 70 + "\n")
    
    # Register with Eureka if enabled
    register_eureka_if_enabled(port)
    
    # Run Flask app
    app.run(host='0.0.0.0', port=port, debug=debug)
