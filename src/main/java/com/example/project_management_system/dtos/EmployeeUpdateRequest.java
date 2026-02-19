package com.example.project_management_system.dtos;

public record EmployeeUpdateRequest(
  String firstName,
  String lastName,
  String email
) {}
