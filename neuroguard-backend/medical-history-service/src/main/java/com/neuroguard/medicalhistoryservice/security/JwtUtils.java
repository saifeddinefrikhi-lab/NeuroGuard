package com.neuroguard.medicalhistoryservice.security;


import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.interfaces.DecodedJWT;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class JwtUtils {

    @Value("${jwt.secret}")
    private String secret;

    public DecodedJWT verifyToken(String token) {
        return JWT.require(Algorithm.HMAC256(secret))
                .build()
                .verify(token);
    }

    public String getUsernameFromToken(String token) {
        return verifyToken(token).getSubject();
    }

    public String getRoleFromToken(String token) {
        return verifyToken(token).getClaim("role").asString();
    }

    public boolean validateToken(String token) {
        try {
            verifyToken(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
    public Long getUserIdFromToken(String token) {
        return verifyToken(token).getClaim("userId").asLong();
    }
}