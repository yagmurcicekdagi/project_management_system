package com.example.project_management_system.dtos.auth;

import jakarta.validation.constraints.NotNull;

public record LinkUserRequest(
    @NotNull(message = "userId is required") Long userId
) {}
