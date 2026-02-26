package com.example.project_management_system.services;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.project_management_system.dtos.EmployeeCreateRequest;
import com.example.project_management_system.dtos.EmployeeResponse;
import com.example.project_management_system.dtos.EmployeeUpdateRequest;
import com.example.project_management_system.entities.Employee;
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
        Employee e = new Employee();
        e.setFirstName(req.firstName());
        e.setLastName(req.lastName());

        Employee saved = employeeRepository.save(e);
        return mapper.toDTO(saved);
    }

    @Transactional(readOnly = true)
    public Page<EmployeeResponse> findAll(String search, Pageable pageable) {
        // If the search param is not provided, default to findAll method
        if (search == null || search.isBlank()) {
            return employeeRepository.findAll(pageable).map(mapper::toDTO);
        }

        String q = search.trim();

        return employeeRepository
                .findByFirstNameStartingWithIgnoreCaseOrLastNameStartingWithIgnoreCase(q, q, pageable)
                .map(mapper::toDTO);
    }

    public EmployeeResponse findById(Long id) {
        return employeeRepository.findById(id)
                .map(mapper::toDTO)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with id: " + id));
    }

    @Transactional
    public EmployeeResponse patch(Long id, EmployeeUpdateRequest req) {

        Employee e = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with id: " + id));

        if (req.firstName() != null) {
            e.setFirstName(req.firstName().trim());
        }

        if (req.lastName() != null) {
            e.setLastName(req.lastName().trim());
        }

        return mapper.toDTO(e);
    }

    @Transactional
    public void deleteById(Long id) {
        if (!employeeRepository.existsById(id)) {
            throw new ResourceNotFoundException("Employee not found");
        }
        employeeRepository.deleteById(id);
    }

}
