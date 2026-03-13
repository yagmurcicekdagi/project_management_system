package com.example.project_management_system.controllers;

import java.net.URI;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import com.example.project_management_system.dtos.auth.LinkUserRequest;
import com.example.project_management_system.dtos.employee.EmployeeCreateRequest;
import com.example.project_management_system.dtos.employee.EmployeeResponse;
import com.example.project_management_system.dtos.employee.EmployeeUpdateRequest;
import com.example.project_management_system.services.EmployeeService;

import jakarta.validation.Valid;

@RestController
@Validated
@RequestMapping("/api/v1/employees")
@PreAuthorize("hasAuthority('MANAGER')")
public class EmployeeController {

    private final EmployeeService employeeService;

    public EmployeeController(EmployeeService employeeService) {
        this.employeeService = employeeService;
    }

    @PostMapping
    public ResponseEntity<EmployeeResponse> create(@Valid @RequestBody EmployeeCreateRequest req) {
        EmployeeResponse created = employeeService.create(req);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest().path("/{id}")
                .buildAndExpand(created.id()).toUri();
        return ResponseEntity.created(location).body(created);

    }

    @PatchMapping("/{id}")
    public EmployeeResponse patch(@PathVariable Long id, @RequestBody EmployeeUpdateRequest req) {
        return employeeService.patch(id, req);
    }

    @GetMapping
    public ResponseEntity<Page<EmployeeResponse>> findAll(
            @RequestParam(required = false) String search, @PageableDefault Pageable pageable) {
        Page<EmployeeResponse> employees = employeeService.findAll(search, pageable);
        return ResponseEntity.ok(employees);
    }

    @GetMapping("/{id}")
    public ResponseEntity<EmployeeResponse> findById(@PathVariable Long id) {
        EmployeeResponse res = employeeService.findById(id);
        return ResponseEntity.ok(res);
    }

    @PatchMapping("/{id}/link-user")
    public ResponseEntity<EmployeeResponse> linkUser(@PathVariable Long id, @Valid @RequestBody LinkUserRequest req) {
        return ResponseEntity.ok(employeeService.linkUser(id, req.userId()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        employeeService.deleteById(id);
        return ResponseEntity.noContent().build();
    }

}
