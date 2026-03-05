package com.esprit.microservice.careplanservice.feign;


import com.esprit.microservice.careplanservice.dto.UserDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;

@FeignClient(name = "user-service", path = "/users")
public interface UserServiceClient {

    @GetMapping("/{id}")
    UserDto getUserById(@PathVariable("id") Long id);

    @GetMapping("/username/{username}")
    UserDto getUserByUsername(@PathVariable("username") String username);

    @GetMapping("/caregiver/{caregiverId}/patients/{patientId}/assigned")
    Boolean isCaregiverAssignedToPatient(@PathVariable("caregiverId") Long caregiverId,
                                         @PathVariable("patientId") Long patientId);

    @GetMapping("/caregiver/{caregiverId}/patients")
    List<Long> getPatientIdsByCaregiver(@PathVariable("caregiverId") Long caregiverId);
}