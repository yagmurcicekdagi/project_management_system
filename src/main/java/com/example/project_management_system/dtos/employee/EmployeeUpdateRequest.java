package com.example.project_management_system.dtos.employee;

import jakarta.validation.constraints.NotBlank;

public record EmployeeUpdateRequest(
        @NotBlank(message = "First name must not be blank") String firstName,
        @NotBlank(message = "Last name must not be blank") String lastName) {

}
