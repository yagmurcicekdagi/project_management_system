package com.example.project_management_system.services;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.project_management_system.dtos.employee.EmployeeResponse;
import com.example.project_management_system.entities.Employee;
import com.example.project_management_system.entities.Project;
import com.example.project_management_system.entities.ProjectAssignment;
import com.example.project_management_system.exceptions.ConflictException;
import com.example.project_management_system.exceptions.ResourceNotFoundException;
import com.example.project_management_system.mappers.EmployeeMapper;
import com.example.project_management_system.repository.ProjectAssignmentRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ProjectAssignmentService {

    private final ProjectAssignmentRepository assignmentRepository;
    private final ProjectService projectService;
    private final EmployeeService employeeService;
    private final EmployeeMapper employeeMapper;

    @Transactional
    public void addEmployeeToProject(Long projectId, Long employeeId, Long assignedBy) {
        Project project = projectService.findEntityById(projectId);
        Employee employee = employeeService.findEntityById(employeeId);

        if (assignmentRepository.existsByProjectIdAndEmployeeId(projectId, employeeId)) {
            throw ConflictException.alreadyAssigned();
        }
        ProjectAssignment assignment = ProjectAssignment.builder()
                .project(project)
                .employee(employee)
                .assignedBy(assignedBy)
                .build();

        assignmentRepository.save(assignment);
    }

    @Transactional(readOnly = true)
    public List<EmployeeResponse> listEmployeesInProject(Long projectId) {
        // Verify project exists before listing its employees
        projectService.findEntityById(projectId);

        // Fetch all assignments for the project and map each to its employee DTO
        return assignmentRepository.findByProjectId(projectId).stream()
                .map(ProjectAssignment::getEmployee)
                .map(employeeMapper::toDTO)
                .toList();
    }

    @Transactional
    public void removeEmployeeFromProject(Long projectId, Long employeeId) {
        ProjectAssignment assignment = assignmentRepository.findByProjectIdAndEmployeeId(projectId, employeeId)
                .orElseThrow(ResourceNotFoundException::assignment);
        assignmentRepository.delete(assignment);
    }

    @Transactional
    public void removeAllEmployeesFromProject(Long projectId) {
        assignmentRepository.deleteByProjectId(projectId);
    }

    @Transactional(readOnly = true)
    public boolean isEmployeeAssigned(Long projectId, Long employeeId) {
        return assignmentRepository.existsByProjectIdAndEmployeeId(projectId, employeeId);
    }

}
