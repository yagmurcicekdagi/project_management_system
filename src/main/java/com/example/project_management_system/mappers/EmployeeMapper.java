package com.example.project_management_system.mappers;

import org.springframework.stereotype.Component;

import com.example.project_management_system.dtos.EmployeeResponse;
import com.example.project_management_system.entities.Employee;

@Component
public class EmployeeMapper {

  public EmployeeResponse toDTO(Employee e) {
    return new EmployeeResponse(e.getId(), e.getFirstName(), e.getLastName());
  }
}
