package com.example.project_management_system.dtos.task;

import java.time.LocalDate;

import com.example.project_management_system.entities.TaskPriority;
import com.example.project_management_system.entities.TaskStatus;

public record TaskResponse(
    Long id,
    String title,
    String description,
    TaskPriority priority,
    TaskStatus status,
    LocalDate startDate,
    LocalDate enDate) {
}
