package tn.neuroguard.medicalhistoryservice.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.neuroguard.medicalhistoryservice.dto.DiseaseDTO;
import tn.neuroguard.medicalhistoryservice.service.DiseaseService;

import java.util.List;

@RestController
@RequestMapping("/api/diseases")
public class DiseaseController {

    @Autowired
    private DiseaseService diseaseService;

    @PostMapping("/add-disease/{medicalRecordId}")
    public ResponseEntity<DiseaseDTO> addDiseaseToMedicalRecord(@PathVariable Long medicalRecordId,
                                                                @RequestBody DiseaseDTO diseaseDTO) {
        DiseaseDTO addedDisease = diseaseService.addDiseaseToMedicalRecord(medicalRecordId, diseaseDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(addedDisease);
    }

    @GetMapping("/medical-record/{medicalRecordId}")
    public ResponseEntity<List<DiseaseDTO>> getDiseasesByMedicalRecord(@PathVariable Long medicalRecordId) {
        List<DiseaseDTO> diseases = diseaseService.getDiseasesByMedicalRecord(medicalRecordId);
        return ResponseEntity.ok(diseases);
    }

    @PutMapping("/update/{id}")
    public ResponseEntity<DiseaseDTO> updateDisease(@PathVariable Long id, @RequestBody DiseaseDTO diseaseDTO) {
        DiseaseDTO updatedDisease = diseaseService.updateDisease(id, diseaseDTO);
        return ResponseEntity.ok(updatedDisease);
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Void> deleteDisease(@PathVariable Long id) {
        diseaseService.deleteDisease(id);
        return ResponseEntity.noContent().build();
    }
}
