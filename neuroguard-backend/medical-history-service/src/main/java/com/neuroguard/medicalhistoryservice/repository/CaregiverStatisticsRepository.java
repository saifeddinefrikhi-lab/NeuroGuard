package com.neuroguard.medicalhistoryservice.repository;

import com.neuroguard.medicalhistoryservice.entity.MedicalHistory;
import com.neuroguard.medicalhistoryservice.entity.ProgressionStage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 * Caregiver Statistics Repository - Simplified aggregate queries
 * Builds DTOs in service layer for Hibernate compatibility
 */
public interface CaregiverStatisticsRepository extends JpaRepository<MedicalHistory, Long> {

    /**
     * Get medical histories assigned to a caregiver
     */
    @Query("SELECT h FROM MedicalHistory h WHERE :caregiverId MEMBER OF h.caregiverIds")
    Page<MedicalHistory> findByCaregiverId(@Param("caregiverId") Long caregiverId, Pageable pageable);

    /**
     * Count assigned patients
     */
    @Query("""
        SELECT COUNT(DISTINCT mh.patientId)
        FROM MedicalHistory mh
        WHERE :caregiverId MEMBER OF mh.caregiverIds
        """)
    int countAssignedPatients(@Param("caregiverId") Long caregiverId);

    /**
     * Count assigned patients with history
     */
    @Query("""
        SELECT COUNT(DISTINCT mh)
        FROM MedicalHistory mh
        WHERE :caregiverId MEMBER OF mh.caregiverIds
        """)
    int countAssignedPatientsWithHistory(@Param("caregiverId") Long caregiverId);

    /**
     * Count by progression stage
     */
    @Query("""
        SELECT COUNT(mh)
        FROM MedicalHistory mh
        WHERE :caregiverId MEMBER OF mh.caregiverIds
        AND mh.progressionStage = :stage
        """)
    int countByProgressionStage(@Param("caregiverId") Long caregiverId, @Param("stage") ProgressionStage stage);

    /**
     * Get average MMSE
     */
    @Query("""
        SELECT COALESCE(AVG(CAST(mh.mmse AS double)), 0.0)
        FROM MedicalHistory mh
        WHERE :caregiverId MEMBER OF mh.caregiverIds
        AND mh.mmse IS NOT NULL
        """)
    double getAverageMMSE(@Param("caregiverId") Long caregiverId);

    /**
     * Get average functional assessment
     */
    @Query("""
        SELECT COALESCE(AVG(CAST(mh.functionalAssessment AS double)), 0.0)
        FROM MedicalHistory mh
        WHERE :caregiverId MEMBER OF mh.caregiverIds
        AND mh.functionalAssessment IS NOT NULL
        """)
    double getAverageFunctionalAssessment(@Param("caregiverId") Long caregiverId);

    /**
     * Get average ADL
     */
    @Query("""
        SELECT COALESCE(AVG(CAST(mh.adl AS double)), 0.0)
        FROM MedicalHistory mh
        WHERE :caregiverId MEMBER OF mh.caregiverIds
        AND mh.adl IS NOT NULL
        """)
    double getAverageADL(@Param("caregiverId") Long caregiverId);

    /**
     * Count patients with low MMSE
     */
    @Query("""
        SELECT COUNT(DISTINCT mh.patientId)
        FROM MedicalHistory mh
        WHERE :caregiverId MEMBER OF mh.caregiverIds
        AND mh.mmse IS NOT NULL
        AND mh.mmse < 18
        """)
    int countPatientsWithLowMMSE(@Param("caregiverId") Long caregiverId);

    /**
     * Count patients with high dependency
     */
    @Query("""
        SELECT COUNT(DISTINCT mh.patientId)
        FROM MedicalHistory mh
        WHERE :caregiverId MEMBER OF mh.caregiverIds
        AND (
            (mh.functionalAssessment IS NOT NULL AND mh.functionalAssessment < 5)
            OR (mh.adl IS NOT NULL AND mh.adl < 5)
        )
        """)
    int countPatientsWithHighDependency(@Param("caregiverId") Long caregiverId);

    /**
     * Count patients with risk factors
     */
    @Query("""
        SELECT COUNT(DISTINCT mh.patientId)
        FROM MedicalHistory mh
        WHERE :caregiverId MEMBER OF mh.caregiverIds
        AND (
            (mh.geneticRisk IS NOT NULL AND mh.geneticRisk != '')
            OR (mh.depression = true)
            OR (mh.cardiovascularDisease = true)
            OR (mh.diabetes = true)
        )
        """)
    int countPatientsWithRiskFactors(@Param("caregiverId") Long caregiverId);
}
