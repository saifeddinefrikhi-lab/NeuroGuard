package com.neuroguard.userservice.events;

import lombok.Getter;
import org.springframework.context.ApplicationEvent;

@Getter
public class UserCreatedEvent extends ApplicationEvent {
    private final String email;

    public UserCreatedEvent(Object source, String email) {
        super(source);
        this.email = email;
    }
}
