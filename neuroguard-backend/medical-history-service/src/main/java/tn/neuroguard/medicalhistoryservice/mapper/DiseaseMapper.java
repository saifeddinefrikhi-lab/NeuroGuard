package tn.neuroguard.medicalhistoryservice.mapper;

import org.mapstruct.Mapper;
import tn.neuroguard.medicalhistoryservice.dto.DiseaseDTO;
import tn.neuroguard.medicalhistoryservice.entity.Disease;

@Mapper(componentModel = "spring")
public interface DiseaseMapper {

    DiseaseDTO toDto(Disease disease);
    Disease toEntity(DiseaseDTO diseaseDTO);
}
