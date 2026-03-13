package com.example.project_management_system.mappers;

import org.springframework.stereotype.Component;

import com.example.project_management_system.dtos.employee.EmployeeResponse;
import com.example.project_management_system.entities.Employee;

@Component
public class EmployeeMapper {

    public EmployeeResponse toDTO(Employee e) {
        Long userId = e.getUser() != null ? e.getUser().getId() : null;
        return new EmployeeResponse(e.getId(), e.getFirstName(), e.getLastName(), userId);
    }
}
