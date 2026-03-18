package com.example.project_management_system.services;

import java.util.Optional;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.project_management_system.entities.Employee;
import com.example.project_management_system.entities.User;
import com.example.project_management_system.exceptions.ConflictException;
import com.example.project_management_system.exceptions.UnauthorizedException;
import com.example.project_management_system.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final EmployeeService employeeService;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public User register(String email, String rawPassword) {
        String em = email.trim().toLowerCase();
        // Check for duplicate email
        if (userRepository.existsByEmailIgnoreCase(em)) {
            throw ConflictException.emailAlreadyInUse();
        }
        // Ensure the email belongs to an existing employee, only known employees may register
        Employee employee = employeeService.requireProvisionedByEmail(em);

        User user = User.builder()
                .email(em)
                .passwordHash(passwordEncoder.encode(rawPassword))
                .role("USER")
                .build();

        // Save first to get the generated id before assigning to the employee FK
        userRepository.save(user);
        // Link the user account to the employee record
        employeeService.linkUser(employee, user);

        return user;
    }

    @Transactional(readOnly = true)
    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmailIgnoreCase(email);
    }

    @Transactional
    public User changePassword(String email, String currentPassword, String newPassword) {
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(UnauthorizedException::unauthorized);

        if (!passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
            throw UnauthorizedException.wrongPassword();
        }

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        return userRepository.save(user);
    }
}
