package com.neuroguard.userservice.security;

import com.auth0.jwt.interfaces.DecodedJWT;
import com.neuroguard.userservice.entities.User;
import com.neuroguard.userservice.entities.UserStatus;
import com.neuroguard.userservice.repositories.UserRepository;
import com.neuroguard.userservice.services.UserService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtils jwtUtils;
    private final UserRepository userRepository;

    @Autowired
    private UserService userService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws IOException, ServletException {
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            chain.doFilter(request, response);
            return;
        }

        String token = authHeader.substring(7);

        if (jwtUtils.isTokenInvalidated(token) || !jwtUtils.validateJwtToken(token)) {
            chain.doFilter(request, response);
            return;
        }

        DecodedJWT decodedJWT = jwtUtils.verifyToken(token);
        String username = decodedJWT.getSubject();
        String role = decodedJWT.getClaim("role").asString();
        Long userId = decodedJWT.getClaim("userId").asLong();
        Long tokenVersion = decodedJWT.getClaim("tokenVersion").asLong();

        // Ban check: validate tokenVersion and account status
        Optional<User> userOpt = userRepository.findByUsernameIgnoreCase(username);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (user.getStatus() == UserStatus.BANNED || user.getStatus() == UserStatus.DISABLED) {
                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                response.setContentType("application/json");
                response.getWriter().write("{\"error\":\"Account is banned or disabled\"}");
                return;
            }
            if (tokenVersion == null || tokenVersion < user.getTokenVersion()) {
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.setContentType("application/json");
                response.getWriter().write("{\"error\":\"Session invalidated. Please log in again.\"}");
                return;
            }
        }

        UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                username,
                null,
                List.of(new SimpleGrantedAuthority("ROLE_" + role))
        );
        authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

        request.setAttribute("userId", userId);
        request.setAttribute("userRole", role);

        SecurityContextHolder.getContext().setAuthentication(authToken);

        if (userService != null) {
            userService.updateLastSeen(username);
        }

        chain.doFilter(request, response);
    }
}