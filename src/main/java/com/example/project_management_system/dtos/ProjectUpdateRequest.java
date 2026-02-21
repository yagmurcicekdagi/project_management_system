package com.example.project_management_system.dtos;

import java.time.LocalDate;

import com.example.project_management_system.entities.ProjectStatus;

public record ProjectUpdateRequest(String name, String description, ProjectStatus status,
    LocalDate startDate, LocalDate endDate) {
}
