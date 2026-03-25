package com.example.project_management_system.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.example.project_management_system.entities.User;
import com.example.project_management_system.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class ManagerSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(ManagerSeeder.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.seed.manager.email}")
    private String email;

    @Value("${app.seed.manager.password}")
    private String password;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (userRepository.existsByEmailIgnoreCase(email)) {
            log.info("Manager account already exists ({}), skipping seed", email);
            return;
        }

        User user = User.builder()
                .email(email)
                .passwordHash(passwordEncoder.encode(password))
                .role("MANAGER")
                .build();

        userRepository.save(user);
        log.info("Seeded manager account: {} / {}", email, password);
    }
}
