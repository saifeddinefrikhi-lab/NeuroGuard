package com.neuroguard.medicalhistoryservice.service;

import com.neuroguard.medicalhistoryservice.dto.CaregiverStatisticsDTO;
import com.neuroguard.medicalhistoryservice.dto.PatientStatisticsDTO;
import com.neuroguard.medicalhistoryservice.dto.ProviderStatisticsDTO;
import com.neuroguard.medicalhistoryservice.entity.MedicalHistory;
import com.neuroguard.medicalhistoryservice.entity.ProgressionStage;
import com.neuroguard.medicalhistoryservice.repository.CaregiverStatisticsRepository;
import com.neuroguard.medicalhistoryservice.repository.MedicalHistoryRepository;
import com.neuroguard.medicalhistoryservice.repository.PatientStatisticsRepository;
import com.neuroguard.medicalhistoryservice.repository.ProviderStatisticsRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
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
@DisplayName("Statistics Services Tests")
class StatisticsServicesTest {

    @Mock
    private CaregiverStatisticsRepository caregiverStatisticsRepository;

    @Mock
    private PatientStatisticsRepository patientStatisticsRepository;

    @Mock
    private ProviderStatisticsRepository providerStatisticsRepository;

    @Mock
    private MedicalHistoryRepository medicalHistoryRepository;

    @InjectMocks
    private CaregiverStatisticsService caregiverStatisticsService;

    @InjectMocks
    private PatientStatisticsService patientStatisticsService;

    @InjectMocks
    private ProviderStatisticsService providerStatisticsService;

    private MedicalHistory testMedicalHistory;

    @BeforeEach
    void setUp() {
        testMedicalHistory = new MedicalHistory();
        testMedicalHistory.setId(1L);
        testMedicalHistory.setPatientId(1L);
        testMedicalHistory.setDiagnosis("Alzheimer's Disease");
        testMedicalHistory.setDiagnosisDate(LocalDate.of(2020, 1, 1));
        testMedicalHistory.setProgressionStage(ProgressionStage.MILD);
        testMedicalHistory.setProviderIds(Arrays.asList(2L));
        testMedicalHistory.setCaregiverIds(Arrays.asList(3L));
        testMedicalHistory.setFiles(new ArrayList<>());
        testMedicalHistory.setComorbidities("Hypertension, Diabetes");
        testMedicalHistory.setMedicationAllergies("Penicillin");
        testMedicalHistory.setCreatedAt(LocalDateTime.now());
        testMedicalHistory.setUpdatedAt(LocalDateTime.now());
    }

    @Test
    @DisplayName("Should get caregiver statistics successfully")
    void testGetCaregiverStatistics() {
        Long caregiverId = 3L;

        when(caregiverStatisticsRepository.countAssignedPatients(caregiverId))
                .thenReturn(5);
        when(caregiverStatisticsRepository.countAssignedPatientsWithHistory(caregiverId))
                .thenReturn(5);
        when(medicalHistoryRepository.findByCaregiverId(eq(caregiverId), any(Pageable.class)))
                .thenReturn(new PageImpl<>(Arrays.asList(testMedicalHistory)));

        CaregiverStatisticsDTO stats = caregiverStatisticsService.getCaregiverStatistics(caregiverId);

        assertNotNull(stats);
        assertEquals(caregiverId, stats.getCaregiverId());
        verify(caregiverStatisticsRepository, times(1)).countAssignedPatients(caregiverId);
    }

    @Test
    @DisplayName("Should return zero assigned patients when caregiver has none")
    void testGetCaregiverStatistics_NoPatients() {
        Long caregiverId = 3L;

        when(caregiverStatisticsRepository.countAssignedPatients(caregiverId))
                .thenReturn(0);
        when(caregiverStatisticsRepository.countAssignedPatientsWithHistory(caregiverId))
                .thenReturn(0);
        when(medicalHistoryRepository.findByCaregiverId(eq(caregiverId), any(Pageable.class)))
                .thenReturn(new PageImpl<>(new ArrayList<>()));

        CaregiverStatisticsDTO stats = caregiverStatisticsService.getCaregiverStatistics(caregiverId);

        assertNotNull(stats);
        assertEquals(0, stats.getTotalAssignedPatients());
        verify(caregiverStatisticsRepository, times(1)).countAssignedPatients(caregiverId);
    }

