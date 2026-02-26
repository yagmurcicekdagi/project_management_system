package com.example.project_management_system.dtos;

import jakarta.validation.constraints.NotBlank;

public record EmployeeCreateRequest(
    @NotBlank(message = "First name is required") String firstName,
    @NotBlank(message = "Last name is required") String lastName
) {}
