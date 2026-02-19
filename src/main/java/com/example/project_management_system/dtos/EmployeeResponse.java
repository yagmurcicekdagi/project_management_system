package com.example.project_management_system.dtos;

import com.example.project_management_system.entities.Employee;

public record EmployeeResponse(
  Long id,
  String firstName,
  String lastName,
  String email
) {

 public static EmployeeResponse from(Employee e) {
        return new EmployeeResponse(
                e.getId(),
                e.getFirstName(),
                e.getLastName(),
                e.getEmail()
        );
    }
}
