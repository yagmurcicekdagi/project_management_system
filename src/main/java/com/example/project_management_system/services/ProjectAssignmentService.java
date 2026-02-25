package com.example.project_management_system.services;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.project_management_system.dtos.EmployeeResponse;
import com.example.project_management_system.dtos.ProjectResponse;
import com.example.project_management_system.entities.Employee;
import com.example.project_management_system.entities.Project;
import com.example.project_management_system.entities.ProjectAssignment;
import com.example.project_management_system.exceptions.ConflictException;
import com.example.project_management_system.exceptions.ResourceNotFoundException;
import com.example.project_management_system.mappers.EmployeeMapper;
import com.example.project_management_system.mappers.ProjectMapper;
import com.example.project_management_system.repository.EmployeeRepository;
import com.example.project_management_system.repository.ProjectAssignmentRepository;
import com.example.project_management_system.repository.ProjectRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ProjectAssignmentService {

    private final ProjectAssignmentRepository assignmentRepository;
    private final ProjectRepository projectRepository;
    private final EmployeeRepository employeeRepository;
    private final EmployeeMapper employeeMapper;
    private final ProjectMapper projectMapper;

    @Transactional
    public void addEmployeeToProject(Long projectId, Long employeeId, Long assignedBy) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + projectId));

        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with id: " + employeeId));

        if (assignmentRepository.existsByProjectIdAndEmployeeId(projectId, employeeId)) {
            throw new ConflictException("Employee already assigned to this project");
        }
        ProjectAssignment assignment = new ProjectAssignment();

        assignment.setProject(project);
        assignment.setEmployee(employee);
        assignment.setAssignedBy(assignedBy);

        assignmentRepository.save(assignment);

    }

    @Transactional(readOnly = true)
    public List<EmployeeResponse> listEmployeesInProject(Long projectId) {
        if (!projectRepository.existsById(projectId)) {
            throw new ResourceNotFoundException("Project not found with id: " + projectId);
        }

        return assignmentRepository.findByProjectId(projectId).stream()
                .map(ProjectAssignment::getEmployee)
                .map(employeeMapper::toDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ProjectResponse> listProjectsForEmployee(Long employeeId) {
        if (!employeeRepository.existsById(employeeId)) {
            throw new ResourceNotFoundException("Employee not found with id: " + employeeId);
        }

        return assignmentRepository.findByEmployeeId(employeeId).stream()
                .map(ProjectAssignment::getProject)
                .map(projectMapper::toDTO)
                .toList();

    }

    @Transactional(readOnly = true)
    public boolean isEmployeeAssigned(Long projectId, Long employeeId) {
        return assignmentRepository.existsByProjectIdAndEmployeeId(projectId, employeeId);
    }

    @Transactional
    public void removeEmployeeFromProject(Long projectId, Long employeeId) {
        ProjectAssignment assignment = assignmentRepository.findByProjectIdAndEmployeeId(projectId, employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found for given project and employee"));
        assignmentRepository.delete(assignment);
    }
}