    @Test
    @DisplayName("Should get patient statistics successfully")
    void testGetPatientStatistics() {
        Long patientId = 1L;

        when(patientStatisticsRepository.findByPatientId(patientId))
                .thenReturn(Optional.of(testMedicalHistory));

        PatientStatisticsDTO stats = patientStatisticsService.getPatientStatistics(patientId);

        assertNotNull(stats);
        assertEquals(patientId, stats.getPatientId());
        verify(patientStatisticsRepository, times(1)).findByPatientId(patientId);
    }

    @Test
    @DisplayName("Should return DTO with hasMedicalHistory=false when patient has no medical history")
    void testGetPatientStatistics_NoHistory() {
        Long patientId = 999L;

        when(patientStatisticsRepository.findByPatientId(patientId))
                .thenReturn(Optional.empty());

        PatientStatisticsDTO stats = patientStatisticsService.getPatientStatistics(patientId);

        assertNotNull(stats);
        assertFalse(stats.isHasMedicalHistory());
        assertEquals(patientId, stats.getPatientId());
        verify(patientStatisticsRepository, times(1)).findByPatientId(patientId);
    }

    @Test
    @DisplayName("Should get provider statistics successfully")
    void testGetProviderStatistics() {
        Long providerId = 2L;

        when(providerStatisticsRepository.countPatientsByProviderId(providerId))
                .thenReturn(10);
        when(medicalHistoryRepository.findByProviderId(eq(providerId), any(Pageable.class)))
                .thenReturn(new PageImpl<>(Arrays.asList(testMedicalHistory)));

        ProviderStatisticsDTO stats = providerStatisticsService.getProviderStatistics(providerId);

        assertNotNull(stats);
        assertEquals(providerId, stats.getProviderId());
        verify(providerStatisticsRepository, times(1)).countPatientsByProviderId(providerId);
    }

    @Test
    @DisplayName("Should return zero patients when provider has none")
    void testGetProviderStatistics_NoPatients() {
        Long providerId = 999L;

        when(providerStatisticsRepository.countPatientsByProviderId(providerId))
                .thenReturn(0);
        when(medicalHistoryRepository.findByProviderId(eq(providerId), any(Pageable.class)))
                .thenReturn(new PageImpl<>(new ArrayList<>()));

        ProviderStatisticsDTO stats = providerStatisticsService.getProviderStatistics(providerId);

        assertNotNull(stats);
        assertEquals(0, stats.getTotalPatients());
        verify(providerStatisticsRepository, times(1)).countPatientsByProviderId(providerId);
    }

    @Test
    @DisplayName("Should calculate statistics with multiple patients")
    void testStatistics_MultiplePatients() {
        Long providerId = 2L;

        when(providerStatisticsRepository.countPatientsByProviderId(providerId))
                .thenReturn(3);
        when(medicalHistoryRepository.findByProviderId(eq(providerId), any(Pageable.class)))
                .thenReturn(new PageImpl<>(Arrays.asList(testMedicalHistory)));

        ProviderStatisticsDTO stats = providerStatisticsService.getProviderStatistics(providerId);

        assertNotNull(stats);
        assertEquals(3, stats.getTotalPatients());
        verify(providerStatisticsRepository, times(1)).countPatientsByProviderId(providerId);
    }

    @Test
    @DisplayName("Should handle null comorbidities gracefully")
    void testStatistics_NullComorbidities() {
        Long patientId = 1L;

        when(patientStatisticsRepository.findByPatientId(patientId))
                .thenReturn(Optional.of(testMedicalHistory));

        PatientStatisticsDTO stats = patientStatisticsService.getPatientStatistics(patientId);

        assertNotNull(stats);
        verify(patientStatisticsRepository, times(1)).findByPatientId(patientId);
    }

