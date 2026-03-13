package com.example.project_management_system.dtos;

public record AuthResponse(String token, String tokenType, String email, String role, String refreshToken) {}

