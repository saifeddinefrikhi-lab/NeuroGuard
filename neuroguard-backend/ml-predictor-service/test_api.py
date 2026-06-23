"""
Test script for ML Predictor Service
Tests API endpoints and functionality
"""
import requests
import json


def test_health_check(base_url="http://localhost:5000"):
    """Test health check endpoint"""
    print("\n[TEST] Health Check")
    print("-" * 50)
    try:
        response = requests.get(f"{base_url}/health")
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        return response.status_code == 200
    except Exception as e:
        print(f"✗ Failed: {e}")
        return False


def test_single_prediction(base_url="http://localhost:5000"):
    """Test single patient prediction with PatientFeatures format"""
    print("\n[TEST] Single Patient Prediction")
    print("-" * 50)
    
    # Sample patient data matching Java PatientFeatures class
    patient_data = {
        "patientId": 123,
        "age": 68,
        "gender": "MALE",              # or 1
        "progressionStage": "MODERATE", # or 2
        "yearsSinceDiagnosis": 3,
        "comorbidityCount": 2,
        "allergyCount": 1,
        "hasGeneticRisk": True,        # or 1
        "hasFamilyHistory": True,      # or 1
        "surgeryCount": 1,
        "caregiverCount": 1,
        "providerCount": 2
    }
    
    try:
        response = requests.post(
            f"{base_url}/predict",
            json=patient_data,
            headers={"Content-Type": "application/json"}
        )
        print(f"Status Code: {response.status_code}")
        result = response.json()
        print(f"Response: {json.dumps(result, indent=2)}")
        
        if response.status_code == 200:
            print(f"\n✓ Patient {result.get('patientId')} - Risk: {result.get('riskLevel')} ({result.get('riskPercentage')}%)")
            print(f"  Recommendation: {result.get('recommendation')}")
            return True
        return False
    except Exception as e:
        print(f"✗ Failed: {e}")
        return False


def test_batch_prediction(base_url="http://localhost:5000"):
    """Test batch prediction with PatientFeatures format"""
    print("\n[TEST] Batch Prediction")
    print("-" * 50)
    
    batch_data = {
        "patients": [
            {
                "patientId": 101,
                "age": 62,
                "gender": "FEMALE",
                "progressionStage": "MILD",
                "yearsSinceDiagnosis": 1,
                "comorbidityCount": 1,
                "allergyCount": 0,
                "hasGeneticRisk": False,
                "hasFamilyHistory": False,
                "surgeryCount": 0,
                "caregiverCount": 0,
                "providerCount": 1
            },
            {
                "patientId": 102,
                "age": 72,
                "gender": "MALE",
                "progressionStage": "SEVERE",
                "yearsSinceDiagnosis": 8,
                "comorbidityCount": 4,
                "allergyCount": 2,
                "hasGeneticRisk": True,
                "hasFamilyHistory": True,
                "surgeryCount": 2,
                "caregiverCount": 2,
                "providerCount": 3
            }
        ]
    }
    
    try:
        response = requests.post(
            f"{base_url}/predict/batch",
            json=batch_data,
            headers={"Content-Type": "application/json"}
        )
        print(f"Status Code: {response.status_code}")
        result = response.json()
        print(f"Total Patients: {result.get('totalPatients')}")
        
        if response.status_code == 200:
            for pred in result.get('predictions', []):
                print(f"\n  Patient {pred['patientId']}:")
                print(f"    Risk Level: {pred['riskLevel']}")
                print(f"    Risk: {pred['riskPercentage']}%")
            return True
        return False
    except Exception as e:
        print(f"✗ Failed: {e}")
        return False


def test_with_extracted_features(base_url="http://localhost:5000"):
    """Test with direct PatientFeatures (numeric values)"""
    print("\n[TEST] Prediction with Direct Feature Values")
    print("-" * 50)
    
    # Features using numeric encoding
    features_data = {
        "patientId": 200,
        "age": 67,
        "gender": 1,                    # 1 = MALE
        "progressionStage": 2,          # 2 = MODERATE
        "yearsSinceDiagnosis": 3,
        "comorbidityCount": 2,
        "allergyCount": 1,
        "hasGeneticRisk": 1,            # 1 = true
        "hasFamilyHistory": 1,          # 1 = true
        "surgeryCount": 1,
        "caregiverCount": 1,
        "providerCount": 2
    }
    
    try:
        response = requests.post(
            f"{base_url}/predict",
            json=features_data,
            headers={"Content-Type": "application/json"}
        )
        print(f"Status Code: {response.status_code}")
        result = response.json()
        print(f"Response: {json.dumps(result, indent=2)}")
        return response.status_code == 200
    except Exception as e:
        print(f"✗ Failed: {e}")
        return False


def run_all_tests():
    """Run all tests"""
    print("=" * 60)
    print("ML Predictor Service - API Tests")
    print("=" * 60)
    print("\nMake sure the Flask server is running:")
    print("  python app.py")
    print("\nPress Enter to start tests...")
    input()
    
    base_url = "http://localhost:5000"
    results = []
    
    # Run tests
    results.append(("Health Check", test_health_check(base_url)))
    results.append(("Single Prediction", test_single_prediction(base_url)))
    results.append(("Batch Prediction", test_batch_prediction(base_url)))
    results.append(("Feature-based Prediction", test_with_extracted_features(base_url)))
    
    # Summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✓ PASS" if result else "✗ FAIL"
        color = "\033[92m" if result else "\033[91m"
        reset = "\033[0m"
        print(f"{color}{status}{reset} - {test_name}")
    
    print(f"\nTotal: {passed}/{total} tests passed")
    print("=" * 60)


if __name__ == '__main__':
    run_all_tests()
