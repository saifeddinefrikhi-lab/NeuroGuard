package com.neuroguard.medicalhistoryservice.security;

import com.neuroguard.medicalhistoryservice.client.UserServiceClient;
import com.neuroguard.medicalhistoryservice.dto.UserDto;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class KeycloakRequestAttributesInterceptor implements HandlerInterceptor {

    private final UserServiceClient userServiceClient;

    public KeycloakRequestAttributesInterceptor(@org.springframework.context.annotation.Lazy UserServiceClient userServiceClient) {
        this.userServiceClient = userServiceClient;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (!(authentication instanceof JwtAuthenticationToken jwtAuthenticationToken)) {
            return true;
        }

        String role = jwtAuthenticationToken.getAuthorities().stream()
                .map(authority -> authority.getAuthority().replaceFirst("^ROLE_", ""))
                .findFirst()
                .orElse("PATIENT");
        request.setAttribute("userRole", role);

        Long userId = null;
        Object userIdClaim = jwtAuthenticationToken.getToken().getClaims().get("userId");
        if (userIdClaim instanceof Number number) {
            userId = number.longValue();
        } else if (userIdClaim instanceof String value) {
            try {
                userId = Long.parseLong(value);
            } catch (NumberFormatException ignored) {
            }
        }

        if (userId == null) {
            String username = jwtAuthenticationToken.getToken().getClaimAsString("preferred_username");
            if (username == null || username.isBlank()) {
                username = jwtAuthenticationToken.getName();
            }

            if (username != null && !username.isBlank()) {
                try {
                    UserDto user = userServiceClient.getUserByUsername(username);
                    userId = user != null ? user.getId() : null;
                } catch (Exception ignored) {
                }
            }
        }

        if (userId != null) {
            request.setAttribute("userId", userId);
        }

        return true;
    }
}