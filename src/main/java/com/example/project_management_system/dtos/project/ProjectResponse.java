package com.example.project_management_system.dtos.project;

import java.time.Instant;
import java.time.LocalDate;

import com.example.project_management_system.entities.ProjectStatus;

public record ProjectResponse(Long id, String name, String description, ProjectStatus status,
        LocalDate startDate, LocalDate endDate, Instant createdAt, Instant updatedAt) {

}
