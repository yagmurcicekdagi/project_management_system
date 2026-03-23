package com.example.project_management_system.controllers;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.project_management_system.dtos.auth.AuthLoginRequest;
import com.example.project_management_system.dtos.auth.AuthRegisterRequest;
import com.example.project_management_system.dtos.auth.AuthResponse;
import com.example.project_management_system.dtos.auth.ChangePasswordRequest;
import com.example.project_management_system.dtos.auth.RefreshResponse;
import com.example.project_management_system.entities.RefreshToken;
import com.example.project_management_system.entities.User;
import com.example.project_management_system.exceptions.UnauthorizedException;
import com.example.project_management_system.security.CustomUserDetails;
import com.example.project_management_system.security.JwtService;
import com.example.project_management_system.services.RefreshTokenService;
import com.example.project_management_system.services.UserService;

import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private static final String TOKEN_TYPE = "Bearer";
    private static final String REFRESH_COOKIE = "refresh_token";

    private final UserService userService;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;
    private final AuthenticationManager authenticationManager;

    @Value("${jwt.refresh-expiration-ms}")
    private long refreshExpirationMs;

    @Value("${app.cookie.secure:true}")
    private boolean secureCookie;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Validated @RequestBody AuthRegisterRequest req, HttpServletResponse res) {
        User user = userService.register(req.email(), req.password());
        return ResponseEntity.ok(buildAuthResponse(user, res));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Validated @RequestBody AuthLoginRequest req, HttpServletResponse res) {
        try {
            // authenticate() loads the user via CustomUserDetailsService — principal carries the User entity
            var authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(req.email(), req.password()));
            // getPrincipal() is declared as Object, make sure it's the expected CustomUserDetails
            if (!(authentication.getPrincipal() instanceof CustomUserDetails details)) {
                throw UnauthorizedException.userNotFound();
            }
            User user = details.getUser();
            return ResponseEntity.ok(buildAuthResponse(user, res));
        } catch (AuthenticationException ex) {
            throw UnauthorizedException.invalidCredentials();
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(
            @CookieValue(name = REFRESH_COOKIE, required = false) String tokenValue,
            HttpServletResponse res) {
        refreshTokenService.revoke(refreshTokenService.getVerified(tokenValue));
        setRefreshCookie(res, "", 0);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/refresh")
    public ResponseEntity<RefreshResponse> refresh(
            @CookieValue(name = REFRESH_COOKIE, required = false) String tokenValue,
            HttpServletResponse res) {
        RefreshToken newToken = refreshTokenService.rotate(refreshTokenService.getVerified(tokenValue));
        setRefreshCookie(res, newToken.getToken(), refreshExpirationMs / 1000);
        return ResponseEntity.ok(new RefreshResponse(jwtService.generateToken(newToken.getUser()), TOKEN_TYPE));
    }

    //TODO: this should not be inside auth controller. move this to user controller if we allow profile changes
    @PostMapping("/change-password")
    public ResponseEntity<Void> changePassword(@AuthenticationPrincipal String email, @Validated @RequestBody ChangePasswordRequest req) {
        User user = userService.changePassword(email, req.currentPassword(), req.newPassword());
        refreshTokenService.revokeAllForUser(user);
        return ResponseEntity.noContent().build();
    }

    private AuthResponse buildAuthResponse(User user, HttpServletResponse res) {
        String accessToken = jwtService.generateToken(user);
        RefreshToken refreshToken = refreshTokenService.create(user);
        setRefreshCookie(res, refreshToken.getToken(), refreshExpirationMs / 1000);
        return new AuthResponse(accessToken, TOKEN_TYPE, user.getEmail(), user.getRole());
    }

    private void setRefreshCookie(HttpServletResponse res, String value, long maxAgeSeconds) {
        ResponseCookie cookie = ResponseCookie.from(REFRESH_COOKIE, value)
                .httpOnly(true)
                .secure(secureCookie)
                .sameSite("Strict")
                .path("/api/v1/auth")
                .maxAge(maxAgeSeconds)
                .build();
        res.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

}
