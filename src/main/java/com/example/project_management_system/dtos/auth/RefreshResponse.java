package com.example.project_management_system.dtos.auth;

public record RefreshResponse(
        String token,
        String tokenType,
        String refreshToken
        ) {

}
