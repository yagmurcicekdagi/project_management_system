package com.example.project_management_system.controllers;

import java.net.URI;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import com.example.project_management_system.dtos.project.ProjectCreateRequest;
import com.example.project_management_system.dtos.project.ProjectResponse;
import com.example.project_management_system.dtos.project.ProjectUpdateRequest;
import com.example.project_management_system.entities.Employee;
import com.example.project_management_system.exceptions.ResourceNotFoundException;
import com.example.project_management_system.services.EmployeeService;
import com.example.project_management_system.services.ProjectAssignmentService;
import com.example.project_management_system.services.ProjectService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@Validated
@RequiredArgsConstructor
@RequestMapping("/api/v1/projects")
public class ProjectController {

    private static final String ROLE_MANAGER = "MANAGER";

    private final ProjectService projectService;
    private final EmployeeService employeeService;
    private final ProjectAssignmentService assignmentService;

    @PostMapping
    @PreAuthorize("hasAuthority('MANAGER')")
    public ResponseEntity<ProjectResponse> create(@Valid @RequestBody ProjectCreateRequest req) {
        ProjectResponse created = projectService.create(req);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest().path("/{id}")
                .buildAndExpand(created.id()).toUri();
        return ResponseEntity.created(location).body(created);
    }

    @PatchMapping("/{id}")
    public ProjectResponse update(@PathVariable Long id, @RequestBody ProjectUpdateRequest req, Authentication auth) {
        boolean isManager = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals(ROLE_MANAGER));
        if (!isManager) {
            Employee employee = employeeService.findByEmail(auth.getName());
            if (!assignmentService.isEmployeeAssigned(id, employee.getId())) {
                throw ResourceNotFoundException.project(id);
            }
        }
        return projectService.update(id, req);
    }

    @GetMapping
    public ResponseEntity<Page<ProjectResponse>> findAll(@PageableDefault Pageable pageable, Authentication auth) {
        // Check for the role
        boolean isManager = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals(ROLE_MANAGER));
        // If the role is manager, show all projects
        if (isManager) {
            return ResponseEntity.ok(projectService.findAll(pageable));
        }
        // If the role is not manager, find the employee by email
        Employee employee = employeeService.findByEmail(auth.getName());
        // Find projects assigned for that employee
        Page<ProjectResponse> projects = projectService.findByEmployee(employee.getId(), pageable);
        return ResponseEntity.ok(projects);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProjectResponse> findById(@PathVariable Long id, Authentication auth) {
        // Check for the role
        boolean isManager = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals(ROLE_MANAGER));
        // Managers can access any project directly
        if (isManager) {
            return ResponseEntity.ok(projectService.findById(id));
        }
        // If the role is not manager, find the employee by email
        Employee employee = employeeService.findByEmail(auth.getName());
        // Return 404 if the employee is not assigned to this project
        if (!assignmentService.isEmployeeAssigned(id, employee.getId())) {
            throw ResourceNotFoundException.project(id);
        }
        return ResponseEntity.ok(projectService.findById(id));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('MANAGER')")
    public ResponseEntity<Void> deleteById(@PathVariable Long id) {
        projectService.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
