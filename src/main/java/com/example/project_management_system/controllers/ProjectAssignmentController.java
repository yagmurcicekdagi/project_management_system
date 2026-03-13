package com.example.project_management_system.controllers;

import java.net.URI;
import java.util.List;

import org.springframework.http.ResponseEntity;
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
import com.example.project_management_system.services.EmployeeService;
import com.example.project_management_system.services.ProjectAssignmentService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.security.access.prepost.PreAuthorize;

@RestController
@Validated
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('MANAGER')")
@RequestMapping("/api/v1/projects/{projectId}/assignments")
public class ProjectAssignmentController {

    private final ProjectAssignmentService assignmentService;
    private final EmployeeService employeeService;

    @PostMapping
    public ResponseEntity<EmployeeResponse> addEmployee(
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
    public ResponseEntity<List<EmployeeResponse>> listEmployees(@PathVariable Long projectId) {
        List<EmployeeResponse> employees = assignmentService.listEmployeesInProject(projectId);
        return ResponseEntity.ok(employees);
    }

    @DeleteMapping("/{employeeId}")
    public ResponseEntity<Void> removeEmployee(
            @PathVariable Long projectId,
            @PathVariable Long employeeId) {
        assignmentService.removeEmployeeFromProject(projectId, employeeId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping()
    public ResponseEntity<Void> removeAllEmployees(@PathVariable Long projectId) {
        assignmentService.removeAllEmployees(projectId);
        return ResponseEntity.noContent().build();
    }
}