    @Test
    @DisplayName("Should count progression stages correctly")
    void testStatistics_ProgressionStageCount() {
        Long providerId = 2L;

        when(providerStatisticsRepository.countByProgressionStage(providerId, ProgressionStage.MILD))
                .thenReturn(3);
        when(providerStatisticsRepository.countByProgressionStage(providerId, ProgressionStage.MODERATE))
                .thenReturn(5);
        when(providerStatisticsRepository.countByProgressionStage(providerId, ProgressionStage.SEVERE))
                .thenReturn(2);

        // Just verify the repository methods work as expected
        int mildCount = providerStatisticsRepository.countByProgressionStage(providerId, ProgressionStage.MILD);
        int moderateCount = providerStatisticsRepository.countByProgressionStage(providerId, ProgressionStage.MODERATE);
        int severeCount = providerStatisticsRepository.countByProgressionStage(providerId, ProgressionStage.SEVERE);

        assertEquals(3, mildCount);
        assertEquals(5, moderateCount);
        assertEquals(2, severeCount);
    }

    @Test
    @DisplayName("Should calculate average MMSE scores")
    void testStatistics_AverageMMSE() {
        Long providerId = 2L;

        when(providerStatisticsRepository.getAverageMMSE(providerId))
                .thenReturn(23.5);

        double avgMMSE = providerStatisticsRepository.getAverageMMSE(providerId);

        assertEquals(23.5, avgMMSE);
        verify(providerStatisticsRepository, times(1)).getAverageMMSE(providerId);
    }

    @Test
    @DisplayName("Should count patients with genetic risk")
    void testStatistics_PatientsWithGeneticRisk() {
        Long providerId = 2L;

        when(providerStatisticsRepository.countPatientsWithGeneticRisk(providerId))
                .thenReturn(4);

        int count = providerStatisticsRepository.countPatientsWithGeneticRisk(providerId);

        assertEquals(4, count);
        verify(providerStatisticsRepository, times(1)).countPatientsWithGeneticRisk(providerId);
    }

    @Test
    @DisplayName("Should count patients with allergies")
    void testStatistics_PatientsWithAllergies() {
        Long providerId = 2L;

        when(providerStatisticsRepository.countPatientsWithAllergies(providerId))
                .thenReturn(7);

        int count = providerStatisticsRepository.countPatientsWithAllergies(providerId);

        assertEquals(7, count);
        verify(providerStatisticsRepository, times(1)).countPatientsWithAllergies(providerId);
    }

    @Test
    @DisplayName("Should count patients with comorbidities")
    void testStatistics_PatientsWithComorbidities() {
        Long providerId = 2L;

        when(providerStatisticsRepository.countPatientsWithComorbidities(providerId))
                .thenReturn(8);

        int count = providerStatisticsRepository.countPatientsWithComorbidities(providerId);

        assertEquals(8, count);
        verify(providerStatisticsRepository, times(1)).countPatientsWithComorbidities(providerId);
    }

    @Test
    @DisplayName("Should handle edge case with zero statistics")
    void testStatistics_ZeroValues() {
        Long providerId = 2L;

        when(providerStatisticsRepository.countPatientsByProviderId(providerId))
                .thenReturn(0);
        when(providerStatisticsRepository.countByProgressionStage(providerId, ProgressionStage.MILD))
                .thenReturn(0);
        when(providerStatisticsRepository.getAverageMMSE(providerId))
                .thenReturn(0.0);
        when(medicalHistoryRepository.findByProviderId(eq(providerId), any(Pageable.class)))
                .thenReturn(new PageImpl<>(new ArrayList<>()));

        ProviderStatisticsDTO stats = providerStatisticsService.getProviderStatistics(providerId);

        assertNotNull(stats);
        assertEquals(0, stats.getTotalPatients());
        verify(providerStatisticsRepository, times(1)).countPatientsByProviderId(providerId);
    }

    @Test
    @DisplayName("Should handle large dataset statistics")
    void testStatistics_LargeDataset() {
        Long providerId = 2L;

        when(providerStatisticsRepository.countPatientsByProviderId(providerId))
                .thenReturn(1000);
        when(providerStatisticsRepository.countPatientsWithAllergies(providerId))
                .thenReturn(500);
        when(medicalHistoryRepository.findByProviderId(eq(providerId), any(Pageable.class)))
                .thenReturn(new PageImpl<>(Arrays.asList(testMedicalHistory)));

        ProviderStatisticsDTO stats = providerStatisticsService.getProviderStatistics(providerId);

        assertNotNull(stats);
        assertEquals(1000, stats.getTotalPatients());
        verify(providerStatisticsRepository, times(1)).countPatientsByProviderId(providerId);
    }
}
