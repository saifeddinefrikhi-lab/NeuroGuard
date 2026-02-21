package com.neuroguard.medicalhistoryservice.client;

import com.neuroguard.medicalhistoryservice.dto.UserDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;

@FeignClient(name = "user-service", url = "${user-service.url:}", path = "/users")
public interface UserServiceClient {

    @GetMapping("/username/{username}")
    UserDto getUserByUsername(@PathVariable("username") String username);

    @GetMapping("/{id}")
    UserDto getUserById(@PathVariable("id") Long id);

    @GetMapping("/role/{role}")
    List<UserDto> getUsersByRole(@PathVariable("role") String role);
}