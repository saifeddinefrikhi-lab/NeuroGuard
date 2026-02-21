package com.neuroguard.medicalhistoryservice.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class TestController {
    @GetMapping("/test")
    public String test(java.security.Principal principal) {
        return "Authenticated as: " + principal.getName();
    }
}
