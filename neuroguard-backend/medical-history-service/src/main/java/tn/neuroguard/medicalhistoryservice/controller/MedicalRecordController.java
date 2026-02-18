package tn.neuroguard.medicalhistoryservice.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.neuroguard.medicalhistoryservice.dto.MedicalRecordDTO;
import tn.neuroguard.medicalhistoryservice.service.MedicalRecordService;

@RestController
@RequestMapping("/api/medical-records")
public class MedicalRecordController {

    @Autowired
    private MedicalRecordService medicalRecordService;

    @PostMapping("/addRecord")
    public ResponseEntity<MedicalRecordDTO> createMedicalRecord(@RequestBody MedicalRecordDTO medicalRecordDTO) {
        MedicalRecordDTO savedRecord = medicalRecordService.createMedicalRecord(medicalRecordDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedRecord);
    }

    @GetMapping("/show/{id}")
    public ResponseEntity<MedicalRecordDTO> getMedicalRecord(@PathVariable Long id) {
        MedicalRecordDTO record = medicalRecordService.getMedicalRecord(id);
        return ResponseEntity.ok(record);
    }

    @PutMapping("/update/{id}")
    public ResponseEntity<MedicalRecordDTO> updateMedicalRecord(@PathVariable Long id,
                                                                @RequestBody MedicalRecordDTO medicalRecordDTO) {
        MedicalRecordDTO updatedRecord = medicalRecordService.updateMedicalRecord(id, medicalRecordDTO);
        return ResponseEntity.ok(updatedRecord);
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Void> deleteMedicalRecord(@PathVariable Long id) {
        medicalRecordService.deleteMedicalRecord(id);
        return ResponseEntity.noContent().build();
    }
}
