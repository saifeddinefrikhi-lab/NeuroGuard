package com.neuroguard.medicalhistoryservice.repository;

import com.neuroguard.medicalhistoryservice.entity.MedicalHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

/**
 * Patient Statistics Repository - Aggregated queries for patient data with table joins
 * Simplified for Hibernate compatibility
 */
public interface PatientStatisticsRepository extends JpaRepository<MedicalHistory, Long> {

    /**
     * Get patient medical history
     */
    @Query("SELECT mh FROM MedicalHistory mh WHERE mh.patientId = :patientId")
    Optional<MedicalHistory> findByPatientId(@Param("patientId") Long patientId);

    /**
     * Count surgeries for a patient (explicit join for clarity)
     */
    @Query("""
        SELECT COALESCE(COUNT(s), 0)
        FROM MedicalHistory mh
        LEFT JOIN mh.surgeries s
        WHERE mh.patientId = :patientId
        """)
    int countSurgeriesByPatientId(@Param("patientId") Long patientId);

    /**
     * Check if medical history exists for patient
     */
    @Query("SELECT COUNT(mh) > 0 FROM MedicalHistory mh WHERE mh.patientId = :patientId")
    boolean existsByPatientId(@Param("patientId") Long patientId);
}
