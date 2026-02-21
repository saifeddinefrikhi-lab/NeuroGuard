package com.neuroguard.userservice.services;

import com.neuroguard.userservice.entities.User;
import com.neuroguard.userservice.security.JwtUtils;
import com.neuroguard.userservice.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

@Service
public class UserService implements UserDetailsService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtUtils jwtUtils;

    // Register a new user
    public String registerUser(User user) {
        if (userRepository.existsByEmail(user.getEmail())) {
            return "User already exists!";
        }
        if (userRepository.existsByUsername(user.getUsername())) {
            return "Username already exists!";
        }
        user.setPassword(new BCryptPasswordEncoder().encode(user.getPassword()));  // Hash the password
        userRepository.save(user); // Save user to database
        return "User registered successfully!";
    }

    // Login method that returns a JWT token
    public String loginUser(String username, String password) {
        User user = userRepository.findByUsername(username)
                .orElse(null);
        if (user != null && new BCryptPasswordEncoder().matches(password, user.getPassword())) {
            return jwtUtils.generateJwtToken(user.getUsername(), user.getRole().name()); // Generate JWT token
        }
        return null; // Invalid credentials
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        // Implement logic to load user by username
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with username: " + username));

        // Convert User entity to UserDetails (you may need to implement a custom UserDetails class)
        return org.springframework.security.core.userdetails.User.builder()
                .username(user.getUsername())
                .password(user.getPassword())
                .roles(String.valueOf(user.getRole()))
                .build();
    }
}