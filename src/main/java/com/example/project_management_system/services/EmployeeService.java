package com.example.project_management_system.services;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.project_management_system.dtos.employee.EmployeeCreateRequest;
import com.example.project_management_system.dtos.employee.EmployeeResponse;
import com.example.project_management_system.dtos.employee.EmployeeUpdateRequest;
import com.example.project_management_system.entities.Employee;
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

        // Check for duplicate email
        if (employeeRepository.findByEmailIgnoreCase(email).isPresent()) {
            throw ConflictException.employeeEmailExists();
        }

        Employee e = Employee.builder()
                .firstName(req.firstName())
                .lastName(req.lastName())
                .email(email)
                .build();

        Employee saved = employeeRepository.save(e);
        return mapper.toDTO(saved);
    }

    @Transactional(readOnly = true)
    public Page<EmployeeResponse> findAll(String search, Pageable pageable) {
        if (search == null || search.isBlank()) {
            return employeeRepository.findAll(pageable).map(mapper::toDTO);
        }

        String q = search.trim();

        return employeeRepository
                .searchByFullName(q, pageable)
                .map(mapper::toDTO);
    }

    public EmployeeResponse findById(Long id) {
        return employeeRepository.findById(id)
                .map(mapper::toDTO)
                .orElseThrow(() -> ResourceNotFoundException.employee(id));
    }

    @Transactional
    public EmployeeResponse patch(Long id, EmployeeUpdateRequest req) {

        Employee e = employeeRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.employee(id));

        if (req.firstName() != null) {
            e.setFirstName(req.firstName().trim());
        }

        if (req.lastName() != null) {
            e.setLastName(req.lastName().trim());
        }

        return mapper.toDTO(e);
    }

    @Transactional(readOnly = true)
    public Employee findByEmail(String email) {
        return employeeRepository.findByEmailIgnoreCase(email)
                .orElseThrow(ResourceNotFoundException::employeeByEmail);
    }

    @Transactional
    public void deleteById(Long id) {
        if (!employeeRepository.existsById(id)) {
            throw ResourceNotFoundException.employee(id);
        }
        employeeRepository.deleteById(id);
    }

}
