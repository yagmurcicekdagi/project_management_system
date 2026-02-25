package com.example.project_management_system.dtos;

import jakarta.validation.constraints.NotNull;

public record ProjectAssignmentCreateRequest(
        @NotNull(message = "employeeId is required")
        Long employeeId,
        Long assignedBy) {

}
