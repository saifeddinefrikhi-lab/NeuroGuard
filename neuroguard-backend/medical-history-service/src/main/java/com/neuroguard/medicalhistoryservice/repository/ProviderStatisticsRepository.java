package com.neuroguard.medicalhistoryservice.repository;

import com.neuroguard.medicalhistoryservice.entity.MedicalHistory;
import com.neuroguard.medicalhistoryservice.entity.ProgressionStage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 * Provider Statistics Repository - Aggregate queries for provider dashboards
 * Simplified for Hibernate compatibility
 */
public interface ProviderStatisticsRepository extends JpaRepository<MedicalHistory, Long> {

    /**
     * Get medical histories managed by a provider
     */
    @Query("SELECT h FROM MedicalHistory h WHERE :providerId MEMBER OF h.providerIds")
    Page<MedicalHistory> findByProviderId(@Param("providerId") Long providerId, Pageable pageable);

    /**
     * Count total patients managed by a provider
     */
    @Query("""
        SELECT COUNT(DISTINCT mh.patientId)
        FROM MedicalHistory mh
        WHERE :providerId MEMBER OF mh.providerIds
        """)
    int countPatientsByProviderId(@Param("providerId") Long providerId);

    /**
     * Count medical histories by progression stage
     */
    @Query("""
        SELECT COUNT(mh)
        FROM MedicalHistory mh
        WHERE :providerId MEMBER OF mh.providerIds
        AND mh.progressionStage = :stage
        """)
    int countByProgressionStage(@Param("providerId") Long providerId, @Param("stage") ProgressionStage stage);

    /**
     * Get average MMSE
     */
    @Query("""
        SELECT COALESCE(AVG(CAST(mh.mmse AS double)), 0.0)
        FROM MedicalHistory mh
        WHERE :providerId MEMBER OF mh.providerIds
        AND mh.mmse IS NOT NULL
        """)
    double getAverageMMSE(@Param("providerId") Long providerId);

    /**
     * Get average functional assessment
     */
    @Query("""
        SELECT COALESCE(AVG(CAST(mh.functionalAssessment AS double)), 0.0)
        FROM MedicalHistory mh
        WHERE :providerId MEMBER OF mh.providerIds
        AND mh.functionalAssessment IS NOT NULL
        """)
    double getAverageFunctionalAssessment(@Param("providerId") Long providerId);

    /**
     * Get average ADL
     */
    @Query("""
        SELECT COALESCE(AVG(CAST(mh.adl AS double)), 0.0)
        FROM MedicalHistory mh
        WHERE :providerId MEMBER OF mh.providerIds
        AND mh.adl IS NOT NULL
        """)
    double getAverageADL(@Param("providerId") Long providerId);

    /**
     * Count patients with genetic risk
     */
    @Query("""
        SELECT COUNT(DISTINCT mh.patientId)
        FROM MedicalHistory mh
        WHERE :providerId MEMBER OF mh.providerIds
        AND mh.geneticRisk IS NOT NULL
        AND mh.geneticRisk != ''
        """)
    int countPatientsWithGeneticRisk(@Param("providerId") Long providerId);

    /**
     * Count patients with comorbidities
     */
    @Query("""
        SELECT COUNT(DISTINCT mh.patientId)
        FROM MedicalHistory mh
        WHERE :providerId MEMBER OF mh.providerIds
        AND mh.comorbidities IS NOT NULL
        AND mh.comorbidities != ''
        """)
    int countPatientsWithComorbidities(@Param("providerId") Long providerId);

    /**
     * Count patients with allergies
     */
    @Query("""
        SELECT COUNT(DISTINCT mh.patientId)
        FROM MedicalHistory mh
        WHERE :providerId MEMBER OF mh.providerIds
        AND (
            (mh.medicationAllergies IS NOT NULL AND mh.medicationAllergies != '')
            OR (mh.foodAllergies IS NOT NULL AND mh.foodAllergies != '')
            OR (mh.environmentalAllergies IS NOT NULL AND mh.environmentalAllergies != '')
        )
        """)
    int countPatientsWithAllergies(@Param("providerId") Long providerId);
}
