package com.neuroguard.userservice.repositories;

import com.neuroguard.userservice.entities.PasswordResetToken;
import com.neuroguard.userservice.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {
    
    // Find token by token string
    List<PasswordResetToken> findByToken(String token);
    
    // Find all tokens for a specific user
    List<PasswordResetToken> findByUser(User user);
    
    // Find valid tokens for a user (not expired and not used)
    @Query("SELECT t FROM PasswordResetToken t WHERE t.user = :user AND t.used = false AND t.expiryDate > :now ORDER BY t.createdAt DESC")
    List<PasswordResetToken> findValidTokenByUser(@Param("user") User user, @Param("now") LocalDateTime now);
    
    // Find all expired tokens
    @Query("SELECT t FROM PasswordResetToken t WHERE t.expiryDate < :now")
    List<PasswordResetToken> findExpiredTokens(@Param("now") LocalDateTime now);
    
    // Delete all expired tokens
    @Modifying
    @Query("DELETE FROM PasswordResetToken t WHERE t.expiryDate < :now")
    void deleteExpiredTokens(@Param("now") LocalDateTime now);
    
    // Delete all tokens for a specific user
    @Modifying
    @Query("DELETE FROM PasswordResetToken t WHERE t.user = :user")
    void deleteAllTokensByUser(@Param("user") User user);
    
    // Mark token as used
    @Modifying
    @Query("UPDATE PasswordResetToken t SET t.used = true WHERE t.token = :token")
    void markTokenAsUsed(@Param("token") String token);
    
    // Count tokens for a user
    long countByUser(User user);
    
    // Check if user has any valid tokens
    @Query("SELECT COUNT(t) > 0 FROM PasswordResetToken t WHERE t.user = :user AND t.used = false AND t.expiryDate > :now")
    boolean hasValidToken(@Param("user") User user, @Param("now") LocalDateTime now);
}
