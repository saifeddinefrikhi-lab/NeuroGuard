package com.neuroguard.medicalhistoryservice.repository;


import com.neuroguard.medicalhistoryservice.entity.MedicalRecordFile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MedicalRecordFileRepository extends JpaRepository<MedicalRecordFile, Long> {
    List<MedicalRecordFile> findByMedicalHistoryId(Long medicalHistoryId);
}