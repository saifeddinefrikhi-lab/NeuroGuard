package com.esprit.microservice.careplanservice.controllers;


import com.esprit.microservice.careplanservice.dto.CarePlanMessageRequest;
import com.esprit.microservice.careplanservice.dto.CarePlanMessageResponse;
import com.esprit.microservice.careplanservice.dto.CarePlanRequest;
import com.esprit.microservice.careplanservice.dto.CarePlanResponse;
import com.esprit.microservice.careplanservice.dto.CarePlanStatsResponse;
import com.esprit.microservice.careplanservice.dto.StatusUpdateRequest;
import com.esprit.microservice.careplanservice.services.CarePlanService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/care-plans")
@RequiredArgsConstructor
public class CarePlanController {

    private final CarePlanService carePlanService;

    @PostMapping
    public ResponseEntity<CarePlanResponse> createCarePlan(@Valid @RequestBody CarePlanRequest request) {
        CarePlanResponse response = carePlanService.createCarePlan(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<CarePlanResponse> updateCarePlan(@PathVariable Long id,
                                                           @Valid @RequestBody CarePlanRequest request) {
        CarePlanResponse response = carePlanService.updateCarePlan(id, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCarePlan(@PathVariable Long id) {
        carePlanService.deleteCarePlan(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}")
    public ResponseEntity<CarePlanResponse> getCarePlanById(@PathVariable Long id) {
        CarePlanResponse response = carePlanService.getCarePlanById(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<CarePlanResponse>> getCarePlansByPatient(@RequestParam Long patientId) {
        List<CarePlanResponse> responses = carePlanService.getCarePlansByPatient(patientId);
        return ResponseEntity.ok(responses);
    }

    /** List care plans for current user (by role: provider=his, admin=all, patient=his, caregiver=assigned patients) */
    @GetMapping("/list")
    public ResponseEntity<List<CarePlanResponse>> getCarePlansList() {
        List<CarePlanResponse> responses = carePlanService.getCarePlansList();
        return ResponseEntity.ok(responses);
    }

    /** Patient only: set one section's status (nutrition, sleep, activity, medication) to TODO or DONE. */
    @PatchMapping("/{id}/status")
    public ResponseEntity<CarePlanResponse> updateSectionStatus(@PathVariable Long id,
                                                               @RequestBody StatusUpdateRequest request) {
        String section = request != null ? request.getSection() : null;
        String status = request != null ? request.getStatus() : null;
        CarePlanResponse response = carePlanService.updateSectionStatus(id, section, status);
        return ResponseEntity.ok(response);
    }

    /** Get chat messages between doctor and patient for this care plan. */
    @GetMapping("/{id}/messages")
    public ResponseEntity<List<CarePlanMessageResponse>> getMessages(@PathVariable Long id) {
        List<CarePlanMessageResponse> messages = carePlanService.getMessages(id);
        return ResponseEntity.ok(messages);
    }

    /** Send a message (doctor or patient only). */
    @PostMapping("/{id}/messages")
    public ResponseEntity<CarePlanMessageResponse> sendMessage(@PathVariable Long id,
                                                              @Valid @RequestBody CarePlanMessageRequest request) {
        CarePlanMessageResponse response = carePlanService.sendMessage(id, request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    /** Admin only: care plan statistics. */
    @GetMapping("/stats")
    public ResponseEntity<CarePlanStatsResponse> getStats() {
        CarePlanStatsResponse response = carePlanService.getStats();
        return ResponseEntity.ok(response);
    }
}