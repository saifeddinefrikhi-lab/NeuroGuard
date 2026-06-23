package com.neuroguard.medicalhistoryservice.controller;



import com.neuroguard.medicalhistoryservice.dto.FileDto;
import com.neuroguard.medicalhistoryservice.dto.MedicalHistoryResponse;
import com.neuroguard.medicalhistoryservice.service.MedicalHistoryService;
import com.neuroguard.medicalhistoryservice.security.JwtUtils;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/patient/medical-history")
@RequiredArgsConstructor
public class PatientController {

    private final MedicalHistoryService historyService;
    private final JwtUtils jwtUtils;

    @GetMapping("/me")
    public ResponseEntity<MedicalHistoryResponse> getMyHistory(HttpServletRequest httpRequest) {
        AuthContext authContext = resolveAuthContext(httpRequest);
        Long patientId = authContext.userId();
        String role = authContext.role();
        MedicalHistoryResponse response = historyService.getMedicalHistoryByPatientId(patientId, patientId, role);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/me/files")
    public ResponseEntity<FileDto> uploadFile(@RequestParam("file") MultipartFile file,
                                              @RequestHeader(value = "Authorization", required = false) String authHeader,
                                              @RequestParam(value = "token", required = false) String tokenParam,
                                              HttpServletRequest httpRequest) {
        String token = null;
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7).trim();
        } else if (tokenParam != null && !tokenParam.isBlank()) {
            token = tokenParam.trim();
        }

        if (token == null) {
            AuthContext authContext = resolveAuthContext(httpRequest);
            Long patientId = authContext.userId();
            String role = authContext.role();
            FileDto fileDto = historyService.uploadFile(patientId, file, patientId, role);
            return ResponseEntity.ok(fileDto);
        }

        if (!jwtUtils.validateToken(token)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized: invalid or expired token");
        }

        Long patientId = jwtUtils.getUserIdFromToken(token);
        String role = jwtUtils.getRoleFromToken(token);
        if (role != null && role.startsWith("ROLE_")) {
            role = role.substring(5);
        }

        FileDto fileDto = historyService.uploadFile(patientId, file, patientId, role);
        return ResponseEntity.ok(fileDto);
    }

    @GetMapping("/me/files")
    public ResponseEntity<List<FileDto>> getMyFiles(HttpServletRequest httpRequest) {
        AuthContext authContext = resolveAuthContext(httpRequest);
        Long patientId = authContext.userId();
        String role = authContext.role();
        List<FileDto> files = historyService.getFiles(patientId, patientId, role);
        return ResponseEntity.ok(files);
    }

    @DeleteMapping("/me/files/{fileId}")
    public ResponseEntity<Void> deleteFile(@PathVariable Long fileId,
                                           HttpServletRequest httpRequest) {
        AuthContext authContext = resolveAuthContext(httpRequest);
        Long patientId = authContext.userId();
        String role = authContext.role();
        historyService.deleteFile(patientId, fileId, patientId, role);
        return ResponseEntity.noContent().build();
    }

    private AuthContext resolveAuthContext(HttpServletRequest request) {
        Object userIdAttr = request.getAttribute("userId");
        Object userRoleAttr = request.getAttribute("userRole");

        if (userIdAttr instanceof Long userId && userRoleAttr instanceof String role) {
            return new AuthContext(userId, role);
        }

        String token = extractToken(request);
        if (token == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized: missing token");
        }

        if (!jwtUtils.validateToken(token)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized: invalid or expired token");
        }

        Long userId = jwtUtils.getUserIdFromToken(token);
        String role = jwtUtils.getRoleFromToken(token);

        if (userId == null || role == null || role.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized: invalid token claims");
        }

        return new AuthContext(userId, role.startsWith("ROLE_") ? role.substring(5) : role);
    }

    private String extractToken(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7).trim();
        }

        String tokenParam = request.getParameter("token");
        if (tokenParam != null && !tokenParam.isBlank()) {
            return tokenParam.trim();
        }

        return null;
    }

    private record AuthContext(Long userId, String role) {}
}