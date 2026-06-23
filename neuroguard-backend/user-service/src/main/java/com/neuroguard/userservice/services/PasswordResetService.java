package com.neuroguard.userservice.services;

import com.neuroguard.userservice.entities.PasswordResetToken;
import com.neuroguard.userservice.entities.User;
import com.neuroguard.userservice.repositories.PasswordResetTokenRepository;
import com.neuroguard.userservice.repositories.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.security.crypto.password.PasswordEncoder;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@Slf4j
public class PasswordResetService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private EmailService emailService;

    @Transactional
    public void completePasswordReset(String token, String newPassword) {
        log.info("Completing password reset for token: {}", token);

        // Find by token string - use the first result if there are duplicates
        List<PasswordResetToken> tokens = passwordResetTokenRepository.findByToken(token);
        if (tokens.isEmpty()) {
            log.warn("No token found in DB for value: {}", token);
            throw new RuntimeException("Invalid or expired reset token");
        }

        PasswordResetToken resetToken = tokens.get(0);
        log.info("Token found: id={}, used={}, expiry={}", resetToken.getId(), resetToken.isUsed(), resetToken.getExpiryDate());

        if (resetToken.isUsed()) {
            log.warn("Token already used: {}", token);
            throw new RuntimeException("This reset link has already been used. Please request a new one.");
        }

        if (resetToken.isExpired()) {
            log.warn("Token expired: {}", token);
            throw new RuntimeException("This reset link has expired. Please request a new one.");
        }

        User user = resetToken.getUser();

        // 1. Update user password
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        // 2. Mark token as used
        resetToken.setUsed(true);
        passwordResetTokenRepository.save(resetToken);

        log.info("Password reset completed successfully for user: {}", user.getEmail());
    }

    @Transactional
    public String processForgotPassword(String email) {
        return processEmailFlow(email, false);
    }

    @Transactional
    public String processUserInvitation(String email) {
        return processEmailFlow(email, true);
    }

    private String processEmailFlow(String email, boolean isInvitation) {
        log.info("Processing {} request for email: {}", isInvitation ? "invitation" : "password reset", email);

        // 1. Find User
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            log.info("No user found with email: {} - returning generic success", email);
            return "If an account with that email exists, an email has been sent.";
        }

        User user = userOpt.get();
        log.info("User identified: {} (ID: {})", user.getEmail(), user.getId());

        // 2. Invalidate ALL existing tokens for this user
        passwordResetTokenRepository.deleteAllTokensByUser(user);

        // 3. Always create a fresh token
        PasswordResetToken newToken = new PasswordResetToken(user);
        passwordResetTokenRepository.save(newToken);
        String tokenToUse = newToken.getToken();

        // 4. Send email
        if (isInvitation) {
            emailService.sendInvitationEmail(
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                tokenToUse
            );
        } else {
            emailService.sendPasswordResetEmail(
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                tokenToUse
            );
        }

        return isInvitation ? "Invitation link has been sent." : "Password reset link has been sent.";
    }
}

