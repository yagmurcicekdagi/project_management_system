package com.example.project_management_system.controllers;

import java.net.URI;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import com.example.project_management_system.dtos.ProjectAssignmentCreateRequest;
import com.example.project_management_system.dtos.employee.EmployeeResponse;
import com.example.project_management_system.entities.Employee;
import com.example.project_management_system.exceptions.ResourceNotFoundException;
import com.example.project_management_system.services.EmployeeService;
import com.example.project_management_system.services.ProjectAssignmentService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@Validated
@RequiredArgsConstructor
@RequestMapping("/api/v1/projects/{projectId}/assignments")
public class ProjectAssignmentController {

    private final ProjectAssignmentService assignmentService;
    private final EmployeeService employeeService;

    @PostMapping
    @PreAuthorize("hasAuthority('MANAGER')")
    public ResponseEntity<EmployeeResponse> assignEmployee(
            @PathVariable Long projectId,
            @Valid @RequestBody ProjectAssignmentCreateRequest req) {

        assignmentService.addEmployeeToProject(projectId, req.employeeId(), req.assignedBy());
        // Build the location
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{employeeId}")
                .buildAndExpand(req.employeeId())
                .toUri();

        EmployeeResponse res = employeeService.findById(req.employeeId());
        return ResponseEntity.created(location).body(res);
    }

    @GetMapping
    public ResponseEntity<List<EmployeeResponse>> listEmployees(
            @PathVariable Long projectId,
            Authentication auth) {
        boolean isManager = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("MANAGER"));
        if (!isManager) {
            // Regular users can only view assignments for projects they belong to.
            // Get the employee record linked to the authenticated user's email
            Employee employee = employeeService.findByEmail(auth.getName());
            if (!assignmentService.isEmployeeAssigned(projectId, employee.getId())) {
                throw ResourceNotFoundException.project(projectId);
            }
        }
        List<EmployeeResponse> employees = assignmentService.listEmployeesInProject(projectId);
        return ResponseEntity.ok(employees);
    }

    @DeleteMapping("/{employeeId}")
    @PreAuthorize("hasAuthority('MANAGER')")
    public ResponseEntity<Void> unassignEmployee(
            @PathVariable Long projectId,
            @PathVariable Long employeeId) {
        assignmentService.removeEmployeeFromProject(projectId, employeeId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping()
    @PreAuthorize("hasAuthority('MANAGER')")
    public ResponseEntity<Void> unassignAllEmployees(@PathVariable Long projectId) {
        assignmentService.removeAllEmployeesFromProject(projectId);
        return ResponseEntity.noContent().build();
    }
}
