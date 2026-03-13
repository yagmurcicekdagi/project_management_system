package com.example.project_management_system.controllers;

import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.project_management_system.dtos.auth.AuthLoginRequest;
import com.example.project_management_system.dtos.auth.AuthRegisterRequest;
import com.example.project_management_system.dtos.auth.AuthResponse;
import com.example.project_management_system.dtos.auth.ChangePasswordRequest;
import com.example.project_management_system.dtos.auth.RefreshRequest;
import com.example.project_management_system.dtos.auth.RefreshResponse;
import com.example.project_management_system.entities.RefreshToken;
import com.example.project_management_system.entities.User;
import com.example.project_management_system.exceptions.UnauthorizedException;
import com.example.project_management_system.security.JwtService;
import com.example.project_management_system.services.RefreshTokenService;
import com.example.project_management_system.services.UserService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;
    private final AuthenticationManager authenticationManager;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Validated @RequestBody AuthRegisterRequest req) {
        User user = userService.register(req.email(), req.password());
        String token = jwtService.generateToken(user);
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user);
        return ResponseEntity.ok(new AuthResponse(token, "Bearer", user.getEmail(), user.getRole(), refreshToken.getToken()));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Validated @RequestBody AuthLoginRequest req) {
        authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(req.email(), req.password()));
        User user = userService.findByEmail(req.email())
                .orElseThrow(() -> new UnauthorizedException("User not found"));
        String token = jwtService.generateToken(user);
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user);
        return ResponseEntity.ok(new AuthResponse(token, "Bearer", user.getEmail(), user.getRole(), refreshToken.getToken()));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@Validated @RequestBody RefreshRequest req) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new UnauthorizedException("Unauthorized");
        }
        RefreshToken token = refreshTokenService.verifyAndGet(req.refreshToken());
        refreshTokenService.revoke(token);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/refresh")
    public ResponseEntity<RefreshResponse> refresh(@Validated @RequestBody RefreshRequest req) {
        RefreshToken oldToken = refreshTokenService.verifyAndGet(req.refreshToken());
        RefreshToken newRefreshToken = refreshTokenService.rotate(oldToken);
        String newAccessToken = jwtService.generateToken(newRefreshToken.getUser());
        return ResponseEntity.ok(new RefreshResponse(newAccessToken, "Bearer", newRefreshToken.getToken()));
    }

    @PostMapping("/change-password")
    public ResponseEntity<Void> changePassword(@Validated @RequestBody ChangePasswordRequest req) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new UnauthorizedException("Unauthorized");
        }
        String email = (String) auth.getPrincipal();
        User user = userService.findByEmail(email)
                .orElseThrow(() -> new UnauthorizedException("Unauthorized"));
        userService.changePassword(email, req.currentPassword(), req.newPassword());
        refreshTokenService.revokeAllForUser(user);
        return ResponseEntity.noContent().build();
    }
}
