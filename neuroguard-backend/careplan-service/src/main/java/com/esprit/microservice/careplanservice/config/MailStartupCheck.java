package com.esprit.microservice.careplanservice.config;

import com.esprit.microservice.careplanservice.services.CarePlanMailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

/**
 * At startup with profile "local", logs mail config and optionally sends a test email
 * to verify SMTP (to the configured "from" address).
 */
@Slf4j
@Component
@Profile("local")
@Order(1)
@RequiredArgsConstructor
public class MailStartupCheck implements ApplicationRunner {

    private final CarePlanMailService mailService;

    @Override
    public void run(ApplicationArguments args) {
        mailService.logStatusAndSendTestIfEnabled();
    }
}
