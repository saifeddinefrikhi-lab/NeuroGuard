package tn.neuroguard.medicalhistoryservice.mapper;

import org.mapstruct.Mapper;
import tn.neuroguard.medicalhistoryservice.dto.MedicalRecordDTO;
import tn.neuroguard.medicalhistoryservice.entity.MedicalRecord;

@Mapper(componentModel = "spring")
public interface MedicalRecordMapper {

    MedicalRecordDTO toDto(MedicalRecord medicalRecord);
    MedicalRecord toEntity(MedicalRecordDTO medicalRecordDTO);
}
