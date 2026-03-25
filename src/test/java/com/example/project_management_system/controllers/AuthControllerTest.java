package com.example.project_management_system.controllers;

import java.util.List;
import java.util.Optional;

import jakarta.servlet.http.Cookie;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.willDoNothing;
import static org.mockito.BDDMockito.willThrow;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.example.project_management_system.dtos.auth.AuthResponse;
import com.example.project_management_system.dtos.auth.RefreshResponse;
import com.example.project_management_system.entities.RefreshToken;
import com.example.project_management_system.entities.User;
import com.example.project_management_system.exceptions.ConflictException;
import com.example.project_management_system.exceptions.UnauthorizedException;
import com.example.project_management_system.security.CustomUserDetails;
import com.example.project_management_system.security.JwtService;
import com.example.project_management_system.services.RefreshTokenService;
import com.example.project_management_system.services.UserService;

@WebMvcTest(AuthController.class)
@DisplayName("AuthController Slice Tests")
class AuthControllerTest extends BaseControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private UserService userService;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private RefreshTokenService refreshTokenService;

    @MockitoBean
    private AuthenticationManager authenticationManager;

    private static final String BASE_URL = "/api/v1/auth";

    private User mockUser() {
        return User.builder()
                .id(1L)
                .email("jane@example.com")
                .passwordHash("$hashed")
                .role("USER")
                .build();
    }

    private RefreshToken mockRefreshToken(User user) {
        return RefreshToken.builder()
                .id(1L)
                .token("refresh-token-value")
                .user(user)
                .build();
    }

    @Nested
    @DisplayName("POST /api/v1/auth/register")
    class Register {

        @Test
        @DisplayName("should register user and return 200 with auth response and refresh cookie")
        void shouldRegisterAndReturn200() throws Exception {
            User user = mockUser();
            RefreshToken refreshToken = mockRefreshToken(user);
            AuthResponse response = new AuthResponse("jwt-token", "Bearer", user.getEmail(), user.getRole());

            given(userService.register("jane@example.com", "secret")).willReturn(user);
            given(jwtService.generateToken(user)).willReturn("jwt-token");
            given(refreshTokenService.create(user)).willReturn(refreshToken);

            mockMvc.perform(post(BASE_URL + "/register")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""
                            {"email": "jane@example.com", "password": "secret"}
                            """))
                    .andExpect(status().isOk())
                    .andExpect(content().json(objectMapper.writeValueAsString(response)))
                    .andExpect(header().string(HttpHeaders.SET_COOKIE, org.hamcrest.Matchers.containsString("refresh_token=refresh-token-value")))
                    .andExpect(header().string(HttpHeaders.SET_COOKIE, org.hamcrest.Matchers.containsString("HttpOnly")));
        }

        @Test
        @DisplayName("should return 400 when email is blank")
        void shouldReturn400WhenEmailBlank() throws Exception {
            mockMvc.perform(post(BASE_URL + "/register")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""
                            {"email": "", "password": "secret"}
                            """))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.email").exists());
        }

        @Test
        @DisplayName("should return 400 when email format is invalid")
        void shouldReturn400WhenEmailInvalid() throws Exception {
            mockMvc.perform(post(BASE_URL + "/register")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""
                            {"email": "not-an-email", "password": "secret"}
                            """))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.email").value("Email must be valid"));
        }

        @Test
        @DisplayName("should return 400 when password is blank")
        void shouldReturn400WhenPasswordBlank() throws Exception {
            mockMvc.perform(post(BASE_URL + "/register")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""
                            {"email": "jane@example.com", "password": ""}
                            """))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.password").value("Password is required"));
        }

        @Test
        @DisplayName("should return 409 when email is already in use")
        void shouldReturn409WhenEmailConflict() throws Exception {
            given(userService.register(anyString(), anyString()))
                    .willThrow(ConflictException.emailAlreadyInUse());

            mockMvc.perform(post(BASE_URL + "/register")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""
                            {"email": "jane@example.com", "password": "secret"}
                            """))
                    .andExpect(status().isConflict())
                    .andExpect(jsonPath("$.message").value("Email already in use"));
        }

        @Test
        @DisplayName("should return 409 when email has no pre-provisioned employee record")
        void shouldReturn409WhenEmailNotProvisioned() throws Exception {
            given(userService.register(anyString(), anyString()))
                    .willThrow(ConflictException.employeeNotProvisioned());

            mockMvc.perform(post(BASE_URL + "/register")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""
                            {"email": "unknown@example.com", "password": "secret"}
                            """))
                    .andExpect(status().isConflict())
                    .andExpect(jsonPath("$.message").value("No employee record found for this email. Contact your manager."));
        }
    }

    @Nested
    @DisplayName("POST /api/v1/auth/login")
    class Login {

        @Test
        @DisplayName("should login and return 200 with auth response and refresh cookie")
        void shouldLoginAndReturn200() throws Exception {
            User user = mockUser();
            RefreshToken refreshToken = mockRefreshToken(user);
            AuthResponse response = new AuthResponse("jwt-token", "Bearer", user.getEmail(), user.getRole());

            CustomUserDetails userDetails = new CustomUserDetails(user);
            given(authenticationManager.authenticate(any()))
                    .willReturn(new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities()));
            given(jwtService.generateToken(user)).willReturn("jwt-token");
            given(refreshTokenService.create(user)).willReturn(refreshToken);

            mockMvc.perform(post(BASE_URL + "/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""
                            {"email": "jane@example.com", "password": "secret"}
                            """))
                    .andExpect(status().isOk())
                    .andExpect(content().json(objectMapper.writeValueAsString(response)))
                    .andExpect(header().string(HttpHeaders.SET_COOKIE, org.hamcrest.Matchers.containsString("refresh_token=refresh-token-value")))
                    .andExpect(header().string(HttpHeaders.SET_COOKIE, org.hamcrest.Matchers.containsString("HttpOnly")));
        }

        @Test
        @DisplayName("should return 400 when email is blank")
        void shouldReturn400WhenEmailBlank() throws Exception {
            mockMvc.perform(post(BASE_URL + "/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""
                            {"email": "", "password": "secret"}
                            """))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.email").exists());
        }

        @Test
        @DisplayName("should return 400 when password is blank")
        void shouldReturn400WhenPasswordBlank() throws Exception {
            mockMvc.perform(post(BASE_URL + "/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""
                            {"email": "jane@example.com", "password": ""}
                            """))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.password").value("Password is required"));
        }

        @Test
        @DisplayName("should return 401 when credentials are invalid")
        void shouldReturn401WhenBadCredentials() throws Exception {
            given(authenticationManager.authenticate(any()))
                    .willThrow(new BadCredentialsException("Bad credentials"));

            mockMvc.perform(post(BASE_URL + "/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""
                            {"email": "jane@example.com", "password": "wrong"}
                            """))
                    .andExpect(status().isUnauthorized());
        }
    }

    @Nested
    @DisplayName("POST /api/v1/auth/logout")
    class Logout {

        @Test
        @DisplayName("should logout and return 204 with cleared cookie")
        void shouldLogoutAndReturn204() throws Exception {
            User user = mockUser();
            RefreshToken refreshToken = mockRefreshToken(user);

            given(refreshTokenService.getVerified("refresh-token-value")).willReturn(Optional.of(refreshToken));
            willDoNothing().given(refreshTokenService).revoke(refreshToken);

            mockMvc.perform(post(BASE_URL + "/logout")
                    .with(authentication(new UsernamePasswordAuthenticationToken(
                            "jane@example.com", null, List.of())))
                    .cookie(new Cookie("refresh_token", "refresh-token-value")))
                    .andExpect(status().isNoContent())
                    .andExpect(header().string(HttpHeaders.SET_COOKIE, org.hamcrest.Matchers.containsString("refresh_token=")))
                    .andExpect(header().string(HttpHeaders.SET_COOKIE, org.hamcrest.Matchers.containsString("Max-Age=0")));
        }

        @Test
        @DisplayName("should return 401 when not authenticated")
        void shouldReturn401WhenNotAuthenticated() throws Exception {
            mockMvc.perform(post(BASE_URL + "/logout")
                    .cookie(new Cookie("refresh_token", "refresh-token-value")))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("should return 204 and clear cookie when refresh cookie is missing")
        void shouldReturn204WhenRefreshCookieMissing() throws Exception {
            given(refreshTokenService.getVerified(null)).willReturn(Optional.empty());

            mockMvc.perform(post(BASE_URL + "/logout")
                    .with(authentication(new UsernamePasswordAuthenticationToken(
                            "jane@example.com", null, List.of()))))
                    .andExpect(status().isNoContent())
                    .andExpect(header().string(HttpHeaders.SET_COOKIE, org.hamcrest.Matchers.containsString("Max-Age=0")));
        }

        @Test
        @DisplayName("should return 204 and clear cookie when refresh token is invalid")
        void shouldReturn204WhenRefreshTokenInvalid() throws Exception {
            given(refreshTokenService.getVerified("bad-token")).willReturn(Optional.empty());

            mockMvc.perform(post(BASE_URL + "/logout")
                    .with(authentication(new UsernamePasswordAuthenticationToken(
                            "jane@example.com", null, List.of())))
                    .cookie(new Cookie("refresh_token", "bad-token")))
                    .andExpect(status().isNoContent())
                    .andExpect(header().string(HttpHeaders.SET_COOKIE, org.hamcrest.Matchers.containsString("Max-Age=0")));
        }
    }

    @Nested
    @DisplayName("POST /api/v1/auth/refresh")
    class Refresh {

        @Test
        @DisplayName("should return new access token and rotate refresh cookie")
        void shouldRefreshAndReturn200() throws Exception {
            User user = mockUser();
            RefreshToken oldToken = mockRefreshToken(user);
            RefreshToken newRefreshToken = RefreshToken.builder()
                    .id(2L).token("new-refresh-token").user(user).build();
            RefreshResponse response = new RefreshResponse("new-jwt-token", "Bearer");

            given(refreshTokenService.getVerified("refresh-token-value")).willReturn(Optional.of(oldToken));
            given(refreshTokenService.rotate(oldToken)).willReturn(newRefreshToken);
            given(jwtService.generateToken(user)).willReturn("new-jwt-token");

            mockMvc.perform(post(BASE_URL + "/refresh")
                    .cookie(new Cookie("refresh_token", "refresh-token-value")))
                    .andExpect(status().isOk())
                    .andExpect(content().json(objectMapper.writeValueAsString(response)))
                    .andExpect(header().string(HttpHeaders.SET_COOKIE, org.hamcrest.Matchers.containsString("refresh_token=new-refresh-token")));
        }

        @Test
        @DisplayName("should return 401 and clear cookie when refresh cookie is missing")
        void shouldReturn401WhenRefreshCookieMissing() throws Exception {
            given(refreshTokenService.getVerified(null)).willReturn(Optional.empty());

            mockMvc.perform(post(BASE_URL + "/refresh"))
                    .andExpect(status().isUnauthorized())
                    .andExpect(header().string(HttpHeaders.SET_COOKIE, org.hamcrest.Matchers.containsString("Max-Age=0")));
        }

        @Test
        @DisplayName("should return 401 and clear cookie when refresh token is expired or revoked")
        void shouldReturn401WhenTokenExpired() throws Exception {
            given(refreshTokenService.getVerified("expired-token")).willReturn(Optional.empty());

            mockMvc.perform(post(BASE_URL + "/refresh")
                    .cookie(new Cookie("refresh_token", "expired-token")))
                    .andExpect(status().isUnauthorized())
                    .andExpect(header().string(HttpHeaders.SET_COOKIE, org.hamcrest.Matchers.containsString("Max-Age=0")));
        }
    }

    @Nested
    @DisplayName("POST /api/v1/auth/change-password")
    class ChangePassword {

        @Test
        @DisplayName("should change password and return 204")
        void shouldChangePasswordAndReturn204() throws Exception {
            User user = mockUser();

            given(userService.changePassword("jane@example.com", "current", "newpass")).willReturn(user);
            willDoNothing().given(refreshTokenService).revokeAllForUser(user);

            mockMvc.perform(post(BASE_URL + "/change-password")
                    .with(authentication(new UsernamePasswordAuthenticationToken(
                            "jane@example.com", null, List.of())))
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""
                            {"currentPassword": "current", "newPassword": "newpass"}
                            """))
                    .andExpect(status().isNoContent());
        }

        @Test
        @DisplayName("should return 401 when not authenticated")
        void shouldReturn401WhenNotAuthenticated() throws Exception {
            mockMvc.perform(post(BASE_URL + "/change-password")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""
                            {"currentPassword": "current", "newPassword": "newpass"}
                            """))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("should return 400 when currentPassword is blank")
        void shouldReturn400WhenCurrentPasswordBlank() throws Exception {
            mockMvc.perform(post(BASE_URL + "/change-password")
                    .with(authentication(new UsernamePasswordAuthenticationToken(
                            "jane@example.com", null, List.of())))
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""
                            {"currentPassword": "", "newPassword": "newpass"}
                            """))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.currentPassword").value("Current password is required"));
        }

        @Test
        @DisplayName("should return 400 when newPassword is blank")
        void shouldReturn400WhenNewPasswordBlank() throws Exception {
            mockMvc.perform(post(BASE_URL + "/change-password")
                    .with(authentication(new UsernamePasswordAuthenticationToken(
                            "jane@example.com", null, List.of())))
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""
                            {"currentPassword": "current", "newPassword": ""}
                            """))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.newPassword").value("New password is required"));
        }

        @Test
        @DisplayName("should return 401 when current password is incorrect")
        void shouldReturn401WhenCurrentPasswordWrong() throws Exception {
            User user = mockUser();

            given(userService.findByEmail("jane@example.com")).willReturn(Optional.of(user));
            willThrow(UnauthorizedException.wrongPassword())
                    .given(userService).changePassword("jane@example.com", "wrong", "newpass");

            mockMvc.perform(post(BASE_URL + "/change-password")
                    .with(authentication(new UsernamePasswordAuthenticationToken(
                            "jane@example.com", null, List.of())))
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""
                            {"currentPassword": "wrong", "newPassword": "newpass"}
                            """))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.message").value("Current password is incorrect"));
        }
    }
}
