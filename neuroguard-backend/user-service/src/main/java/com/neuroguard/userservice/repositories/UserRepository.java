package com.neuroguard.userservice.repositories;

import com.neuroguard.userservice.entities.Role;
import com.neuroguard.userservice.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);  // Find user by email
    boolean existsByEmail(String email);  // Check if email already exists
    boolean existsByUsername(String username);  // Check if username already exists

    Optional<User> findByUsername(String username);  // Find user by username
    List<User> findByRole(Role role);
}