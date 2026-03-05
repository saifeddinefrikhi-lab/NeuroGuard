package com.neuroguard.medicalhistoryservice.repository;

import com.neuroguard.medicalhistoryservice.entity.MedicalHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface MedicalHistoryRepository extends JpaRepository<MedicalHistory, Long> {
    Optional<MedicalHistory> findByPatientId(Long patientId);
    boolean existsByPatientId(Long patientId);

    @Query("SELECT h FROM MedicalHistory h WHERE :providerId MEMBER OF h.providerIds")
    List<MedicalHistory> findByProviderId(@Param("providerId") Long providerId);

    @Query("SELECT h FROM MedicalHistory h WHERE :caregiverId MEMBER OF h.caregiverIds")
    List<MedicalHistory> findByCaregiverId(@Param("caregiverId") Long caregiverId);
}