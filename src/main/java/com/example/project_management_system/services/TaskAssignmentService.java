package com.example.project_management_system.services;

import org.springframework.stereotype.Service;

import com.example.project_management_system.entities.Employee;
import com.example.project_management_system.entities.Task;
import com.example.project_management_system.entities.TaskAssignment;
import com.example.project_management_system.repository.TaskAssignmentRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class TaskAssignmentService {
  private final TaskAssignmentRepository repository;
  private final TaskService taskService;
  private final EmployeeService employeeService;

  @Transactional
  // TODO: needs authority check
  public Long assignEmployeeToTask(Long taskId, Long employeeId, Long asssignedById) {
    // Validate task and employee exists first
    Task task = taskService.findEntityById(taskId);
    Employee employee = employeeService.findEntityById(employeeId);
    // Return existing assignment if present
    var existingAssignment = repository.findByTaskIdAndEmployeeId(taskId, employeeId);
    if (existingAssignment.isPresent()) {
      return existingAssignment.get().getId();
    }
    // Find who is assigning the task and if he has an authority
    // Currently, a USER is an Employee by our business rule.
    // Question: can assignedById be null? How do we handle it?
    Employee assignedBy = employeeService.findEntityById(asssignedById);
    // Create task assignment and save it
    TaskAssignment assignment = TaskAssignment.builder().task(task).employee(employee).assignedBy(assignedBy.getId())
        .build();
    return repository.save(assignment).getId();
  }

  @Transactional
  public int unassignEmployeeFromTask(Long taskId, Long employeeId, Long assignedById) {
    // Check if he is a MANAGER and has authority to unassign
    // If an employee record is deleted, it should automatically unassign the task
    // Validate task and employee exist
    taskService.findEntityById(taskId);
    employeeService.findEntityById(employeeId);
    // Return the deleted count for the client
    return repository.deleteByTaskIdAndEmployeeId(taskId, employeeId);
  }
}
