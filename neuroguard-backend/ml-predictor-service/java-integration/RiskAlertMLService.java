package com.neuroguard.riskalert;

import com.neuroguard.mlclient.MLPredictorClient;
import com.neuroguard.mlclient.PatientFeatures;
import com.neuroguard.mlclient.PredictionResult;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.Period;

/**
 * Example integration of ML Predictor with Risk Alert Service
 * Shows how to generate alerts based on ML predictions
 */
@Service
public class RiskAlertMLService {
    
    @Autowired
    private MLPredictorClient mlClient;
    
    @Autowired
    private RiskAlertRepository alertRepository;
    
    @Autowired
    private MedicalHistoryRepository medicalHistoryRepository;
    
    /**
     * Analyze patient and create alert if high risk
     * 
     * @param patientId Patient to analyze
     * @return Created alert or null if no alert needed
     */
    public RiskAlert analyzePatientAndCreateAlert(Long patientId) {
        // 1. Fetch medical history
        MedicalHistory history = medicalHistoryRepository.findByPatientId(patientId)
            .orElseThrow(() -> new RuntimeException("Medical history not found"));
        
        // 2. Build PatientFeatures from medical history
        PatientFeatures features = buildPatientFeatures(history);
        
        // 3. Get ML prediction
        PredictionResult prediction = mlClient.predictHospitalizationRisk(features);
        
        // 4. Create alert if risk is significant
        if (shouldCreateAlert(prediction)) {
            return createRiskAlert(history, prediction);
        }
        
        return null;
    }
    
    /**
     * Build PatientFeatures from MedicalHistory entity
     */
    private PatientFeatures buildPatientFeatures(MedicalHistory history) {
        PatientFeatures features = new PatientFeatures();
        
        features.setPatientId(history.getPatientId());
        
        // Calculate age from diagnosis date
        if (history.getDiagnosisDate() != null) {
            int yearsSince = Period.between(history.getDiagnosisDate(), LocalDate.now()).getYears();
            features.setYearsSinceDiagnosis(yearsSince);
            // Estimate current age (assume diagnosed at 60)
            features.setAge(60 + yearsSince);
        } else {
            features.setAge(65); // default estimate
            features.setYearsSinceDiagnosis(0);
        }
        
        // Gender (from patient entity if available, or default)
        features.setGender(history.getPatient() != null ? 
            history.getPatient().getGender() : "MALE");
        
        // Progression stage
        features.setProgressionStage(history.getProgressionStage().name());
        
        // Comorbidities count
        features.setComorbidityCount(countComorbidities(history.getComorbidities()));
        
        // Allergies count
        int allergyCount = 0;
        if (history.getFoodAllergies() != null) 
            allergyCount += history.getFoodAllergies().split(",").length;
        if (history.getMedicationAllergies() != null) 
            allergyCount += history.getMedicationAllergies().split(",").length;
        if (history.getEnvironmentalAllergies() != null) 
            allergyCount += history.getEnvironmentalAllergies().split(",").length;
        features.setAllergyCount(allergyCount);
        
        // Genetic risk
        features.setHasGeneticRisk(hasGeneticRisk(history.getGeneticRisk()));
        
        // Family history
        features.setHasFamilyHistory(
            history.getFamilyHistory() != null && 
            !history.getFamilyHistory().isEmpty() &&
            !history.getFamilyHistory().equalsIgnoreCase("none")
        );
        
        // Surgery count
        features.setSurgeryCount(
            history.getSurgicalProcedures() != null ? 
            history.getSurgicalProcedures().size() : 0
        );
        
        // Caregiver count
        features.setCaregiverCount(
            history.getCaregivers() != null ? 
            history.getCaregivers().size() : 0
        );
        
        // Provider count
        features.setProviderCount(
            history.getProviders() != null ? 
            history.getProviders().size() : 0
        );
        
        return features;
    }
    
    /**
     * Determine if alert should be created based on prediction
     */
    private boolean shouldCreateAlert(PredictionResult prediction) {
        // Create alert for MODERATE, HIGH, or CRITICAL risk
        return prediction.getRiskLevel() != null &&
               (prediction.getRiskLevel().equals("MODERATE") ||
                prediction.getRiskLevel().equals("HIGH") ||
                prediction.getRiskLevel().equals("CRITICAL"));
    }
    
    /**
     * Create risk alert from prediction
     */
    private RiskAlert createRiskAlert(MedicalHistory history, PredictionResult prediction) {
        RiskAlert alert = new RiskAlert();
        
        alert.setPatientId(history.getPatientId());
        
        // Map risk level to severity
        alert.setSeverity(mapRiskLevelToSeverity(prediction.getRiskLevel()));
        
        // Create message
        String message = String.format(
            "ML Prediction: %s hospitalization risk (%.1f%%). %s",
            prediction.getRiskLevel(),
            prediction.getRiskPercentage(),
            prediction.getRecommendation()
        );
        alert.setMessage(message);
        
        alert.setResolved(false);
        alert.setCreatedAt(LocalDateTime.now());
        
        // Save alert
        return alertRepository.save(alert);
    }
    
    /**
     * Map ML risk level to alert severity
     */
    private Severity mapRiskLevelToSeverity(String riskLevel) {
        switch (riskLevel) {
            case "CRITICAL":
                return Severity.CRITICAL;
            case "HIGH":
            case "MODERATE":
                return Severity.WARNING;
            case "LOW":
            case "MINIMAL":
            default:
                return Severity.INFO;
        }
    }
    
    /**
     * Count comorbidities from string
     */
    private int countComorbidities(String comorbidities) {
        if (comorbidities == null || comorbidities.isEmpty()) {
            return 0;
        }
        return comorbidities.split(",").length;
    }
    
    /**
     * Check if patient has genetic risk
     */
    private boolean hasGeneticRisk(String geneticRisk) {
        if (geneticRisk == null) return false;
        
        String risk = geneticRisk.toLowerCase();
        return risk.contains("mutation") || 
               risk.contains("positive") ||
               risk.contains("lrrk2") ||
               risk.contains("gba") ||
               risk.contains("snca") ||
               risk.contains("parkin");
    }
    
    /**
     * Batch process all patients
     */
    public void analyzeAllPatients() {
        List<MedicalHistory> allHistories = medicalHistoryRepository.findAll();
        
        int alertsCreated = 0;
        for (MedicalHistory history : allHistories) {
            try {
                RiskAlert alert = analyzePatientAndCreateAlert(history.getPatientId());
                if (alert != null) {
                    alertsCreated++;
                    System.out.println("Created alert for patient " + 
                        history.getPatientId() + 
                        ": " + alert.getSeverity());
                }
            } catch (Exception e) {
                System.err.println("Error analyzing patient " + 
                    history.getPatientId() + ": " + e.getMessage());
            }
        }
        
        System.out.println("Analysis complete. Created " + alertsCreated + " alerts.");
    }
}
