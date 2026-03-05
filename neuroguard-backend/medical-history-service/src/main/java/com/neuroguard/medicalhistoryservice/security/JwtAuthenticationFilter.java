package com.neuroguard.medicalhistoryservice.security;


import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

    private final JwtUtils jwtUtils;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws IOException, ServletException {
        String method = request.getMethod();
        String path = request.getRequestURI();
        log.debug("JwtAuthenticationFilter processing {} {}", method, path);

        try {
            String authHeader = request.getHeader("Authorization");
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                log.debug("No Bearer token found in Authorization header for {} {}", method, path);
                chain.doFilter(request, response);
                return;
            }

            String token = authHeader.substring(7);
            log.debug("Extracted token from Authorization header (length: {})", token.length());

            if (!jwtUtils.validateToken(token)) {
                log.warn("Invalid or expired token for {} {}", method, path);
                response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Invalid or expired token");
                return;
            }

            String username = jwtUtils.getUsernameFromToken(token);
            String role = jwtUtils.getRoleFromToken(token);
            Long userId = jwtUtils.getUserIdFromToken(token);

            log.debug("JWT Filter - {} {} - Username: {}, Role: {}, UserId: {}", method, path, username, role, userId);

            // Create authentication token
            SimpleGrantedAuthority authority = new SimpleGrantedAuthority("ROLE_" + role);
            UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                    username,
                    null,
                    List.of(authority)
            );
            authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

            // Store userId and role in request attributes for later use
            request.setAttribute("userId", userId);
            request.setAttribute("userRole", role);

            log.debug("JWT Filter - Setting authentication with authority: {} for {} {}", authority, method, path);
            SecurityContextHolder.getContext().setAuthentication(authToken);
            chain.doFilter(request, response);
        } catch (Exception e) {
            log.error("Authentication failed for {} {}: {}", method, path, e.getMessage(), e);
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Authentication failed: " + e.getMessage());
        }
    }
}