package com.neuroguard.userservice.repositories;

import com.neuroguard.userservice.entities.CaregiverPatient;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CaregiverPatientRepository extends JpaRepository<CaregiverPatient, Long> {
    List<CaregiverPatient> findByCaregiverId(Long caregiverId);
    boolean existsByCaregiverIdAndPatientId(Long caregiverId, Long patientId);
    // Optionnel : supprimer une affectation
    void deleteByCaregiverIdAndPatientId(Long caregiverId, Long patientId);
}
