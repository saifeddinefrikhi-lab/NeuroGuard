package tn.neuroguard.medicalhistoryservice.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import tn.neuroguard.medicalhistoryservice.dto.DiseaseDTO;
import tn.neuroguard.medicalhistoryservice.entity.Disease;
import tn.neuroguard.medicalhistoryservice.entity.MedicalRecord;
import tn.neuroguard.medicalhistoryservice.mapper.DiseaseMapper;
import tn.neuroguard.medicalhistoryservice.repository.DiseaseRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class DiseaseService {

    @Autowired
    private DiseaseRepository diseaseRepository;

    @Autowired
    private DiseaseMapper diseaseMapper;

    @Autowired
    private MedicalRecordService medicalRecordService;

    public DiseaseDTO addDiseaseToMedicalRecord(Long medicalRecordId, DiseaseDTO diseaseDTO) {
        MedicalRecord medicalRecord = medicalRecordService.findMedicalRecordById(medicalRecordId);
        Disease disease = diseaseMapper.toEntity(diseaseDTO);
        disease.setMedicalRecord(medicalRecord);
        disease.setDiagnosedAt(LocalDateTime.now());
        disease = diseaseRepository.save(disease);
        return diseaseMapper.toDto(disease);
    }

    public List<DiseaseDTO> getDiseasesByMedicalRecord(Long medicalRecordId) {
        List<Disease> diseases = diseaseRepository.findByMedicalRecordId(medicalRecordId);
        return diseases.stream().map(diseaseMapper::toDto).collect(Collectors.toList());
    }

    public DiseaseDTO updateDisease(Long id, DiseaseDTO diseaseDTO) {
        Disease existingDisease = diseaseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Disease not found"));

        existingDisease.setName(diseaseDTO.getName());
        existingDisease.setDescription(diseaseDTO.getDescription());
        existingDisease.setDiagnosedAt(diseaseDTO.getDiagnosedAt());

        existingDisease = diseaseRepository.save(existingDisease);
        return diseaseMapper.toDto(existingDisease);
    }

    public void deleteDisease(Long id) {
        Disease existingDisease = diseaseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Disease not found"));
        diseaseRepository.delete(existingDisease);
    }
}
