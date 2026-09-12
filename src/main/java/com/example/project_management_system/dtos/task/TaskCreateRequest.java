package com.example.project_management_system.dtos.task;

import java.time.LocalDate;

import com.example.project_management_system.entities.Task;
import com.example.project_management_system.entities.TaskPriority;
import com.example.project_management_system.entities.TaskStatus;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record TaskCreateRequest(
    @NotBlank(message = "Title is required") String title,
    String description,
    @NotBlank(message = "You must choose a priority level") TaskPriority priority,
    TaskStatus status,
    @NotNull(message = "Start date is required") LocalDate startDate,
    @NotNull(message = "End date is required") LocalDate endDate) {
}
