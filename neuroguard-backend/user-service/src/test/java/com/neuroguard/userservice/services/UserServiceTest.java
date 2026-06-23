package com.neuroguard.userservice.services;

import com.neuroguard.userservice.dto.CreateUserRequest;
import com.neuroguard.userservice.dto.UpdateUserRequest;
import com.neuroguard.userservice.dto.UserDto;
import com.neuroguard.userservice.entities.Role;
import com.neuroguard.userservice.entities.User;
import com.neuroguard.userservice.repositories.UserRepository;
import com.neuroguard.userservice.security.JwtUtils;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private JwtUtils jwtUtils;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private ApplicationEventPublisher eventPublisher;

    @InjectMocks
    private UserService userService;

    @Test
    void createUser_success() {
        CreateUserRequest req = new CreateUserRequest();
        req.setFirstName("John");
        req.setLastName("Doe");
        req.setUsername("john");
        req.setEmail("john@test.com");
        req.setRole("ADMIN");
        req.setPassword("Password123");

        when(userRepository.existsByUsernameIgnoreCase("john")).thenReturn(false);
        when(userRepository.existsByEmailIgnoreCase("john@test.com")).thenReturn(false);
        when(passwordEncoder.encode("Password123")).thenReturn("hashed");
        when(userRepository.saveAndFlush(any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            user.setId(1L);
            return user;
        });

        UserDto result = userService.createUser(req);

        assertNotNull(result);
        assertEquals("john", result.getUsername());
        assertEquals("ADMIN", result.getRole());
        verify(userRepository).saveAndFlush(any(User.class));
    }

    @Test
    void createUser_emailAlreadyExists_throwsException() {
        CreateUserRequest req = new CreateUserRequest();
        req.setUsername("john");
        req.setEmail("john@test.com");

        when(userRepository.existsByUsernameIgnoreCase("john")).thenReturn(false);
        when(userRepository.existsByEmailIgnoreCase("john@test.com")).thenReturn(true);

        RuntimeException ex = assertThrows(RuntimeException.class, () -> userService.createUser(req));
        assertEquals("Email already exists", ex.getMessage());
    }

    @Test
    void updateUser_notFound_throwsException() {
        UpdateUserRequest req = new UpdateUserRequest();
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        RuntimeException ex = assertThrows(RuntimeException.class, () -> userService.updateUser(99L, req));
        assertEquals("User not found", ex.getMessage());
    }

    @Test
    void deleteUser_notFound_throwsException() {
        when(userRepository.findById(15L)).thenReturn(Optional.empty());

        RuntimeException ex = assertThrows(RuntimeException.class, () -> userService.deleteUser(15L));
        assertEquals("User not found", ex.getMessage());
    }

    @Test
    void loginUser_success_returnsToken() {
        User user = new User();
        user.setId(10L);
        user.setUsername("john");
        user.setPassword("hashed");
        user.setRole(Role.ADMIN);
        user.setTokenVersion(0L);

        when(userRepository.findByUsernameIgnoreCase("john")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("Password123", "hashed")).thenReturn(true);
        when(jwtUtils.generateJwtToken("john", "ADMIN", 10L, 0L)).thenReturn("jwt-token");

        String token = userService.loginUser("john", "Password123");
        assertEquals("jwt-token", token);
    }
}
