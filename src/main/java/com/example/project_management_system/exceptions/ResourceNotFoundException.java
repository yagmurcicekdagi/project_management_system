package com.example.project_management_system.exceptions;

public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String message) {
        super(message);
    }

    public static ResourceNotFoundException employee(Long id) {
        return new ResourceNotFoundException("Employee not found with id: " + id);
    }

    public static ResourceNotFoundException employeeByEmail() {
        return new ResourceNotFoundException("No employee linked to this account");
    }

    public static ResourceNotFoundException project(Long id) {
        return new ResourceNotFoundException("Project not found with id: " + id);
    }

    public static ResourceNotFoundException assignment() {
        return new ResourceNotFoundException("Assignment not found for given project and employee");
    }
}
