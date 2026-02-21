package com.neuroguard.userservice.security;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.interfaces.DecodedJWT;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Date;
import java.util.HashSet;
import java.util.Set;

@Component
public class JwtUtils {

    @Value("${jwt.secret}")
    private String SECRET_KEY; // Replace with a stronger key

    private final Set<String> invalidatedTokens = new HashSet<>();

    // Generate JWT Token
    public String generateJwtToken(String username, String role) {
        Algorithm algorithm = Algorithm.HMAC256(SECRET_KEY); // Use HMAC256 with your secret key

        return JWT.create()
                .withSubject(username)  // The username is the subject of the token
                .withClaim("role", role)  // Store role in the token
                .withIssuedAt(new Date())  // Set the issued date
                .withExpiresAt(new Date(System.currentTimeMillis() + 86400000))  // Token expiration (24 hours)
                .sign(algorithm);  // Sign the token using the algorithm
    }

    // Get username from JWT Token
    public String getUsernameFromJwtToken(String token) {
        return JWT.require(Algorithm.HMAC256(SECRET_KEY))
                .build()
                .verify(token)
                .getSubject();  // Extract the username from the token
    }

    // Get role from JWT Token
    public String getRoleFromJwtToken(String token) {
        DecodedJWT decodedJWT = JWT.require(Algorithm.HMAC256(SECRET_KEY))
                .build()
                .verify(token);
        return decodedJWT.getClaim("role").asString();  // Extract the role from the token
    }

    // Validate JWT Token
    public boolean validateJwtToken(String token) {
        try {
            JWT.require(Algorithm.HMAC256(SECRET_KEY)).build().verify(token);
            return true; // Token is valid
        } catch (Exception e) {
            return false; // Token is invalid
        }
    }

    public void invalidateToken(String token) {
        invalidatedTokens.add(token);
    }

    public boolean isTokenInvalidated(String token) {
        return invalidatedTokens.contains(token);
    }
}