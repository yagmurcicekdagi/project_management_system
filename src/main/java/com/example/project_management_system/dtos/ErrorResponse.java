package com.example.project_management_system.dtos;

public record ErrorResponse(
    int status,
    String error,
    String message,
    String path) {
}
