package com.neuroguard.medicalhistoryservice.service;

import com.neuroguard.medicalhistoryservice.client.UserServiceClient;
import com.neuroguard.medicalhistoryservice.dto.FileDto;
import com.neuroguard.medicalhistoryservice.dto.MedicalHistoryRequest;
import com.neuroguard.medicalhistoryservice.dto.MedicalHistoryResponse;
import com.neuroguard.medicalhistoryservice.dto.UserDto;
import com.neuroguard.medicalhistoryservice.entity.MedicalHistory;
import com.neuroguard.medicalhistoryservice.entity.MedicalRecordFile;
import com.neuroguard.medicalhistoryservice.repository.MedicalHistoryRepository;
import com.neuroguard.medicalhistoryservice.repository.MedicalRecordFileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MedicalHistoryService {

    private static final Logger log = LoggerFactory.getLogger(MedicalHistoryService.class);

    private final MedicalHistoryRepository historyRepository;
    private final MedicalRecordFileRepository fileRepository;
    private final UserServiceClient userServiceClient;

    private final String uploadDir = "uploads/medical-history/";

    // ------------------- Provider Operations -------------------
    public List<MedicalHistoryResponse> getAllMedicalHistoriesForProvider(Long providerId) {
        List<MedicalHistory> histories = historyRepository.findByProviderId(providerId);
        return histories.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    // ------------------- Caregiver Operations -------------------
    public List<MedicalHistoryResponse> getAllMedicalHistoriesForCaregiver(Long caregiverId) {
        List<MedicalHistory> histories = historyRepository.findByCaregiverId(caregiverId);
        return histories.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional
    public MedicalHistoryResponse createMedicalHistory(MedicalHistoryRequest request, Long providerId) {
        // Check if patient already has a medical history
        if (historyRepository.existsByPatientId(request.getPatientId())) {
            throw new RuntimeException("Medical history already exists for patient: " + request.getPatientId());
        }

        MedicalHistory history = mapRequestToEntity(request);

        // Ensure the creator provider is added to providerIds if not present
        if (!history.getProviderIds().contains(providerId)) {
            history.getProviderIds().add(providerId);
        }

        // Handle caregiver assignments - prefer IDs over names
        List<Long> caregiverIds = new ArrayList<>();
        if (request.getCaregiverIds() != null && !request.getCaregiverIds().isEmpty()) {
            caregiverIds = request.getCaregiverIds();
        } else if (request.getCaregiverNames() != null && !request.getCaregiverNames().isEmpty()) {
            caregiverIds = resolveCaregiverNamesToIds(request.getCaregiverNames());
        }
        history.setCaregiverIds(caregiverIds);

        history = historyRepository.save(history);
        return mapToResponse(history);
    }

    @Transactional
    public MedicalHistoryResponse updateMedicalHistory(Long patientId, MedicalHistoryRequest request, Long providerId) {
        MedicalHistory history = historyRepository.findByPatientId(patientId)
                .orElseThrow(() -> new RuntimeException("Medical history not found for patient: " + patientId));

        // Authorization: provider must be in providerIds
        if (!history.getProviderIds().contains(providerId)) {
            throw new RuntimeException("Provider not assigned to this patient");
        }

        // Update basic fields
        updateEntityFromRequest(history, request);

        // Handle caregiver assignments - prefer IDs over names
        if (request.getCaregiverIds() != null) {
            // Direct ID assignment (preferred method)
            history.setCaregiverIds(request.getCaregiverIds());
        } else if (request.getCaregiverNames() != null && !request.getCaregiverNames().isEmpty()) {
            // Resolve names to IDs (fallback method)
            List<Long> caregiverIds = resolveCaregiverNamesToIds(request.getCaregiverNames());
            history.setCaregiverIds(caregiverIds);
        }
        // If neither is provided, keep existing caregiverIds unchanged

        // Handle provider assignments
        if (request.getProviderIds() != null && !request.getProviderIds().isEmpty()) {
            // Merge new provider IDs with existing ones
            for (Long newProviderId : request.getProviderIds()) {
                if (!history.getProviderIds().contains(newProviderId)) {
                    history.getProviderIds().add(newProviderId);
                }
            }
        }
        // Always ensure the updating provider remains in the list
        if (!history.getProviderIds().contains(providerId)) {
            history.getProviderIds().add(providerId);
        }

        history = historyRepository.save(history);
        return mapToResponse(history);
    }

    @Transactional
    public void deleteMedicalHistory(Long patientId, Long providerId) {
        MedicalHistory history = historyRepository.findByPatientId(patientId)
                .orElseThrow(() -> new RuntimeException("Medical history not found for patient: " + patientId));

        if (!history.getProviderIds().contains(providerId)) {
            throw new RuntimeException("Provider not assigned to this patient");
        }

        for (MedicalRecordFile file : history.getFiles()) {
            deleteFileFromDisk(file.getFilePath());
        }
        historyRepository.delete(history);
    }

    public MedicalHistoryResponse getMedicalHistoryByPatientId(Long patientId, Long requesterId, String requesterRole) {
        MedicalHistory history = historyRepository.findByPatientId(patientId)
                .orElseThrow(() -> new RuntimeException("Medical history not found for patient: " + patientId));

        switch (requesterRole) {
            case "PATIENT":
                if (!history.getPatientId().equals(requesterId)) {
                    throw new RuntimeException("Access denied: You can only view your own medical history");
                }
                break;
            case "PROVIDER":
                if (!history.getProviderIds().contains(requesterId)) {
                    throw new RuntimeException("Access denied: Provider not assigned to this patient");
                }
                break;
            case "CAREGIVER":
                if (!history.getCaregiverIds().contains(requesterId)) {
                    throw new RuntimeException("Access denied: Caregiver not assigned to this patient");
                }
                break;
            default:
                throw new RuntimeException("Access denied");
        }

        return mapToResponse(history);
    }

    // ------------------- File Operations -------------------

    @Transactional
    public FileDto uploadFile(Long patientId, MultipartFile file, Long requesterId, String requesterRole) {
        MedicalHistory history = historyRepository.findByPatientId(patientId)
                .orElseThrow(() -> new RuntimeException("Medical history not found for patient: " + patientId));

        if (requesterRole.equals("PATIENT") && !history.getPatientId().equals(requesterId)) {
            throw new RuntimeException("Access denied: You can only upload files to your own medical history");
        } else if (requesterRole.equals("PROVIDER") && !history.getProviderIds().contains(requesterId)) {
            throw new RuntimeException("Access denied: Provider not assigned to this patient");
        } else if (!requesterRole.equals("PATIENT") && !requesterRole.equals("PROVIDER")) {
            throw new RuntimeException("Access denied: Only patients and providers can upload files");
        }

        String fileName = UUID.randomUUID() + "_" + file.getOriginalFilename();
        String filePath = uploadDir + patientId + "/" + fileName;
        try {
            Path path = Paths.get(filePath);
            Files.createDirectories(path.getParent());
            file.transferTo(path);
        } catch (IOException e) {
            throw new RuntimeException("Failed to store file", e);
        }

        MedicalRecordFile fileEntity = new MedicalRecordFile();
        fileEntity.setMedicalHistoryId(history.getId());
        fileEntity.setFileName(file.getOriginalFilename());
        fileEntity.setFileType(file.getContentType());
        fileEntity.setFilePath(filePath);
        fileEntity.setUploadedAt(LocalDateTime.now());

        fileEntity = fileRepository.save(fileEntity);
        return mapToFileDto(fileEntity);
    }

    public List<FileDto> getFiles(Long patientId, Long requesterId, String requesterRole) {
        MedicalHistory history = historyRepository.findByPatientId(patientId)
                .orElseThrow(() -> new RuntimeException("Medical history not found for patient: " + patientId));

        switch (requesterRole) {
            case "PATIENT":
                if (!history.getPatientId().equals(requesterId)) {
                    throw new RuntimeException("Access denied");
                }
                break;
            case "PROVIDER":
                if (!history.getProviderIds().contains(requesterId)) {
                    throw new RuntimeException("Access denied");
                }
                break;
            case "CAREGIVER":
                if (!history.getCaregiverIds().contains(requesterId)) {
                    throw new RuntimeException("Access denied");
                }
                break;
            default:
                throw new RuntimeException("Access denied");
        }

        return history.getFiles().stream()
                .map(this::mapToFileDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteFile(Long patientId, Long fileId, Long requesterId, String requesterRole) {
        MedicalHistory history = historyRepository.findByPatientId(patientId)
                .orElseThrow(() -> new RuntimeException("Medical history not found for patient: " + patientId));

        // Authorization check
        switch (requesterRole) {
            case "PATIENT":
                if (!history.getPatientId().equals(requesterId)) {
                    throw new RuntimeException("Access denied: You can only delete files from your own medical history");
                }
                break;
            case "PROVIDER":
                if (!history.getProviderIds().contains(requesterId)) {
                    throw new RuntimeException("Access denied: Provider not assigned to this patient");
                }
                break;
            default:
                throw new RuntimeException("Access denied: Only patients and providers can delete files");
        }

        // Find and delete the file
        MedicalRecordFile file = fileRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("File not found: " + fileId));

        // Verify the file belongs to this medical history
        if (!file.getMedicalHistoryId().equals(history.getId())) {
            throw new RuntimeException("File does not belong to this medical history");
        }

        // Delete from disk
        deleteFileFromDisk(file.getFilePath());

        // Delete from database
        fileRepository.delete(file);
    }

    // ------------------- Helper Methods -------------------

    private List<Long> resolveCaregiverNamesToIds(List<String> caregiverNames) {
        if (caregiverNames == null || caregiverNames.isEmpty()) {
            return new ArrayList<>();
        }
        List<Long> ids = new ArrayList<>();
        for (String name : caregiverNames) {
            // Skip empty or whitespace-only names
            if (name == null || name.trim().isEmpty()) {
                log.debug("Skipping empty caregiver name");
                continue;
            }

            try {
                UserDto user = userServiceClient.getUserByUsername(name);
                // Ensure the user has the CAREGIVER role
                if (!"CAREGIVER".equals(user.getRole())) {
                    log.warn("User {} exists but is not a caregiver, role is: {}", name, user.getRole());
                    continue;
                }
                ids.add(user.getId());
                log.debug("Successfully resolved caregiver name {} to ID {}", name, user.getId());
            } catch (Exception e) {
                log.warn("Could not resolve caregiver name '{}': {}", name, e.getMessage());
                // Don't throw exception, just skip this caregiver
                // This allows the update to proceed even if some caregivers can't be found
            }
        }
        return ids;
    }

    private MedicalHistory mapRequestToEntity(MedicalHistoryRequest req) {
        MedicalHistory history = new MedicalHistory();
        history.setPatientId(req.getPatientId());
        updateEntityFromRequest(history, req);
        return history;
    }

    private void updateEntityFromRequest(MedicalHistory history, MedicalHistoryRequest req) {
        history.setDiagnosis(req.getDiagnosis());
        history.setDiagnosisDate(req.getDiagnosisDate());
        history.setProgressionStage(req.getProgressionStage());
        history.setGeneticRisk(req.getGeneticRisk());
        history.setFamilyHistory(req.getFamilyHistory());
        history.setEnvironmentalFactors(req.getEnvironmentalFactors());
        history.setComorbidities(req.getComorbidities());
        history.setMedicationAllergies(req.getMedicationAllergies());
        history.setEnvironmentalAllergies(req.getEnvironmentalAllergies());
        history.setFoodAllergies(req.getFoodAllergies());
        history.setSurgeries(req.getSurgeries() != null ? req.getSurgeries() : new ArrayList<>());
        // Note: providerIds should NOT be updated here during updates
        // They are managed separately to preserve existing provider associations
    }

    private MedicalHistoryResponse mapToResponse(MedicalHistory history) {
        MedicalHistoryResponse resp = new MedicalHistoryResponse();
        resp.setId(history.getId());
        resp.setPatientId(history.getPatientId());

        try {
            UserDto patient = userServiceClient.getUserById(history.getPatientId());
            resp.setPatientName(patient.getFirstName() + " " + patient.getLastName());
        } catch (Exception e) {
            resp.setPatientName("Unknown");
            log.error("Failed to fetch patient name for id: {}", history.getPatientId(), e);
        }

        List<String> providerNames = new ArrayList<>();
        for (Long providerId : history.getProviderIds()) {
            try {
                UserDto provider = userServiceClient.getUserById(providerId);
                providerNames.add(provider.getFirstName() + " " + provider.getLastName());
            } catch (Exception e) {
                providerNames.add("Unknown");
                log.error("Failed to fetch provider name for id: {}", providerId, e);
            }
        }
        resp.setProviderNames(providerNames);

        List<String> caregiverNames = new ArrayList<>();
        for (Long caregiverId : history.getCaregiverIds()) {
            try {
                UserDto caregiver = userServiceClient.getUserById(caregiverId);
                caregiverNames.add(caregiver.getFirstName() + " " + caregiver.getLastName());
            } catch (Exception e) {
                caregiverNames.add("Unknown");
                log.error("Failed to fetch caregiver name for id: {}", caregiverId, e);
            }
        }
        resp.setCaregiverNames(caregiverNames);

        resp.setDiagnosis(history.getDiagnosis());
        resp.setDiagnosisDate(history.getDiagnosisDate());
        resp.setProgressionStage(history.getProgressionStage());
        resp.setGeneticRisk(history.getGeneticRisk());
        resp.setFamilyHistory(history.getFamilyHistory());
        resp.setEnvironmentalFactors(history.getEnvironmentalFactors());
        resp.setComorbidities(history.getComorbidities());
        resp.setMedicationAllergies(history.getMedicationAllergies());
        resp.setEnvironmentalAllergies(history.getEnvironmentalAllergies());
        resp.setFoodAllergies(history.getFoodAllergies());
        resp.setSurgeries(history.getSurgeries());
        resp.setProviderIds(history.getProviderIds());
        resp.setCaregiverIds(history.getCaregiverIds());
        resp.setFiles(history.getFiles().stream().map(this::mapToFileDto).collect(Collectors.toList()));
        resp.setCreatedAt(history.getCreatedAt());
        resp.setUpdatedAt(history.getUpdatedAt());

        return resp;
    }

    private FileDto mapToFileDto(MedicalRecordFile file) {
        FileDto dto = new FileDto();
        dto.setId(file.getId());
        dto.setFileName(file.getFileName());
        dto.setFileType(file.getFileType());
        dto.setFileUrl("/files/" + file.getId());
        dto.setUploadedAt(file.getUploadedAt());
        return dto;
    }

    private void deleteFileFromDisk(String filePath) {
        try {
            Files.deleteIfExists(Paths.get(filePath));
        } catch (IOException e) {
            log.error("Failed to delete file: {}", filePath, e);
        }
    }
}