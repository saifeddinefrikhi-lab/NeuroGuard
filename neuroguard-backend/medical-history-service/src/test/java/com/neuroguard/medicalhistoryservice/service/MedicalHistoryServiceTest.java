package com.neuroguard.medicalhistoryservice.service;

import com.neuroguard.medicalhistoryservice.client.UserServiceClient;
import com.neuroguard.medicalhistoryservice.dto.*;
import com.neuroguard.medicalhistoryservice.entity.MedicalHistory;
import com.neuroguard.medicalhistoryservice.entity.MedicalRecordFile;
import com.neuroguard.medicalhistoryservice.entity.ProgressionStage;
import com.neuroguard.medicalhistoryservice.repository.MedicalHistoryRepository;
import com.neuroguard.medicalhistoryservice.repository.MedicalRecordFileRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Medical History Service Tests")
class MedicalHistoryServiceTest {

    @Mock
    private MedicalHistoryRepository historyRepository;

    @Mock
    private MedicalRecordFileRepository fileRepository;

    @Mock
    private UserServiceClient userServiceClient;

    @Mock
    private EmailService emailService;

    @InjectMocks
    private MedicalHistoryService medicalHistoryService;

    private MedicalHistory testMedicalHistory;
    private MedicalHistoryRequest testRequest;
    private UserDto testPatient;
    private UserDto testProvider;
    private UserDto testCaregiver;

    @BeforeEach
    void setUp() {
        // Initialize test data
        testPatient = new UserDto();
        testPatient.setId(1L);
        testPatient.setFirstName("John");
        testPatient.setLastName("Doe");
        testPatient.setEmail("john@example.com");
        testPatient.setRole("PATIENT");
        testPatient.setAge(65);
        testPatient.setGender("Male");

        testProvider = new UserDto();
        testProvider.setId(2L);
        testProvider.setFirstName("Dr.");
        testProvider.setLastName("Smith");
        testProvider.setEmail("doctor@example.com");
        testProvider.setRole("PROVIDER");

        testCaregiver = new UserDto();
        testCaregiver.setId(3L);
        testCaregiver.setFirstName("Jane");
        testCaregiver.setLastName("Care");
        testCaregiver.setEmail("caregiver@example.com");
        testCaregiver.setRole("CAREGIVER");

        testRequest = new MedicalHistoryRequest();
        testRequest.setPatientId(1L);
        testRequest.setDiagnosis("Alzheimer's Disease");
        testRequest.setDiagnosisDate(LocalDate.of(2020, 1, 1));
        testRequest.setProgressionStage(ProgressionStage.MILD);
        testRequest.setGeneticRisk("High");
        testRequest.setFamilyHistory("Grandmother had Alzheimer's");
        testRequest.setEnvironmentalFactors("Low education level");
        testRequest.setComorbidities("Hypertension, Diabetes");
        testRequest.setMedicationAllergies("Penicillin");
        testRequest.setEnvironmentalAllergies("Pollen");
        testRequest.setFoodAllergies("Nuts");
        testRequest.setCaregiverIds(Arrays.asList(3L));
        testRequest.setMmse(25);
        testRequest.setFunctionalAssessment(20);
        testRequest.setAdl(15);
        testRequest.setMemoryComplaints(true);
        testRequest.setBehavioralProblems(false);
        testRequest.setSmoking(false);
        testRequest.setDiabetes(true);

        testMedicalHistory = new MedicalHistory();
        testMedicalHistory.setId(1L);
        testMedicalHistory.setPatientId(1L);
        testMedicalHistory.setDiagnosis("Alzheimer's Disease");
        testMedicalHistory.setDiagnosisDate(LocalDate.of(2020, 1, 1));
        testMedicalHistory.setProgressionStage(ProgressionStage.MILD);
        testMedicalHistory.setProviderIds(Arrays.asList(2L));
        testMedicalHistory.setCaregiverIds(Arrays.asList(3L));
        testMedicalHistory.setFiles(new ArrayList<>());
        testMedicalHistory.setCreatedAt(LocalDateTime.now());
        testMedicalHistory.setUpdatedAt(LocalDateTime.now());
        testMedicalHistory.setMmse(25);
        testMedicalHistory.setFunctionalAssessment(20);
        testMedicalHistory.setAdl(15);
    }

