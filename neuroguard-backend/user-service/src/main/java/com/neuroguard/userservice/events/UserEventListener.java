package com.neuroguard.userservice.events;

import com.neuroguard.userservice.services.PasswordResetService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class UserEventListener {

    @Autowired
    private PasswordResetService passwordResetService;

    @EventListener
    @Async
    public void handleUserCreatedEvent(UserCreatedEvent event) {
        log.info("Handling UserCreatedEvent for: {}", event.getEmail());
        try {
            String result = passwordResetService.processUserInvitation(event.getEmail());
            log.info("Invitation event result for {}: {}", event.getEmail(), result);
        } catch (Exception e) {
            log.error("CRITICAL: Failed to process invitation event for {}", event.getEmail(), e);
        }
    }
}
