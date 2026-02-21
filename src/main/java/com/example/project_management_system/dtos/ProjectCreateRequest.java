package com.example.project_management_system.dtos;

import java.time.LocalDate;

import com.example.project_management_system.entities.ProjectStatus;

import jakarta.validation.constraints.NotBlank;

public record ProjectCreateRequest(@NotBlank(message = "Name is required") String name,

    String description,

    ProjectStatus status,

    LocalDate startDate, LocalDate endDate) {
}
