package com.example.project_management_system.services;

import java.time.Instant;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.project_management_system.entities.RefreshToken;
import com.example.project_management_system.entities.User;
import com.example.project_management_system.exceptions.UnauthorizedException;
import com.example.project_management_system.repository.RefreshTokenRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;

    @Value("${jwt.refresh-expiration-ms}")
    private long refreshExpirationMs;

    @Transactional
    public RefreshToken create(User user) {
        RefreshToken token = RefreshToken.builder()
                .token(UUID.randomUUID().toString())
                .user(user)
                .expiresAt(Instant.now().plusMillis(refreshExpirationMs))
                .build();
        return refreshTokenRepository.save(token);
    }

    @Transactional(readOnly = true)
    public RefreshToken getVerified(String tokenValue) {
        if (tokenValue == null) throw UnauthorizedException.tokenNotFound();
        RefreshToken token = refreshTokenRepository.findByToken(tokenValue)
                .orElseThrow(UnauthorizedException::tokenNotFound);
        if (token.isRevoked()) {
            throw UnauthorizedException.tokenRevoked();
        }
        if (token.getExpiresAt().isBefore(Instant.now())) {
            throw UnauthorizedException.tokenExpired();
        }
        return token;
    }

    @Transactional
    public void revoke(RefreshToken token) {
        token.setRevoked(true);
        refreshTokenRepository.save(token);
    }

    @Transactional
    public void revokeAllForUser(User user) {
        refreshTokenRepository.revokeAllByUser(user);
    }

    @Transactional
    public RefreshToken rotate(RefreshToken old) {
        old.setRevoked(true);
        refreshTokenRepository.save(old);
        return create(old.getUser());
    }
}
