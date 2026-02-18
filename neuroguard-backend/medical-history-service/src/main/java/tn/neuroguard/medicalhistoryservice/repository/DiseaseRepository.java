package tn.neuroguard.medicalhistoryservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import tn.neuroguard.medicalhistoryservice.entity.Disease;

import java.util.List;

@Repository
public interface DiseaseRepository extends JpaRepository<Disease, Long> {

    List<Disease> findByMedicalRecordId(Long medicalRecordId);
}

