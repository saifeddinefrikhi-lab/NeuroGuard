package com.neuroguard.userservice.repositories;

import com.neuroguard.userservice.entities.Role;
import com.neuroguard.userservice.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);  // Find user by email
    Optional<User> findByEmailIgnoreCase(String email); // Nour feature
    
    boolean existsByEmail(String email);  // Check if email already exists
    boolean existsByEmailIgnoreCase(String email); // Nour feature
    
    boolean existsByUsername(String username);  // Check if username already exists
    boolean existsByUsernameIgnoreCase(String username); // Nour feature

    Optional<User> findByUsername(String username);  // Find user by username
    Optional<User> findByUsernameIgnoreCase(String username); // Nour feature
    Optional<User> findByUsernameOrEmail(String username, String email); // Nour feature

    List<User> findByRole(Role role);
    List<User> findByCaregiverId(Long caregiverId); // Main logic
    
    long countByRole(Role role); // Main logic
}
