package com.neuroguard.medicalhistoryservice.security;


import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTVerificationException;
import com.auth0.jwt.interfaces.DecodedJWT;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class JwtUtils {

    private static final Logger log = LoggerFactory.getLogger(JwtUtils.class);

    @Value("${jwt.secret}")
    private String secret;

    public DecodedJWT verifyToken(String token) {
        try {
            log.debug("Attempting to verify JWT token. Secret length: {}", secret.length());
            DecodedJWT decoded = JWT.require(Algorithm.HMAC256(secret))
                    .build()
                    .verify(token);
            log.debug("JWT token verification successful");
            return decoded;
        } catch (JWTVerificationException e) {
            log.error("JWT verification failed: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Unexpected error during JWT verification: {}", e.getMessage(), e);
            throw e;
        }
    }

    public String getUsernameFromToken(String token) {
        try {
            String username = verifyToken(token).getSubject();
            log.debug("Extracted username from token: {}", username);
            return username;
        } catch (Exception e) {
            log.error("Failed to extract username from token: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to extract username from token", e);
        }
    }

    public String getRoleFromToken(String token) {
        try {
            String role = verifyToken(token).getClaim("role").asString();
            if (role == null || role.isEmpty()) {
                log.warn("Role claim is null or empty in JWT token");
                throw new RuntimeException("Role claim missing in JWT token");
            }
            log.debug("Extracted role from token: {}", role);
            return role;
        } catch (Exception e) {
            log.error("Failed to extract role from token: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to extract role from token", e);
        }
    }

    public boolean validateToken(String token) {
        try {
            log.debug("Starting JWT token validation");
            verifyToken(token);
            log.debug("JWT token validation successful");
            return true;
        } catch (Exception e) {
            log.warn("Token validation failed: {} - Message: {}", e.getClass().getSimpleName(), e.getMessage());
            return false;
        }
    }

    public Long getUserIdFromToken(String token) {
        try {
            Long userId = verifyToken(token).getClaim("userId").asLong();
            if (userId == null) {
                log.warn("UserId claim is null in JWT token");
                throw new RuntimeException("UserId claim missing in JWT token");
            }
            log.debug("Extracted userId from token: {}", userId);
            return userId;
        } catch (Exception e) {
            log.error("Failed to extract userId from token: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to extract userId from token", e);
        }
    }
}