package com.example.project_management_system.exceptions;

public class ConflictException extends RuntimeException {

    public ConflictException(String message) {
        super(message);
    }

    public static ConflictException emailAlreadyInUse() {
        return new ConflictException("Email already in use");
    }

    public static ConflictException employeeEmailExists() {
        return new ConflictException("An employee with this email already exists");
    }

    public static ConflictException employeeNotProvisioned() {
        return new ConflictException("No employee record found for this email. Contact your manager.");
    }

    public static ConflictException alreadyAssigned() {
        return new ConflictException("Employee already assigned to this project");
    }
}
