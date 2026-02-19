package com.example.project_management_system.services;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.project_management_system.dtos.EmployeeCreateRequest;
import com.example.project_management_system.dtos.EmployeeResponse;
import com.example.project_management_system.dtos.EmployeeUpdateRequest;
import com.example.project_management_system.entities.Employee;
import com.example.project_management_system.exceptions.ConflictException;
import com.example.project_management_system.exceptions.ResourceNotFoundException;
import com.example.project_management_system.repository.EmployeeRepository;

@Service
public class EmployeeService {
    private final EmployeeRepository employeeRepository;

    public EmployeeService(EmployeeRepository employeeRepository) {
        this.employeeRepository = employeeRepository;
    }

    @Transactional
    public EmployeeResponse create(EmployeeCreateRequest req) {
        if (employeeRepository.existsByEmailIgnoreCase(req.email())) {
            throw new ConflictException("Email already in use");
        }
        Employee e = new Employee();
        e.setFirstName(req.firstName());
        e.setLastName(req.lastName());
        e.setEmail(req.email());

        Employee saved = employeeRepository.save(e);
        return EmployeeResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public Page<EmployeeResponse> findAll(String search, Pageable pageable) {
        // If the search param is not given, default to findAll method
        if (search == null || search.isBlank()) {
            return employeeRepository.findAll(pageable).map(EmployeeResponse::from);
        }

        String q = search.trim();

        return employeeRepository
                .findByFirstNameStartingWithIgnoreCaseOrLastNameStartingWithIgnoreCase(
                        q, q, pageable
                )
                .map(EmployeeResponse::from);
    }
    public Optional<EmployeeResponse> findById(Long id) {
        return employeeRepository.findById(id).map(EmployeeResponse::from);
    }

    @Transactional
    public EmployeeResponse patch(Long id, EmployeeUpdateRequest req) {

    Employee e = employeeRepository.findById(id)
            .orElseThrow(() ->
                    new ResourceNotFoundException("Employee not found: " + id)
            );

    if (req.firstName() != null) {
        e.setFirstName(req.firstName().trim());
    }

    if (req.lastName() != null) {
        e.setLastName(req.lastName().trim());
    }

    if (req.email() != null) {

        String newEmail = req.email().trim().toLowerCase();

        if (!newEmail.equalsIgnoreCase(e.getEmail())
                && employeeRepository.existsByEmailIgnoreCase(newEmail)) {
            throw new ConflictException("Email already exists");
        }

        e.setEmail(newEmail);
    }

    return EmployeeResponse.from(e);
}

    @Transactional
    public void deleteById(Long id) {
          if (!employeeRepository.existsById(id)) {
            throw new ResourceNotFoundException("Employee not found");
        }
        employeeRepository.deleteById(id);
    }

}
