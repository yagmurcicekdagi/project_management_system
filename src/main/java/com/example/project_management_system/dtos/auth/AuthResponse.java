package com.example.project_management_system.dtos.auth;

public record AuthResponse(String token, String tokenType, String email, String role, String refreshToken) {

}
