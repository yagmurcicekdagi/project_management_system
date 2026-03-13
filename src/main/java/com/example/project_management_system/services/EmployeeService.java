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
import com.example.project_management_system.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class EmployeeService {

    private static final String EMPLOYEE_NOT_FOUND = "Employee not found with id: ";

    private final EmployeeRepository employeeRepository;
    private final UserRepository userRepository;
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
                .searchByFullName(q, pageable)
                .map(mapper::toDTO);
    }

    public EmployeeResponse findById(Long id) {
        return employeeRepository.findById(id)
                .map(mapper::toDTO)
                .orElseThrow(() -> new ResourceNotFoundException(EMPLOYEE_NOT_FOUND + id));
    }

    @Transactional
    public EmployeeResponse patch(Long id, EmployeeUpdateRequest req) {

        Employee e = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(EMPLOYEE_NOT_FOUND + id));

        if (req.firstName() != null) {
            e.setFirstName(req.firstName().trim());
        }

        if (req.lastName() != null) {
            e.setLastName(req.lastName().trim());
        }

        return mapper.toDTO(e);
    }

    @Transactional
    public EmployeeResponse linkUser(Long employeeId, Long userId) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException(EMPLOYEE_NOT_FOUND + employeeId));
        if (employee.getUser() != null) {
            throw new ConflictException("Employee is already linked to a user");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        if (employeeRepository.findByUserId(userId).isPresent()) {
            throw new ConflictException("User is already linked to another employee");
        }

        employee.setUser(user);
        return mapper.toDTO(employeeRepository.save(employee));
    }

    @Transactional
    public void deleteById(Long id) {
        if (!employeeRepository.existsById(id)) {
            throw new ResourceNotFoundException("Employee not found with id " + id);
        }
        employeeRepository.deleteById(id);
    }

}
