package com.example.project_management_system.services;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.project_management_system.dtos.employee.EmployeeCreateRequest;
import com.example.project_management_system.dtos.employee.EmployeeResponse;
import com.example.project_management_system.dtos.employee.EmployeeUpdateRequest;
import com.example.project_management_system.entities.Employee;
import com.example.project_management_system.entities.User;
import com.example.project_management_system.exceptions.ConflictException;
import com.example.project_management_system.exceptions.ResourceNotFoundException;
import com.example.project_management_system.mappers.EmployeeMapper;
import com.example.project_management_system.repository.EmployeeRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final EmployeeMapper mapper;

    @Transactional
    public EmployeeResponse create(EmployeeCreateRequest req) {
        String email = req.email().trim().toLowerCase();

        if (employeeRepository.existsByEmailIgnoreCase(email)) {
            throw ConflictException.employeeEmailExists();
        }

        Employee e = Employee.builder()
                .firstName(req.firstName())
                .lastName(req.lastName())
                .email(email)
                .build();

        return mapper.toDTO(employeeRepository.save(e));
    }

    @Transactional(readOnly = true)
    public Page<EmployeeResponse> findAll(String search, Pageable pageable) {
        if (search == null || search.isBlank()) {
            return employeeRepository.findAll(pageable).map(mapper::toDTO);
        }

        String q = search.trim();

        // Search employees whose full name matches the query and map results to DTOs
        return employeeRepository
                .searchByFullName(q, pageable)
                .map(mapper::toDTO);
    }

    @Transactional(readOnly = true)
    public EmployeeResponse findById(Long id) {
        return employeeRepository.findById(id)
                .map(mapper::toDTO)
                .orElseThrow(() -> ResourceNotFoundException.employee(id));
    }

    // Returns the raw entity — for internal use by other services that need the entity, not the DTO
    @Transactional(readOnly = true)
    Employee findEntityById(Long id) {
        return employeeRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.employee(id));
    }

    @Transactional
    public EmployeeResponse update(Long id, EmployeeUpdateRequest req) {
        Employee e = employeeRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.employee(id));

        e.setFirstName(req.firstName().trim());
        e.setLastName(req.lastName().trim());

        return mapper.toDTO(employeeRepository.save(e));
    }

    @Transactional(readOnly = true)
    public Employee findByEmail(String email) {
        return employeeRepository.findByEmailIgnoreCase(email)
                .orElseThrow(ResourceNotFoundException::employeeByEmail);
    }

    // Finds an employee by email for registration — throws ConflictException if not provisioned
    @Transactional(readOnly = true)
    Employee requireProvisionedByEmail(String email) {
        return employeeRepository.findByEmailIgnoreCase(email)
                .orElseThrow(ConflictException::employeeNotProvisioned);
    }

    // Links a user account to an employee — explicit save needed as no cascade from User to Employee
    @Transactional
    void linkUser(Employee employee, User user) {
        employee.setUser(user);
        employeeRepository.save(employee);
    }

    @Transactional
    public void deleteById(Long id) {
        if (!employeeRepository.existsById(id)) {
            throw ResourceNotFoundException.employee(id);
        }
        employeeRepository.deleteById(id);
    }

}
