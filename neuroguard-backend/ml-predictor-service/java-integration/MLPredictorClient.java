package com.neuroguard.mlclient;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

/**
 * Service to integrate with Python ML Predictor Service
 * Predicts hospitalization risk for Parkinson's patients
 */
@Service
public class MLPredictorClient {
    
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final String mlServiceUrl;
    
    public MLPredictorClient() {
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
        // Configure this via application.properties: ml.predictor.url
        this.mlServiceUrl = "http://localhost:5000";
    }
    
    /**
     * Predict hospitalization risk for a patient
     * 
     * @param features PatientFeatures object with patient data
     * @return PredictionResult with risk assessment
     */
    public PredictionResult predictHospitalizationRisk(PatientFeatures features) {
        try {
            String url = mlServiceUrl + "/predict";
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            HttpEntity<PatientFeatures> request = new HttpEntity<>(features, headers);
            
            ResponseEntity<PredictionResult> response = restTemplate.postForEntity(
                url, 
                request, 
                PredictionResult.class
            );
            
            return response.getBody();
            
        } catch (Exception e) {
            throw new RuntimeException("Failed to get ML prediction: " + e.getMessage(), e);
        }
    }
    
    /**
     * Check if ML service is healthy
     */
    public boolean isMLServiceHealthy() {
        try {
            String url = mlServiceUrl + "/health";
            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
            
            Map<String, Object> health = response.getBody();
            return "healthy".equals(health.get("status")) && 
                   Boolean.TRUE.equals(health.get("model_loaded"));
                   
        } catch (Exception e) {
            return false;
        }
    }
}

/**
 * Patient Features matching Python ML model
 * This matches the feature extraction in Python
 */
class PatientFeatures {
    private Long patientId;
    private int age;
    private String gender;              // MALE, FEMALE, OTHER (or 1, 0, 2)
    private String progressionStage;    // MILD, MODERATE, SEVERE (or 1, 2, 3)
    private int yearsSinceDiagnosis;
    private int comorbidityCount;
    private int allergyCount;
    private boolean hasGeneticRisk;
    private boolean hasFamilyHistory;
    private int surgeryCount;
    private int caregiverCount;
    private int providerCount;
    
    // Constructors
    public PatientFeatures() {}
    
    public PatientFeatures(Long patientId, int age, String gender, 
                          String progressionStage, int yearsSinceDiagnosis,
                          int comorbidityCount, int allergyCount,
                          boolean hasGeneticRisk, boolean hasFamilyHistory,
                          int surgeryCount, int caregiverCount, int providerCount) {
        this.patientId = patientId;
        this.age = age;
        this.gender = gender;
        this.progressionStage = progressionStage;
        this.yearsSinceDiagnosis = yearsSinceDiagnosis;
        this.comorbidityCount = comorbidityCount;
        this.allergyCount = allergyCount;
        this.hasGeneticRisk = hasGeneticRisk;
        this.hasFamilyHistory = hasFamilyHistory;
        this.surgeryCount = surgeryCount;
        this.caregiverCount = caregiverCount;
        this.providerCount = providerCount;
    }
    
    // Getters and Setters
    public Long getPatientId() { return patientId; }
    public void setPatientId(Long patientId) { this.patientId = patientId; }
    
    public int getAge() { return age; }
    public void setAge(int age) { this.age = age; }
    
    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }
    
    public String getProgressionStage() { return progressionStage; }
    public void setProgressionStage(String progressionStage) { 
        this.progressionStage = progressionStage; 
    }
    
    public int getYearsSinceDiagnosis() { return yearsSinceDiagnosis; }
    public void setYearsSinceDiagnosis(int yearsSinceDiagnosis) { 
        this.yearsSinceDiagnosis = yearsSinceDiagnosis; 
    }
    
    public int getComorbidityCount() { return comorbidityCount; }
    public void setComorbidityCount(int comorbidityCount) { 
        this.comorbidityCount = comorbidityCount; 
    }
    
    public int getAllergyCount() { return allergyCount; }
    public void setAllergyCount(int allergyCount) { 
        this.allergyCount = allergyCount; 
    }
    
    public boolean isHasGeneticRisk() { return hasGeneticRisk; }
    public void setHasGeneticRisk(boolean hasGeneticRisk) { 
        this.hasGeneticRisk = hasGeneticRisk; 
    }
    
    public boolean isHasFamilyHistory() { return hasFamilyHistory; }
    public void setHasFamilyHistory(boolean hasFamilyHistory) { 
        this.hasFamilyHistory = hasFamilyHistory; 
    }
    
    public int getSurgeryCount() { return surgeryCount; }
    public void setSurgeryCount(int surgeryCount) { 
        this.surgeryCount = surgeryCount; 
    }
    
    public int getCaregiverCount() { return caregiverCount; }
    public void setCaregiverCount(int caregiverCount) { 
        this.caregiverCount = caregiverCount; 
    }
    
    public int getProviderCount() { return providerCount; }
    public void setProviderCount(int providerCount) { 
        this.providerCount = providerCount; 
    }
}

/**
 * Prediction result from ML service
 */
class PredictionResult {
    private Long patientId;
    private int prediction;           // 0 = not hospitalized, 1 = hospitalized
    private double probability;       // 0.0 to 1.0
    private String riskLevel;         // MINIMAL, LOW, MODERATE, HIGH, CRITICAL
    private double riskPercentage;    // 0.0 to 100.0
    private String recommendation;
    
    // Constructors
    public PredictionResult() {}
    
    // Getters and Setters
    public Long getPatientId() { return patientId; }
    public void setPatientId(Long patientId) { this.patientId = patientId; }
    
    public int getPrediction() { return prediction; }
    public void setPrediction(int prediction) { this.prediction = prediction; }
    
    public double getProbability() { return probability; }
    public void setProbability(double probability) { this.probability = probability; }
    
    public String getRiskLevel() { return riskLevel; }
    public void setRiskLevel(String riskLevel) { this.riskLevel = riskLevel; }
    
    public double getRiskPercentage() { return riskPercentage; }
    public void setRiskPercentage(double riskPercentage) { 
        this.riskPercentage = riskPercentage; 
    }
    
    public String getRecommendation() { return recommendation; }
    public void setRecommendation(String recommendation) { 
        this.recommendation = recommendation; 
    }
}
