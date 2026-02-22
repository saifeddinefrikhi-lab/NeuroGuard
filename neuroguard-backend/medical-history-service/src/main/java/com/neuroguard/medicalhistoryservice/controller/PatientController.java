package com.neuroguard.medicalhistoryservice.controller;



import com.neuroguard.medicalhistoryservice.dto.FileDto;
import com.neuroguard.medicalhistoryservice.dto.MedicalHistoryResponse;
import com.neuroguard.medicalhistoryservice.service.MedicalHistoryService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/patient/medical-history")
@RequiredArgsConstructor
public class PatientController {

    private final MedicalHistoryService historyService;

    @GetMapping("/me")
    public ResponseEntity<MedicalHistoryResponse> getMyHistory(HttpServletRequest httpRequest) {
        Long patientId = (Long) httpRequest.getAttribute("userId");
        String role = (String) httpRequest.getAttribute("userRole");
        MedicalHistoryResponse response = historyService.getMedicalHistoryByPatientId(patientId, patientId, role);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/me/files")
    public ResponseEntity<FileDto> uploadFile(@RequestParam("file") MultipartFile file,
                                              HttpServletRequest httpRequest) {
        Long patientId = (Long) httpRequest.getAttribute("userId");
        String role = (String) httpRequest.getAttribute("userRole");
        FileDto fileDto = historyService.uploadFile(patientId, file, patientId, role);
        return ResponseEntity.ok(fileDto);
    }

    @GetMapping("/me/files")
    public ResponseEntity<List<FileDto>> getMyFiles(HttpServletRequest httpRequest) {
        Long patientId = (Long) httpRequest.getAttribute("userId");
        String role = (String) httpRequest.getAttribute("userRole");
        List<FileDto> files = historyService.getFiles(patientId, patientId, role);
        return ResponseEntity.ok(files);
    }

    @DeleteMapping("/me/files/{fileId}")
    public ResponseEntity<Void> deleteFile(@PathVariable Long fileId,
                                           HttpServletRequest httpRequest) {
        Long patientId = (Long) httpRequest.getAttribute("userId");
        String role = (String) httpRequest.getAttribute("userRole");
        historyService.deleteFile(patientId, fileId, patientId, role);
        return ResponseEntity.noContent().build();
    }
}