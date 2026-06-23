"""
Test API Script for Alzheimer's Predictor Service
Tests all endpoints with sample data
"""
import requests
import json
from typing import Dict, List
import time


class AlzheimersAPITester:
    """Test Alzheimer's disease prediction API"""
    
    def __init__(self, base_url: str = "http://localhost:5000"):
        self.base_url = base_url
        self.test_results = []
    
    def _print_header(self, text: str):
        print(f"\n{'='*70}")
        print(f"  {text}")
        print(f"{'='*70}")
    
    def _print_result(self, endpoint: str, status: bool, details: str = ""):
        symbol = "✓" if status else "❌"
        print(f"{symbol} {endpoint}")
        if details:
            print(f"   {details}")
        self.test_results.append((endpoint, status))
    
    def test_health(self):
        """Test health check endpoint"""
        self._print_header("1. Testing /health Endpoint")
        
        try:
            response = requests.get(f"{self.base_url}/health", timeout=5)
            if response.status_code == 200:
                data = response.json()
                if data.get('model_loaded'):
                    self._print_result(
                        "/health",
                        True,
                        f"Model loaded with {data.get('features_count')} features"
                    )
                    return True
                else:
                    self._print_result("/health", False, "Model not loaded")
                    return False
            else:
                self._print_result("/health", False, f"Status code: {response.status_code}")
                return False
        except Exception as e:
            self._print_result("/health", False, str(e))
            return False
    
    def test_features_info(self):
        """Test features info endpoint"""
        self._print_header("2. Testing /features Endpoint")
        
        try:
            response = requests.get(f"{self.base_url}/features", timeout=5)
            if response.status_code == 200:
                data = response.json()
                features = data.get('feature_names', [])
                self._print_result(
                    "/features",
                    True,
                    f"Retrieved {len(features)} features: {', '.join(features[:5])}..."
                )
                return True
            else:
                self._print_result("/features", False, f"Status code: {response.status_code}")
                return False
        except Exception as e:
            self._print_result("/features", False, str(e))
            return False
    
    def test_single_prediction_low_risk(self):
        """Test low risk prediction"""
        self._print_header("3. Testing /predict Endpoint (Low Risk Case)")
        
        payload = {
            "patientId": "P001",
            "age": 65,
            "gender": "Male",
            "MMSE": 28,
            "FunctionalAssessment": 9,
            "ADL": 9,
            "MemoryComplaints": 0,
            "BehavioralProblems": 0,
            "FamilyHistoryAlzheimers": 0,
            "Smoking": 0,
            "CardiovascularDisease": 0,
            "Diabetes": 0,
            "Depression": 0,
            "HeadInjury": 0,
            "Hypertension": 0
        }
        
        try:
            response = requests.post(
                f"{self.base_url}/predict",
                json=payload,
                timeout=5
            )
            if response.status_code == 200:
                result = response.json()
                self._print_result(
                    "/predict (low risk)",
                    True,
                    f"Risk Level: {result.get('riskLevel')} "
                    f"({result.get('riskPercentage')}%)"
                )
                print(f"   Recommendation: {result.get('recommendation')[:60]}...")
                return True
            else:
                self._print_result("/predict", False, f"Status code: {response.status_code}")
                return False
        except Exception as e:
            self._print_result("/predict", False, str(e))
            return False
    
    def test_single_prediction_high_risk(self):
        """Test high risk prediction"""
        self._print_header("4. Testing /predict Endpoint (High Risk Case)")
        
        payload = {
            "patientId": "P002",
            "age": 78,
            "gender": "Female",
            "MMSE": 18,
            "FunctionalAssessment": 3,
            "ADL": 2,
            "MemoryComplaints": 1,
            "BehavioralProblems": 1,
            "FamilyHistoryAlzheimers": 1,
            "Smoking": 1,
            "CardiovascularDisease": 1,
            "Diabetes": 1,
            "Depression": 1,
            "HeadInjury": 0,
            "Hypertension": 1
        }
        
        try:
            response = requests.post(
                f"{self.base_url}/predict",
                json=payload,
                timeout=5
            )
            if response.status_code == 200:
                result = response.json()
                self._print_result(
                    "/predict (high risk)",
                    True,
                    f"Risk Level: {result.get('riskLevel')} "
                    f"({result.get('riskPercentage')}%)"
                )
                print(f"   Recommendation: {result.get('recommendation')[:60]}...")
                return True
            else:
                self._print_result("/predict", False, f"Status code: {response.status_code}")
                return False
        except Exception as e:
            self._print_result("/predict", False, str(e))
            return False
    
    def test_batch_prediction(self):
        """Test batch prediction"""
        self._print_header("5. Testing /predict/batch Endpoint")
        
        payload = {
            "patients": [
                {
                    "patientId": "P003",
                    "age": 70,
                    "gender": "Male",
                    "MMSE": 25,
                    "FunctionalAssessment": 7,
                    "ADL": 6,
                    "MemoryComplaints": 1,
                    "BehavioralProblems": 0,
                    "FamilyHistoryAlzheimers": 0,
                    "Smoking": 0,
                    "CardiovascularDisease": 0,
                    "Diabetes": 1,
                    "Depression": 0,
                    "HeadInjury": 0,
                    "Hypertension": 1
                },
                {
                    "patientId": "P004",
                    "age": 72,
                    "gender": "Female",
                    "MMSE": 20,
                    "FunctionalAssessment": 4,
                    "ADL": 3,
                    "MemoryComplaints": 1,
                    "BehavioralProblems": 1,
                    "FamilyHistoryAlzheimers": 1,
                    "Smoking": 0,
                    "CardiovascularDisease": 1,
                    "Diabetes": 1,
                    "Depression": 1,
                    "HeadInjury": 1,
                    "Hypertension": 1
                }
            ]
        }
        
        try:
            response = requests.post(
                f"{self.base_url}/predict/batch",
                json=payload,
                timeout=5
            )
            if response.status_code == 200:
                result = response.json()
                successful = result.get('successfulPredictions', 0)
                failed = result.get('failedPredictions', 0)
                self._print_result(
                    "/predict/batch",
                    True,
                    f"Processed {successful} patients successfully, {failed} failed"
                )
                
                # Print batch results
                for pred in result.get('predictions', []):
                    print(f"   - Patient {pred['patientId']}: "
                          f"{pred['riskLevel']} ({pred['riskPercentage']}%)")
                return True
            else:
                self._print_result("/predict/batch", False, f"Status code: {response.status_code}")
                return False
        except Exception as e:
            self._print_result("/predict/batch", False, str(e))
            return False
    
    def test_info(self):
        """Test service info endpoint"""
        self._print_header("6. Testing /info Endpoint")
        
        try:
            response = requests.get(f"{self.base_url}/info", timeout=5)
            if response.status_code == 200:
                data = response.json()
                self._print_result(
                    "/info",
                    True,
                    f"Service: {data.get('service_name')} v{data.get('version')}"
                )
                print(f"   Model Type: {data.get('model_type')}")
                print(f"   Features: {data.get('features_count')}")
                return True
            else:
                self._print_result("/info", False, f"Status code: {response.status_code}")
                return False
        except Exception as e:
            self._print_result("/info", False, str(e))
            return False
    
    def test_error_handling(self):
        """Test error handling"""
        self._print_header("7. Testing Error Handling")
        
        # Test missing fields
        invalid_payload = {
            "patientId": "P005",
            "age": 70
            # Missing required fields
        }
        
        try:
            response = requests.post(
                f"{self.base_url}/predict",
                json=invalid_payload,
                timeout=5
            )
            if response.status_code == 400:
                self._print_result(
                    "Invalid request handling",
                    True,
                    "Correctly rejected invalid payload"
                )
                return True
            else:
                self._print_result(
                    "Invalid request handling",
                    False,
                    f"Expected 400, got {response.status_code}"
                )
                return False
        except Exception as e:
            self._print_result("Invalid request handling", False, str(e))
            return False
    
    def run_all_tests(self):
        """Run all test cases"""
        print("\n" + "#" * 70)
        print("# ALZHEIMER'S DISEASE PREDICTOR API - TEST SUITE")
        print("#" * 70)
        
        try:
            # Health check first
            if not self.test_health():
                print("\n⚠ Service not available. Make sure API is running.")
                print(f"  Start it with: python alzheimers_app.py")
                return False
            
            time.sleep(0.5)
            
            # Run all tests
            self.test_features_info()
            time.sleep(0.5)
            self.test_single_prediction_low_risk()
            time.sleep(0.5)
            self.test_single_prediction_high_risk()
            time.sleep(0.5)
            self.test_batch_prediction()
            time.sleep(0.5)
            self.test_info()
            time.sleep(0.5)
            self.test_error_handling()
            
            # Summary
            self._print_header("TEST SUMMARY")
            passed = sum(1 for _, status in self.test_results if status)
            total = len(self.test_results)
            
            print(f"\nTests Passed: {passed}/{total}")
            
            if passed == total:
                print("\n✓ ALL TESTS PASSED!")
            else:
                print(f"\n⚠ {total - passed} test(s) failed")
            
            print(f"\n{'='*70}\n")
            
            return passed == total
        
        except KeyboardInterrupt:
            print("\n\n⚠ Test interrupted by user")
            return False
        except Exception as e:
            print(f"\n❌ Unexpected error: {e}")
            import traceback
            traceback.print_exc()
            return False


def main():
    """Main test execution"""
    import sys
    
    # Allow custom base URL as argument
    base_url = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:5000"
    
    tester = AlzheimersAPITester(base_url=base_url)
    success = tester.run_all_tests()
    
    sys.exit(0 if success else 1)


if __name__ == '__main__':
    main()