    @Test
    @DisplayName("Should create medical history successfully")
    void testCreateMedicalHistory_Success() {
        when(historyRepository.existsByPatientId(testRequest.getPatientId())).thenReturn(false);
        when(historyRepository.save(any(MedicalHistory.class))).thenReturn(testMedicalHistory);
        when(userServiceClient.getUserById(1L)).thenReturn(testPatient);
        when(userServiceClient.getUserById(2L)).thenReturn(testProvider);
        when(userServiceClient.getUserById(3L)).thenReturn(testCaregiver);

        MedicalHistoryResponse response = medicalHistoryService.createMedicalHistory(testRequest, 2L);

        assertNotNull(response);
        assertEquals(1L, response.getPatientId());
        assertEquals("Alzheimer's Disease", response.getDiagnosis());
        assertEquals(ProgressionStage.MILD, response.getProgressionStage());
        verify(historyRepository, times(1)).save(any(MedicalHistory.class));
        verify(emailService, times(2)).sendNotification(anyString(), anyString(), anyString());
    }

    @Test
    @DisplayName("Should throw exception when creating duplicate medical history")
    void testCreateMedicalHistory_DuplicateThrowsException() {
        when(historyRepository.existsByPatientId(testRequest.getPatientId())).thenReturn(true);

        RuntimeException exception = assertThrows(RuntimeException.class, () ->
            medicalHistoryService.createMedicalHistory(testRequest, 2L)
        );

        assertTrue(exception.getMessage().contains("Medical history already exists"));
        verify(historyRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should update medical history successfully")
    void testUpdateMedicalHistory_Success() {
        Long patientId = 1L;
        Long providerId = 2L;

        when(historyRepository.findByPatientId(patientId)).thenReturn(Optional.of(testMedicalHistory));
        when(historyRepository.save(any(MedicalHistory.class))).thenReturn(testMedicalHistory);
        when(userServiceClient.getUserById(1L)).thenReturn(testPatient);
        when(userServiceClient.getUserById(2L)).thenReturn(testProvider);
        when(userServiceClient.getUserById(3L)).thenReturn(testCaregiver);

        MedicalHistoryResponse response = medicalHistoryService.updateMedicalHistory(patientId, testRequest, providerId);

        assertNotNull(response);
        assertEquals("Alzheimer's Disease", response.getDiagnosis());
        verify(historyRepository, times(1)).save(any(MedicalHistory.class));
        verify(emailService, times(2)).sendNotification(anyString(), anyString(), anyString());
    }

    @Test
    @DisplayName("Should throw exception when updating non-existent medical history")
    void testUpdateMedicalHistory_NotFoundThrowsException() {
        when(historyRepository.findByPatientId(anyLong())).thenReturn(Optional.empty());

        RuntimeException exception = assertThrows(RuntimeException.class, () ->
            medicalHistoryService.updateMedicalHistory(1L, testRequest, 2L)
        );

        assertTrue(exception.getMessage().contains("Medical history not found"));
    }

    @Test
    @DisplayName("Should throw exception when provider not assigned to patient")
    void testUpdateMedicalHistory_UnauthorizedProviderThrowsException() {
        testMedicalHistory.setProviderIds(Arrays.asList(999L)); // Different provider

        when(historyRepository.findByPatientId(1L)).thenReturn(Optional.of(testMedicalHistory));

        RuntimeException exception = assertThrows(RuntimeException.class, () ->
            medicalHistoryService.updateMedicalHistory(1L, testRequest, 2L)
        );

        assertTrue(exception.getMessage().contains("Provider not assigned"));
    }

    @Test
    @DisplayName("Should delete medical history successfully")
    void testDeleteMedicalHistory_Success() {
        Long patientId = 1L;
        Long providerId = 2L;

        when(historyRepository.findByPatientId(patientId)).thenReturn(Optional.of(testMedicalHistory));
        when(userServiceClient.getUserById(1L)).thenReturn(testPatient);
        when(userServiceClient.getUserById(3L)).thenReturn(testCaregiver);

        medicalHistoryService.deleteMedicalHistory(patientId, providerId);

        verify(historyRepository, times(1)).delete(testMedicalHistory);
        verify(emailService, times(2)).sendNotification(anyString(), anyString(), anyString());
    }

    @Test
    @DisplayName("Should throw exception when provider not authorized to delete")
    void testDeleteMedicalHistory_UnauthorizedProviderThrowsException() {
        testMedicalHistory.setProviderIds(Arrays.asList(999L)); // Different provider

        when(historyRepository.findByPatientId(1L)).thenReturn(Optional.of(testMedicalHistory));

        RuntimeException exception = assertThrows(RuntimeException.class, () ->
            medicalHistoryService.deleteMedicalHistory(1L, 2L)
        );

        assertTrue(exception.getMessage().contains("Provider not assigned"));
    }

    @Test
    @DisplayName("Should get all medical histories for provider")
    void testGetAllMedicalHistoriesForProvider() {
        List<MedicalHistory> histories = Arrays.asList(testMedicalHistory);
        Page<MedicalHistory> page = new PageImpl<>(histories);
        Pageable pageable = PageRequest.of(0, 20);

        when(historyRepository.findByProviderId(2L, pageable)).thenReturn(page);
        when(userServiceClient.getUserById(1L)).thenReturn(testPatient);
        when(userServiceClient.getUserById(2L)).thenReturn(testProvider);
        when(userServiceClient.getUserById(3L)).thenReturn(testCaregiver);

        Page<MedicalHistoryResponse> response = medicalHistoryService.getAllMedicalHistoriesForProvider(2L, pageable);

        assertNotNull(response);
        assertEquals(1, response.getContent().size());
        assertEquals("Alzheimer's Disease", response.getContent().get(0).getDiagnosis());
    }

    @Test
    @DisplayName("Should get all medical histories for caregiver")
    void testGetAllMedicalHistoriesForCaregiver() {
        List<MedicalHistory> histories = Arrays.asList(testMedicalHistory);
        Page<MedicalHistory> page = new PageImpl<>(histories);
        Pageable pageable = PageRequest.of(0, 20);

        when(historyRepository.findByCaregiverId(3L, pageable)).thenReturn(page);
        when(userServiceClient.getUserById(1L)).thenReturn(testPatient);
        when(userServiceClient.getUserById(2L)).thenReturn(testProvider);
        when(userServiceClient.getUserById(3L)).thenReturn(testCaregiver);

        Page<MedicalHistoryResponse> response = medicalHistoryService.getAllMedicalHistoriesForCaregiver(3L, pageable);

        assertNotNull(response);
        assertEquals(1, response.getContent().size());
    }

    @Test
    @DisplayName("Should get medical history by patient ID for patient")
    void testGetMedicalHistoryByPatientId_PatientRole() {
        when(historyRepository.findByPatientId(1L)).thenReturn(Optional.of(testMedicalHistory));
        when(userServiceClient.getUserById(1L)).thenReturn(testPatient);
        when(userServiceClient.getUserById(2L)).thenReturn(testProvider);
        when(userServiceClient.getUserById(3L)).thenReturn(testCaregiver);

        MedicalHistoryResponse response = medicalHistoryService.getMedicalHistoryByPatientId(1L, 1L, "PATIENT");

        assertNotNull(response);
        assertEquals(1L, response.getPatientId());
    }

    @Test
    @DisplayName("Should throw exception when patient accesses other patient's history")
    void testGetMedicalHistoryByPatientId_PatientAccessDenied() {
        when(historyRepository.findByPatientId(1L)).thenReturn(Optional.of(testMedicalHistory));

        RuntimeException exception = assertThrows(RuntimeException.class, () ->
            medicalHistoryService.getMedicalHistoryByPatientId(1L, 999L, "PATIENT")
        );

        assertTrue(exception.getMessage().contains("Access denied"));
    }

    @Test
    @DisplayName("Should throw exception when provider not authorized to view")
    void testGetMedicalHistoryByPatientId_ProviderAccessDenied() {
        testMedicalHistory.setProviderIds(Arrays.asList(999L)); // Different provider

        when(historyRepository.findByPatientId(1L)).thenReturn(Optional.of(testMedicalHistory));

        RuntimeException exception = assertThrows(RuntimeException.class, () ->
            medicalHistoryService.getMedicalHistoryByPatientId(1L, 2L, "PROVIDER")
        );

        assertTrue(exception.getMessage().contains("Access denied"));
    }

    @Test
    @DisplayName("Should throw exception when caregiver not authorized to view")
    void testGetMedicalHistoryByPatientId_CaregiverAccessDenied() {
        testMedicalHistory.setCaregiverIds(Arrays.asList(999L)); // Different caregiver

        when(historyRepository.findByPatientId(1L)).thenReturn(Optional.of(testMedicalHistory));

        RuntimeException exception = assertThrows(RuntimeException.class, () ->
            medicalHistoryService.getMedicalHistoryByPatientId(1L, 3L, "CAREGIVER")
        );

        assertTrue(exception.getMessage().contains("Access denied"));
    }

    @Test
    @DisplayName("Should get files for medical history")
    void testGetFiles_Success() {
        MedicalRecordFile file = new MedicalRecordFile();
        file.setId(1L);
        file.setFileName("test.pdf");
        file.setFileType("application/pdf");
        file.setMedicalHistoryId(1L);
        file.setFilePath("1/uuid_test.pdf");
        file.setUploadedAt(LocalDateTime.now());

        testMedicalHistory.setFiles(Arrays.asList(file));

        when(historyRepository.findByPatientId(1L)).thenReturn(Optional.of(testMedicalHistory));

        List<FileDto> files = medicalHistoryService.getFiles(1L, 1L, "PATIENT");

        assertNotNull(files);
        assertEquals(1, files.size());
        assertEquals("test.pdf", files.get(0).getFileName());
    }

    @Test
    @DisplayName("Should throw exception when accessing files without permission")
    void testGetFiles_UnauthorizedThrowsException() {
        testMedicalHistory.setProviderIds(Arrays.asList(999L));

        when(historyRepository.findByPatientId(1L)).thenReturn(Optional.of(testMedicalHistory));

        RuntimeException exception = assertThrows(RuntimeException.class, () ->
            medicalHistoryService.getFiles(1L, 2L, "PROVIDER")
        );

        assertTrue(exception.getMessage().contains("Access denied"));
    }

    @Test
    @DisplayName("Should check file access correctly")
    void testCanAccessFile_Success() {
        MedicalRecordFile file = new MedicalRecordFile();
        file.setId(1L);
        file.setMedicalHistoryId(1L);

        when(fileRepository.findById(1L)).thenReturn(Optional.of(file));
        when(historyRepository.findById(1L)).thenReturn(Optional.of(testMedicalHistory));

        boolean canAccess = medicalHistoryService.canAccessFile(1L, 1L, "PATIENT");

        assertTrue(canAccess);
    }

    @Test
    @DisplayName("Should deny file access for unauthorized user")
    void testCanAccessFile_AccessDenied() {
        MedicalRecordFile file = new MedicalRecordFile();
        file.setId(1L);
        file.setMedicalHistoryId(1L);

        when(fileRepository.findById(1L)).thenReturn(Optional.of(file));
        when(historyRepository.findById(1L)).thenReturn(Optional.of(testMedicalHistory));

        boolean canAccess = medicalHistoryService.canAccessFile(1L, 999L, "PATIENT");

        assertFalse(canAccess);
    }

    @Test
    @DisplayName("Should build patient features successfully")
    void testBuildPatientFeatures() {
        when(historyRepository.findByPatientId(1L)).thenReturn(Optional.of(testMedicalHistory));
        when(userServiceClient.getUserById(1L)).thenReturn(testPatient);

        PatientFeatures features = medicalHistoryService.buildPatientFeatures(1L);

        assertNotNull(features);
        assertEquals(1L, features.getPatientId());
        assertEquals(65, features.getAge());
        assertEquals("Male", features.getGender());
        assertEquals(ProgressionStage.MILD.name(), features.getProgressionStage());
        assertEquals(25, features.getMmse());
        assertEquals(20, features.getFunctionalAssessment());
        assertEquals(15, features.getAdl());
    }

    @Test
    @DisplayName("Should throw exception when building features for non-existent patient")
    void testBuildPatientFeatures_NotFoundThrowsException() {
        when(historyRepository.findByPatientId(999L)).thenReturn(Optional.empty());

        RuntimeException exception = assertThrows(RuntimeException.class, () ->
            medicalHistoryService.buildPatientFeatures(999L)
        );

        assertTrue(exception.getMessage().contains("No medical history"));
    }

    @Test
    @DisplayName("Should count comma-separated items correctly")
    void testCountCommaItems() {
        // Testing through buildPatientFeatures which uses countCommaItems internally
        testMedicalHistory.setComorbidities("Hypertension, Diabetes, Heart Disease");
        testMedicalHistory.setMedicationAllergies("Penicillin, Aspirin");

        when(historyRepository.findByPatientId(1L)).thenReturn(Optional.of(testMedicalHistory));
        when(userServiceClient.getUserById(1L)).thenReturn(testPatient);

        PatientFeatures features = medicalHistoryService.buildPatientFeatures(1L);

        assertEquals(3, features.getComorbidityCount());
        assertEquals(2, features.getAllergyCount());
    }

    @Test
    @DisplayName("Should resolve caregiver names to IDs successfully")
    void testResolveCaregiverNamesToIds() {
        testRequest.setCaregiverNames(Arrays.asList("jane_care"));
        testRequest.setCaregiverIds(null);

        when(historyRepository.existsByPatientId(1L)).thenReturn(false);
        when(userServiceClient.getUserByUsername("jane_care")).thenReturn(testCaregiver);
        when(historyRepository.save(any(MedicalHistory.class))).thenReturn(testMedicalHistory);
        when(userServiceClient.getUserById(1L)).thenReturn(testPatient);
        when(userServiceClient.getUserById(2L)).thenReturn(testProvider);
        when(userServiceClient.getUserById(3L)).thenReturn(testCaregiver);

        MedicalHistoryResponse response = medicalHistoryService.createMedicalHistory(testRequest, 2L);

        assertNotNull(response);
        verify(userServiceClient).getUserByUsername("jane_care");
    }

    @Test
    @DisplayName("Should throw exception when resolving non-existent caregiver name")
    void testResolveCaregiverNamesToIds_NonExistentThrowsException() {
        testRequest.setCaregiverNames(Arrays.asList("nonexistent_caregiver"));
        testRequest.setCaregiverIds(null);

        when(userServiceClient.getUserByUsername("nonexistent_caregiver"))
            .thenThrow(new RuntimeException("User not found"));

        RuntimeException exception = assertThrows(RuntimeException.class, () ->
            medicalHistoryService.createMedicalHistory(testRequest, 2L)
        );

        assertTrue(exception.getMessage().contains("Unresolved caregivers"));
    }
}
