package com.neuroguard.userservice.services;

import com.neuroguard.userservice.entities.CaregiverPatient;
import com.neuroguard.userservice.repositories.CaregiverPatientRepository;
import com.neuroguard.userservice.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CaregiverAssignmentService {

    private final CaregiverPatientRepository caregiverPatientRepository;
    private final UserRepository userRepository;

    // Vérifier si un caregiver est assigné à un patient
    public boolean isCaregiverAssignedToPatient(Long caregiverId, Long patientId) {
        // Optionnel : vérifier que les IDs correspondent à des utilisateurs avec les bons rôles
        return caregiverPatientRepository.existsByCaregiverIdAndPatientId(caregiverId, patientId);
    }

    // Récupérer la liste des IDs des patients assignés à un caregiver
    public List<Long> getPatientIdsByCaregiver(Long caregiverId) {
        return caregiverPatientRepository.findByCaregiverId(caregiverId)
                .stream()
                .map(CaregiverPatient::getPatientId)
                .collect(Collectors.toList());
    }

    // Ajouter une affectation (pour administration)
    @Transactional
    public void assignCaregiverToPatient(Long caregiverId, Long patientId) {
        // Vérifier que le caregiver existe et a le rôle CAREGIVER
        var caregiver = userRepository.findById(caregiverId)
                .orElseThrow(() -> new IllegalArgumentException("Caregiver with id " + caregiverId + " not found"));

        if (!caregiver.getRole().equals(com.neuroguard.userservice.entities.Role.CAREGIVER)) {
            throw new IllegalArgumentException("User with id " + caregiverId + " is not a caregiver");
        }

        // Vérifier que le patient existe et a le rôle PATIENT
        var patient = userRepository.findById(patientId)
                .orElseThrow(() -> new IllegalArgumentException("Patient with id " + patientId + " not found"));

        if (!patient.getRole().equals(com.neuroguard.userservice.entities.Role.PATIENT)) {
            throw new IllegalArgumentException("User with id " + patientId + " is not a patient");
        }

        // Vérifier que l'affectation n'existe pas déjà
        if (!caregiverPatientRepository.existsByCaregiverIdAndPatientId(caregiverId, patientId)) {
            CaregiverPatient cp = new CaregiverPatient();
            cp.setCaregiverId(caregiverId);
            cp.setPatientId(patientId);
            caregiverPatientRepository.save(cp);
        }
    }

    // Retirer une affectation
    @Transactional
    public void unassignCaregiverFromPatient(Long caregiverId, Long patientId) {
        caregiverPatientRepository.deleteByCaregiverIdAndPatientId(caregiverId, patientId);
    }
}