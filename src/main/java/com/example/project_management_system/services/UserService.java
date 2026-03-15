package com.example.project_management_system.services;

import java.util.Optional;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.project_management_system.entities.Employee;
import com.example.project_management_system.entities.User;
import com.example.project_management_system.exceptions.ConflictException;
import com.example.project_management_system.exceptions.UnauthorizedException;
import com.example.project_management_system.repository.EmployeeRepository;
import com.example.project_management_system.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final EmployeeRepository employeeRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public User register(String email, String rawPassword) {
        String em = email == null ? null : email.trim().toLowerCase();
        if (em == null || em.isEmpty()) {
            throw new IllegalArgumentException("email is required");
        }
        if (rawPassword == null || rawPassword.isEmpty()) {
            throw new IllegalArgumentException("password is required");
        }

        if (userRepository.existsByEmailIgnoreCase(em)) {
            throw ConflictException.emailAlreadyInUse();
        }

        Employee employee = employeeRepository.findByEmailIgnoreCase(em)
                .orElseThrow(ConflictException::employeeNotProvisioned);

        User user = User.builder()
                .email(em)
                .passwordHash(passwordEncoder.encode(rawPassword))
                .role("USER")
                .build();

        userRepository.save(user);
        // Set the user field (user_id) on the employee and save it
        employee.setUser(user);
        employeeRepository.save(employee);

        return user;
    }

    @Transactional(readOnly = true)
    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmailIgnoreCase(email);
    }

    @Transactional(readOnly = true)
    public User login(String email, String rawPassword) {
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(UnauthorizedException::invalidCredentials);

        if (!passwordEncoder.matches(rawPassword, user.getPasswordHash())) {
            throw UnauthorizedException.invalidCredentials();
        }
        return user;
    }

    @Transactional
    public void changePassword(String email, String currentPassword, String newPassword) {
        if (newPassword == null || newPassword.isBlank()) {
            throw new IllegalArgumentException("newPassword is required");
        }

        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(UnauthorizedException::unauthorized);

        if (!passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
            throw UnauthorizedException.wrongPassword();
        }

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }
}
