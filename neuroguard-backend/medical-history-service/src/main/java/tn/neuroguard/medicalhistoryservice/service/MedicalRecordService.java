package tn.neuroguard.medicalhistoryservice.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import tn.neuroguard.medicalhistoryservice.dto.MedicalRecordDTO;
import tn.neuroguard.medicalhistoryservice.entity.MedicalRecord;
import tn.neuroguard.medicalhistoryservice.mapper.MedicalRecordMapper;
import tn.neuroguard.medicalhistoryservice.repository.MedicalRecordRepository;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class MedicalRecordService {

    @Autowired
    private MedicalRecordRepository medicalRecordRepository;

    @Autowired
    private MedicalRecordMapper medicalRecordMapper;

    public MedicalRecordDTO createMedicalRecord(MedicalRecordDTO medicalRecordDTO) {
        MedicalRecord medicalRecord = medicalRecordMapper.toEntity(medicalRecordDTO);
        medicalRecord.setCreatedAt(LocalDateTime.now());
        medicalRecord.setUpdatedAt(LocalDateTime.now());
        medicalRecord = medicalRecordRepository.save(medicalRecord);
        return medicalRecordMapper.toDto(medicalRecord);
    }

    public MedicalRecordDTO getMedicalRecord(Long id) {
        Optional<MedicalRecord> medicalRecord = medicalRecordRepository.findById(id);
        return medicalRecord.map(medicalRecordMapper::toDto)
                .orElseThrow(() -> new RuntimeException("Medical record not found"));
    }

    public MedicalRecordDTO updateMedicalRecord(Long id, MedicalRecordDTO medicalRecordDTO) {
        MedicalRecord existingRecord = medicalRecordRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Medical record not found"));

        existingRecord.setPatientName(medicalRecordDTO.getPatientName());
        existingRecord.setPatientId(medicalRecordDTO.getPatientId());
        existingRecord.setRecordFileName(medicalRecordDTO.getRecordFileName());
        existingRecord.setUpdatedAt(LocalDateTime.now());

        existingRecord = medicalRecordRepository.save(existingRecord);
        return medicalRecordMapper.toDto(existingRecord);
    }

    public void deleteMedicalRecord(Long id) {
        MedicalRecord existingRecord = medicalRecordRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Medical record not found"));
        medicalRecordRepository.delete(existingRecord);
    }


    // Implemented the method to retrieve a MedicalRecord by its ID
    public MedicalRecord findMedicalRecordById(Long id) {
        return medicalRecordRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("MedicalRecord not found with id: " + id));
    }
}
