package com.neuroguard.medicalhistoryservice.service;

import com.neuroguard.medicalhistoryservice.client.UserServiceClient;
import com.neuroguard.medicalhistoryservice.dto.*;
import com.neuroguard.medicalhistoryservice.entity.MedicalHistory;
import com.neuroguard.medicalhistoryservice.entity.MedicalRecordFile;
import com.neuroguard.medicalhistoryservice.repository.MedicalHistoryRepository;
import com.neuroguard.medicalhistoryservice.repository.MedicalRecordFileRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Period;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MedicalHistoryService {

    private static final Logger log = LoggerFactory.getLogger(MedicalHistoryService.class);

    private final MedicalHistoryRepository historyRepository;
    private final MedicalRecordFileRepository fileRepository;
    private final UserServiceClient userServiceClient;
    private final EmailService emailService;
    private final RabbitTemplate rabbitTemplate;

    @Autowired(required = false)
    private AzureBlobStorageService azureStorageService;


    private List<String> getRecipientEmails(MedicalHistory history) {
        List<String> emails = new ArrayList<>();
        // Patient email
        try {
            UserDto patient = userServiceClient.getUserById(history.getPatientId());
            if (patient.getEmail() != null && !patient.getEmail().isBlank()) {
                emails.add(patient.getEmail());
            }
        } catch (Exception e) {
            log.error("Failed to fetch patient email for id {}", history.getPatientId(), e);
        }
        // Caregiver emails
        for (Long caregiverId : history.getCaregiverIds()) {
            try {
                UserDto caregiver = userServiceClient.getUserById(caregiverId);
                if (caregiver.getEmail() != null && !caregiver.getEmail().isBlank()) {
                    emails.add(caregiver.getEmail());
                }
            } catch (Exception e) {
                log.error("Failed to fetch caregiver email for id {}", caregiverId, e);
            }
        }
        return emails;
    }

    // ------------------- Provider Operations -------------------
    public Page<MedicalHistoryResponse> getAllMedicalHistoriesForProvider(Long providerId, Pageable pageable) {
        Page<MedicalHistory> histories = historyRepository.findByProviderId(providerId, pageable);
        return histories.map(this::mapToResponse);
    }

    // ------------------- Caregiver Operations -------------------
    public Page<MedicalHistoryResponse> getAllMedicalHistoriesForCaregiver(Long caregiverId, Pageable pageable) {
        Page<MedicalHistory> histories = historyRepository.findByCaregiverId(caregiverId, pageable);
        return histories.map(this::mapToResponse);
    }

    @Transactional
    public MedicalHistoryResponse createMedicalHistory(MedicalHistoryRequest request, Long providerId) {
        if (historyRepository.existsByPatientId(request.getPatientId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Medical history already exists for patient: " + request.getPatientId());
        }

        MedicalHistory history = mapRequestToEntity(request);

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
        // Send email notifications
        List<String> recipients = getRecipientEmails(history);
        String subject = "New Medical History Created";
        String text = String.format(
                "A new medical history record for patient ID %d has been created.\n\n" +
                        "Diagnosis: %s\n" +
                        "Diagnosis Date: %s\n" +
                        "Progression Stage: %s\n\n" +
                        "Please log in to the system for more details.",
                history.getPatientId(),
                request.getDiagnosis(),
                request.getDiagnosisDate(),
                request.getProgressionStage()
        );
        for (String email : recipients) {
            emailService.sendNotification(email, subject, text);
        }

        // Publish async message to RabbitMQ
        try {
            java.util.Map<String, Object> message = new java.util.HashMap<>();
            message.put("patientId", history.getPatientId());
            
            org.springframework.web.context.request.ServletRequestAttributes attributes = 
                (org.springframework.web.context.request.ServletRequestAttributes) org.springframework.web.context.request.RequestContextHolder.getRequestAttributes();
            if (attributes != null) {
                String token = attributes.getRequest().getHeader("Authorization");
                if (token != null) {
                    message.put("token", token);
                }
            }
            
            rabbitTemplate.convertAndSend(
                "medical-history-exchange",
                "medical.history.created",
                message
            );
            log.info("Published medical.history.created event for patient: {}", history.getPatientId());
        } catch (Exception e) {
            log.error("Failed to publish RabbitMQ message for patient: {}", history.getPatientId(), e);
        }

        return mapToResponse(history);
    }

    @Transactional
    public MedicalHistoryResponse updateMedicalHistory(Long patientId, MedicalHistoryRequest request, Long providerId) {
        MedicalHistory history = historyRepository.findByPatientId(patientId)
                .orElseThrow(() -> new RuntimeException("Medical history not found for patient: " + patientId));

        if (!history.getProviderIds().contains(providerId)) {
            throw new RuntimeException("Provider not assigned to this patient");
        }

        updateEntityFromRequest(history, request);

        // Handle caregiver assignments - prefer IDs over names
        if (request.getCaregiverIds() != null) {
            history.setCaregiverIds(request.getCaregiverIds());
        } else if (request.getCaregiverNames() != null && !request.getCaregiverNames().isEmpty()) {
            List<Long> caregiverIds = resolveCaregiverNamesToIds(request.getCaregiverNames());
            history.setCaregiverIds(caregiverIds);
        }

        // Handle provider assignments
        if (request.getProviderIds() != null && !request.getProviderIds().isEmpty()) {
            for (Long newProviderId : request.getProviderIds()) {
                if (!history.getProviderIds().contains(newProviderId)) {
                    history.getProviderIds().add(newProviderId);
                }
            }
        }
        if (!history.getProviderIds().contains(providerId)) {
            history.getProviderIds().add(providerId);
        }

        history = historyRepository.save(history);

        List<String> recipients = getRecipientEmails(history);
        String subject = "Medical History Updated";
        String text = String.format(
                "The medical history record for patient ID %d has been updated.\n\n" +
                        "Updated information includes diagnosis, progression stage, comorbidities, etc.\n\n" +
                        "Please log in to the system for more details.",
                history.getPatientId()
        );
        for (String email : recipients) {
            emailService.sendNotification(email, subject, text);
        }

        return mapToResponse(history);
    }

    @Transactional
    public void deleteMedicalHistory(Long patientId, Long providerId) {
        MedicalHistory history = historyRepository.findByPatientId(patientId)
                .orElseThrow(() -> new RuntimeException("Medical history not found for patient: " + patientId));

        if (!history.getProviderIds().contains(providerId)) {
            throw new RuntimeException("Provider not assigned to this patient");
        }
        // Collect emails before deletion
        List<String> recipients = getRecipientEmails(history);

        for (MedicalRecordFile file : history.getFiles()) {
            deleteFileFromAzure(file.getFilePath());
        }
        historyRepository.delete(history);
        // Send email notifications
        String subject = "Medical History Deleted";
        String text = String.format(
                "The medical history record for patient ID %d has been deleted.\n\n" +
                        "If this was unexpected, please contact your healthcare provider.",
                patientId
        );
        for (String email : recipients) {
            emailService.sendNotification(email, subject, text);
        }
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

        String fileName = java.util.UUID.randomUUID() + "_" + file.getOriginalFilename();
        String blobName = patientId + "/" + fileName;
        String filePath = null;

        if (azureStorageService != null) {
            try {
                // Upload file to Azure Blob Storage
                azureStorageService.uploadFile(blobName, file.getInputStream(), file.getSize());
                log.info("File uploaded to Azure Blob Storage: {}", blobName);
                filePath = blobName;
            } catch (IllegalStateException e) {
                log.warn("Azure Storage is disabled, falling back to local file storage.");
            } catch (IOException e) {
                log.error("Failed to read file input stream", e);
                throw new RuntimeException("Failed to upload file: " + e.getMessage(), e);
            } catch (Exception e) {
                log.warn("Azure Storage upload failed, falling back to local storage: {}", e.getMessage());
            }
        }

        if (filePath == null) {
            // Local fallback
            try {
                java.nio.file.Path uploadDir = java.nio.file.Paths.get("uploads", "medical-history", String.valueOf(patientId));
                java.nio.file.Files.createDirectories(uploadDir);
                java.nio.file.Path localPath = uploadDir.resolve(fileName);
                java.nio.file.Files.copy(file.getInputStream(), localPath, java.nio.file.StandardCopyOption.REPLACE_EXISTING);
                filePath = "uploads/medical-history/" + patientId + "/" + fileName;
                log.info("File uploaded to local storage: {}", filePath);
            } catch (IOException e) {
                throw new RuntimeException("Failed to upload file locally", e);
            }
        }

        // Save metadata to database
        MedicalRecordFile fileEntity = new MedicalRecordFile();
        fileEntity.setMedicalHistoryId(history.getId());
        fileEntity.setFileName(file.getOriginalFilename());
        fileEntity.setFileType(file.getContentType());
        fileEntity.setFilePath(filePath);  // Store path
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

        MedicalRecordFile file = fileRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("File not found: " + fileId));

        if (!file.getMedicalHistoryId().equals(history.getId())) {
            throw new RuntimeException("File does not belong to this medical history");
        }

        if (file.getFilePath() != null && file.getFilePath().startsWith("uploads/")) {
            try {
                java.nio.file.Files.deleteIfExists(java.nio.file.Paths.get(file.getFilePath()));
                log.info("Deleted local file: {}", file.getFilePath());
            } catch (IOException e) {
                log.error("Failed to delete local file: {}", file.getFilePath(), e);
            }
        } else {
            deleteFileFromAzure(file.getFilePath());
        }
        fileRepository.delete(file);
    }

    // ------------------- Helper Methods -------------------

    private List<Long> resolveCaregiverNamesToIds(List<String> caregiverNames) {
        if (caregiverNames == null || caregiverNames.isEmpty()) {
            return new ArrayList<>();
        }
        List<Long> ids = new ArrayList<>();
        List<String> unresolved = new ArrayList<>();
        for (String name : caregiverNames) {
            if (name == null || name.trim().isEmpty()) {
                continue;
            }
            try {
                UserDto user = userServiceClient.getUserByUsername(name);
                if (!"CAREGIVER".equals(user.getRole())) {
                    unresolved.add(name + " (not a caregiver)");
                    continue;
                }
                ids.add(user.getId());
            } catch (Exception e) {
                unresolved.add(name);
            }
        }
        if (!unresolved.isEmpty()) {
            throw new RuntimeException("Unresolved caregivers: " + String.join(", ", unresolved));
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
        // Existing fields
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

        // New fields
        history.setMmse(req.getMmse());
        history.setFunctionalAssessment(req.getFunctionalAssessment());
        history.setAdl(req.getAdl());
        history.setMemoryComplaints(req.getMemoryComplaints());
        history.setBehavioralProblems(req.getBehavioralProblems());
        history.setSmoking(req.getSmoking());
        history.setCardiovascularDisease(req.getCardiovascularDisease());
        history.setDiabetes(req.getDiabetes());
        history.setDepression(req.getDepression());
        history.setHeadInjury(req.getHeadInjury());
        history.setHypertension(req.getHypertension());
        history.setAlcoholConsumption(req.getAlcoholConsumption());
        history.setPhysicalActivity(req.getPhysicalActivity());
        history.setDietQuality(req.getDietQuality());
        history.setSleepQuality(req.getSleepQuality());
        history.setBmi(req.getBmi());
        history.setCholesterolTotal(req.getCholesterolTotal());
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

        // Existing fields
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

        // New fields
        resp.setMmse(history.getMmse());
        resp.setFunctionalAssessment(history.getFunctionalAssessment());
        resp.setAdl(history.getAdl());
        resp.setMemoryComplaints(history.getMemoryComplaints());
        resp.setBehavioralProblems(history.getBehavioralProblems());
        resp.setSmoking(history.getSmoking());
        resp.setCardiovascularDisease(history.getCardiovascularDisease());
        resp.setDiabetes(history.getDiabetes());
        resp.setDepression(history.getDepression());
        resp.setHeadInjury(history.getHeadInjury());
        resp.setHypertension(history.getHypertension());
        resp.setAlcoholConsumption(history.getAlcoholConsumption());
        resp.setPhysicalActivity(history.getPhysicalActivity());
        resp.setDietQuality(history.getDietQuality());
        resp.setSleepQuality(history.getSleepQuality());
        resp.setBmi(history.getBmi());
        resp.setCholesterolTotal(history.getCholesterolTotal());

        return resp;
    }

    private FileDto mapToFileDto(MedicalRecordFile file) {
        FileDto dto = new FileDto();
        dto.setId(file.getId());
        dto.setFileName(file.getFileName());
        dto.setFileType(file.getFileType());

        // Generate CDN URL from blob path if Azure service is available
        if (file.getFilePath() != null && file.getFilePath().startsWith("uploads/")) {
            dto.setFileUrl("/files/" + file.getId());
        } else if (azureStorageService != null) {
            try {
                dto.setFileUrl(azureStorageService.generateFileUrl(file.getFilePath()));
            } catch (Exception e) {
                dto.setFileUrl("/files/" + file.getId());
            }
        } else {
            // Fallback to direct URL if Azure not configured
            dto.setFileUrl("/files/" + file.getId());
        }

        dto.setUploadedAt(file.getUploadedAt());
        return dto;
    }

    private void deleteFileFromAzure(String blobName) {
        if (azureStorageService == null) {
            log.debug("Azure Storage is not configured, skipping Azure deletion: {}", blobName);
            return;
        }

        try {
            azureStorageService.deleteFile(blobName);
        } catch (Exception e) {
            log.error("Failed to delete file from Azure Blob Storage: {}", blobName, e);
            // Don't throw exception - continue with database deletion
        }
    }

    // ------------------- Feature Building for ML -------------------
    public PatientFeatures buildPatientFeatures(Long patientId) {
        MedicalHistory history = historyRepository.findByPatientId(patientId)
                .orElseThrow(() -> new RuntimeException("No medical history for patient: " + patientId));

        UserDto patient = userServiceClient.getUserById(patientId);

        PatientFeatures features = new PatientFeatures();
        features.setPatientId(patientId);
        features.setAge(patient.getAge() != null ? patient.getAge() : 0);
        features.setGender(patient.getGender() != null ? patient.getGender() : "Unknown");
        features.setProgressionStage(history.getProgressionStage() != null ? history.getProgressionStage().name() : null);
        if (history.getDiagnosisDate() != null) {
            features.setYearsSinceDiagnosis(Period.between(history.getDiagnosisDate(), LocalDate.now()).getYears());
        } else {
            features.setYearsSinceDiagnosis(0);
        }
        features.setComorbidityCount(countCommaItems(history.getComorbidities()));
        features.setAllergyCount(
                countCommaItems(history.getMedicationAllergies()) +
                        countCommaItems(history.getEnvironmentalAllergies()) +
                        countCommaItems(history.getFoodAllergies())
        );
        features.setHasGeneticRisk(history.getGeneticRisk() != null && !history.getGeneticRisk().isBlank());
        features.setHasFamilyHistory(history.getFamilyHistory() != null && !history.getFamilyHistory().isBlank());
        features.setSurgeryCount(history.getSurgeries() != null ? history.getSurgeries().size() : 0);
        features.setCaregiverCount(history.getCaregiverIds() != null ? history.getCaregiverIds().size() : 0);
        features.setProviderCount(history.getProviderIds() != null ? history.getProviderIds().size() : 0);

        // New fields
        features.setMmse(history.getMmse());
        features.setFunctionalAssessment(history.getFunctionalAssessment());
        features.setAdl(history.getAdl());
        features.setMemoryComplaints(history.getMemoryComplaints());
        features.setBehavioralProblems(history.getBehavioralProblems());
        features.setSmoking(history.getSmoking());
        features.setCardiovascularDisease(history.getCardiovascularDisease());
        features.setDiabetes(history.getDiabetes());
        features.setDepression(history.getDepression());
        features.setHeadInjury(history.getHeadInjury());
        features.setHypertension(history.getHypertension());
        features.setAlcoholConsumption(history.getAlcoholConsumption());
        features.setPhysicalActivity(history.getPhysicalActivity());
        features.setDietQuality(history.getDietQuality());
        features.setSleepQuality(history.getSleepQuality());
        features.setBmi(history.getBmi());
        features.setCholesterolTotal(history.getCholesterolTotal());

        return features;
    }

    private int countCommaItems(String field) {
        if (field == null || field.isBlank()) return 0;
        return field.split(",").length;
    }

    // ------------------- File Access Check -------------------
    public boolean canAccessFile(Long fileId, Long userId, String role) {
        MedicalRecordFile file = fileRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("File not found: " + fileId));
        MedicalHistory history = historyRepository.findById(file.getMedicalHistoryId())
                .orElseThrow(() -> new RuntimeException("Medical history not found for file"));
        switch (role) {
            case "PATIENT":
                return history.getPatientId().equals(userId);
            case "PROVIDER":
                return history.getProviderIds().contains(userId);
            case "CAREGIVER":
                return history.getCaregiverIds().contains(userId);
            default:
                return false;
        }
    }
}